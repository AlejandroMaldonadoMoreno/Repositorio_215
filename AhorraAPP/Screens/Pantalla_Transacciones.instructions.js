import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Pantalla_Transacciones({ navigation }) {
  const [dateTransaccion, setDateTransaccion] = useState(new Date());
  const [showDateTransaccion, setShowDateTransaccion] = useState(false);

  const onChangeTransaccion = (event, selectedDate) => {
    const currentDate = selectedDate || dateTransaccion;
    setShowDateTransaccion(Platform.OS === 'ios');
    setDateTransaccion(currentDate);
  };


  const formatDate = (d) => {
    if(!d) return '';
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Fondo azul superior */}
      <View style={styles.fondoAzul}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.Atras}>{"< Atrás"}</Text>
            </TouchableOpacity>
      </View>

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
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDateTransaccion(true)}>
            <Text style={{ color: dateTransaccion ? '#000' : '#aaa' }}>{dateTransaccion ? formatDate(dateTransaccion) : 'DD/MM/AAAA'}</Text>
          </TouchableOpacity>
          {showDateTransaccion && (
            <DateTimePicker
              value={dateTransaccion}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={onChangeTransaccion}
            />
          )}

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
        backgroundColor: "#002359",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,

        paddingTop: 30,
        paddingLeft: 20,         
  },
  Atras: {
        color: "#0a57d9",
        fontSize: 16,
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

  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    justifyContent: 'center',
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  boton: {
    backgroundColor: "#0a57d9",
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
