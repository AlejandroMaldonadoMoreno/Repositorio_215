import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Menu from './Screens/Menu';
import HomeScreen from './Screens/HomeScreen';
import LoginScreen from './Screens/LoginScreen';
import GraficaScreen from './Screens/GraficaScreen';
import GraficaDetailScreen from './Screens/GraficaDetailScreen';
import ProfileScreen from './Screens/ProfileScreen';
import StatusScreen from './Screens/StatusScreen';
import Actualizar from './Screens/Actualizar';
import PantallaTransacciones from './Screens/Pantalla_Transacciones.instructions';
import MenuScreen from './Screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Menu" component={MenuScreen} />

        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Grafica" component={GraficaScreen} />
        <Stack.Screen name="GraficaDetail" component={GraficaDetailScreen} options={{ title: 'Detalle de Gráfica' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Status" component={StatusScreen} />
        <Stack.Screen name="Actualizar" component={Actualizar} />
        <Stack.Screen name="Transacciones" component={PantallaTransacciones} options={{ title: 'Transacciones' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
