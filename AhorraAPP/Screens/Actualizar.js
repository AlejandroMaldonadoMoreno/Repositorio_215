import React, { useState, useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";

export default function ActualizarTransaccion({ route, navigation }) {
  const [nombre, setNombre] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [fecha, setFecha] = useState(new Date());

  // Cargar datos del movimiento cuando se pasa por la navegación
  useEffect(() => {
    if (route?.params?.movimiento) {
      const mov = route.params.movimiento;
      setNombre(mov.nombre || "");
      setCuenta(mov.cuenta || "");
      setMonto(mov.monto ? String(mov.monto) : "");
      setConcepto(mov.concepto || mov.concept || "");
      if (mov.fecha) {
        setFecha(new Date(mov.fecha));
      }
    }
  }, [route?.params?.movimiento]);

  const formatearFecha = (date) => {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const actualizar = () => {
    if (!concepto) {
      Alert.alert("Campo incompleto", "Por favor completa el concepto.");
      return;
    }

    Alert.alert(
      "Transacción actualizada",
      `Concepto: ${concepto}\nMonto: $${monto}\nFecha: ${formatearFecha(fecha)}`
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.franjaAzul} >
        
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.Atras}>{"< Atrás"}</Text>
        </TouchableOpacity>
      
        </View>

      <View style={styles.contenido}>
        <Text style={styles.titulo}>Actualizar Transacción</Text>

        

          
          <View style={styles.formulario}>

          

          <Text style={styles.label}>Monto:</Text>
          <View style={[styles.input, {backgroundColor: '#f0f0f0'}]}>
            <Text style={{ color: "#666", fontSize: 15 }}>
              {monto ? `$ ${monto}` : "$ 0.00"}
            </Text>
          </View>

          <Text style={styles.label}>Concepto:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Pago de renta"
            placeholderTextColor="#aaa"
            value={concepto}
            onChangeText={setConcepto}
          />

          <Text style={styles.label}>Fecha:</Text>
          <View style={[styles.input, {backgroundColor: '#f0f0f0'}]}>
            <Text style={{ color: "#666", fontSize: 15 }}>
              {formatearFecha(fecha)}
            </Text>
          </View>

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
    padding: 12,
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
 
  Atras: {
        color: "#0a57d9",
        fontSize: 16,
    },

});
