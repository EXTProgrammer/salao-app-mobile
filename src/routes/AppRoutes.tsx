import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { ProfessionalsScreen } from '../screens/ProfessionalsScreen';
import { SchedulingScreen } from '../screens/SchedulingScreen';
import { useAuth } from '../context/AuthContext';
import { View, Text, Alert, TouchableOpacity} from 'react-native';
import {MyScheduleScreen} from "../screens/MyScheduleScreen";
import { AdminServicesScreen } from '../screens/admin/AdminServiceScreen';

const Tab = createBottomTabNavigator();

export function AppRoutes() {
    const { user, signOut } = useAuth();
    const isAdmin = user?.role === 'ROLE_ADMIN';

    const handleLogout = () => {
        Alert.alert('Sair da Conta', 'Tem certeza que deseja sair do aplicativo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair',
                style: 'destructive',
                onPress: () => signOut()
            }
        ]);
    };

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: '#FFF' },
                headerTintColor: '#333',
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',

                headerRight: () => (
                    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                        <Ionicons name="log-out-outline" size={26} color="#FF3B30" />
                    </TouchableOpacity>
                )
            }}
        >
            <Tab.Screen
                name="Início"
                component={ServicesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Agendar"
                component={SchedulingScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                    tabBarLabelStyle: { fontWeight: 'bold' }
                }}
            />

            <Tab.Screen
                name="Equipe"
                component={ProfessionalsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Minha Agenda"
                component={MyScheduleScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}