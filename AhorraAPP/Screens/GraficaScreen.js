import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Modal, Pressable, FlatList, BackHandler, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioController = new UsuarioController();
// --- IMPORTACIÓN DE GRÁFICO CIRCULAR ---
import PieChart from 'react-native-pie-chart'; 

/*
  GraficaScreen.js
  ... (Tus comentarios)
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

        // Back handler is registered only while this screen is focused (see useFocusEffect below)
        return () => { mounted = false; };
    }, [isLoggedIn]);

    // Register back handler only when this screen is focused
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (isLoggedIn) {
                    Alert.alert(
                        'Salir',
                        '¿Deseas cerrar sesión?',
                        [
                            { text: 'Cancelar', style: 'cancel', onPress: () => {} },
                            { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
                                try { await usuarioController.logout(); } catch (e) { console.warn('[GraficaScreen] logout error', e); }
                                try { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }
                                catch (e) { try { navigation.navigate('Login'); } catch (e2) { navigation.popToTop(); } }
                            } }
                        ]
                    );
                    return true;
                }
                return false;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => {
                try {
                    if (subscription && typeof subscription.remove === 'function') subscription.remove();
                    else if (BackHandler.removeEventListener) BackHandler.removeEventListener('hardwareBackPress', onBackPress);
                } catch (e) { console.warn('[GraficaScreen] error removing BackHandler listener', e); }
            };
        }, [isLoggedIn])
    );
    return ruta === 'principal' ? (
        <Principal navigation={navigation} onVerDetalle={() => setRuta('detalle')} />
    ) : (
        <Detalle navigation={navigation} onVolver={() => setRuta('principal')} />
    );
}

// Header removed — we inline the header markup where needed so containers can overlap it.

// --- Vista Principal ---
function Principal({ onVerDetalle, navigation }) {
    const [notifVisible, setNotifVisible] = useState(false);
    const [notifications] = useState([
        { id: 'n1', title: 'Pago recibido', body: 'Has recibido $1,200.00', time: 'Hoy 10:30' },
        { id: 'n2', title: 'Alerta presupuesto', body: 'Estás cerca de tu límite en Comida', time: 'Ayer 18:12' },
        { id: 'n3', title: 'Recordatorio', body: 'Paga tu servicio de agua', time: 'Hace 2 días' },
    ]);

    return (
        <View style={[styles.container, { backgroundColor: palette.bg }] }>
            {/* Header removed — main content starts here */}
            <View style={styles.fondoAzul} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

                <View style={[styles.cardBalance]}>
                    <Text style={styles.small}>Saldo Disponible</Text>
                    <Text style={styles.balance}>$ 23403.74</Text>

                    <View style={styles.rowBetween}>
                        <TouchableOpacity style={styles.ctaButton} 
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Text style={styles.ctaText}>Mi Cuenta</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.circleIcon} onPress={() => setNotifVisible(true)}>
                            <Ionicons
                                name="mail"
                                size={metrics.circle * 0.6}
                                color={palette.primary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sección: Resumen de gastos con leyenda y gráfico de barras */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Resumen de gastos</Text>
                        <TouchableOpacity onPress={onVerDetalle}><Text style={styles.link}>Ver a detalle</Text></TouchableOpacity>
                    </View>

                    <View style={styles.legendAndChart}>
                        {/* Leyenda con nuevos colores (dots) */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#3AA0FF'}]} /><Text style={styles.legendText}>Otros</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#36D36C'}]} /><Text style={styles.legendText}>Comida</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#FFD15C'}]} /><Text style={styles.legendText}>Ocio</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#0A84FF'}]} /><Text style={styles.legendText}>Agua</Text></View>
                            {/* Mensaje de advertencia */}
                            <Text style={styles.warningMessage}>
                                <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" /> Has excedido tu presupuesto de Comida con: $xxxx
                            </Text>
                        </View>

                        {/* GRÁFICO (Barras dobles) */}
                        <View style={styles.chartCard}>
                            <View style={styles.barsRow}>
                                {/* Otros */}
                                <View style={styles.doubleBar}>
                                    <View style={[styles.bar, { height: 90 }, {backgroundColor: '#0A84FF'}]} />
                                    <View style={[styles.bar, { height: 75 }, {backgroundColor: 'rgba(58, 160, 255, 0.4)'}]} />
                                </View>
                                {/* Comida */}
                                <View style={styles.doubleBar}>
                                    <View style={[styles.bar, { height: 120 }, {backgroundColor: '#36D36C'}]} />
                                    <View style={[styles.bar, { height: 100 }, {backgroundColor: 'rgba(54, 211, 108, 0.4)'}]} />
                                </View>
                                {/* Ocio */}
                                <View style={styles.doubleBar}>
                                    <View style={[styles.bar, { height: 100 }, {backgroundColor: '#FFD15C'}]} />
                                    <View style={[styles.bar, { height: 85 }, {backgroundColor: 'rgba(255, 209, 92, 0.4)'}]} />
                                </View>
                                {/* Agua */}
                                <View style={styles.doubleBar}>
                                    <View style={[styles.bar, { height: 130 }, {backgroundColor: '#0A84FF'}]} />
                                    <View style={[styles.bar, { height: 110 }, {backgroundColor: 'rgba(58, 160, 255, 0.4)'}]} />
                                </View>
                            </View>
                            <Text style={styles.chartNote}>Nota: Los colores codificados coinciden con la leyenda.</Text>
                        </View>
                    </View>
                </View>

                {/* Sección: Movimientos recientes (lista sencilla) */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Status')}
                        >
                            <Text style={styles.link}>Ver Todo...</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Items */}
                    <View style={styles.movementItem}>
                        <View style={styles.movLeft}><View style={styles.circleSmall} /></View>
                        <View style={styles.movMiddle}>
                            <Text style={styles.movTitle}>Movimiento 1</Text>
                            <Text style={styles.movDate}>1 de agosto 2025</Text>
                        </View>
                        <Text style={[styles.movAmount, { color: '#FF3B30' }]}>- $365.90</Text>
                    </View>

                    <View style={styles.movementItem}>
                        <View style={styles.movLeft}><View style={styles.circleSmall} /></View>
                        <View style={styles.movMiddle}>
                            <Text style={styles.movTitle}>Movimiento 2</Text>
                            <Text style={styles.movDate}>28 de julio 2025</Text>
                        </View>
                        <Text style={[styles.movAmount, { color: '#0A84FF' }]}>+ $2640.00</Text>
                    </View>
                </View>
            </ScrollView>
            <Modal visible={notifVisible} animationType="fade" transparent onRequestClose={() => setNotifVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Notificaciones</Text>
                            <Pressable onPress={() => setNotifVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </Pressable>
                        </View>

                        <FlatList
                            data={notifications}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.notifItem}>
                                    <Text style={styles.notifTitle}>{item.title}</Text>
                                    <Text style={styles.notifBody}>{item.body}</Text>
                                    <Text style={styles.notifTime}>{item.time}</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <View style={styles.fondoInferior} />
        </View>
    );
}

// --- Vista Detalle ---
function Detalle({ onVolver }) {
    // --- Datos para el PieChart (CORRECCIÓN FINAL) ---
    // La librería espera un array de objetos, cada uno con 'value' y 'color'.
    const widthAndHeight = 160;
    const series = [
        { value: 65, color: '#36D36C' }, // 65% ingresos (Verde)
        { value: 35, color: '#FF3B30' }, // 35% gastos (Rojo)
    ];

    return (
        <View style={[styles.container, { backgroundColor: palette.bg }] }>
            <View style={styles.fondoAzul} />
            <View style={styles.fondoInferior} />

            {/* Header removed — main content starts here for Detalle */}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                <View style={[styles.cardBalance]}>
                    <Text style={styles.small}>Saldo Disponible</Text>
                    <Text style={styles.balance}>$ 23403.74</Text>
                </View>

                <View style={styles.sectionCard}>
                    {/* Título de la sección "Ingresos y Gastos" */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Ingresos y Gastos</Text>
                        <TouchableOpacity onPress={onVolver}><Text style={styles.link}>Volver</Text></TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                        {/* --- IMPLEMENTACIÓN CORREGIDA --- */}
                        {/* Pasamos el array de objetos directamente a 'series' */}
                        {/* Y eliminamos la prop 'sliceColor' */}
                        <PieChart
                            widthAndHeight={widthAndHeight}
                            series={series} // <-- ¡AQUÍ ESTÁ LA CORRECCIÓN!
                            // sliceColor prop ya no es necesaria
                            coverRadius={0.45} 
                            coverFill={'#FFF'} 
                        />
                        <View style={{ flex: 1, paddingLeft: 16 }}>
                            {/* Leyenda de Ingresos y Gastos */}
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#36D36C'}]} /><Text>Ingresos</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#FF3B30'}]} /><Text>Gastos</Text></View>
                        </View>
                    </View>

                    {/* Mensaje "Tus ingresos superan..." */}
                    <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#36D36C" style={{ marginRight: 5 }} />
                        <Text style={{ color: palette.text }}>Tus ingresos superan a tus gastos este mes.</Text>
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
    border: '#eee',
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
    chartH: 140,
    doubleBarW: 38,
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative' }, 
    // header styles removed
    cardBalance: {
        backgroundColor: palette.card,
        borderRadius: metrics.r,
        padding: metrics.p,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        marginTop: Platform.OS === 'android' ? 60 : 80,
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
    },
    fondoInferior: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 60,
        backgroundColor: "#002359",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    small: { color: palette.textMuted, fontSize: 14 },
    balance: { fontSize: 28, fontWeight: '700', marginTop: 6 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    ctaButton: { backgroundColor: palette.primary, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
    ctaText: { color: '#fff', fontWeight: '600' },
    circleIcon: { 
        width: metrics.circle, 
        height: metrics.circle, 
        borderRadius: metrics.circle / 2, 
        borderWidth: 2, 
        borderColor: palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sectionCard: { backgroundColor: palette.card, marginTop: 18, borderRadius: metrics.r, padding: metrics.pSm, elevation: 1 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    link: { color: palette.primary, fontWeight: '600' },

    legendAndChart: { flexDirection: 'row', gap: 12 },
    legend: { flex: 1, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dot: { width: metrics.dot, height: metrics.dot, borderRadius: metrics.dot / 2, marginRight: 8 },
    legendText: { fontSize: 14, color: palette.text },
    
    warningMessage: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },

    chartCard: { flex: 1.6, backgroundColor: palette.card, borderRadius: 8, padding: metrics.pSm, borderWidth: 1, borderColor: palette.border },
    barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: metrics.chartH },
    
    doubleBar: { 
        flexDirection: 'row', 
        alignItems: 'flex-end',
        width: metrics.doubleBarW, 
        justifyContent: 'space-between', 
    },
    bar: { 
        width: metrics.barW * 0.8, 
        borderRadius: 4,
    },

    chartNote: { fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' },

    movementItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    movLeft: { width: 40, alignItems: 'center' },
    circleSmall: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#ddd' },
    movMiddle: { flex: 1, paddingLeft: 8 },
    movTitle: { fontWeight: '600' },
    movDate: { color: '#999', fontSize: 12 },
    movAmount: { fontWeight: '700' },
    
    // Notification modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBox: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    closeButtonText: {
        color: palette.primary,
        fontWeight: '700',
    },
    notifItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    notifTitle: {
        fontWeight: '700',
        marginBottom: 4,
    },
    notifBody: {
        color: '#444',
        marginBottom: 6,
    },
    notifTime: {
        color: '#888',
        fontSize: 12,
    },

    // footer/background styles removed
});