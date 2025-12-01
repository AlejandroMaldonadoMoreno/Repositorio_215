import React, { useState } from 'react';
import { Text, StyleSheet, View, Button, ScrollView } from 'react-native';

// Importamos todas las pantallas del proyecto
import Actualizar from './Actualizar';
import GraficaDetailScreen from './GraficaDetailScreen';
import GraficaScreen from './GraficaScreen';
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import Pantalla_Transacciones from './MovimientoScreen';
import StatusScreen from './StatusScreen';
import ProfileScreen from "./ProfileScreen";

export default function MenuScreen() {
  const [screen, setScreen] = useState('menu');

  switch (screen) {
    case 'actualizar':
      return <Actualizar />;
    case 'grafica':
      return <GraficaScreen />;
    case 'login':
      return <LoginScreen />;
    case 'transacciones':
      return <Pantalla_Transacciones />;
    case 'status':
      return <StatusScreen />;
      case 'perfil':
          return <ProfileScreen />;
    default:
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Menú de Pantallas</Text>

          <View style={styles.buttonContainer}>
            <Button title="Actualizar" onPress={() => setScreen('actualizar')} />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Gráfica (Principal y Detalle)" onPress={() => setScreen('grafica')} />
          </View>

          {/* <View style={styles.buttonContainer}>
            <Button title="Detalle de Gráfica" onPress={() => setScreen('graficaDetail')} />
          </View> */}

          {/* <View style={styles.buttonContainer}>
            <Button title="Inicio (Home)" onPress={() => setScreen('home')} />
          </View> */}

          <View style={styles.buttonContainer}>
            <Button title="Inicio de Sesión (Login)" onPress={() => setScreen('login')} />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Transacciones" onPress={() => setScreen('transacciones')} />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Estado (Status)" onPress={() => setScreen('status')} />
          </View>
            <View style={styles.buttonContainer}>
                <Button title="Perfil (Status)" onPress={() => setScreen('perfil')} />
            </View>
        </ScrollView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f6f8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#222',
  },
  buttonContainer: {
    width: '90%',
    marginVertical: 6,
  },
});