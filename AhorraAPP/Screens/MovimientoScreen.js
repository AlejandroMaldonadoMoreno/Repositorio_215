import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, FlatList, Alert } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import DatabaseService from '../database/DataBaseService';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioController = new UsuarioController();

export default function MovimientoScreen({ navigation }) {
  const [dateTransaccion, setDateTransaccion] = useState(new Date());
  const [showDateTransaccion, setShowDateTransaccion] = useState(false);

  const [user, setUser] = useState(null);
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  const [nombre, setNombre] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');

  const onChangeTransaccion = (event, selectedDate) => {
    const currentDate = selectedDate || dateTransaccion;
    setShowDateTransaccion(Platform.OS === 'ios');
    setDateTransaccion(currentDate);
  };

  const loadContext = async () => {
    try {
      await usuarioController.initialize();
      const u = await usuarioController.getCurrentUser();
      setUser(u);
      if (!u) return;
      // load transactions to compute saldo
      const txs = await DatabaseService.getTransactions(u.id, { limit: 10000 }).catch(() => []);
      const sum = (txs || []).reduce((s, t) => s + (Number(t.monto) || 0), 0);
      setSaldoDisponible(sum);
      // load budgets
      const buds = await DatabaseService.getBudgets(u.id).catch(() => []);
      setBudgets(Array.isArray(buds) ? buds : []);
    } catch (e) {
      console.warn('[Pantalla_Transacciones] loadContext error', e);
    }
  };

  useEffect(() => {
    loadContext();
  }, []);


  const formatDate = (d) => {
    if(!d) return '';
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const pickBudget = (b) => {
    setSelectedBudget(b);
    setBudgetModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!user) return Alert.alert('Error', 'Debes iniciar sesión para realizar una transferencia');
    const value = parseFloat((monto || '').toString().replace(',', '.')) || 0;
    if (value <= 0) return Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0');
    if (value > saldoDisponible) {
      return Alert.alert(
        'Saldo insuficiente', 
        `No tienes suficiente saldo para realizar esta transferencia.\n\nSaldo disponible: $${saldoDisponible.toFixed(2)}\nTransferencia que intentas realizar: $${value.toFixed(2)}\nFaltante: $${(value - saldoDisponible).toFixed(2)}`
      );
    }

    // buscar cuenta destino por número de cuenta o correo
    const allUsers = await DatabaseService.getAll().catch(() => []);
    const dest = (allUsers || []).find(u => (u.cuenta || '') === (cuentaDestino || '') || ((u.correo || '').toLowerCase() === (cuentaDestino || '').toLowerCase()));
    if (!dest) return Alert.alert('Cuenta no encontrada', 'La cuenta destino no existe');

    // si hay presupuesto seleccionado, validar excede
    if (selectedBudget) {
      const currentGastado = Number(selectedBudget.gastado || 0);
      const limite = Number(selectedBudget.limite || 0);
      const nuevoGastado = currentGastado + value;
      if (nuevoGastado > limite) {
        const excede = nuevoGastado - limite;
        const msg = `Advertencia: este pago excede el presupuesto "${selectedBudget.nombre || ''}" por $${excede.toFixed(2)}.`;
        // pedir confirmación
        const confirm = await new Promise(resolve => {
          Alert.alert('Presupuesto Excedido', msg, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continuar', onPress: () => resolve(true) }
          ]);
        });
        if (!confirm) return; // cancelar operación
      }
    }

    // concepto por defecto si vacío
    const conceptFinal = (concepto && concepto.trim()) ? concepto.trim() : `Movimiento`;

    // registrar transferencia: débito para remitente, crédito para receptor
    try {
      const fechaISO = (dateTransaccion && dateTransaccion.toISOString) ? dateTransaccion.toISOString() : new Date().toISOString();
      // débito remitente
      await DatabaseService.addTransaction(user.id, { tipo: 'transfer', concepto: conceptFinal, monto: -Math.abs(value), fecha: fechaISO, metadata: { toUserId: dest.id, budgetId: selectedBudget ? selectedBudget.id : null } });
      // crédito receptor
      await DatabaseService.addTransaction(dest.id, { tipo: 'transfer', concepto: conceptFinal, monto: Math.abs(value), fecha: fechaISO, metadata: { fromUserId: user.id } });

      // actualizar presupuesto si aplica
      if (selectedBudget) {
        const currentGastado = Number(selectedBudget.gastado || 0);
        const limite = Number(selectedBudget.limite || 0);
        const nuevoGastado = currentGastado + value;
        try {
          const updated = await DatabaseService.updateBudget(selectedBudget.id, { gastado: nuevoGastado });
          // si el presupuesto ahora excede el límite, notificar al usuario
          try {
            const exceededBy = (Number(updated && (updated.gastado != null ? updated.gastado : nuevoGastado)) || nuevoGastado) - limite;
            if (exceededBy > 0) {
              const subj = 'Presupuesto excedido';
              const body = `El presupuesto "${updated.nombre || selectedBudget.nombre || ''}" ha sido excedido por $${exceededBy.toFixed(2)}. Límite: $${limite.toFixed(2)}, Gastado: $${(Number(updated.gastado) || nuevoGastado).toFixed(2)}.`;
              await DatabaseService.addMail(user.id, { subject: subj, body, is_read: 0 });
            }
          } catch (e) {
            console.warn('[Pantalla_Transacciones] notificar presupuesto excedido error', e);
          }
        } catch (e) {
          console.warn('updateBudget error', e);
        }
      }

      // enviar mails: receptor y remitente
      try {
        const subjR = 'Has recibido dinero';
        const bodyR = `Has recibido $${value.toFixed(2)} de ${user.nombre || user.correo || ''} el ${formatDate(new Date(dateTransaccion))}. Concepto: ${conceptFinal}`;
        await DatabaseService.addMail(dest.id, { subject: subjR, body: bodyR, is_read: 0 });
      } catch (e) { console.warn('mail to receiver error', e); }
      try {
        const subjS = 'Transferencia realizada';
        const bodyS = `Se realizó una transferencia de $${value.toFixed(2)} a ${dest.nombre || dest.correo || dest.cuenta || ''} el ${formatDate(new Date(dateTransaccion))}. Concepto: ${conceptFinal}`;
        await DatabaseService.addMail(user.id, { subject: subjS, body: bodyS, is_read: 0 });
      } catch (e) { console.warn('mail to sender error', e); }

      Alert.alert('Éxito', 'transferencia registrada correctamente');
      // limpiar formulario y recargar contexto
      setNombre(''); setCuentaDestino(''); setMonto(''); setConcepto(''); setSelectedBudget(null);
      await loadContext();
    } catch (e) {
      console.error('[Pantalla_Transacciones] submit error', e);
      Alert.alert('Error', 'No fue posible completar la transferencia');
    }
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
          <Text style={styles.saldoMonto}>$ {typeof saldoDisponible === 'number' ? saldoDisponible.toFixed(2) : '0.00'}</Text>
        </View>

        {/* Formulario 1 - transferencia */}
        <View style={styles.formulario}>
          <Text style={styles.tituloSeccion}>transferencia</Text>

          <Text style={styles.label}>Nombre (destinatario):</Text>
          <TextInput value={nombre} onChangeText={setNombre} style={styles.input} placeholder="Ej. Juan Pérez" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Número de cuenta o correo destino:</Text>
          <TextInput
            value={cuentaDestino}
            onChangeText={setCuentaDestino}
            style={styles.input}
            keyboardType="default"
            placeholder="Ej. 1234567890123456 o correo@ej.com"
            placeholderTextColor="#aaa"
          />

          <View style={styles.fila}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Monto:</Text>
              <TextInput value={monto} onChangeText={setMonto} style={styles.input} placeholder="Ej. 1200.00" placeholderTextColor="#aaa" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Concepto:</Text>
              <TextInput value={concepto} onChangeText={setConcepto} style={styles.input} placeholder="Ej. Pago" placeholderTextColor="#aaa" />
            </View>
          </View>

          <Text style={styles.label}>Presupuesto (opcional):</Text>
          <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setBudgetModalVisible(true)}>
            <Text>{selectedBudget ? `${selectedBudget.nombre} — gastado: $${Number(selectedBudget.gastado||0).toFixed(2)} / límite: $${Number(selectedBudget.limite||0).toFixed(2)}` : 'Seleccionar presupuesto (opcional)'} </Text>
          </TouchableOpacity>

          <Modal visible={budgetModalVisible} animationType="slide" transparent>
            <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: '70%', padding: 12 }}>
                <Text style={{ fontWeight: '700', marginBottom: 8 }}>Seleccionar presupuesto</Text>
                <FlatList
                  data={budgets}
                  keyExtractor={item => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => pickBudget(item)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ fontWeight: '600' }}>{item.nombre}</Text>
                      <Text style={{ color: '#666' }}>Gastado: $ {Number(item.gastado||0).toFixed(2)} / Límite: $ {Number(item.limite||0).toFixed(2)}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => { setSelectedBudget(null); setBudgetModalVisible(false); }} style={{ marginTop: 8, padding: 8 }}>
                  <Text style={{ color: '#0a57d9' }}>Ninguno / Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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

          <TouchableOpacity style={styles.boton} onPress={handleSubmit}>
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
