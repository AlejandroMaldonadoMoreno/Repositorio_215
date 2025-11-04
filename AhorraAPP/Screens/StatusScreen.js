import { View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import React, { useState } from 'react';

import Pantalla_Transacciones from './Pantalla_Transacciones.instructions';


export default function StatusScreen() {
    const[screen, setScreen] = useState('status');

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
                        <TouchableOpacity style={styles.movimientosBoton}>
                            <Text style={styles.movimientosBotonText}> Editar</Text>
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

                        <View style={styles.movimientoDatoContainer}>
                            
                            <View>
                                <Text style={styles.movimientoTag}> Movimento 1</Text>
                                <Text style={styles.tag}> Pagaste - concepto: </Text>
                            </View>
                            <View style={styles.tipoMovimientoContainer}>
                                <Text style={styles.money}>$ 25,000.75</Text>
                                <TouchableOpacity style={styles.deleteBoton}>
                                    <Text style={styles.deleteText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.movimientoDatoContainer}>
                            <View>
                                <Text style={styles.movimientoTag}> Movimento 2</Text>
                                <Text style={styles.tag}> Recibiste - concepto: </Text>
                            </View>
                            <View style={styles.tipoMovimientoContainer}>
                                <Text style={styles.money}>$ 45,000.13</Text>
                                <TouchableOpacity style={styles.deleteBoton}>
                                    <Text style={styles.deleteText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.movimientoDatoContainer}>
                            <View>
                                <Text style={styles.movimientoTag}> Movimento 3</Text>
                                <Text style={styles.tag}> Recibiste - concepto: </Text>
                            </View>
                            <View style={styles.tipoMovimientoContainer}>
                                <Text style={styles.money}>$ 5,450.00</Text>
                                <TouchableOpacity style={styles.deleteBoton}>
                                    <Text style={styles.deleteText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.movimientoDatoContainer}>
                            <View>
                                <Text style={styles.movimientoTag}> Movimento 4</Text>
                                <Text style={styles.tag}> Pagaste - concepto: </Text>
                            </View>
                            <View style={styles.tipoMovimientoContainer}>
                                <Text style={styles.money}>$ 1,000.13</Text>
                                <TouchableOpacity style={styles.deleteBoton}>
                                    <Text style={styles.deleteText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                    </ScrollView>  
                </View>


                <View style={styles.dataContainer}>
                    <View style={styles.textPresupuestoContainer}>
                        <Text style={styles.titleTag}> Presupuesto</Text>
                    </View>
                    <ScrollView 
                        style={styles.presupuestoScroll}
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}
                    >
                        <View style={styles.presupuestoContainer}>
                            <View style={styles.presupuestoObjectContainer1}>
                            
                                <Text style={styles.movimientoTag}> Otros</Text>
                                <Text style={styles.money}>$ 2,000.00</Text>
                            
                            </View>

                            <View style={styles.presupuestoObjectContainer2}>
                            
                                <Text style={styles.movimientoTag}> Comida</Text>
                                <Text style={styles.money}>$ 1,000.40</Text>
                            
                            </View>

                            <View style={styles.presupuestoObjectContainer3}>
                            
                                <Text style={styles.movimientoTag}> Ocio</Text>
                                <Text style={styles.money}>$ 1,500.10</Text>
                            
                            </View>

                        </View>

                        <View style={styles.presupuestoContainer}>
                            <View style={styles.presupuestoObjectContainer4}>
                            
                                <Text style={styles.movimientoTag}> Agua</Text>
                                <Text style={styles.money}>$ 1,500.00</Text>
                            
                            </View>

                            <View style={styles.presupuestoObjectContainer5}>
                            
                                <Text style={styles.movimientoTag}> Luz</Text>
                                <Text style={styles.money}>$ 2060.40</Text>
                            
                            </View>

                            <View style={styles.presupuestoObjectContainer6}>
                            
                                <Text style={styles.movimientoTag}> Internet</Text>
                                <Text style={styles.money}>$ 1,500.10</Text>
                            
                            </View>

                        </View>
                    </ScrollView>
                    
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


});
