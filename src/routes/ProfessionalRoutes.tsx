import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AgendaScreen } from '../screens/AgendaScreen';
import { ProfessionalHomeScreen } from '../screens/professional/ProfessionalHomeScreen';
import { AdminServicesScreen } from '../screens/admin/AdminServiceScreen';
import { AdminClientsScreen } from '../screens/admin/AdminClientScreen';
import { AdminProfessionalScreen } from '../screens/admin/AdminProfessionalScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {AdminScheduleScreen} from "../screens/admin/AdminScheduleScreen";


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AgendaStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AgendaHoje" component={ProfessionalHomeScreen} />
            <Stack.Screen name="AgendaCompleta" component={AgendaScreen} />
            <Stack.Screen name="NovaMarcacao" component={AdminScheduleScreen} />
        </Stack.Navigator>
    );
}

export function ProfessionalRoutes() {
    const { user, signOut } = useAuth();

    const isAdmin = user?.role === 'ROLE_ADMIN';

    const handleLogout = () => {
        Alert.alert('Sair', 'Tem certeza que deseja sair do aplicativo?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: signOut }
        ]);
    };

    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#FFF' },
                headerTintColor: '#333',
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#999',
                headerRight: () => (
                    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                )
            }}
        >

            {isAdmin && (
                <>
                    <Tab.Screen
                        name="Minha Agenda"
                        component={AgendaStack}
                        options={{
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="calendar" size={size} color={color} />
                            )
                        }}
                    />

                    <Tab.Screen
                        name="Clientes"
                        component={AdminClientsScreen}
                        options={{
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="people" size={size} color={color} />
                            )
                        }}
                    />

                    <Tab.Screen
                        name="Equipe"
                        component={AdminProfessionalScreen}
                        options={{
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="id-card" size={size} color={color} />
                            )
                        }}
                    />

                    <Tab.Screen
                        name="Serviços"
                        component={AdminServicesScreen}
                        options={{
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="briefcase" size={size} color={color} />
                            )
                        }}
                    />
                </>
            )}

        </Tab.Navigator>
    );
}