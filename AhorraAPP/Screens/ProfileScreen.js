import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Switch, Modal, Pressable
} from "react-native";

export default function ProfileScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [alertas, setAlertas] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSave = () => {
    // aquí podrías enviar datos al servidor o guardarlos en un store
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.contenidoScroll}>
        {/* Header grande (recuadro azul) */}
        <View style={styles.recuadroAzul}>
          <View style={styles.barraSuperior}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.botonVolver}>{"< Atrás"}</Text>
            </Pressable>
          </View>
          <Text style={styles.recuadroAzulText}>Ahorra+ App</Text>
        </View>

        {/* Tarjeta de perfil se solapa con el header para efecto visual */}
        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInicial}>{nombre ? nombre.charAt(0).toUpperCase() : "U"}</Text>
          </View>
          <View>
            <Text style={styles.nombrePerfil}>
              {nombre || "Nombre del usuario"}
            </Text>
            <Text style={styles.correoPerfil}>
              {correo || "correo@ejemplo.com"}
            </Text>
          </View>
        </View>

        {/* Pantalla principal del perfil: información y botón para abrir actualización */}
        <View style={[styles.tarjetaFormulario, { alignItems: 'flex-start' }]}>
          <Text style={styles.tituloFormulario}>Mi Cuenta</Text>

          <Text style={styles.etiqueta}>Nombre</Text>
          <Text style={{ marginBottom: 10 }}>{nombre || 'No proporcionado'}</Text>

          <Text style={styles.etiqueta}>Celular</Text>
          <Text style={{ marginBottom: 10 }}>{celular || 'No proporcionado'}</Text>

          <Text style={styles.etiqueta}>Correo</Text>
          <Text style={{ marginBottom: 10 }}>{correo || 'No proporcionado'}</Text>

          <TouchableOpacity style={[styles.boton, { alignSelf: 'stretch' }]} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.textoBoton}>Actualizar información</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pie}>
          <Text style={styles.textoPie}>
            Ahorra+ • Seguridad en tus finanzas
          </Text>
        </View>

        {/* Modal secundario para actualizar información */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.tituloFormulario}>Actualizar información</Text>
                <Pressable onPress={() => setIsModalVisible(false)}>
                  <Text style={{ color: '#0a57d9', fontWeight: '700' }}>Cerrar</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={styles.etiqueta}>Nombre del usuario</Text>
                <TextInput
                  style={styles.campo}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor="#999"
                  value={nombre}
                  onChangeText={setNombre}
                />

                <Text style={styles.etiqueta}>Número Celular</Text>
                <TextInput
                  style={styles.campo}
                  placeholder="Ingresa tu número"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={celular}
                  onChangeText={setCelular}
                />

                <Text style={styles.etiqueta}>Correo electrónico</Text>
                <TextInput
                  style={styles.campo}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  value={correo}
                  onChangeText={setCorreo}
                />

                <Text style={styles.etiqueta}>Nueva contraseña</Text>
                <TextInput
                  style={styles.campo}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>
                    Enviar alertas de presupuesto a mi correo
                  </Text>
                  <Switch
                    value={alertas}
                    onValueChange={setAlertas}
                    trackColor={{ false: '#d1d5db', true: "#0a57d9", }}
                    thumbColor={alertas ? '#ffffff' : '#f4f3f4'}
                  />
                </View>

                <TouchableOpacity style={styles.boton} onPress={handleSave}>
                  <Text style={styles.textoBoton}>Guardar cambios</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  contenidoScroll: {
    alignItems: "center",
    paddingBottom: 40,
  },
  
  botonVolver: {
    color: "#0a57d9",
    fontSize: 16,
  },
  tituloApp: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
    color: "#0A3D91",
    marginRight: 30,
  },
  recuadroAzul: {
    width: "100%",
    height: 160,
    backgroundColor: "#002359",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  recuadroAzulText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 12,
  },
  barraSuperior: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "transparent",
    paddingHorizontal: 2,
  },
  tarjetaPerfil: {
    width: "90%",
    backgroundColor: "#fff",
    marginTop: -40,
    borderRadius: 20,
    paddingVertical: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0EBFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarInicial: {
    fontSize: 36,
    color: "#0a57d9",
    fontWeight: "bold",
  },
  nombrePerfil: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000ff",
    textAlign: "center",
  },
  correoPerfil: {
    color: "#777",
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },
  tarjetaFormulario: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tituloFormulario: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0a57d9",
    marginBottom: 15,
  },
  etiqueta: {
    color: "#000000ff",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 5,
  },
  campo: {
    backgroundColor: "#F5F9FF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#D0E0F0",
    marginBottom: 15,
  },
  boton: {
    backgroundColor: "#0a57d9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 5,
  },
  textoBoton: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  pie: {
    marginTop: 30,
    backgroundColor: "#D6E3FF",
    width: "80%",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  textoPie: {
    fontSize: 12,
    color: "#000000ff",
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  switchLabel: {
    marginLeft: 8,
    marginRight: 19,
    color: '#4b5563',
    fontSize: 13,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});