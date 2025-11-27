import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { UsuarioController } from '../controllers/UsuarioController';
import DatabaseService from '../database/DataBaseService';

const usuarioController = new UsuarioController();

export default function GraficaDetailScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ ingresos: 0, gastos: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await usuarioController.initialize();
        const u = await usuarioController.getCurrentUser();
        if (!u) {
          if (mounted) {
            setTransactions([]);
            setTotals({ ingresos: 0, gastos: 0 });
          }
          return;
        }
        const txs = await DatabaseService.getTransactions(u.id, { limit: 200 });
        if (!mounted) return;
        setTransactions(txs || []);
        const ingresos = (txs || []).reduce((s, t) => s + ((Number(t.monto) || 0) > 0 ? Number(t.monto) : 0), 0);
        const gastos = (txs || []).reduce((s, t) => s + ((Number(t.monto) || 0) < 0 ? Math.abs(Number(t.monto)) : 0), 0);
        setTotals({ ingresos, gastos });
      } catch (e) {
        console.warn('[GraficaDetailScreen] load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const total = totals.ingresos + totals.gastos;
  const series = total > 0 ? [
    { value: totals.ingresos || 0, color: '#36D36C' },
    { value: totals.gastos || 0, color: '#FF3B30' },
  ] : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerWrap} />

      <View style={styles.cardBalance}>
        <Text style={styles.small}>Saldo Disponible</Text>
        <Text style={styles.balance}>$ {((totals.ingresos - totals.gastos) || 23403.74).toFixed(2)}</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ingresos y Gastos</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Volver</Text></TouchableOpacity>
        </View>

        <View style={styles.pairRow}>
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <Text>Cargando...</Text>
            ) : (!transactions || transactions.length === 0) ? (
              <View style={styles.piePlaceholder}><Text style={{ color: '#fff', fontWeight: '700' }}>Sin movimientos</Text></View>
            ) : (total === 0) ? (
              <View style={styles.piePlaceholder}><Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>No hay ingresos ni gastos registrados</Text></View>
            ) : (
              <PieChart
                widthAndHeight={160}
                series={series}
                coverRadius={0.45}
                coverFill={'#FFF'}
              />
            )}
          </View>

          <View style={styles.legendBlock}>
            {( !transactions || transactions.length === 0 || (totals.ingresos + totals.gastos) === 0) ? (
              <View style={{ padding: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#666', fontWeight: '600', textAlign: 'center' }}>No hay ingresos ni gastos registrados</Text>
              </View>
            ) : (
              <>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#36d36c' }]} /><Text>Ingresos: $ {totals.ingresos.toFixed(2)}</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ff3b30' }]} /><Text>Gastos: $ {totals.gastos.toFixed(2)}</Text></View>
              </>
            )}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: '#666' }}>- Aquí puedes ver el detalle por categoría en una vista ampliada.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f6f7fb', flex: 1 },
  headerWrap: { backgroundColor: '#072A63', height: 80, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  cardBalance: { backgroundColor: '#fff', marginTop: -40, borderRadius: 12, padding: 16, elevation: 3 },
  small: { color: '#666', fontSize: 14 },
  balance: { fontSize: 28, fontWeight: '700', marginTop: 6 },
  sectionCard: { backgroundColor: '#fff', marginTop: 18, borderRadius: 12, padding: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  link: { color: '#0A63D8', fontWeight: '600' },
  pairRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  piePlaceholder: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#36d36c', alignItems: 'center', justifyContent: 'center' },
  legendBlock: { flex: 1, paddingLeft: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
});
