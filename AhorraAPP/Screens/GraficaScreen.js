import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';

// Requerimiento del profe: TODO en este archivo.
// Hago dos vistas (principal y detalle) y navego con estado local.

export default function GraficaScreen() {
	const [ruta, setRuta] = useState('principal'); // 'principal' | 'detalle'

	return ruta === 'principal' ? (
		<Principal onVerDetalle={() => setRuta('detalle')} />
	) : (
		<Detalle onVolver={() => setRuta('principal')} />
	);
}

// Encabezado como estaba: barra superior con título centrado y botón Back opcional
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : (Platform.OS === 'ios' ? 44 : 0);

function Header({ onBack }) {
	return (
		<View style={[styles.headerWrap, { paddingTop: TOP_INSET, minHeight: 80 + TOP_INSET }] }>
			<View style={styles.headerRow}>
				{onBack ? (
					<TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<Text style={styles.headerBack}>Back</Text>
					</TouchableOpacity>
				) : (
					<View style={{ width: 50 }} />
				)}
			<Text style={styles.headerTitle}>ahorra + app</Text>
				<View style={{ width: 50 }} />
			</View>
		</View>
	);
}

function Principal({ onVerDetalle }) {
	// Sin escalar: mantenemos tamaños base y usamos flex/padding para acomodar
	return (
		<View style={{ flex: 1, backgroundColor: '#072A63' }}>
			<SafeAreaView style={{ backgroundColor: '#072A63' }} />
			<StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'light-content'} backgroundColor="#072A63" />
			<ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
				<Header />

					<View style={[styles.cardBalance, { marginTop: -24 }] }>
				<Text style={styles.small}>Saldo Disponible</Text>
						<Text style={styles.balance}>$ 23403.74</Text>

				<View style={styles.rowBetween}>
								<TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
						<Text style={styles.ctaText}>Mi Cuenta</Text>
					</TouchableOpacity>
					<View style={styles.circleIcon} />
				</View>
			</View>

			<View style={styles.sectionCard}>
				<View style={styles.sectionHeaderRow}>
					<Text style={styles.sectionTitle}>Resumen de gastos</Text>
					<TouchableOpacity onPress={onVerDetalle}><Text style={styles.link}>Ver a detalle</Text></TouchableOpacity>
				</View>

				<View style={styles.legendAndChart}>
					<View style={styles.legend}>
						<View style={styles.legendItem}><View style={[styles.dot, styles.catOtros]} /><Text style={styles.legendText}>Otros</Text></View>
						<View style={styles.legendItem}><View style={[styles.dot, styles.catComida]} /><Text style={styles.legendText}>Comida</Text></View>
						<View style={styles.legendItem}><View style={[styles.dot, styles.catOcio]} /><Text style={styles.legendText}>Ocio</Text></View>
						<View style={styles.legendItem}><View style={[styles.dot, styles.catAgua]} /><Text style={styles.legendText}>Agua</Text></View>
					</View>

								<View style={styles.chartCard}>
									<View style={styles.barsRow}>
										<View style={[styles.bar, { height: 90 }, styles.catOtros]} />
										<View style={[styles.bar, { height: 120 }, styles.catComida]} />
										<View style={[styles.bar, { height: 100 }, styles.catOcio]} />
										<View style={[styles.bar, { height: 130 }, styles.catAgua]} />
						</View>
						<Text style={styles.chartNote}>Nota: Los colores codificados coinciden con la leyenda.</Text>
					</View>
				</View>
			</View>

			<View style={styles.sectionCard}>
				<View style={styles.sectionHeaderRow}>
					<Text style={styles.sectionTitle}>Movimientos Recientes</Text>
					<TouchableOpacity><Text style={styles.link}>Ver Todo...</Text></TouchableOpacity>
				</View>

				<View style={styles.movementItem}>
					<View style={styles.movLeft}><View style={styles.circleSmall} /></View>
					<View style={styles.movMiddle}>
						<Text style={styles.movTitle}>Movimiento 1</Text>
						<Text style={styles.movDate}>1 de agosto 2025</Text>
					</View>
					<Text style={[styles.movAmount, { color: '#FF3B30' }]}>- $365.90</Text>
				</View>

				<View style={styles.movementItem}>
					<View style={styles.movLeft}><View style={styles.circleSmall} /></View>
					<View style={styles.movMiddle}>
						<Text style={styles.movTitle}>Movimiento 2</Text>
						<Text style={styles.movDate}>28 de julio 2025</Text>
					</View>
					<Text style={[styles.movAmount, { color: '#0A84FF' }]}>+ $2640.00</Text>
				</View>
			</View>
		</ScrollView>
		</View>
	);
}

