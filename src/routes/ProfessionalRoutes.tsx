import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

import { ProfessionalHomeScreen } from '../screens/professional/ProfessionalHomeScreen';
import { AdminServicesScreen } from '../screens/admin/AdminServiceScreen';
import { AdminClientsScreen } from '../screens/admin/AdminClientScreen';
import { AdminProfessionalScreen } from '../screens/admin/AdminProfessionalScreen';


const Tab = createBottomTabNavigator();

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
            <Tab.Screen
                name="Minha Agenda"
                component={ProfessionalHomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    )
                }}
            />

            {}
            {isAdmin && (
                <>
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