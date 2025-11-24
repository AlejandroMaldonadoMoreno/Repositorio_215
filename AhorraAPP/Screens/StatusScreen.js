import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';

import Pantalla_Transacciones from './Pantalla_Transacciones.instructions';


export default function StatusScreen() {
    const[screen, setScreen] = useState('status');
    const [editMode, setEditMode] = useState(false);

    const [movimientos, setMovimientos] = useState([
        { id: 'm1', title: 'Movimento 1', tag: 'Pagaste - concepto:', amount: '$ 25,000.75' },
        { id: 'm2', title: 'Movimento 2', tag: 'Recibiste - concepto:', amount: '$ 45,000.13' },
        { id: 'm3', title: 'Movimento 3', tag: 'Recibiste - concepto:', amount: '$ 5,450.00' },
        { id: 'm4', title: 'Movimento 4', tag: 'Pagaste - concepto:', amount: '$ 1,000.13' },
    ]);

    const handleDeleteMovimiento = (id) => {
        // eliminar del estado local
        setMovimientos(prev => prev.filter(m => m.id !== id));
    };

    const showConfirm = (title, message, action) => {
        setConfirmTitle(title);
        setConfirmMessage(message);
        setOnConfirmAction(() => () => {
            try { action(); } finally { setConfirmVisible(false); }
        });
        setConfirmVisible(true);
    };

    const confirmDeleteMovimiento = (id) => {
        const mov = movimientos.find(m => m.id === id);
        showConfirm(
            'Eliminar movimiento',
            `¿Estás seguro que quieres eliminar "${mov?.title || 'este movimiento'}"?`,
            () => handleDeleteMovimiento(id)
        );
    };

    // Presupuestos (budget) state
    const [budgets, setBudgets] = useState([
        { id: 'b1', name: 'Otros', amount: '2000.00', color: '#51e5ffff' },
        { id: 'b2', name: 'Comida', amount: '1000.40', color: '#57ff98ff' },
        { id: 'b3', name: 'Ocio', amount: '1500.10', color: '#ffbe54ff' },
        { id: 'b4', name: 'Agua', amount: '1500.00', color: '#ce84ffff' },
        { id: 'b5', name: 'Luz', amount: '2060.40', color: '#fffb8bff' },
        { id: 'b6', name: 'Internet', amount: '1500.10', color: '#ff9fd0ff' },
    ]);

    const [budgetEditMode, setBudgetEditMode] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newBudgetName, setNewBudgetName] = useState('');
    const [newBudgetAmount, setNewBudgetAmount] = useState('');
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

    const handleDeleteBudget = (id) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    };

    const confirmDeleteBudget = (id) => {
        const bud = budgets.find(b => b.id === id);
        showConfirm(
            'Eliminar presupuesto',
            `¿Eliminar el presupuesto "${bud?.name || 'este presupuesto'}"?`,
            () => handleDeleteBudget(id)
        );
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
                        style={styles.boton}
                        onPress={() => setScreen('transacciones')}

                    >
                        <Text style={styles.tituloBoton}> Crear Transacción </Text>
                    </TouchableOpacity>
                </View>


                <View style={styles.dataContainer}>

                    <View style={styles.movimientosContainer}>
                        <Text style={styles.titleTag}> Movimientos Recientes</Text>
                        <TouchableOpacity style={styles.movimientosBoton}>
                            <Text style={styles.movimientosBotonText}> Ordenar por..</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.movimientosBoton, editMode ? styles.movimientosBotonActive : null]}
                            onPress={() => setEditMode(prev => !prev)}
                        >
                            <Text style={styles.movimientosBotonText}>{editMode ? 'Listo' : 'Editar'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.textDateContainer}>
                        <Text style={styles.dateTag}>24 de diciembre del 2025</Text>
                    </View>


                    <ScrollView 
                        nestedScrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        style={styles.movimientosScroll}
                    >

                        {movimientos.map(m => (
                            <View key={m.id} style={styles.movimientoDatoContainer}>
                                <View>
                                    <Text style={styles.movimientoTag}>{m.title}</Text>
                                    <Text style={styles.tag}> {m.tag} </Text>
                                </View>
                                <View style={styles.tipoMovimientoContainer}>
                                    <Text style={styles.money}>{m.amount}</Text>
                                    {editMode && (
                                        <TouchableOpacity
                                            style={styles.deleteBoton}
                                            onPress={() => confirmDeleteMovimiento(m.id)}
                                        >
                                            <Text style={styles.deleteText}>X</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                        
                    </ScrollView>  
                </View>


                <View style={styles.dataContainer}>
                    <View style={[styles.textPresupuestoContainer, {justifyContent: 'space-between', alignItems: 'center'}]}>
                        <Text style={styles.titleTag}> Presupuesto</Text>
                        <TouchableOpacity
                            style={[styles.movimientosBoton, budgetEditMode ? styles.movimientosBotonActive : null]}
                            onPress={() => setBudgetEditMode(prev => !prev)}
                        >
                            <Text style={styles.movimientosBotonText}>{budgetEditMode ? 'Listo' : 'Editar'}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView 
                        style={styles.presupuestoScroll}
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}
                    >
                        <View style={styles.presupuestoScrollRow}>
                            <TouchableOpacity style={styles.addBox} onPress={() => setModalVisible(true)}>
                                <Text style={styles.addPlus}>+</Text>
                            </TouchableOpacity>

                            {budgets.map(b => (
                                <View key={b.id} style={[styles.presupuestoItem, {backgroundColor: b.color}] }>
                                    <Text style={styles.movimientoTag}>{b.name}</Text>
                                    <Text style={styles.money}>$ {b.amount}</Text>
                                    {budgetEditMode && (
                                        <TouchableOpacity style={styles.deleteBoton} onPress={() => confirmDeleteBudget(b.id)}>
                                            <Text style={styles.deleteText}>X</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    <Modal
                        visible={modalVisible}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.titleTag}>Crear Presupuesto</Text>
                                <TextInput
                                    placeholder="Nombre"
                                    value={newBudgetName}
                                    onChangeText={setNewBudgetName}
                                    style={styles.modalInput}
                                />
                                <TextInput
                                    placeholder="Monto"
                                    value={newBudgetAmount}
                                    onChangeText={setNewBudgetAmount}
                                    keyboardType="numeric"
                                    style={styles.modalInput}
                                />
                                <View style={styles.modalButtonsRow}>
                                    <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#0a57d9'}]} onPress={handleAddBudget}>
                                        <Text style={styles.modalButtonText}>Guardar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#999'}]} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.modalButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Confirmation modal (internal) */}
                    {confirmVisible && (
                        <Modal
                            visible={confirmVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setConfirmVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalContainer, styles.confirmContainer]}>
                                    <Text style={styles.titleTag}>{confirmTitle}</Text>
                                    <Text style={{marginTop:10, textAlign:'center'}}>{confirmMessage}</Text>
                                    <View style={styles.modalButtonsRow}>
                                        <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#999'}]} onPress={() => setConfirmVisible(false)}>
                                            <Text style={styles.modalButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#d9534f'}]} onPress={() => onConfirmAction()}>
                                            <Text style={styles.modalButtonText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}

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
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 10,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    presupuestoScroll: {
        width: '100%',
        height: '100%',
        
    },
    presupuestoObjectContainer1: {
        backgroundColor: '#51e5ffff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer2: {
        backgroundColor: '#57ff98ff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer3: {
        backgroundColor: '#ffbe54ff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer4: {
        backgroundColor: '#ce84ffff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer5: {
        backgroundColor: '#fffb8bff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer6: {
        backgroundColor: '#ff9fd0ff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
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
        backgroundColor: 'red',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
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
    boton: {
        backgroundColor: '#0a57d9',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 30,
    },
    tituloBoton: {
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
    },
    movimientosBotonActive: {
        backgroundColor: '#ff8c00',
    },
    presupuestoScrollRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'flex-start',
    },
    addBox: {
        width: 100,
        height: 100,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#919191ff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginRight: 10,
    },
    addPlus: {
        fontSize: 40,
        color: '#0a57d9',
        fontWeight: '700',
    },
    presupuestoItem: {
        width: 100,
        height: 100,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        marginRight: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginTop: 10,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 15,
    },
    modalButton: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    confirmContainer: {
        width: '85%',
        paddingTop: 10,
        paddingBottom: 20,
    },


});
