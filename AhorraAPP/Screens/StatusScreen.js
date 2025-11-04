import { View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';


export default function LoginScreen() {

    return (
    

    <ScrollView
        contentContainerStyle={styles.containerMain}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
    >
        
        
        <View style={styles.dataContainer}>
            <Text style={styles.titleTag}> Saldo Disponible</Text>

            <Text style={styles.titleMoney}>$25,000.75</Text>
            <Pressable style={styles.boton}>
                <Text style={styles.tituloBoton}> Crear Transacción </Text>
            </Pressable>
        </View>


        <View style={styles.dataContainer}>
            <View style={styles.movimientosContainer}>
                <Text style={styles.titleTag}> Movimientos Recientes</Text>
                <Pressable style={styles.movimientosBoton}>
                    <Text style={styles.movimientosBotonText}> Ordenar por..</Text>
                </Pressable>
                <Pressable style={styles.movimientosBoton}>
                    <Text style={styles.movimientosBotonText}> Editar</Text>
                </Pressable>
            </View>
            <View style={styles.textDateContainer}>
                <Text style={styles.dateTag}>24 de diciembre del 2025</Text>
            </View>
            <ScrollView 
                showsHorizontalScrollIndicator={false}
                style={styles.movimientosScroll}
            >

                <View style={styles.movimientoDatoContainer}>
                    
                    <View>
                        <Text style={styles.movimientoTag}> Movimento 1</Text>
                        <Text style={styles.tag}> Pagaste - concepto: </Text>
                    </View>
                    <View style={styles.tipoMovimientoContainer}>
                        <Text style={styles.money}>$25,000.75</Text>
                        <Pressable style={styles.deleteBoton}>
                            <Text style={styles.deleteText}>X</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.movimientoDatoContainer}>
                    <View>
                        <Text style={styles.movimientoTag}> Movimento 2</Text>
                        <Text style={styles.tag}> Recibiste - concepto: </Text>
                    </View>
                    <View style={styles.tipoMovimientoContainer}>
                        <Text style={styles.money}>$45,000.13</Text>
                        <Pressable style={styles.deleteBoton}>
                            <Text style={styles.deleteText}>X</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.movimientoDatoContainer}>
                    <View>
                        <Text style={styles.movimientoTag}> Movimento 3</Text>
                        <Text style={styles.tag}> Recibiste - concepto: </Text>
                    </View>
                    <View style={styles.tipoMovimientoContainer}>
                        <Text style={styles.money}>$5,450.00</Text>
                        <Pressable style={styles.deleteBoton}>
                            <Text style={styles.deleteText}>X</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.movimientoDatoContainer}>
                    <View>
                        <Text style={styles.movimientoTag}> Movimento 4</Text>
                        <Text style={styles.tag}> Pagaste - concepto: </Text>
                    </View>
                    <View style={styles.tipoMovimientoContainer}>
                        <Text style={styles.money}>$1,000.13</Text>
                        <Pressable style={styles.deleteBoton}>
                            <Text style={styles.deleteText}>X</Text>
                        </Pressable>
                    </View>
                </View>
                
            </ScrollView>  
        </View>


        <View style={styles.dataContainer}>
            <View style={styles.textPresupuestoContainer}>
                <Text style={styles.titleTag}> Presupuesto</Text>
            </View>

            <View style={styles.presupuestoContainer}>
                <View style={styles.presupuestoObjectContainer1}>
                
                    <Text style={styles.movimientoTag}> Otros</Text>
                    <Text style={styles.money}>$2,000.00</Text>
                
                </View>

                <View style={styles.presupuestoObjectContainer2}>
                
                    <Text style={styles.movimientoTag}> Comida</Text>
                    <Text style={styles.money}>$1,000.40</Text>
                
                </View>

                <View style={styles.presupuestoObjectContainer3}>
                
                    <Text style={styles.movimientoTag}> Ocio</Text>
                    <Text style={styles.money}>$1,500.10</Text>
                
                </View>

            </View>

            <View style={styles.presupuestoContainer}>
                <View style={styles.presupuestoObjectContainer4}>
                
                    <Text style={styles.movimientoTag}> Agua</Text>
                    <Text style={styles.money}>$1,500.00</Text>
                
                </View>

                <View style={styles.presupuestoObjectContainer5}>
                
                    <Text style={styles.movimientoTag}> Luz</Text>
                    <Text style={styles.money}>$2060.40</Text>
                
                </View>

                <View style={styles.presupuestoObjectContainer6}>
                
                    <Text style={styles.movimientoTag}> Internet</Text>
                    <Text style={styles.money}>$1,500.10</Text>
                
                </View>

            </View>
            
        </View>

        

        

        
        
    </ScrollView>
        
  
  );
}

const styles = StyleSheet.create({
    containerMain: {
        backgroundColor: '#002359',
        padding: 40, 
    },
    container: {
        flex: 1,
        backgroundColor: '#002359',  
    },
    dataContainer: {
        flex: 1,
        padding: 10,
        height: '100%',
        width: '100%',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginBottom: 40,
        borderColor: '#919191ff',
        borderWidth: 2,
        

    },
    movimientosContainer: {
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
    },
    textDateContainer: {
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
        paddingBottom: 20,
    },
    textPresupuestoContainer: {
        paddingTop: 20,
        paddingBottom: 20,
        width: '100%', 
        flexDirection: 'row',  
        alignItems: 'center',  
    },
    presupuestoContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    presupuestoObjectContainer1: {
        backgroundColor: '#51e5ffff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer2: {
        backgroundColor: '#57ff98ff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer3: {
        backgroundColor: '#ffbe54ff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer4: {
        backgroundColor: '#ce84ffff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer5: {
        backgroundColor: '#fffb8bff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    presupuestoObjectContainer6: {
        backgroundColor: '#ff9fd0ff', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 2,
    },
    tipoMovimientoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        
    },
    deleteText: {
        color: '#ffffff',
        fontWeight: '500',
        fontSize: 20,
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
        height: '100%',
        borderRadius: 10,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderColor: '#919191ff',
        borderWidth: 4,
    },
    movimientosBoton: {
        backgroundColor: '#0a57d9',
        flex: 1,
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        margin: 20,
        alignItems: 'center',
        width: '100%',
        
    },
    movimientosBotonText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#ffffff',
        alignItems: 'center',
       
    },
    titleTag:{
        fontSize: 15,
        alignItems: 'center',
        fontWeight: '500',

    },
    dateTag: {
        fontSize: 15,    
    },
    tag: {
        fontSize: 15,
        alignItems: 'center',
        
    },
    money: {
        fontSize: 25,
        fontWeight: '500',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 20,
    },
    titleMoney: {
        fontSize: 50,
        fontWeight: '500',
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
        height: 50,
    },
    tituloBoton: {
        fontSize: 20,
        fontWeight: '500',
        color: '#ffffff',
    },


});