function Detalle({ onVolver }) {
	return (
		<View style={{ flex: 1, backgroundColor: '#072A63' }}>
			<SafeAreaView style={{ backgroundColor: '#072A63' }} />
			<StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'light-content'} backgroundColor="#072A63" />
			<ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
				<Header onBack={onVolver} />

					<View style={styles.cardBalance}>
				<Text style={styles.small}>Saldo Disponible</Text>
						<Text style={styles.balance}>$ 23403.74</Text>
			</View>

			<View style={styles.sectionCard}>
				<View style={styles.sectionHeaderRow}>
					<Text style={styles.sectionTitle}>Resumen de gastos - Detalle</Text>
					<TouchableOpacity onPress={onVolver}><Text style={styles.link}>Volver</Text></TouchableOpacity>
				</View>

						<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
							<View style={styles.piePlaceholder}><Text style={{ color: '#fff', fontWeight: '700' }}>65%</Text></View>
					<View style={{ flex: 1, paddingLeft: 16 }}>
						<View style={styles.legendItem}><View style={[styles.dot, styles.catComida]} /><Text>Ingresos</Text></View>
						<View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#ff3b30' }]} /><Text>Gastos</Text></View>
					</View>
				</View>

				<View style={{ marginTop: 12 }}>
								<Text style={{ color: '#666' }}>- Aquí puedes ver el detalle por categoría en una vista ampliada.</Text>
				</View>
			</View>
		</ScrollView>
		</View>
	);
}

// Estilos en el mismo archivo (más sencillo de revisar en clase)
// Organización: paleta + medidas base, luego grupos (header, tarjetas, gráfico, lista)
const palette = {
	bg: '#f6f7fb',
	header: '#002359',
	primary: '#0A63D8',
	card: '#ffffff',
	text: '#333',
	textMuted: '#666',
	border: '#eee',
	// categorías
	catOtros: '#8b8bff',
	catComida: '#36d36c',
	catOcio: '#ffd15c',
	catAgua: '#3aa0ff',
};

const metrics = {
	r: 12,
	rHeader: 18,
	p: 16,
	pSm: 12,
	headerMinH: 56,
	circle: 40,
	dot: 12,
	barW: 18,
	chartH: 140,
};

const styles = StyleSheet.create({
	// Layout general
	container: { flex: 1, backgroundColor: palette.bg },

	// Header
	headerWrap: {
		backgroundColor: palette.header,
		borderBottomLeftRadius: metrics.rHeader,
		borderBottomRightRadius: metrics.rHeader,
		paddingBottom: 8,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		minHeight: metrics.headerMinH,
	},
	headerBack: { color: palette.primary, fontWeight: '600' },
	headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

	// Tarjeta de saldo
	cardBalance: {
		backgroundColor: palette.card,
		borderRadius: metrics.r,
		padding: metrics.p,
		elevation: 3,
		shadowColor: '#000',
		shadowOpacity: 0.08,
	},
	small: { color: palette.textMuted, fontSize: 14 },
	balance: { fontSize: 28, fontWeight: '700', marginTop: 6 },
	rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
	ctaButton: { backgroundColor: palette.primary, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
	ctaText: { color: '#fff', fontWeight: '600' },
	circleIcon: { width: metrics.circle, height: metrics.circle, borderRadius: metrics.circle / 2, borderWidth: 2, borderColor: palette.primary },

	// Secciones contenedoras
	sectionCard: { backgroundColor: palette.card, marginTop: 18, borderRadius: metrics.r, padding: metrics.pSm, elevation: 1 },
	sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
	sectionTitle: { fontSize: 16, fontWeight: '700' },
	link: { color: palette.primary, fontWeight: '600' },

	// Leyenda + gráfico
	legendAndChart: { flexDirection: 'row', gap: 12 },
	legend: { flex: 1, justifyContent: 'center' },
	legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
	dot: { width: metrics.dot, height: metrics.dot, borderRadius: metrics.dot / 2, marginRight: 8 },
	legendText: { fontSize: 14, color: palette.text },
	chartCard: { flex: 1.6, backgroundColor: palette.card, borderRadius: 8, padding: metrics.pSm, borderWidth: 1, borderColor: palette.border },
	barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: metrics.chartH },
	bar: { width: metrics.barW, borderRadius: 6 },
	chartNote: { fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' },

	// Lista de movimientos
	movementItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
	movLeft: { width: 40, alignItems: 'center' },
	circleSmall: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#ddd' },
	movMiddle: { flex: 1, paddingLeft: 8 },
	movTitle: { fontWeight: '600' },
	movDate: { color: '#999', fontSize: 12 },
	movAmount: { fontWeight: '700' },

	// Colores de categorías (aplicados como helpers)
	catOtros: { backgroundColor: palette.catOtros },
	catComida: { backgroundColor: palette.catComida },
	catOcio: { backgroundColor: palette.catOcio },
	catAgua: { backgroundColor: palette.catAgua },

	// Placeholder de gráfico circular
	piePlaceholder: { width: 160, height: 160, borderRadius: 80, backgroundColor: palette.catComida, alignItems: 'center', justifyContent: 'center' },
});
