import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';

/*
  GraficaScreen.js
  - Este archivo muestra la pantalla principal (Resumen de gastos) y una vista de detalle.
  - Navegación: uso de estado local `ruta` para alternar entre 'principal' y 'detalle'.
	Esto evita agregar React Navigation para la demo/clase y facilita explicar "cómo lo hice".

  Comentarios clave que debe recordar si el profesor pregunta:
  1) Las gráficas simples aquí están hechas con vistas (View) coloreadas y tamaños fijos:
	 - Las barras del gráfico son `View` con anchura fija (`metrics.barW`) y alturas proporcionales
	   a los valores (p. ej. 90, 120, etc.). Esto es una implementación ligera para mostrar barras
	   sin añadir librerías externas. En producción usaría `react-native-svg` o `victory-native`.
  2) La "gráfica de pastel" es un placeholder (círculo con porcentaje) para ilustrar el concepto.
	 - Para una torta real se pueden usar `react-native-svg` + `d3-shape` o bibliotecas ya hechas.
  3) Los colores y métricas están centralizados en `palette` y `metrics` para mantener consistencia.
*/

export default function GraficaScreen() {
	// ruta: simple router de dos estados para mostrar Principal o Detalle
	const [ruta, setRuta] = useState('principal'); // 'principal' | 'detalle'

	// Devuelve el componente acorde a la ruta; explicable fácilmente en clase.
	return ruta === 'principal' ? (
		<Principal onVerDetalle={() => setRuta('detalle')} />
	) : (
		<Detalle onVolver={() => setRuta('principal')} />
	);
}

// --- Header ---
/* TOP_INSET se usa para evitar solaparse con la status bar en Android/iOS.
   StatusBar.currentHeight es útil en Android; en iOS se puede ajustar a 44 para notches. */
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : (Platform.OS === 'ios' ? 44 : 0);

function Header({ onBack }) {
	return (
		<View style={[styles.headerWrap, { paddingTop: TOP_INSET, minHeight: 80 + TOP_INSET }] }>
			<View style={styles.headerRow}>
				{onBack ? (
					// Botón back simple; en una app real usaría un icono.
					<TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<Text style={styles.headerBack}>Back</Text>
					</TouchableOpacity>
				) : (
					// Espaciador para centrar el título cuando no hay botón back
					<View style={{ width: 50 }} />
				)}
				<Text style={styles.headerTitle}>ahorra + app</Text>
				<View style={{ width: 50 }} />
			</View>
		</View>
	);
}

// --- Vista Principal ---
function Principal({ onVerDetalle }) {
	// Estructura: Header grande, tarjeta de balance, sección de resumen con leyenda + gráfico,
	// y lista de movimientos.
	return (
		<View style={{ flex: 1, backgroundColor: '#072A63' }}>
			{/* SafeArea y StatusBar para que el header no quede debajo de la status bar */}
			<SafeAreaView style={{ backgroundColor: '#072A63' }} />
			<StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'light-content'} backgroundColor="#072A63" />
			<ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
				<Header />

				{/* Tarjeta de saldo - contiene el balance actual */}
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

				{/* Sección: Resumen de gastos con leyenda y gráfico de barras */}
				<View style={styles.sectionCard}>
					<View style={styles.sectionHeaderRow}>
						<Text style={styles.sectionTitle}>Resumen de gastos</Text>
						{/* En la vista principal, al pulsar lleva a la vista detalle */}
						<TouchableOpacity onPress={onVerDetalle}><Text style={styles.link}>Ver a detalle</Text></TouchableOpacity>
					</View>

					<View style={styles.legendAndChart}>
						{/* Leyenda: explica colores por categoría */}
						<View style={styles.legend}>
							<View style={styles.legendItem}><View style={[styles.dot, styles.catOtros]} /><Text style={styles.legendText}>Otros</Text></View>
							<View style={styles.legendItem}><View style={[styles.dot, styles.catComida]} /><Text style={styles.legendText}>Comida</Text></View>
							<View style={styles.legendItem}><View style={[styles.dot, styles.catOcio]} /><Text style={styles.legendText}>Ocio</Text></View>
							<View style={styles.legendItem}><View style={[styles.dot, styles.catAgua]} /><Text style={styles.legendText}>Agua</Text></View>
						</View>

						{/* Gráfico de barras simple:
							- Implementación: cada barra es un View con altura en px proporcional al valor.
							- Ventaja: no requiere dependencias. Desventaja: no es interactivo.
							- Si el profesor pregunta: expliqué que los valores 90/120/100/130 son ejemplos
							  que representan cantidades relativas; se pueden calcular dinámicamente a partir de datos.
						*/}
						<View style={styles.chartCard}>
							<View style={styles.barsRow}>
								{/* Cada View aquí representa una barra; el estilo de color viene de helpers */}
								<View style={[styles.bar, { height: 90 }, styles.catOtros]} />
								<View style={[styles.bar, { height: 120 }, styles.catComida]} />
								<View style={[styles.bar, { height: 100 }, styles.catOcio]} />
								<View style={[styles.bar, { height: 130 }, styles.catAgua]} />
							</View>
							<Text style={styles.chartNote}>Nota: Los colores codificados coinciden con la leyenda.</Text>
						</View>
					</View>
				</View>

				{/* Sección: Movimientos recientes (lista sencilla) */}
				<View style={styles.sectionCard}>
					<View style={styles.sectionHeaderRow}>
						<Text style={styles.sectionTitle}>Movimientos Recientes</Text>
						<TouchableOpacity><Text style={styles.link}>Ver Todo...</Text></TouchableOpacity>
					</View>

					{/* Items de ejemplo; en la práctica vendrían de un array map */}
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

// --- Vista Detalle ---
function Detalle({ onVolver }) {
	// En la vista detalle añadimos un placeholder circular que representa un pie-chart.
	// En clase puedes explicar: "aquí usé una vista redondeada con porcentaje dentro como demo".
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
						{/* Pie placeholder: circulo con porcentaje; explicable como demo */}
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

// --- Estilos y constantes ---
// Mantener la paleta y métricas centrales facilita explicar en clase cómo cambiar colores/tamaños.
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
