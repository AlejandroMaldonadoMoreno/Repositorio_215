import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { estilosDetalle as styles } from './styles/graficaDetalleStyles';

export default function GraficaDetailScreen({ navigation }) {
  return (
  // Pantalla de detalle con estilos separados
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

// estilos importados desde ./styles/graficaDetalleStyles
