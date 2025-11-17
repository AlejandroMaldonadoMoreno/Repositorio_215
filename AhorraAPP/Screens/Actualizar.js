import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function ActualizarTransaccion() {
  // Estados de los campos
  const [nombre, setNombre] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [fecha, setFecha] = useState("");

  // Función parcial (validación + simulación de guardado)
  const actualizar = () => {
    if (!nombre || !cuenta || !monto || !concepto || !fecha) {
      Alert.alert("Campos incompletos", "Por favor completa todos los datos.");
      return;
    }

    // FUNCIONALIDAD PARCIAL:
    // Aquí luego puedes llamar a tu API con fetch() o axios()

    Alert.alert(
      "Transacción actualizada",
      `Nombre: ${nombre}\nCuenta: ${cuenta}\nMonto: $${monto}`
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.franjaAzul} />

      <View style={styles.contenido}>
        <Text style={styles.titulo}>Actualizar Transacción</Text>

        <View style={styles.formulario}>
          <Text style={styles.label}>Nombre/s:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Juan Pérez"
            placeholderTextColor="#aaa"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Número tarjeta o cuenta:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej. 1234 5678 9012 3456"
            placeholderTextColor="#aaa"
            value={cuenta}
            onChangeText={setCuenta}
          />

          <Text style={styles.label}>Monto:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej. 1500.00"
            placeholderTextColor="#aaa"
            value={monto}
            onChangeText={setMonto}
          />

          <Text style={styles.label}>Concepto:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Pago de renta"
            placeholderTextColor="#aaa"
            value={concepto}
            onChangeText={setConcepto}
          />

          <Text style={styles.label}>Fecha:</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#aaa"
            value={fecha}
            onChangeText={setFecha}
          />

          <TouchableOpacity style={styles.boton} onPress={actualizar}>
            <Text style={styles.textoBoton}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f2f4f8",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  franjaAzul: {
    backgroundColor: "#002359",
    height: 230,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  contenido: {
    width: "90%",
    marginTop: 100,
    alignItems: "center",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  formulario: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 15,
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  boton: {
    backgroundColor: "#0a57d9",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
