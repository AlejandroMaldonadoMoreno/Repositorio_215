import React, { useState, useEffect } from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Modal, Pressable, FlatList, BackHandler, Alert} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { UsuarioController } from '../controllers/UsuarioController';
import DatabaseService from '../database/DataBaseService';

// --- IMPORTACIÓN DE GRÁFICO CIRCULAR ---
import PieChart from 'react-native-pie-chart';

const usuarioController = new UsuarioController();

/*
  GraficaScreen.js
*/

export default function GraficaScreen({ navigation }) {
    const [ruta, setRuta] = useState('principal');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await usuarioController.initialize();
                const u = await usuarioController.getCurrentUser();
                if (mounted) setIsLoggedIn(!!u);
            } catch (e) {
                console.warn('[GraficaScreen] init check current user error', e);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [isLoggedIn]);

    // Back handler solo cuando esta pantalla está enfocada
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                // Si estamos en detalle, volver a principal
                if (ruta === 'detalle') {
                    setRuta('principal');
                    return true;
                }
                
                // Si estamos en principal y hay sesión, preguntar si desea cerrar sesión
                if (isLoggedIn && ruta === 'principal') {
                    Alert.alert(
                        'Salir',
                        '¿Deseas cerrar sesión?',
                        [
                            { text: 'Cancelar', style: 'cancel', onPress: () => {} },
                            {
                                text: 'Cerrar sesión',
                                style: 'destructive',
                                onPress: async () => {
                                    try {
                                        await usuarioController.logout();
                                    } catch (e) {
                                        console.warn('[GraficaScreen] logout error', e);
                                    }
                                    try {
                                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                                    } catch (e) {
                                        try {
                                            navigation.navigate('Login');
                                        } catch (e2) {
                                            navigation.popToTop();
                                        }
                                    }
                                }
                            }
                        ]
                    );
                    return true;
                }
                
                return false;
            };

            const subscription = BackHandler.addEventListener(
                'hardwareBackPress',
                onBackPress
            );
            return () => {
                try {
                    if (subscription && typeof subscription.remove === 'function')
                        subscription.remove();
                    else if (BackHandler.removeEventListener)
                        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
                } catch (e) {
                    console.warn('[GraficaScreen] error removing BackHandler listener', e);
                }
            };
        }, [isLoggedIn, ruta])
    );

    return ruta === 'principal' ? (
        <Principal navigation={navigation} onVerDetalle={() => setRuta('detalle')} />
    ) : (
        <Detalle navigation={navigation} onVolver={() => setRuta('principal')} />
    );
}

