import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

import { AuthRoutes } from './AuthRoutes';
import { AppRoutes } from './AppRoutes';
import { ProfessionalRoutes } from './ProfessionalRoutes';

export function Routes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }
    
    if (user) {
        // Se for Profissional ou Administrador, carrega o painel de gestão
        if (user.role === 'ROLE_PROFISSIONAL' || user.role === 'ROLE_ADMIN') {
            return <ProfessionalRoutes />;
        }
        // Se for Cliente (o padrão), carrega o aplicativo normal que já construímos
        return <AppRoutes />;
    }

    // Se não estiver logado, mostra o Login/Registro
    return <AuthRoutes />;
}