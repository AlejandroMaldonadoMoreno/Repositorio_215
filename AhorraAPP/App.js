import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MenuScreen from './Screens/HomeScreen';
import LoginScreen from './Screens/LoginScreen';
import GraficaScreen from './Screens/GraficaScreen';
import GraficaDetailScreen from './Screens/GraficaDetailScreen';
import ProfileScreen from './Screens/ProfileScreen';
import StatusScreen from './Screens/StatusScreen';
import Actualizar from './Screens/Actualizar';
import PantallaTransacciones from './Screens/Pantalla_Transacciones.instructions';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator Component con barra inferior
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    backgroundColor: '#002359',
                    borderTopLeftRadius: 40,
                    borderTopRightRadius: 40,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    position: 'absolute',
                    borderTopWidth: 0,
                    elevation: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={GraficaScreen}
                options={{
                    tabBarLabel: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="StatusTab"
                component={StatusScreen}
                options={{
                    tabBarLabel: 'Estado',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="stats-chart" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="Menu" component={MenuScreen} />
                <Stack.Screen name="Grafica" component={MainTabs} />
                <Stack.Screen name="GraficaDetail" component={GraficaDetailScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Status" component={StatusScreen} />
                <Stack.Screen name="Actualizar" component={Actualizar} />
                <Stack.Screen name="Transacciones" component={PantallaTransacciones} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}