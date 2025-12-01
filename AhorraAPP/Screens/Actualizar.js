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
  Modal,
  FlatList,
} from "react-native";
import DatabaseService from '../database/DataBaseService';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioController = new UsuarioController();

export default function ActualizarTransaccion({ route, navigation }) {
  const [nombre, setNombre] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date());
  const [tipoMovimiento, setTipoMovimiento] = useState("transferencia"); // transferencia, gasto, ingreso
  const [movimientoId, setMovimientoId] = useState(null);
  const [presupuestoId, setPresupuestoId] = useState(null);
  const [presupuestoIdOriginal, setPresupuestoIdOriginal] = useState(null); // Para tracking de cambios
  const [presupuestoNombre, setPresupuestoNombre] = useState("");
  const [user, setUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [presupuestoModalVisible, setPresupuestoModalVisible] = useState(false);

  // Cargar datos del movimiento cuando se pasa por la navegación
  useEffect(() => {
    const loadUser = async () => {
      await usuarioController.initialize();
      const u = await usuarioController.getCurrentUser();
      setUser(u);
    };
    loadUser();

    if (route?.params?.movimiento) {
      const mov = route.params.movimiento;
      setMovimientoId(mov.id);
      setNombre(mov.nombre || "");
      setCuenta(mov.cuenta || "");
      setMonto(mov.monto ? String(Math.abs(mov.monto)) : "");
      setConcepto(mov.concepto || mov.concept || "");
      if (mov.fecha) {
        setFecha(new Date(mov.fecha));
      }
      
      // Detectar tipo de movimiento
      let tipo = "transferencia";
      let presupId = null;
      try {
        let meta = mov.metadata;
        if (meta && typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch (e) { }
        }
        if (meta && meta.tipo) {
          tipo = meta.tipo;
        }
        if (meta && meta.descripcion) {
          setDescripcion(meta.descripcion);
        }
        if (meta && meta.presupuestoId) {
          presupId = meta.presupuestoId;
        }
      } catch (e) {}
      
      // Si tiene tipo directamente
      if (mov.tipo && (mov.tipo === 'gasto' || mov.tipo === 'ingreso')) {
        tipo = mov.tipo;
      }
      
      setTipoMovimiento(tipo);
      setPresupuestoId(presupId);
      setPresupuestoIdOriginal(presupId); // Guardar ID original para detectar cambios
      
      // Obtener nombre del presupuesto si existe
      if (presupId) {
        try {
          let meta = mov.metadata;
          if (meta && typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch (e) { }
          }
          if (meta && meta.presupuestoNombre) {
            setPresupuestoNombre(meta.presupuestoNombre);
          }
        } catch (e) {}
      }
    }
  }, [route?.params?.movimiento]);
  
  // Cargar lista de presupuestos cuando se monta el componente
  useEffect(() => {
    const loadBudgets = async () => {
      if (user) {
        try {
          const buds = await DatabaseService.getBudgets(user.id);
          const normalized = (Array.isArray(buds) ? buds : []).map(b => ({
            id: b.id || b._id || b.rowid || b.ID,
            concept: b.concept || b.nombre || b.name || b.category || '',
            limit: Number(b.limit || b.limite || 0),
            spent: Number(b.spent || b.gastado || 0),
          }));
          setBudgets(normalized);
          
          // Actualizar nombre del presupuesto y concepto si existe
          if (presupuestoId) {
            const presup = normalized.find(b => b.id === presupuestoId);
            if (presup) {
              if (!presupuestoNombre) {
                setPresupuestoNombre(presup.concept);
              }
              // Establecer concepto si no existe o está vacío
              if (!concepto || concepto === '') {
                setConcepto(presup.concept);
              }
            }
          }
        } catch (e) {
          console.warn('[Actualizar] Error loading budgets', e);
        }
      }
    };
    loadBudgets();
  }, [user, presupuestoId]);

  const formatearFecha = (date) => {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const eliminar = async () => {
    if (!movimientoId || !user) return;

    const montoNum = Number(monto);
    const esGasto = tipoMovimiento === 'gasto';
    const esIngreso = tipoMovimiento === 'ingreso';

    console.log('[Actualizar] Eliminar - Tipo:', tipoMovimiento);
    console.log('[Actualizar] Eliminar - Monto:', montoNum);
    console.log('[Actualizar] Eliminar - PresupuestoId:', presupuestoId);
    console.log('[Actualizar] Eliminar - Es gasto?', esGasto, 'Es ingreso?', esIngreso);

    Alert.alert(
      '¿Eliminar movimiento?',
      `¿Estás seguro de que deseas eliminar este ${tipoMovimiento}?\n\nMonto: $${montoNum.toFixed(2)}\n${esGasto ? `Se recuperarán $${montoNum.toFixed(2)} del presupuesto.` : esIngreso ? `Se revertirá el ingreso de $${montoNum.toFixed(2)} en el presupuesto.` : 'N/A'}\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Actualizar] Iniciando eliminación...');
              
              // Actualizar el presupuesto ANTES de eliminar (para tener los datos)
              if (presupuestoId) {
                try {
                  const budgets = await DatabaseService.getBudgets(user.id);
                  const budget = budgets.find(b => b.id === presupuestoId);
                  
                  console.log('[Actualizar] Presupuesto encontrado:', budget);
                  
                  if (budget) {
                    const gastadoActual = Number(budget.gastado || 0);
                    const limiteActual = Number(budget.limite || 0);
                    let nuevoGastado;
                    
                    console.log('[Actualizar] Gastado actual:', gastadoActual);
                    console.log('[Actualizar] Límite:', limiteActual);
                    
                    if (esGasto) {
                      // Si era un gasto, restamos el monto (recuperamos dinero)
                      nuevoGastado = Math.max(0, gastadoActual - montoNum);
                      console.log('[Actualizar] GASTO - Nuevo gastado:', nuevoGastado, '(se resta', montoNum, ')');
                    } else if (esIngreso) {
                      // Si era un ingreso, sumamos el monto (revertimos la recuperación)
                      nuevoGastado = gastadoActual + montoNum;
                      console.log('[Actualizar] INGRESO - Nuevo gastado:', nuevoGastado, '(se suma', montoNum, ')');
                      
                      // Validar que no exceda el límite
                      if (nuevoGastado > limiteActual) {
                        console.warn('[Actualizar] ADVERTENCIA: Al revertir el ingreso se excedería el límite');
                        Alert.alert(
                          'Advertencia',
                          `Al eliminar este ingreso, el presupuesto excedería su límite.\n\nGastado actual: $${gastadoActual.toFixed(2)}\nIngreso a revertir: $${montoNum.toFixed(2)}\nNuevo gastado: $${nuevoGastado.toFixed(2)}\nLímite: $${limiteActual.toFixed(2)}\n\n¿Deseas continuar de todos modos?`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Continuar',
                              style: 'destructive',
                              onPress: async () => {
                                await DatabaseService.updateBudget(presupuestoId, { gastado: nuevoGastado });
                                console.log('[Actualizar] Presupuesto actualizado a:', nuevoGastado);
                              }
                            }
                          ]
                        );
                        return;
                      }
                    }
                    
                    await DatabaseService.updateBudget(presupuestoId, { gastado: Math.max(0, nuevoGastado) });
                    console.log('[Actualizar] Presupuesto actualizado exitosamente. Gastado:', nuevoGastado);
                  } else {
                    console.warn('[Actualizar] No se encontró el presupuesto con ID:', presupuestoId);
                  }
                } catch (e) {
                  console.error('[Actualizar] Error actualizando presupuesto:', e);
                }
              } else {
                console.warn('[Actualizar] No hay presupuestoId vinculado');
              }
              
              // Eliminar la transacción
              await DatabaseService.deleteTransaction(movimientoId);
              console.log('[Actualizar] Transacción eliminada exitosamente');

              // Enviar notificación
              try {
                const subject = `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Gasto'} eliminado`;
                const body = `Se ha eliminado un ${tipoMovimiento} de $${montoNum.toFixed(2)} (${concepto}). ${esGasto ? `Se recuperaron $${montoNum.toFixed(2)} en el presupuesto.` : `Se eliminaron $${montoNum.toFixed(2)} del presupuesto.`}`;
                await DatabaseService.addMail(user.id, { subject, body, is_read: 0 });
              } catch (e) {
                console.warn('[Actualizar] Error enviando notificación', e);
              }

              Alert.alert(
                'Eliminado',
                `El ${tipoMovimiento} ha sido eliminado correctamente.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (e) {
              console.warn('[Actualizar] Error eliminando movimiento', e);
              Alert.alert('Error', 'No fue posible eliminar el movimiento');
            }
          }
        }
      ]
    );
  };

  const actualizar = async () => {
    if (!movimientoId || !user) {
      Alert.alert("Error", "No se pudo identificar el movimiento o el usuario.");
      return;
    }

    // Validaciones según tipo de movimiento
    if (tipoMovimiento === "transferencia") {
      if (!concepto) {
        Alert.alert("Campo incompleto", "Por favor completa el concepto.");
        return;
      }
      
      // Para transferencias solo se puede actualizar el concepto
      try {
        const movimientoOriginal = route.params.movimiento;
        let meta = movimientoOriginal.metadata;
        if (meta && typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch (e) { }
        }
        
        console.log('[Actualizar] Actualizando transferencia ID:', movimientoId);
        console.log('[Actualizar] Concepto nuevo:', concepto);
        console.log('[Actualizar] Concepto original:', movimientoOriginal.concepto);
        
        // Actualizar la transacción en la base de datos
        const resultado = await DatabaseService.updateTransaction(movimientoId, {
          concepto: concepto,
          metadata: JSON.stringify(meta || {})
        });
        
        console.log('[Actualizar] Resultado de actualización:', resultado);
        
        // Enviar notificación
        try {
          await DatabaseService.addMail(user.id, { 
            subject: 'Transferencia actualizada', 
            body: `Se ha actualizado el concepto de una transferencia.\n\nConcepto anterior: ${movimientoOriginal.concepto || 'N/A'}\nNuevo concepto: ${concepto}`, 
            is_read: 0 
          });
        } catch (e) {
          console.warn('[Actualizar] Error enviando notificación', e);
        }
        
        Alert.alert(
          "Transacción actualizada",
          `Se ha actualizado el concepto de la transferencia.\n\nConcepto anterior: ${movimientoOriginal.concepto || 'N/A'}\nNuevo concepto: ${concepto}`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } catch (e) {
        console.warn('[Actualizar] Error actualizando transferencia', e);
        Alert.alert('Error', 'No fue posible actualizar la transferencia: ' + (e.message || 'Error desconocido'));
      }
    } else {
      // Para gastos e ingresos se puede actualizar todo
      if (!concepto) {
        Alert.alert("Campo incompleto", "Por favor completa el concepto.");
        return;
      }
      if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
        Alert.alert("Campo incompleto", "Por favor ingresa un monto válido mayor a 0.");
        return;
      }
      
      try {
        // Obtener el movimiento original para calcular la diferencia
        const movimientoOriginal = route.params.movimiento;
        const montoOriginal = Math.abs(Number(movimientoOriginal.monto) || 0);
        const montoNuevo = Number(monto);
        const diferenciaMonto = montoNuevo - montoOriginal;
        const cambioPresupuesto = presupuestoIdOriginal !== presupuestoId;
        
        // Validación de SALDO para GASTO
        if (tipoMovimiento === 'gasto' && diferenciaMonto > 0) {
          // Solo validar si el gasto aumenta
          try {
            // Obtener todas las transacciones para calcular el saldo
            const txs = await DatabaseService.getTransactions(user.id, { limit: 1000 });
            const saldoActual = (txs || []).reduce((s, t) => s + (Number(t.monto) || 0), 0);
            
            console.log('[Actualizar] Saldo actual:', saldoActual);
            console.log('[Actualizar] Diferencia de monto:', diferenciaMonto);
            
            if (diferenciaMonto > saldoActual) {
              Alert.alert(
                'Saldo insuficiente',
                `No tienes suficiente saldo para aumentar este gasto.\n\nSaldo disponible: $${saldoActual.toFixed(2)}\nAumento del gasto: $${diferenciaMonto.toFixed(2)}\nFaltante: $${(diferenciaMonto - saldoActual).toFixed(2)}`
              );
              return;
            }
          } catch (e) {
            console.warn('[Actualizar] Error verificando saldo:', e);
          }
        }
        
        // Cargar presupuestos actuales
        const budgetsActuales = await DatabaseService.getBudgets(user.id);
        
        // CASO 1: Cambió el presupuesto
        if (cambioPresupuesto) {
          // Revertir el movimiento del presupuesto original
          if (presupuestoIdOriginal) {
            const presupuestoAntiguo = budgetsActuales.find(b => b.id === presupuestoIdOriginal);
            if (presupuestoAntiguo) {
              const gastadoAntiguo = Number(presupuestoAntiguo.gastado || 0);
              let nuevoGastadoAntiguo;
              
              if (tipoMovimiento === 'gasto') {
                // Restar el gasto original (recuperar dinero)
                nuevoGastadoAntiguo = Math.max(0, gastadoAntiguo - montoOriginal);
              } else {
                // Sumar el ingreso original (perder dinero recuperado)
                nuevoGastadoAntiguo = gastadoAntiguo + montoOriginal;
              }
              
              await DatabaseService.updateBudget(presupuestoIdOriginal, { 
                gastado: Math.max(0, nuevoGastadoAntiguo) 
              });
            }
          }
          
          // Aplicar el movimiento al nuevo presupuesto
          if (presupuestoId) {
            const presupuestoNuevo = budgetsActuales.find(b => b.id === presupuestoId);
            if (presupuestoNuevo) {
              const gastadoNuevo = Number(presupuestoNuevo.gastado || 0);
              const limiteNuevo = Number(presupuestoNuevo.limite || 0);
              let nuevoGastadoNuevo;
              
              if (tipoMovimiento === 'gasto') {
                // Sumar el nuevo gasto
                nuevoGastadoNuevo = gastadoNuevo + montoNuevo;
                
                // Validar límite
                if (nuevoGastadoNuevo > limiteNuevo) {
                  Alert.alert(
                    'Límite excedido',
                    `El nuevo presupuesto no tiene suficiente espacio para este gasto.\n\nLímite: $${limiteNuevo.toFixed(2)}\nGastado actual: $${gastadoNuevo.toFixed(2)}\nGasto a añadir: $${montoNuevo.toFixed(2)}\nTotal resultante: $${nuevoGastadoNuevo.toFixed(2)}\nExcedente: $${(nuevoGastadoNuevo - limiteNuevo).toFixed(2)}`
                  );
                  return;
                }
              } else {
                // Restar el nuevo ingreso
                nuevoGastadoNuevo = gastadoNuevo - montoNuevo;
                
                // Validar que el ingreso no sea mayor al gastado del nuevo presupuesto
                if (montoNuevo > gastadoNuevo) {
                  Alert.alert(
                    'Ingreso no válido',
                    `No puedes registrar un ingreso mayor al monto gastado del nuevo presupuesto.\n\nGastado actual del presupuesto "${presupuestoNuevo.concept || presupuestoNuevo.nombre}": $${gastadoNuevo.toFixed(2)}\nIngreso: $${montoNuevo.toFixed(2)}\n\nEl ingreso máximo permitido es $${gastadoNuevo.toFixed(2)}.`
                  );
                  return;
                }
                
                // Validar que no sea negativo
                if (nuevoGastadoNuevo < 0) {
                  Alert.alert(
                    'Valor no válido',
                    `El nuevo presupuesto no puede tener un valor negativo después del ingreso.\n\nGastado actual: $${gastadoNuevo.toFixed(2)}\nIngreso: $${montoNuevo.toFixed(2)}\nResultado: $${nuevoGastadoNuevo.toFixed(2)} (negativo)`
                  );
                  return;
                }
              }
              
              await DatabaseService.updateBudget(presupuestoId, { 
                gastado: Math.max(0, nuevoGastadoNuevo) 
              });
            }
          }
        } 
        // CASO 2: Mismo presupuesto, solo cambió el monto
        else if (presupuestoId && diferenciaMonto !== 0) {
          const budget = budgetsActuales.find(b => b.id === presupuestoId);
          
          if (budget) {
            const gastadoActual = Number(budget.gastado || 0);
            const limite = Number(budget.limite || 0);
            let nuevoGastado;
            
            if (tipoMovimiento === 'gasto') {
              // Si es gasto, aumentamos o disminuimos según la diferencia
              nuevoGastado = gastadoActual + diferenciaMonto;
              
              // Validar que no exceda el límite
              if (nuevoGastado > limite) {
                Alert.alert(
                  'Límite excedido',
                  `Al actualizar este gasto, excederías el límite del presupuesto.\n\nLímite: $${limite.toFixed(2)}\nGastado actual: $${gastadoActual.toFixed(2)}\nNuevo gasto total: $${nuevoGastado.toFixed(2)}\nExcedente: $${(nuevoGastado - limite).toFixed(2)}`
                );
                return;
              }
            } else {
              // Si es ingreso, restamos o sumamos inversamente
              nuevoGastado = gastadoActual - diferenciaMonto;
              
              // Validar que el ingreso no haga que gastado sea negativo
              if (nuevoGastado < 0) {
                Alert.alert(
                  'Valor no válido',
                  `El nuevo monto de ingreso resultaría en un valor negativo en el presupuesto.\n\nGastado actual: $${gastadoActual.toFixed(2)}\nIngreso nuevo: $${montoNuevo.toFixed(2)}\nResultado: $${nuevoGastado.toFixed(2)} (negativo)\n\nEl monto máximo de ingreso permitido es $${gastadoActual.toFixed(2)}.`
                );
                return;
              }
            }
            
            // Actualizar el presupuesto
            await DatabaseService.updateBudget(presupuestoId, { gastado: Math.max(0, nuevoGastado) });
          }
        }
        
        // Actualizar la transacción
        const montoFinal = tipoMovimiento === 'gasto' ? -Math.abs(montoNuevo) : Math.abs(montoNuevo);
        
        // Obtener nombre del presupuesto actual para metadata
        let nombrePresupuestoActual = presupuestoNombre;
        if (presupuestoId) {
          const presupActual = budgetsActuales.find(b => b.id === presupuestoId);
          if (presupActual) {
            nombrePresupuestoActual = presupActual.concept || presupActual.nombre || '';
          }
        }
        
        await DatabaseService.updateTransaction(movimientoId, {
          concepto: concepto,
          monto: montoFinal,
          metadata: JSON.stringify({
            tipo: tipoMovimiento,
            presupuestoId: presupuestoId,
            presupuestoNombre: nombrePresupuestoActual,
            descripcion: descripcion,
            categoria: concepto
          })
        });
        
        // Enviar notificación
        try {
          const subject = `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Gasto'} actualizado`;
          let body = `Se ha actualizado un ${tipoMovimiento}.\n\nConcepto: ${concepto}\nMonto nuevo: $${montoNuevo.toFixed(2)}`;
          if (cambioPresupuesto) {
            body += `\n\nPresupuesto cambiado: ${presupuestoNombre || 'N/A'} → ${nombrePresupuestoActual || 'N/A'}`;
          }
          if (diferenciaMonto !== 0) {
            body += `\nDiferencia de monto: ${diferenciaMonto > 0 ? '+' : ''}$${diferenciaMonto.toFixed(2)}`;
          }
          await DatabaseService.addMail(user.id, { subject, body, is_read: 0 });
        } catch (e) {
          console.warn('[Actualizar] Error enviando notificación', e);
        }
        
        let mensajeExito = `Concepto: ${concepto}\nMonto: $${montoNuevo.toFixed(2)}\nDescripción: ${descripcion || 'N/A'}`;
        if (cambioPresupuesto) {
          mensajeExito += `\n\n✓ Presupuesto cambiado exitosamente`;
          mensajeExito += `\n  Anterior: ${presupuestoNombre || 'N/A'}`;
          mensajeExito += `\n  Nuevo: ${nombrePresupuestoActual || 'N/A'}`;
        }
        if (diferenciaMonto !== 0) {
          mensajeExito += `\n\nDiferencia aplicada: ${diferenciaMonto > 0 ? '+' : ''}$${diferenciaMonto.toFixed(2)}`;
        }
        
        Alert.alert(
          `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Gasto'} actualizado`,
          mensajeExito,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } catch (e) {
        console.warn('[Actualizar] Error actualizando gasto/ingreso', e);
        Alert.alert('Error', 'No fue posible actualizar el movimiento');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.franjaAzul} >
        
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.Atras}>{"< Atrás"}</Text>
        </TouchableOpacity>
      
        </View>

      <View style={styles.contenido}>
        <Text style={styles.titulo}>
          Actualizar {tipoMovimiento === 'transferencia' ? 'Transferencia' : tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Gasto'}
        </Text>

        <View style={styles.formulario}>
          {/* Mostrar tipo de movimiento */}
          <Text style={[styles.label, {fontWeight: '600', color: '#0a57d9', marginBottom: 10}]}>
            Tipo: {tipoMovimiento === 'transferencia' ? '🔄 Transferencia' : tipoMovimiento === 'ingreso' ? '💰 Ingreso' : '💳 Gasto'}
          </Text>

          {/* Para TRANSFERENCIAS: solo concepto editable */}
          {tipoMovimiento === "transferencia" && (
            <>
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
                placeholderTextColor="#b9b9b9ff"
                value={concepto}
                onChangeText={setConcepto}
              />

              <Text style={styles.label}>Fecha:</Text>
              <View style={[styles.input, {backgroundColor: '#f0f0f0'}]}>
                <Text style={{ color: "#666", fontSize: 15 }}>
                  {formatearFecha(fecha)}
                </Text>
              </View>

              <View style={[styles.input, {backgroundColor: '#fff8dc', borderColor: '#f0ad4e', marginTop: 15}]}>
                <Text style={{ color: "#856404", fontSize: 13 }}>
                  ⚠️ En transferencias solo puedes modificar el concepto. El monto y fecha no son modificables por seguridad.
                </Text>
              </View>
            </>
          )}

          {/* Para GASTOS e INGRESOS: todo editable */}
          {(tipoMovimiento === "gasto" || tipoMovimiento === "ingreso") && (
            <>
              <Text style={styles.label}>Presupuesto / Categoría:</Text>
              <TouchableOpacity
                style={[styles.input, {justifyContent: 'center'}]}
                onPress={() => setPresupuestoModalVisible(true)}
              >
                <Text style={{color: presupuestoId ? '#000' : '#999', fontSize: 15}}>
                  {presupuestoId 
                    ? (budgets.find(b => b.id === presupuestoId)?.concept || presupuestoNombre || 'Presupuesto seleccionado')
                    : 'Seleccionar presupuesto'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Monto:</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#b9b9b9ff"
                value={monto}
                onChangeText={setMonto}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Descripción (opcional):</Text>
              <TextInput
                style={[styles.input, {height: 80}]}
                placeholder="Detalles adicionales..."
                placeholderTextColor="#b9b9b9ff"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Fecha:</Text>
              <View style={[styles.input, {backgroundColor: '#f0f0f0'}]}>
                <Text style={{ color: "#666", fontSize: 15 }}>
                  {formatearFecha(fecha)}
                </Text>
              </View>

              <View style={[styles.input, {backgroundColor: '#d4edda', borderColor: '#c3e6cb', marginTop: 15}]}>
                <Text style={{ color: "#155724", fontSize: 13 }}>
                  ✓ Puedes modificar el concepto, monto y descripción de este {tipoMovimiento}.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.boton} onPress={actualizar}>
            <Text style={styles.textoBoton}>Actualizar</Text>
          </TouchableOpacity>

          {/* Botón eliminar solo para gastos e ingresos */}
          {(tipoMovimiento === "gasto" || tipoMovimiento === "ingreso") && (
            <TouchableOpacity style={[styles.boton, {backgroundColor: '#d9534f', marginTop: 10}]} onPress={eliminar}>
              <Text style={styles.textoBoton}>Eliminar {tipoMovimiento}</Text>
            </TouchableOpacity>
          )}

          {/* Advertencia para transferencias */}
          {tipoMovimiento === "transferencia" && (
            <View style={[styles.input, {backgroundColor: '#f8d7da', borderColor: '#f5c6cb', marginTop: 15}]}>
              <Text style={{ color: "#721c24", fontSize: 13, textAlign: 'center' }}>
                🔒 Las transferencias son perpetuas y no pueden ser eliminadas.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Modal de selección de presupuesto */}
      <Modal
        visible={presupuestoModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPresupuestoModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, maxHeight: '70%', padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 16, color: '#002359' }}>
              Seleccionar presupuesto
            </Text>
            <FlatList
              data={budgets}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => {
                const percentage = Math.min(Math.round((item.spent / item.limit) * 100), 100);
                const disponible = item.limit - item.spent;
                const isSelected = presupuestoId === item.id;
                
                return (
                  <TouchableOpacity 
                    onPress={() => {
                      setPresupuestoId(item.id);
                      setPresupuestoNombre(item.concept);
                      setConcepto(item.concept); // Actualizar concepto automáticamente
                      setPresupuestoModalVisible(false);
                    }} 
                    style={{ 
                      paddingVertical: 12, 
                      paddingHorizontal: 12,
                      borderBottomWidth: 1, 
                      borderBottomColor: '#eee',
                      backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                      borderRadius: 8,
                      marginBottom: 4
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '600', fontSize: 16, flex: 1 }}>{item.concept}</Text>
                      {isSelected && <Text style={{ color: '#0a57d9', fontSize: 18 }}>✓</Text>}
                    </View>
                    <Text style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                      Gastado: ${item.spent.toFixed(2)} / Límite: ${item.limit.toFixed(2)}
                    </Text>
                    <Text style={{ color: disponible >= 0 ? '#36d36c' : '#d9534f', fontSize: 13, marginTop: 2 }}>
                      Disponible: ${disponible.toFixed(2)} ({percentage}%)
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#999', textAlign: 'center' }}>
                    No hay presupuestos disponibles.{'\n'}Crea uno primero en la pantalla principal.
                  </Text>
                </View>
              )}
            />
            <TouchableOpacity 
              onPress={() => setPresupuestoModalVisible(false)} 
              style={{ 
                marginTop: 12, 
                padding: 12, 
                backgroundColor: '#0a57d9', 
                borderRadius: 8, 
                alignItems: 'center' 
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#125bd8ff",
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
