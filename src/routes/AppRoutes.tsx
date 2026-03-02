import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { useAuth } from '../context/AuthContext';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

// Telas Placeholder
function AgendaScreen() { return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Minha Agenda</Text></View>; }
function AdminScreen() { return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Painel Admin</Text></View>; }

export function AppRoutes() {
    const { user } = useAuth();

    // Verifica se é chefe (Admin ou Profissional)
    const isAdminOrPro = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROFISSIONAL';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false, // Remove o cabeçalho padrão
                tabBarActiveTintColor: '#007AFF', // Cor do ícone ativo
                tabBarInactiveTintColor: 'gray',  // Cor do ícone inativo
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                }
            }}
        >
            <Tab.Screen
                name="Início"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Minha Agenda"
                component={AgendaScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    )
                }}
            />

            {/* Renderização Condicional: Só mostra esta aba se for Admin/Pro */}
            {isAdminOrPro && (
                <Tab.Screen
                    name="Admin"
                    component={AdminScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="settings" size={size} color={color} />
                        ),
                        tabBarLabel: 'Gestão' // Nome que aparece embaixo do ícone
                    }}
                />
            )}

        </Tab.Navigator>
    );
}