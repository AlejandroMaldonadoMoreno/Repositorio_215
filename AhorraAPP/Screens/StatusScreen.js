import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';

import Pantalla_Transacciones from './Pantalla_Transacciones.instructions';


export default function StatusScreen() {
    const[screen, setScreen] = useState('status');

    const [movimientos, setMovimientos] = useState([
        { id: 'm1', title: 'Movimento 1', tag: 'Pagaste - concepto: Pago del auto', amount: '$ 25,000.75', date: '14 de noviembre de 2025', time: '10:30' },
        { id: 'm2', title: 'Movimento 2', tag: 'Recibiste - concepto: Venta de bicicleta', amount: '$ 45,000.13', date: '13 de noviembre de 2025', time: '14:15' },
        { id: 'm3', title: 'Movimento 3', tag: 'Recibiste - concepto: Cobro de alquileres', amount: '$ 5,450.00', date: '12 de noviembre de 2025', time: '09:45' },
        { id: 'm4', title: 'Movimento 4', tag: 'Pagaste - concepto: Compra de libros', amount: '$ 1,000.13', date: '11 de noviembre de 2025', time: '16:20' },
    ]);

    const showConfirm = (title, message, action) => {
        setConfirmTitle(title);
        setConfirmMessage(message);
        setOnConfirmAction(() => () => {
            try { action(); } finally { setConfirmVisible(false); }
        });
        setConfirmVisible(true);
    };


    // Presupuestos Mensuales
    const [monthlyBudgets, setMonthlyBudgets] = useState([
        { id: 'mb1', concept: 'Alimentación', limit: '500.00', spent: '100.50', month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { id: 'mb2', concept: 'Transporte', limit: '200.00', spent: '150.00', month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { id: 'mb3', concept: 'Entretenimiento', limit: '300.00', spent: '290.75', month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { id: 'mb4', concept: 'Videjuegos', limit: '600.00', spent: '200.00', month: new Date().getMonth() + 1, year: new Date().getFullYear() },

    ]);

    const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
    const [editingMonthlyId, setEditingMonthlyId] = useState(null);
    const [newMonthlyCategory, setNewMonthlyCategory] = useState('');
    const [newMonthlyLimit, setNewMonthlyLimit] = useState('');
    const [newMonthlySpent, setNewMonthlySpent] = useState('0.00');
    // Monthly budgets filters/sorting/search
    const [monthlyFilterModalVisible, setMonthlyFilterModalVisible] = useState(false);
    const [monthlySortType, setMonthlySortType] = useState('riesgoMayor'); // riesgoMayor/riesgoMenor
    const [monthlyRiskFilters, setMonthlyRiskFilters] = useState({ bajo: false, alto: false });
    const [monthlySearchTerm, setMonthlySearchTerm] = useState('');
    const [movimientoModalVisible, setMovimientoModalVisible] = useState(false);
    const [editingMovimiento, setEditingMovimiento] = useState(null);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    // filters can be combined (payments, received)
    const [filters, setFilters] = useState({ tipoPago: false, tipoRecibido: false });
    // sortType controls ordering (only one at a time)
    const [sortType, setSortType] = useState('fechaReciente');
    // Internal confirmation modal state (works across platforms)
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});


    const handleAddBudget = () => {
        if (!newBudgetName.trim() || !newBudgetAmount.trim()) {
            Alert.alert('Error', 'Por favor, completa todos los campos antes de guardar.');
            return;
        }
        const id = `b${Date.now()}`;
        setBudgets(prev => [{ id, name: newBudgetName.trim(), amount: newBudgetAmount.trim(), color: '#a8d0e6' }, ...prev]);
        setNewBudgetName('');
        setNewBudgetAmount('');
        setModalVisible(false);
    };

    // Función para ordenar/filtrar movimientos con filtros combinables
    const getOrderedMovimientos = () => {
        // Helper: parse Spanish date like "14 de noviembre de 2025" and optional time "10:30"
        const parseSpanishDateTime = (dateStr, timeStr) => {
            if (!dateStr) return new Date(0);
            const monthMap = {
                enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
                julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
            };
            try {
                const m = dateStr.toString().toLowerCase().match(/(\d{1,2})\s+de\s+([a-zñ]+)\s+de\s+(\d{4})/i);
                if (m) {
                    const day = parseInt(m[1], 10);
                    const monthName = m[2];
                    const year = parseInt(m[3], 10);
                    const month = monthMap[monthName] !== undefined ? monthMap[monthName] : 0;
                    let hours = 0, minutes = 0;
                    if (timeStr) {
                        const t = timeStr.toString().match(/(\d{1,2}):(\d{2})/);
                        if (t) { hours = parseInt(t[1], 10); minutes = parseInt(t[2], 10); }
                    }
                    return new Date(year, month, day, hours, minutes);
                }
                // Fallback to Date parsing if format differs
                const fallback = new Date(dateStr);
                if (!isNaN(fallback)) return fallback;
            } catch (e) {}
            return new Date(0);
        };

        let arr = [...movimientos];

        // Apply type filters first (if any selected)
        if (filters.tipoPago || filters.tipoRecibido) {
            arr = arr.filter(m => {
                const tag = (m.tag || '').toLowerCase();
                const isPago = tag.includes('paga') || tag.includes('pagaste');
                const isRecibido = tag.includes('recibi') || tag.includes('recibiste');
                return (filters.tipoPago && isPago) || (filters.tipoRecibido && isRecibido);
            });
        }

        // Apply sorting
        if (sortType === 'fechaReciente') {
            arr.sort((a, b) => parseSpanishDateTime(b.date, b.time) - parseSpanishDateTime(a.date, a.time));
        } else if (sortType === 'fechaAntigua') {
            arr.sort((a, b) => parseSpanishDateTime(a.date, a.time) - parseSpanishDateTime(b.date, b.time));
        } else if (sortType === 'montoMenor') {
            arr.sort((a, b) => parseFloat(a.amount.replace(/[^\d.]/g, '')) - parseFloat(b.amount.replace(/[^\d.]/g, '')));
        } else if (sortType === 'montoMayor') {
            arr.sort((a, b) => parseFloat(b.amount.replace(/[^\d.]/g, '')) - parseFloat(a.amount.replace(/[^\d.]/g, '')));
        }

        return arr;

    };

    // CRUD Operations for Monthly Budgets
    const handleAddMonthlyBudget = () => {
        if (!newMonthlyCategory.trim() || !newMonthlyLimit.trim()) return;
        
        const id = `mb${Date.now()}`;
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        setMonthlyBudgets(prev => [{ 
            id, 
            concept: newMonthlyCategory.trim(), 
            limit: newMonthlyLimit.trim(), 
            spent: newMonthlySpent || '0.00',
            month: currentMonth,
            year: currentYear
        }, ...prev]);
        
        setNewMonthlyCategory('');
        setNewMonthlyLimit('');
        setNewMonthlySpent('0.00');
        setEditingMonthlyId(null);
        setMonthlyModalVisible(false);
    };


    const getPercentageSpent = (spent, limit) => {
        return Math.min(Math.round((parseFloat(spent) / parseFloat(limit)) * 100), 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage <= 50) return '#36d36c';
        if (percentage <= 80) return '#ffbe54';
        return '#d9534f';
    };

    // Get filtered + sorted monthly budgets according to search, risk filters and sort type
    const getFilteredMonthlyBudgets = () => {
        let arr = [...monthlyBudgets];

        // Search by concept (live)
        if (monthlySearchTerm && monthlySearchTerm.trim() !== '') {
            const term = monthlySearchTerm.trim().toLowerCase();
            arr = arr.filter(mb => (mb.concept || '').toLowerCase().includes(term));
        }

        // Apply risk filters if any
        if (monthlyRiskFilters.bajo || monthlyRiskFilters.alto) {
            arr = arr.filter(mb => {
                const pct = getPercentageSpent(mb.spent, mb.limit);
                const isBajo = pct <= 50;
                const isAlto = pct >= 80;
                return (monthlyRiskFilters.bajo && isBajo) || (monthlyRiskFilters.alto && isAlto);
            });
        }

        // Apply sorting by riesgo (only these two now)
        if (monthlySortType === 'riesgoMayor') {
            arr.sort((a, b) => getPercentageSpent(b.spent, b.limit) - getPercentageSpent(a.spent, a.limit));
        } else if (monthlySortType === 'riesgoMenor') {
            arr.sort((a, b) => getPercentageSpent(a.spent, a.limit) - getPercentageSpent(b.spent, b.limit));
        }

        return arr;
    };

    switch (screen) {
        case 'transacciones':
            return <Pantalla_Transacciones/>;
        case 'status':
        
    return (
    <ScrollView
        contentContainerStyle={styles.containerMain}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
    >
        <View style={styles.fondoAzul} />
        
            <View style={styles.contenido}>
                <View style={styles.dataContainer}>
                    <Text style={styles.titleTag}> Saldo Disponible</Text>

                    <Text style={styles.titleMoney}>$ 25,000.75</Text>
                    <TouchableOpacity 
                        style={styles.botonTransacciones}
                        onPress={() => setScreen('transacciones')}

                    >
                        <Text style={styles.tituloBoton}> Crear Transacción </Text>
                    </TouchableOpacity>
                </View>


                <View style={styles.dataContainer}>

                    <View style={styles.movimientosContainer}>
                        <Text style={styles.titleTag}> Movimientos Recientes</Text>
                        <TouchableOpacity 
                            style={styles.movimientosBoton}
                            onPress={() => setOrderModalVisible(true)}
                        >
                            <Text style={styles.movimientosBotonText}> Ordenar por..</Text>
                        </TouchableOpacity>
                        
                    </View>
                    {/* Monthly budgets filter modal */}
                    <Modal
                        visible={monthlyFilterModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setMonthlyFilterModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>Filtros Presupuestos</Text>
                                <Text style={styles.modalSubtitle}>Riesgo (puede seleccionar varios):</Text>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setMonthlyRiskFilters(prev => ({...prev, bajo: !prev.bajo}))}
                                >
                                    <Text style={styles.orderOptionText}>{monthlyRiskFilters.bajo ? '☑' : '☐'} Bajo (≤50%)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setMonthlyRiskFilters(prev => ({...prev, alto: !prev.alto}))}
                                >
                                    <Text style={styles.orderOptionText}>{monthlyRiskFilters.alto ? '☑' : '☐'} Alto (≥80%)</Text>
                                </TouchableOpacity>

                                <Text style={[styles.modalSubtitle, {marginTop: 10}]}>Ordenar por riesgo:</Text>
                                <TouchableOpacity style={styles.orderOption} onPress={() => { setMonthlySortType('riesgoMayor'); setMonthlyFilterModalVisible(false); }}>
                                    <Text style={styles.orderOptionText}>🔥 Riesgo (mayor a menor)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.orderOption} onPress={() => { setMonthlySortType('riesgoMenor'); setMonthlyFilterModalVisible(false); }}>
                                    <Text style={styles.orderOptionText}>❄️ Riesgo (menor a mayor)</Text>
                                </TouchableOpacity>

                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#6c757d', flex: 1, marginRight: 8}]}
                                        onPress={() => { setMonthlyRiskFilters({ bajo: false, alto: false }); setMonthlySortType('riesgoMayor'); setMonthlyFilterModalVisible(false); }}
                                    >
                                        <Text style={styles.modalButtonText}>Limpiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#0a57d9', flex: 1}]}
                                        onPress={() => setMonthlyFilterModalVisible(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Aplicar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <ScrollView 
                        nestedScrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        style={styles.movimientosScroll}
                    >

                        {getOrderedMovimientos().map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={styles.movimientoDatoContainer}
                                onPress={() => {
                                    setEditingMovimiento(m);
                                    setMovimientoModalVisible(true);
                                }}
                            >
                                <View style={{flex: 1}}>
                                    <Text style={styles.movimientoTag}>{m.title}</Text>
                                    <Text style={styles.tag}> {m.tag} </Text>
                                    <Text style={styles.movimientoFecha}>{m.date} - {m.time}</Text>
                                </View>
                                <View style={styles.tipoMovimientoContainer}>
                                    <Text style={styles.money}>{m.amount}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        
                    </ScrollView>

                    {/* Modal de información de movimiento */}
                    {movimientoModalVisible && editingMovimiento && (
                        <Modal
                            visible={movimientoModalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setMovimientoModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.titleTag}>{editingMovimiento.tag}</Text>
                                    <View style={styles.modalInfoSection}>
                                        <Text style={styles.modalInputLabel}>Título:</Text>
                                        <Text style={styles.modalInputValue}>{editingMovimiento.title}</Text>
                                        
                                        <Text style={styles.modalInputLabel}>Monto:</Text>
                                        <Text style={styles.modalInputValue}>{editingMovimiento.amount}</Text>
                                        
                                        <Text style={styles.modalInputLabel}>Fecha:</Text>
                                        <Text style={styles.modalInputValue}>{editingMovimiento.date}</Text>
                                        
                                        <Text style={styles.modalInputLabel}>Hora:</Text>
                                        <Text style={styles.modalInputValue}>{editingMovimiento.time}</Text>
                                    </View>
                                    <View style={styles.modalButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, {backgroundColor: '#999'}]}
                                            onPress={() => setMovimientoModalVisible(false)}
                                        >
                                            <Text style={styles.modalButtonText}>Cerrar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}

                    {/* Modal de ordenar/filtrar (combinable) */}
                    <Modal
                        visible={orderModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setOrderModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>Ordenar/Filtrar por:</Text>

                                <Text style={[styles.modalSubtitle, {marginTop: 5}]}>Filtrar por tipo (puede seleccionar varios):</Text>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setFilters(prev => ({...prev, tipoPago: !prev.tipoPago}))}
                                >
                                    <Text style={styles.orderOptionText}>{filters.tipoPago ? '☑' : '☐'} 💸 Solo pagos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => setFilters(prev => ({...prev, tipoRecibido: !prev.tipoRecibido}))}
                                >
                                    <Text style={styles.orderOptionText}>{filters.tipoRecibido ? '☑' : '☐'} 💵 Solo recibidos</Text>
                                </TouchableOpacity>

                                <Text style={[styles.modalSubtitle, {marginTop: 10}]}>Ordenar por (elige uno):</Text>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('fechaReciente'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>📅 Fecha más reciente</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('fechaAntigua'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>📅 Fecha más antigua</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('montoMenor'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>💰 Monto menor a mayor</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.orderOption}
                                    onPress={() => { setSortType('montoMayor'); setOrderModalVisible(false); }}
                                >
                                    <Text style={styles.orderOptionText}>💰 Monto mayor a menor</Text>
                                </TouchableOpacity>

                                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#6c757d', flex: 1, marginRight: 8}]}
                                        onPress={() => { setFilters({ tipoPago: false, tipoRecibido: false }); setSortType('fechaReciente'); }}
                                    >
                                        <Text style={styles.modalButtonText}>Limpiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, {backgroundColor: '#0a57d9', flex: 1}]}
                                        onPress={() => setOrderModalVisible(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Aplicar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>

                {/* Monthly Budgets Section */}
                <View style={styles.dataContainer}>
                    <View style={[styles.textPresupuestoContainer, {justifyContent: 'space-between', alignItems: 'center'}]}>
                        <Text style={styles.titleTag}> Presupuestos Mensuales</Text>
                    </View>

                                <Text style={styles.monthlyBudgetInfo}>
                                    Mes actual: {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                                </Text>

                                <View style={styles.presupuestoContainer}>
                                    <TextInput
                                        placeholder="Buscar por concepto..."
                                        value={monthlySearchTerm}
                                        onChangeText={setMonthlySearchTerm}
                                        style={styles.presupuestoInput}
                                    />
                                    <TouchableOpacity
                                        style={styles.presupuestoBoton}
                                        onPress={() => setMonthlyFilterModalVisible(true)}
                                    >
                                        <Text style={styles.presupuestoBotonText}>Filtros</Text>
                                    </TouchableOpacity>
                                </View>

                    <ScrollView
                        style={styles.monthlyBudgetScroll}
                        contentContainerStyle={styles.monthlyBudgetScrollContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.monthlyBudgetRow}>
                            {getFilteredMonthlyBudgets().map(mb => {
                                const percentage = getPercentageSpent(mb.spent, mb.limit);
                                const progressColor = getProgressColor(percentage);
                                return (
                                    <TouchableOpacity
                                        key={mb.id}
                                        style={styles.monthlyBudgetItemBox}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setEditingMonthlyId(mb.id);
                                            setNewMonthlyCategory(mb.concept);
                                            setNewMonthlyLimit(mb.limit);
                                            setNewMonthlySpent(mb.spent);
                                            setMonthlyModalVisible(true);
                                        }}
                                    >
                                        <View style={[styles.thermoBackground]}> 
                                            <View style={[styles.thermoFill, {width: `${percentage}%`, backgroundColor: progressColor}]} />
                                        </View>
                                        <View style={styles.monthlyBudgetBoxContent}>
                                            <View style={styles.monthlyBudgetHeader}>
                                                <Text style={styles.conceptTitle}>{mb.concept}</Text>
                                            </View>
                                            <View style={styles.monthlyBudgetAmount}>
                                                <Text style={styles.spentAmount}>$ {mb.spent} / $ {mb.limit}</Text>
                                                <Text style={styles.percentageText}>{percentage}%</Text>
                                            </View>
                                            <Text style={styles.remainingText}>
                                                Disponible: $ {(parseFloat(mb.limit) - parseFloat(mb.spent)).toFixed(2)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Monthly Budget Modal */}
                    {monthlyModalVisible && (
                        <Modal
                            visible={monthlyModalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setMonthlyModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.titleTag}>{editingMonthlyId ? 'Editar Presupuesto Mensual' : 'Nuevo Presupuesto Mensual'}</Text>
                                    
                                    <Text style={styles.modalInputLabel}>Concepto</Text>
                                    <TextInput
                                        placeholder="Ej: Alimentación"
                                        value={newMonthlyCategory}
                                        onChangeText={setNewMonthlyCategory}
                                        style={styles.modalInput}
                                    />
                                    
                                    <Text style={styles.modalInputLabel}>Límite mensual</Text>
                                    <TextInput
                                        placeholder="0.00"
                                        value={newMonthlyLimit}
                                        onChangeText={setNewMonthlyLimit}
                                        keyboardType="decimal-pad"
                                        style={styles.modalInput}
                                    />
                                    
                                    <Text style={styles.modalInputLabel}>Gastado hasta ahora (opcional)</Text>
                                    <TextInput
                                        placeholder="0.00"
                                        value={newMonthlySpent}
                                        onChangeText={setNewMonthlySpent}
                                        keyboardType="decimal-pad"
                                        style={styles.modalInput}
                                    />
                                    <View style={styles.modalButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, {backgroundColor: '#0a57d9'}]}
                                            onPress={() => {
                                                if (editingMonthlyId) {
                                                    setMonthlyBudgets(prev => prev.map(mb => mb.id === editingMonthlyId ? {
                                                        ...mb,
                                                        concept: newMonthlyCategory,
                                                        limit: newMonthlyLimit,
                                                        spent: newMonthlySpent
                                                    } : mb));
                                                } else {
                                                    handleAddMonthlyBudget();
                                                }
                                                setMonthlyModalVisible(false);
                                            }}
                                        >
                                            <Text style={styles.modalButtonText}>{editingMonthlyId ? 'Actualizar' : 'Guardar'}</Text>
                                        </TouchableOpacity>
                                        {editingMonthlyId && (
                                            <TouchableOpacity
                                                style={[styles.modalButton, {backgroundColor: '#d9534f'}]}
                                                onPress={() => {
                                                    setMonthlyBudgets(prev => prev.filter(mb => mb.id !== editingMonthlyId));
                                                    setMonthlyModalVisible(false);
                                                    setEditingMonthlyId(null);
                                                }}
                                            >
                                                <Text style={styles.modalButtonText}>Eliminar</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.modalButton, {backgroundColor: '#999'}]}
                                            onPress={() => {
                                                setMonthlyModalVisible(false);
                                                setEditingMonthlyId(null);
                                            }}
                                        >
                                            <Text style={styles.modalButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <TouchableOpacity 
                            style={styles.botonPresupuesto}
                            onPress={() => {
                                setNewMonthlyCategory('');
                                setNewMonthlyLimit('');
                                setNewMonthlySpent('0.00');
                                setEditingMonthlyId(null);
                                setMonthlyModalVisible(true);
                            }}
                        >
                            <Text style={styles.tituloBoton}> Crear Presupuesto </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        <View style={styles.fondoInferior} />
        
    </ScrollView>
        
  
  );
}
}


const styles = StyleSheet.create({
    containerMain: {
        flexGrow: 1,
        backgroundColor: '#f2f4f8',
        alignItems: "center",
        paddingBottom: 40, 
    },
    contenido: {
        width: "90%",
        marginTop: 80,
        marginBottom: 40,
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
    
    dataContainer: {
        flex: 1,
        paddingHorizontal: 10,
        borderRadius: 10,
        padding: 20,
        
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,

    },
    movimientosContainer: {
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
        padding: 10,
        justifyContent: 'space-between'
    },
    textDateContainer: {
        width: '100%', 
        flexDirection: 'row',  
        justifyContent:'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    textPresupuestoContainer: {
        paddingTop: 20,
        paddingBottom: 20,
        width: '100%', 
        flexDirection: 'row',  
        paddingHorizontal: 10,
    },
    presupuestoContainer: {
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
        padding: 10,
        justifyContent: 'space-between'
    },
    presupuestoBoton: {
        backgroundColor: '#0a57d9',
        borderRadius: 30,
        padding: 10,
        
        alignItems: 'center',
    },
    presupuestoBotonText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        alignItems: 'center',
    },
    presupuestoInput: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        
    },
    tipoMovimientoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteText: {
        color: '#ffffff',
        fontWeight: '500',
        fontSize: 15,
    },
    deleteBoton: {
        backgroundColor: '#d9534f',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 10,
    },
    movimientoDatoContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        
        
    },
    movimientoTag: {
        fontSize: 15,
        fontWeight: '500',
        alignItems: 'center',
    },
    movimientosScroll: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    movimientosBoton: {
        backgroundColor: '#0a57d9',
        borderRadius: 30,
        padding: 10,
        
        alignItems: 'center',
        
        
    },
    movimientosBotonText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        alignItems: 'center',
       
    },
    titleTag:{
        fontSize: 15,
        fontWeight: '500',

    },
    dateTag: {
        fontSize: 10,
    },
    tag: {
        fontSize: 10,
        alignItems: 'center',
        
    },
    movimientoFecha: {
        fontSize: 9,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    money: {
        fontSize: 15,
        fontWeight: '500',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    titleMoney: {
        fontSize: 30,
        fontWeight: '700',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    botonTransacciones: {
        backgroundColor: '#0a57d9',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 30,
    },
    botonPresupuesto: {
        backgroundColor: '#0a57d9',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 30,
        marginTop: 30,
    },
    tituloBoton: {
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    movimientosBotonActive: {
        backgroundColor: '#ff8c00',
    },
    monthlyBudgetScroll: {
        width: '100%',
        maxHeight: 400,
    },
    monthlyBudgetInfo: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    monthlySearchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    monthlyBudgetItem: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0a57d9',
    },
    monthlyBudgetItemBox: {
        width: '90%',
        maxWidth: 320,
        minWidth: 180,
        height: 120,
        margin: 10,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f2f4f8',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        position: 'relative',
    },
    thermoBackground: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
        backgroundColor: '#e0e0e0',
        borderRadius: 16,
        overflow: 'hidden',
    },
    thermoFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 16,
    },
    monthlyBudgetBoxContent: {
        flex: 1,
        zIndex: 2,
        padding: 14,
        justifyContent: 'center',
    },
    monthlyBudgetHeader: {
        marginBottom: 4,
    },
    conceptTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    monthlyBudgetAmount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    spentAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    percentageText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0a57d9',
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    remainingText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    addMonthlyButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    addMonthlyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    monthlyBudgetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    monthlyBudgetScrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingBottom: 30,
    },
    movimientoModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    movimientoModalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    movimientoInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
    },
    movimientoButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    editButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoInfoContainer: {
        marginTop: 20,
        width: '100%',
    },
    movimientoInfoText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: '#ddd',
        marginVertical: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0a57d9',
        marginBottom: 15,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    movimientoDetailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    movimientoDetailLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    movimientoDetailValue: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '600',
    },
    movimientoActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoActionButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    movimientoActionText: {
        textAlign: 'center',
        fontWeight: '500',
    },
    movimientoDeleteButton: {
        backgroundColor: '#d9534f',
    },
    movimientoEditButton: {
        backgroundColor: '#007bff',
    },
    movimientoSaveButton: {
        backgroundColor: '#28a745',
    },
    movimientoCancelButton: {
        backgroundColor: '#6c757d',
    },
    movimientoFormGroup: {
        width: '100%',
        marginTop: 10,
    },
    movimientoFormLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    movimientoFormInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    movimientoFormButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoFormButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoDeleteConfirmation: {
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    movimientoDeleteConfirmationText: {
        color: '#721c24',
        fontSize: 14,
        marginBottom: 10,
    },
    movimientoDeleteConfirmationButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    movimientoDeleteConfirmationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // New styles for editing recent movements modal
    movimientoModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    movimientoModalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    movimientoModalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
    },
    movimientoModalCloseButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    movimientoModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0a57d9',
        marginBottom: 15,
    },
    movimientoModalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    movimientoModalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        marginTop: 10,
    },
    movimientoModalButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoModalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoModalDeleteButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    movimientoModalDeleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoModalEditButton: {
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    movimientoModalEditButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoModalActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoModalActionButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    movimientoModalActionText: {
        textAlign: 'center',
        fontWeight: '500',
    },
    movimientoModalDeleteConfirmation: {
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    movimientoModalDeleteConfirmationText: {
        color: '#721c24',
        fontSize: 14,
        marginBottom: 10,
    },
    movimientoModalDeleteConfirmationButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    movimientoModalDeleteConfirmationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Additional styles for movimiento detail modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    modalInputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        marginTop: 10,
    },
    modalInputValue: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: '500',
        marginBottom: 10,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    // Styles for movimiento detail buttons
    movimientoDetailButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    movimientoDetailButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Styles for delete confirmation in movimiento detail modal
    deleteConfirmationContainer: {
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    deleteConfirmationText: {
        color: '#721c24',
        fontSize: 14,
        marginBottom: 10,
    },
    deleteConfirmationButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    deleteConfirmationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Styles for close button in modals
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    // General modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0a57d9',
        marginBottom: 15,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Specific styles for movimiento detail modal
    movimientoDetailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    movimientoDetailLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    movimientoDetailValue: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '600',
    },
    movimientoActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoActionButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    movimientoActionText: {
        textAlign: 'center',
        fontWeight: '500',
    },
    movimientoDeleteButton: {
        backgroundColor: '#d9534f',
    },
    movimientoEditButton: {
        backgroundColor: '#007bff',
    },
    movimientoSaveButton: {
        backgroundColor: '#28a745',
    },
    movimientoCancelButton: {
        backgroundColor: '#6c757d',
    },
    movimientoFormGroup: {
        width: '100%',
        marginTop: 10,
    },
    movimientoFormLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    movimientoFormInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    movimientoFormButton: {
        backgroundColor: '#0a57d9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    movimientoFormButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    movimientoDeleteConfirmation: {
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 15,
        marginTop: 10,
    },
    movimientoDeleteConfirmationText: {
        color: '#721c24',
        fontSize: 14,
        marginBottom: 10,
    },
    movimientoDeleteConfirmationButton: {
        backgroundColor: '#d9534f',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    movimientoDeleteConfirmationButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    modalInfoSection: {
        width: '100%',
        marginVertical: 15,
    },
    orderOption: {
        width: '100%',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
        marginVertical: 2,
        borderRadius: 8,
    },
    orderOptionText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});
