import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function Pantalla_Transacciones() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Fondo azul superior */}
      <View style={styles.fondoAzul} />

      {/* Contenido principal */}
      <View style={styles.contenido}>
        {/* Tarjeta de saldo */}
        <View style={styles.saldoCard}>
          <Text style={styles.saldoTitulo}>Saldo Disponible</Text>
          <Text style={styles.saldoMonto}>$ 23403.74</Text>
        </View>

        {/* Formulario 1 - Transacción */}
        <View style={styles.formulario}>
          <Text style={styles.tituloSeccion}>Transacción</Text>

          <Text style={styles.label}>Nombre:</Text>
          <TextInput style={styles.input} placeholder="Ej. Juan Pérez" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Número de cuenta o tarjeta:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej. 1234 5678 9012 3456"
            placeholderTextColor="#aaa"
          />

          <View style={styles.fila}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Monto:</Text>
              <TextInput style={styles.input} placeholder="Ej. 1200.00" placeholderTextColor="#aaa" />
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Concepto:</Text>
              <TextInput style={styles.input} placeholder="Ej. Pago" placeholderTextColor="#aaa" />
            </View>
          </View>

          <Text style={styles.label}>Fecha:</Text>
          <TextInput style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor="#aaa" />

          <TouchableOpacity style={styles.boton}>
            <Text style={styles.textoBoton}>Realizar</Text>
          </TouchableOpacity>
        </View>

        {/* Formulario 2 - Pagar servicio */}
        <View style={styles.formulario}>
          <Text style={styles.tituloSeccion}>Pagar Servicio</Text>

          <Text style={styles.label}>Nombre del servicio:</Text>
          <TextInput style={styles.input} placeholder="Ej. Luz" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Clave del servicio:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej. 847392"
            placeholderTextColor="#aaa"
          />

          <View style={styles.fila}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Monto:</Text>
              <TextInput style={styles.input} placeholder="Ej. 350.00" placeholderTextColor="#aaa" />
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Categoría:</Text>
              <TextInput style={styles.input} placeholder="Ej. Hogar" placeholderTextColor="#aaa" />
            </View>
          </View>

          <Text style={styles.label}>Fecha:</Text>
          <TextInput style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor="#aaa" />

          <TouchableOpacity style={styles.boton}>
            <Text style={styles.textoBoton}>Realizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fondo azul inferior */}
      <View style={styles.fondoInferior} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f2f4f8",
    alignItems: "center",
    paddingBottom: 40,
  },
  fondoAzul: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 250,
    backgroundColor: "#0b3d91",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  fondoInferior: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 60,
    backgroundColor: "#0b3d91",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  contenido: {
    width: "90%",
    marginTop: 80,
  },
  saldoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 25,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  saldoTitulo: {
    color: "#333",
    fontSize: 15,
  },
  saldoMonto: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginTop: 5,
  },
  formulario: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  boton: {
    backgroundColor: "#0066ff",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  textoBoton: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
});
