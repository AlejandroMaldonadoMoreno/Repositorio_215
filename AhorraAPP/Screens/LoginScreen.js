import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Switch, Alert, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Platform, ScrollView } from 'react-native';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioController = new UsuarioController();

export default function LoginScreen({ navigation }) {
    const [modalVisible, setModalVisible] = useState(null);
    const [alertas, setAlertas] = useState(false);
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [contrasenia, setContrasenia] = useState('');

    useEffect(() => {
        (async () => {
            try {
                await usuarioController.initialize();
            } catch (e) {
                console.warn('DB init error', e);
            }
        })();
    }, []);

    const validacionLogin = async () => {
        if (correo.trim() === '' || contrasenia.trim() === '') {
            Alert.alert('Error', 'Los campos están en blanco');
            return false;
        }
        if (!correo.includes('@') || !correo.includes('.')) {
            Alert.alert('Error', 'El correo no es válido');
            return false;
        }
        try {
            const result = await usuarioController.checkCredentials(correo.trim().toLowerCase(), contrasenia);
            if (result.status === 'not_found') {
                Alert.alert('Error', 'El correo no está registrado');
                return false;
            }
            if (result.status === 'wrong_password') {
                Alert.alert('Error', 'La contraseña es incorrecta');
                return false;
            }
            if (result.status === 'ok') {
                const usuario = result.user;
                Alert.alert('Inicio de sesión exitoso', `Bienvenido ${usuario.nombre}`);
                setCorreo('');
                setContrasenia('');
                navigation.navigate('Grafica');
                return true;
            }
            Alert.alert('Error', 'No se pudo iniciar sesión');
            return false;
        } catch (e) {
            console.error('Login error', e);
            Alert.alert('Error', 'No se pudo iniciar sesión');
            return false;
        }
    };
    const validacionRegistro = async () => {
        if (nombre.trim() === '' || apellidos.trim() === '' || telefono.trim() === '' || correo.trim() === '' || contrasenia.trim() === '') {
            Alert.alert('Error', 'Completa todos los campos');
            return false;
        }
        if (!correo.includes('@') || !correo.includes('.')) {
            Alert.alert('Error', 'El correo no es válido');
            return false;
        }
        if (telefono.length < 7) {
            Alert.alert('Error', 'El número de teléfono no es válido');
            return false;
        }
        if (!alertas) {
            Alert.alert('Error', 'Debe aceptar recibir alertas de presupuesto');
            return false;
        }

        try {
            const nuevo = await usuarioController.crearUsuario({
                nombre,
                apellidos,
                telefono,
                correo,
                password: contrasenia,
            });

            Alert.alert('Registro exitoso', `Bienvenido ${nuevo.nombre}`);
            setNombre('');
            setApellidos('');
            setTelefono('');
            setCorreo('');
            setContrasenia('');
            setAlertas(false);
            setModalVisible(null);
            return true;
        } catch (e) {
            console.error('Registro error', e);
            Alert.alert('Error', e.message || 'No se pudo registrar el usuario');
            return false;
        }
    };

    const validacionRecuperar = () => {
        if (correo.trim() === '') {
            Alert.alert("Error los campos estan en blanco (Móvil)");
            return false;
        }
        if (!correo.includes('@') || !correo.includes('.')) {
            Alert.alert("El correo no es valido (Móvil)");
            return false;
        }

        Alert.alert('Instrucciones enviadas', 'Revisa tu correo para recuperar tu contraseña');
        setCorreo(''); // Limpiar el campo de correo
        return true;
    }


    return (
    <View style={styles.container}>
      <Text style={styles.TituloPrincipal}>Bienvenido a tu aplicación de ahorro</Text>

        <Pressable style={styles.boton} onPress={()=>setModalVisible('login')}>
            <Text style={styles.tituloBoton}> Iniciar Sesión </Text>
        </Pressable>

        <Pressable style={styles.boton} onPress={()=>setModalVisible('registro')}>
            <Text style={styles.tituloBoton}> Registrarse </Text>
        </Pressable>

        <Modal
            visible={modalVisible === 'login'}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setModalVisible(null)}
        >
            <KeyboardAvoidingView style={styles.containerMain} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <View style={styles.Encabezado}>
                            <View style={styles.Salir}>
                                <Pressable onPress={() => setModalVisible(null)}>
                                    <Text style={styles.Atras}>‹ Atras</Text>
                                </Pressable>

                            </View>

                            <Text style={styles.Titulo}>Iniciar sesión</Text>
                        </View>


                        <View style={styles.Contain5}>
                            <Text style={styles.label}>Correo electrónico:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ejemplo@gmail.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={correo}
                                onChangeText={setCorreo}
                            />

                            <Text style={styles.label}>Contraseña:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="************"
                                secureTextEntry
                                value={contrasenia}
                                onChangeText={setContrasenia}
                            />

                            <Pressable style={styles.BotonInicio}  onPress={async () => { const ok = await validacionLogin(); if (ok) setModalVisible(null); }}>
                                <Text style={styles.BotonInicioText}>Iniciar sesión</Text>
                            </Pressable>


                        </View>


                        <View style={styles.Card2}>
                            <Text style={styles.CardText2}> ¿Aún no tienes cuenta? </Text>
                            <Pressable onPress={() => setModalVisible('registro') }>
                                <Text style={styles.BotonRegistro}> Regístrate</Text>
                            </Pressable>
                        </View>

                        <View style={styles.card3}>
                            <Text style={styles.CardText3}> ¿Perdiste tu contraseña? </Text>
                        </View>
                        <View style={styles.contenedorBotonContra}>
                            <Pressable style={styles.botonContra} onPress={() => setModalVisible('Recuperar') }>
                                <Text style={styles.TextContra}> Recuperala aquí</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>

        <Modal
            visible={modalVisible === 'registro'}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setModalVisible(null)}
        >
            <KeyboardAvoidingView style={styles.containerMain} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <View style={styles.Encabezado2}>
                            <View style={styles.Salir}>
                                <Pressable onPress={() => setModalVisible(null)}>
                                    <Text style={styles.Atras}>‹ Atras</Text>
                                </Pressable>

                            </View>

                            <Text style={styles.Titulo}>Registro</Text>
                        </View>


                        <View style={styles.Contain6}>
                            <Text style={styles.label}>Nombre:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe tu nombre"
                                keyboardType="default"
                                autoCapitalize="words"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                            <Text style={styles.label}>Apellidos:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe tus apellidos"
                                keyboardType="default"
                                autoCapitalize="words"
                                value={apellidos}
                                onChangeText={setApellidos}
                            />
                            <Text style={styles.label}>Número de teléfono:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe tu numero de teléfono"
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                                value={telefono}
                                onChangeText={setTelefono}
                            />
                            <Text style={styles.label}>Correo electrónico:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe tu correo electrónico"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={correo}
                                onChangeText={setCorreo}
                            />

                            <Text style={styles.label}>Contraseña:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="************"
                                secureTextEntry
                                value={contrasenia}
                                onChangeText={setContrasenia}
                            />
                            <View style={styles.switchContainer}>

                                <Text style={styles.switchLabel}>
                                    Enviar alertas de presupuesto a mi correo
                                </Text>
                                <Switch
                                    value={alertas}
                                    onValueChange={setAlertas}
                                    trackColor={{ false: '#d1d5db', true: '#0a57d9' }}
                                    thumbColor={alertas ? '#ffffff' : '#f4f3f4'}
                                />
                            </View>

                            <Pressable style={styles.BotonInicio} onPress={async () => { const ok = await validacionRegistro(); if (ok) setModalVisible(null); }}>
                                <Text style={styles.BotonInicioText}>Registrarme</Text>
                            </Pressable>


                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

        </Modal>


        <Modal
            visible={modalVisible === 'Recuperar'}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setModalVisible(null)}
        >
            <KeyboardAvoidingView style={styles.containerMain} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <View style={styles.Encabezado2}>
                            <View style={styles.Salir}>
                                <Pressable onPress={() => setModalVisible(null)}>
                                    <Text style={styles.Atras}>‹ Atras</Text>
                                </Pressable>

                            </View>

                            <Text style={styles.Titulo}>Recuperar Contraseña</Text>
                        </View>


                        <View style={styles.containContra}>
                            <Text style={styles.label}>Correo electrónico:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ingrese su correo electrónico"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={correo}
                                onChangeText={setCorreo}
                            />

                            <Pressable style={styles.BotonInicio} onPress={async () => {
                                const ok = await validacionRecuperar();
                                if (ok) setModalVisible(null);
                            }}>
                                <Text style={styles.BotonInicioText}>Enviar</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

        </Modal>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
      backgroundColor: '#002359',
      gap:20,
  },
    containerMain: {
        flex: 1,
        backgroundColor: '#ffffff',

    },
    Titulo: {
    fontSize: 25,
    fontWeight: '500',
    color: '#FFFFFF',
        alignItems: 'center',
    },
    TituloPrincipal: {
        fontSize: 20,
        fontWeight: '500',
        color: '#ffffff',
        alignItems: 'center',
    },
    boton: {
    backgroundColor: '#ffffff',
        borderRadius: 15,
        paddingVertical: 14,
        paddingHorizontal: 20,
        minWidth:'60%',
        maxWidth:300,
        alignItems: 'center',
  },
    tituloBoton: {
        fontSize: 20,
        fontWeight: '500',
    },
    Encabezado: {
        backgroundColor: '#002359',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 28,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    Encabezado2: {
        backgroundColor: '#002359',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 28,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    Salir: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    Atras: {
        color: '#cfe2ff',
        fontWeight: '600',
        fontSize: 16,
    },

    Contain5: {
        backgroundColor: '#fff',
            marginHorizontal: 20,
        minHeight: 300,
        marginTop: -22,
        padding: 16,
        borderRadius: 16,
        elevation: 5,
        borderColor:'#171717',
        borderWidth: 1,

    },
    Contain6: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        minHeight: '75%',
        marginTop: -22,
        padding: 16,
        borderRadius: 16,
        elevation: 5,
        borderColor:'#171717',
        borderWidth: 1,

    },
    label: {
        color: '#4b5563',

        marginBottom: 6,
        fontSize: 13,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        marginBottom: 14,
        minHeight: 55,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },

    BotonInicio: {

        height: 55,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a57d9',
        marginTop: 10,
        marginBottom: 50,
    },
    BotonInicioText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 20,

    },
    Card2: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 16,
    },
    CardText2: {
        color: '#6b7280',
    },
    BotonRegistro: {
        color: '#0a57d9',
        fontWeight: '700',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 4,
    },
    switchLabel: {
        marginLeft: 8,
        color: '#4b5563',
        fontSize: 13,
        flexShrink: 1,
    },
    card3: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    botonContra: {
      width: '70%',
        height: 55,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a57d9',
        marginTop: 10,
        marginBottom: 50,
    },
    CardText3: {
        color: '#6b7280',
        fontWeight: '700',
        fontSize: 17,
    },
    TextContra: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize:20
    },
    contenedorBotonContra:{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    containContra: {
        backgroundColor: '#fff',
        width: '90%',
        maxWidth: 500,
        alignSelf: 'center',
        minHeight: 200,
        marginTop: -22,
        padding: 16,
        borderRadius: 16,
        elevation: 5,
        borderColor:'#171717',
        borderWidth: 1,
    },

});