// --- Vista Principal ---
function Principal({ onVerDetalle, navigation }) {
    const [notifVisible, setNotifVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const seenNotificationIdsRef = React.useRef(new Set());
    const [saldoDisponible, setSaldoDisponible] = useState(null);
    const [categoryTotals, setCategoryTotals] = useState([]);
    const [chartModalVisible, setChartModalVisible] = useState(false);

    const loadUserData = async () => {
        setLoadingData(true);
        try {
            await usuarioController.initialize();
            const u = await usuarioController.getCurrentUser();
            setUser(u);
            if (!u) {
                setTransactions([]);
                setBudgets([]);
                setLoadingData(false);
                return;
            }
            let txs = [];
            let buds = [];

            // TRANSACCIONES
            try {
                if (
                    DatabaseService &&
                    typeof DatabaseService.getTransactions === 'function'
                ) {
                    const r = await DatabaseService.getTransactions(u.id, {
                        limit: 1000
                    });
                    txs = Array.isArray(r) ? r : [];

                    // saldo
                    try {
                        const all = txs;
                        const sum = (all || []).reduce(
                            (s, t) => s + (Number(t.monto) || 0),
                            0
                        );
                        setSaldoDisponible(sum);
                    } catch (e) {
                        console.warn('[GraficaScreen] error computing saldo', e);
                        setSaldoDisponible(null);
                    }
                } else {
                    console.warn(
                        '[GraficaScreen] DatabaseService.getTransactions not available'
                    );
                }
            } catch (e) {
                console.warn('[GraficaScreen] error getting transactions', e);
                txs = [];
            }

            // Lista de usuarios
            try {
                if (
                    DatabaseService &&
                    typeof DatabaseService.getAll === 'function'
                ) {
                    const allUsers = await DatabaseService.getAll();
                    setUsersList(Array.isArray(allUsers) ? allUsers : []);
                }
            } catch (e) {
                console.warn('[GraficaScreen] error getting all users', e);
                setUsersList([]);
            }

            // Presupuestos + mails
            try {
                if (
                    DatabaseService &&
                    typeof DatabaseService.getBudgets === 'function'
                ) {
                    const r2 = await DatabaseService.getBudgets(u.id);
                    buds = Array.isArray(r2) ? r2 : [];
                } else {
                    console.warn(
                        '[GraficaScreen] DatabaseService.getBudgets not available'
                    );
                }

                try {
                    if (
                        DatabaseService &&
                        typeof DatabaseService.getMails === 'function'
                    ) {
                        const mails = await DatabaseService.getMails(u.id, { limit: 50 });
                        const mailList = Array.isArray(mails) ? mails : [];
                        
                        // Detectar notificaciones NUEVAS Y NO LEÍDAS comparando con las IDs ya vistas
                        const newNotifications = mailList.filter(
                            n => n.id && 
                                 !seenNotificationIdsRef.current.has(String(n.id)) &&
                                 !n.read && !n.is_read  // Solo contar las no leídas
                        );
                        
                        if (newNotifications.length > 0) {
                            // Hay notificaciones nuevas no leídas
                            setUnreadCount(prev => prev + newNotifications.length);
                            // Mostrar toast solo para la más reciente
                            const newest = newNotifications[0];
                            if (newest && (newest.subject || newest.title)) {
                                showToast(newest.subject || newest.title);
                            }
                        }
                        
                        // Actualizar el set de IDs vistas (marcar TODAS como vistas, leídas o no)
                        mailList.forEach(n => {
                            if (n.id) seenNotificationIdsRef.current.add(String(n.id));
                        });
                        
                        setNotifications(mailList);
                    }
                } catch (e) {
                    console.warn('[GraficaScreen] error getting mails', e);
                    setNotifications([]);
                }
            } catch (e) {
                console.warn('[GraficaScreen] error getting budgets', e);
                buds = [];
            }

            setTransactions(txs);
            setBudgets(buds);

            // Totales por categoría desde presupuestos
            try {
                const results = [];
                const paletteColors = [
                    '#36D36C',
                    '#FFD15C',
                    '#0A84FF',
                    '#3AA0FF',
                    '#FF6B6B',
                    '#A259FF',
                    '#FFB86L',
                    '#4CD964',
                    '#FF9F43',
                    '#7BD389'
                ];
                const getColorForName = n => {
                    if (!n) return paletteColors[0];
                    let s = 0;
                    for (let i = 0; i < n.length; i++)
                        s = (s * 31 + n.charCodeAt(i)) >>> 0;
                    return paletteColors[s % paletteColors.length];
                };

                if (Array.isArray(buds) && buds.length > 0) {
                    for (const b of buds) {
                        const nombre =
                            (b.nombre && b.nombre.toString()) || 'Presupuesto';
                        const limite = Number(b.limite) || 0;
                        const gastado = Number(b.gastado) || 0;
                        const color = getColorForName(nombre);
                        results.push({ name: nombre, color, limite, gastado });
                    }
                }
                setCategoryTotals(results);
            } catch (e) {
                console.warn(
                    '[GraficaScreen] error computing category totals from budgets',
                    e
                );
                setCategoryTotals([]);
            }
        } catch (e) {
            console.warn('[GraficaScreen] loadUserData error', e);
            setTransactions([]);
            setBudgets([]);
            setSaldoDisponible(null);
        } finally {
            setLoadingData(false);
        }
    };

    const handleDeleteNotification = async id => {
        if (!user) return;
        try {
            await DatabaseService.deleteMail(user.id, id).catch(() => null);
        } catch (e) {
            console.warn('[GraficaScreen] deleteMail error', e);
        }
        
        // Si la notificación eliminada estaba en el contador de no leídas, decrementar
        const notifToDelete = notifications.find(n => String(n.id) === String(id));
        const wasUnread = notifToDelete && !notifToDelete.read;
        
        setNotifications(prev => {
            const updated = Array.isArray(prev)
                ? prev.filter(n => String(n.id) !== String(id))
                : [];
            return updated;
        });
        
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        // Remover del set de IDs vistas
        if (id) seenNotificationIdsRef.current.delete(String(id));
    };

    // Show toast notification
    const showToast = (message) => {
        setToastMessage(message);
        setToastVisible(true);
        setTimeout(() => {
            setToastVisible(false);
        }, 3000);
    };

    // Handle opening notification modal - mark all as read
    const handleOpenNotifications = () => {
        setNotifVisible(true);
        setUnreadCount(0);
        // Optionally mark all notifications as read in database
        if (user && notifications.length > 0) {
            notifications.forEach(n => {
                if (!n.read && n.id) {
                    DatabaseService.updateMail(user.id, n.id, { read: true }).catch(() => null);
                }
            });
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };



    const renderChartAndLegend = (inModal = false) => {
        return (
            <>
                {/* Leyenda */}
                <View style={styles.legend}>
                    {categoryTotals && categoryTotals.length > 0 ? (
                        categoryTotals.map(cat => (
                            <View key={cat.name} style={styles.legendItem}>
                                <View
                                    style={[styles.dot, { backgroundColor: cat.color }]}
                                />
                                <Text style={styles.legendText}>{cat.name}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                            <Text style={{ color: '#888' }}>
                                No hay presupuestos para mostrar.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Gráfico barras dobles */}
                <View style={styles.chartCard}>
                    {categoryTotals && categoryTotals.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >
                            <View
                                style={[styles.barsRow, { flexDirection: 'row' }]}
                            >
                                {(() => {
                                    const maxVal = Math.max(
                                        ...categoryTotals.flatMap(c => [
                                            c.limite || 0,
                                            c.gastado || 0
                                        ]),
                                        1
                                    );
                                    return categoryTotals.map(cat => {
                                        const limiteH = Math.round(
                                            ((cat.limite || 0) / maxVal) *
                                            (metrics.chartH * 0.9)
                                        );
                                        const gastadoH = Math.round(
                                            ((cat.gastado || 0) / maxVal) *
                                            (metrics.chartH * 0.9)
                                        );
                                        return (
                                            <View
                                                key={cat.name}
                                                style={[styles.doubleBar]}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'flex-end'
                                                    }}
                                                >
                                                    <View
                                                        style={[
                                                            styles.bar,
                                                            {
                                                                height: gastadoH,
                                                                backgroundColor: cat.color
                                                            }
                                                        ]}
                                                    />
                                                    <View
                                                        style={[
                                                            styles.bar,
                                                            {
                                                                height: limiteH,
                                                                backgroundColor:
                                                                    (cat.color || '#ccc') + '66'
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                                <Text style={styles.barLabel}>
                                                    {cat.name}
                                                </Text>
                                            </View>
                                        );
                                    });
                                })()}
                            </View>
                        </ScrollView>
                    ) : (
                        <View style={{ padding: 24, alignItems: 'center' }}>
                            <Text style={{ color: '#888' }}>
                                No hay presupuestos para mostrar.
                            </Text>
                        </View>
                    )}
                    <Text style={styles.chartNote}>
                        Nota: Los colores codificados coinciden con la leyenda.
                    </Text>
                </View>
            </>
        );
    };

    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
        }, [])
    );

    // Movimientos recientes
    const recentTransactions = (transactions || [])
        .slice()
        .sort((a, b) => {
            const getTime = t => {
                if (!t) return 0;
                const candidates = [
                    t.fecha,
                    t.created_at,
                    t.createdAt,
                    t.ts,
                    t.time
                ];
                for (const c of candidates) {
                    if (!c) continue;
                    const n = Date.parse(c);
                    if (!isNaN(n)) return n;
                    const num = Number(c);
                    if (!isNaN(num) && num > 0) return num;
                }
                if (t.id) {
                    const idn = Number(t.id);
                    if (!isNaN(idn)) return idn;
                }
                return 0;
            };
            return getTime(b) - getTime(a);
        })
        .slice(0, 3);

    const handleAtrasPress = () => {
        Alert.alert(
            'Salir',
            '¿Deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await usuarioController.logout();
                        } catch (e) {
                            console.warn('[GraficaScreen] logout error', e);
                        }
                        try {
                            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                        } catch (e) {
                            try {
                                navigation.navigate('Login');
                            } catch (e2) {
                                navigation.popToTop();
                            }
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: palette.bg }]}>
            <View style={styles.fondoAzul} />
    
    
    
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
            >
                
                <TouchableOpacity 

                    onPress={handleAtrasPress}
                 >
                    <Text style={styles.Atras}>{"< Atrás"}</Text>
                </TouchableOpacity>

                <View style={[styles.cardBalance]}>
                    
                    <Text style={styles.small}>Saldo Disponible</Text>
                    <Text style={styles.balance}>
                        $ {typeof saldoDisponible === 'number'
                        ? saldoDisponible.toFixed(2)
                        : '0.00'}
                    </Text>

                    <View style={styles.rowBetween}>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('ProfileTab')}
                        >
                            <Text style={styles.ctaText}>Mi Cuenta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.circleIcon}
                            onPress={handleOpenNotifications}
                        >
                            <Ionicons
                                name="mail"
                                size={metrics.circle * 0.6}
                                color={palette.primary}
                            />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Resumen de gastos */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Resumen de gastos</Text>
                        <TouchableOpacity onPress={onVerDetalle}>
                            <Text style={styles.link}>Ver a detalle</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.legendAndChart}>
                        {renderChartAndLegend()}
                    </View>
                </View>

                {/* Movimientos recientes */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>
                            Movimientos Recientes
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('StatusTab')}
                        >
                            <Text style={styles.link}>Ver Todo...</Text>
                        </TouchableOpacity>
                    </View>

                    {(!recentTransactions ||
                        recentTransactions.length === 0) ? (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                            <Text style={{ color: '#888' }}>
                                No hay movimientos recientes.
                            </Text>
                        </View>
                    ) : (
                        recentTransactions.map(tx => {
                            const monto = Number(tx.monto) || 0;
                            const isNegative = monto < 0;

                            // counterparty
                            let counterparty = '';
                            try {
                                let meta = tx.metadata;
                                if (meta && typeof meta === 'string') {
                                    try {
                                        meta = JSON.parse(meta);
                                    } catch (e) {}
                                }
                                const cpId =
                                    meta &&
                                    (meta.fromUserId ||
                                        meta.toUserId ||
                                        meta.toUser ||
                                        meta.fromUser);
                                if (cpId) {
                                    const found = (usersList || []).find(
                                        u => String(u.id) === String(cpId)
                                    );
                                    if (found)
                                        counterparty =
                                            found.nombre ||
                                            found.correo ||
                                            found.cuenta ||
                                            '';
                                }
                            } catch (e) {}

                            const title =
                                monto > 0
                                    ? `Recibido${
                                        counterparty ? ' de ' + counterparty : ''
                                    }`
                                    : `Enviado${
                                        counterparty ? ' a ' + counterparty : ''
                                    }`;

                            let dateLabel = '';
                            try {
                                const d =
                                    tx.fecha ||
                                    tx.created_at ||
                                    tx.createdAt ||
                                    tx.ts;
                                if (d) {
                                    const parsed = Date.parse(d);
                                    if (!isNaN(parsed))
                                        dateLabel = new Date(
                                            parsed
                                        ).toLocaleDateString();
                                    else {
                                        const n = Number(d);
                                        if (!isNaN(n) && n > 0)
                                            dateLabel = new Date(
                                                n
                                            ).toLocaleDateString();
                                    }
                                }
                            } catch (e) {}

                            const key =
                                tx.id ||
                                tx._id ||
                                `${dateLabel}_${monto}_${title}`;

                            return (
                                <View key={key} style={styles.movementItem}>
                                    <View style={styles.movLeft}>
                                        <View style={styles.circleSmall} />
                                    </View>
                                    <View style={styles.movMiddle}>
                                        <Text style={styles.movTitle}>{title}</Text>
                                        <Text style={styles.movDate}>{dateLabel}</Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.movAmount,
                                            {
                                                color: isNegative
                                                    ? '#FF3B30'
                                                    : '#0A84FF'
                                            }
                                        ]}
                                    >
                                        {isNegative
                                            ? `- $${Math.abs(monto).toFixed(2)}`
                                            : `+ $${monto.toFixed(2)}`}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Modal notificaciones */}
            <Modal
                visible={notifVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setNotifVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Notificaciones</Text>
                            <Pressable
                                onPress={() => setNotifVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </Pressable>
                        </View>

                        <FlatList
                            data={notifications}
                            keyExtractor={item => String(item.id)}
                            renderItem={({ item }) => (
                                <View style={styles.notifItem}>
                                    <Pressable
                                        style={styles.notifCloseButton}
                                        onPress={() =>
                                            handleDeleteNotification(item.id)
                                        }
                                    >
                                        <Text style={styles.notifCloseText}>✕</Text>
                                    </Pressable>
                                    <Text style={styles.notifTitle}>
                                        {item.subject ||
                                            item.title ||
                                            'Mensaje'}
                                    </Text>
                                    <Text style={styles.notifBody}>
                                        {item.body}
                                    </Text>
                                    <Text style={styles.notifTime}>
                                        {item.fecha
                                            ? new Date(
                                                item.fecha
                                            ).toLocaleString()
                                            : ''}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal detalle de presupuestos */}
            <Modal
                visible={chartModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setChartModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { maxHeight: '90%' }]}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>
                                Detalle de presupuestos
                            </Text>
                            <Pressable
                                onPress={() => setChartModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </Pressable>
                        </View>
                        <ScrollView>
                            <View style={{ paddingBottom: 20 }}>
                                {renderChartAndLegend(true)}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Navigation Tab inferior con icono de casa */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Ionicons name="home" size={28} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Toast Notification */}
            {toastVisible && (
                <View style={styles.toastContainer}>
                    <View style={styles.toast}>
                        <Ionicons name="notifications" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

// --- Vista Detalle ---
function Detalle({ onVolver, navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ ingresos: 0, gastos: 0 });

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                await usuarioController.initialize();
                const u = await usuarioController.getCurrentUser();
                if (!u) {
                    if (mounted) {
                        setTransactions([]);
                        setTotals({ ingresos: 0, gastos: 0 });
                    }
                    return;
                }
                let txs = [];
                try {
                    if (
                        DatabaseService &&
                        typeof DatabaseService.getTransactions === 'function'
                    ) {
                        const r = await DatabaseService.getTransactions(u.id, {
                            limit: 1000
                        });
                        txs = Array.isArray(r) ? r : [];
                    }
                } catch (e) {
                    console.warn(
                        '[GraficaScreen.Detalle] error getting transactions',
                        e
                    );
                    txs = [];
                }
                if (!mounted) return;
                setTransactions(txs);
                const ingresos = (txs || []).reduce(
                    (s, t) =>
                        s +
                        ((Number(t.monto) || 0) > 0
                            ? Number(t.monto)
                            : 0),
                    0
                );
                const gastos = (txs || []).reduce(
                    (s, t) =>
                        s +
                        ((Number(t.monto) || 0) < 0
                            ? Math.abs(Number(t.monto))
                            : 0),
                    0
                );
                if (mounted) setTotals({ ingresos, gastos });
            } catch (e) {
                console.warn('[GraficaScreen.Detalle] load error', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const total = totals.ingresos + totals.gastos;
    const widthAndHeight = 160;
    const series =
        total > 0
            ? [
                { value: totals.ingresos || 0, color: '#36D36C' },
                { value: totals.gastos || 0, color: '#FF3B30' }
            ]
            : [];

    return (
        <View style={[styles.container, { backgroundColor: palette.bg }]}>
            <View style={styles.fondoAzul} />
            <View style={styles.fondoInferior} />

            {/* Navigation Tab inferior también en Detalle */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Ionicons name="home" size={28} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
            >
                <TouchableOpacity 

                    onPress={onVolver}
                 >
                    <Text style={styles.Atras}>{"< Atrás"}</Text>
                </TouchableOpacity>
                <View style={[styles.cardBalance]}>
                    <Text style={styles.small}>Saldo Disponible</Text>
                    <Text style={styles.balance}>
                        ${' '}
                        {(
                            (totals.ingresos - totals.gastos) ||
                            0
                        ).toFixed(2)}
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Ingresos y Gastos</Text>
                        <TouchableOpacity onPress={onVolver}>
                            <Text style={styles.link}>Volver</Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 12
                        }}
                    >
                        <View
                            style={{
                                width: 160,
                                height: 160,
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {loading ? (
                                <Text>Cargando...</Text>
                            ) : !transactions ||
                            transactions.length === 0 ? (
                                <View style={styles.piePlaceholder}>
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            paddingHorizontal: 8
                                        }}
                                    >
                                        Sin movimientos
                                    </Text>
                                </View>
                            ) : total === 0 ? (
                                <View style={styles.piePlaceholder}>
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            paddingHorizontal: 8
                                        }}
                                    >
                                        No hay ingresos ni gastos registrados
                                    </Text>
                                </View>
                            ) : (
                                <PieChart
                                    widthAndHeight={widthAndHeight}
                                    series={series}
                                    coverRadius={0.45}
                                    coverFill={'#FFF'}
                                />
                            )}
                        </View>

                        <View style={styles.legendBlock}>
                            {!transactions ||
                            transactions.length === 0 ||
                            totals.ingresos + totals.gastos === 0 ? (
                                <View
                                    style={{
                                        padding: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#666',
                                            fontWeight: '600',
                                            flex: 1,
                                            textAlign: 'flex-start',
                                            paddingRight: 50
                                        }}
                                    >
                                        No hay ingresos ni gastos registrados
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.dot,
                                                { backgroundColor: '#36d36c' }
                                            ]}
                                        />
                                        <Text>
                                            Ingresos: ${' '}
                                            {totals.ingresos.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.dot,
                                                { backgroundColor: '#ff3b30' }
                                            ]}
                                        />
                                        <Text>
                                            Gastos: ${' '}
                                            {totals.gastos.toFixed(2)}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <Text style={{ color: '#666' }}>
                            - Aquí puedes ver el detalle por categoría en una vista
                            ampliada.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// --- Estilos y constantes ---
const palette = {
    bg: '#f6f7fb',
    header: '#002359',
    primary: '#0A63D8',
    card: '#ffffff',
    text: '#333',
    textMuted: '#666',
    border: '#eee'
};

const metrics = {
    r: 12,
    rHeader: 18,
    p: 16,
    pSm: 12,
    headerMinH: 56,
    circle: 40,
    dot: 12,
    barW: 18,
    chartH: 175,
    doubleBarW: 38
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative' },

    cardBalance: {
        backgroundColor: palette.card,
        borderRadius: metrics.r,
        padding: metrics.p,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        marginTop: Platform.OS === 'android' ? 20 : 80
    },
    fondoAzul: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 250,
        backgroundColor: "#002359",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,

        paddingTop: 30,
        paddingLeft: 20,
        
    },
    Atras: {
        color: "#0a57d9",
        fontSize: 16,
        marginTop: 15,
        
    },
    fondoInferior: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 60,
        backgroundColor: '#002359',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40
    },
    small: { color: palette.textMuted, fontSize: 14 },
    balance: { fontSize: 28, fontWeight: '700', marginTop: 6 },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12
    },
    ctaButton: {
        backgroundColor: palette.primary,
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 20
    },
    ctaText: { color: '#fff', fontWeight: '600' },
    circleIcon: {
        width: metrics.circle,
        height: metrics.circle,
        borderRadius: metrics.circle / 2,
        borderWidth: 2,
        borderColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },

    sectionCard: {
        backgroundColor: palette.card,
        marginTop: 18,
        borderRadius: metrics.r,
        padding: metrics.pSm,
        elevation: 1
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    link: { color: palette.primary, fontWeight: '600' },

    legendAndChart: { flexDirection: 'row', gap: 16 },
    legend: { flex: 1, justifyContent: 'center' },
    legendBlock: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    dot: {
        width: metrics.dot,
        height: metrics.dot,
        borderRadius: metrics.dot / 2,
        marginRight: 8
    },
    legendText: {
        fontSize: 12,
        color: palette.text,
        maxWidth: 140
    },

    warningMessage: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },

    chartCard: {
        flex: 1.6,
        backgroundColor: palette.card,
        borderRadius: 8,
        padding: metrics.pSm,
        borderWidth: 1,
        borderColor: palette.border
    },
    barsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: metrics.chartH
    },

    doubleBar: {
        alignItems: 'center',
        width: 'auto',
        justifyContent: 'space-between'
    },
    bar: {
        width: metrics.barW * 0.8,
        borderRadius: 4
    },
    barLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 6,
        width: 'auto',
        paddingHorizontal: 8,
        alignSelf: 'center',
        color: '#333',
        fontWeight: '600'
    },

    chartNote: {
        fontSize: 12,
        color: '#888',
        marginTop: 8,
        textAlign: 'center'
    },

    piePlaceholder: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#36d36c',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },

    movementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    movLeft: { width: 40, alignItems: 'center' },
    circleSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    movMiddle: { flex: 1, paddingLeft: 8 },
    movTitle: { fontWeight: '600' },
    movDate: { color: '#999', fontSize: 12 },
    movAmount: { fontWeight: '700' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalBox: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    closeButton: { paddingHorizontal: 12, paddingVertical: 6 },
    closeButtonText: { color: palette.primary, fontWeight: '700' },
    notifItem: {
        position: 'relative',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    notifCloseButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    notifCloseText: { color: '#333', fontSize: 10 },
    notifTitle: { fontWeight: '700', marginBottom: 4 },
    notifBody: { color: '#444', marginBottom: 6 },
    notifTime: { color: '#888', fontSize: 12 },

    // Navigation Tab inferior
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 60,
        backgroundColor: '#002359',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    homeButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0a57d9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff'
    },
    // Badge for unread notifications
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    // Toast notification styles
    toastContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 9999
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    toastText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500'
    }
});

