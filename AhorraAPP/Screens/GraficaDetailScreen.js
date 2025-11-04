import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function GraficaDetailScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerWrap} />

      <View style={styles.cardBalance}>
        <Text style={styles.small}>Saldo Disponible</Text>
        <Text style={styles.balance}>$ 23403.74</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Resumen de gastos - Detalle</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Volver</Text></TouchableOpacity>
        </View>

        <View style={styles.pairRow}>
          <View style={styles.piePlaceholder}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>65%</Text>
          </View>

          <View style={styles.legendBlock}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#36d36c' }]} /><Text>Ingresos</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ff3b30' }]} /><Text>Gastos</Text></View>
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
