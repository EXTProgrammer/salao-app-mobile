import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import api from '../services/api';

// --- Tipagens do Contexto ---
interface User {
    id: number;
    nome: string;
    email: string;
    role: string;
}

interface AuthContextData {
    user: User | null;
    loading: boolean;
    signIn: (token: string, userData: User) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Carrega o usuário salvo ao abrir o app
    useEffect(() => {
        async function loadStorageData() {
            const storagedUser = await AsyncStorage.getItem('@SalaoApp:user');
            const storagedToken = await AsyncStorage.getItem('@SalaoApp:token');

            if (storagedUser && storagedToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;
                setUser(JSON.parse(storagedUser));
            }
            setLoading(false);
        }

        loadStorageData();
    }, []);

    // INTERCEPTADOR GLOBAL DE ERROS (Trata o Token Expirado)
    useEffect(() => {
        // Cria o interceptador
        const interceptor = api.interceptors.response.use(
            (response) => {
                // Se a resposta for sucesso, só repassa pra frente
                return response;
            },
            async (error) => {
                // Se der erro, verifica se é 401 (Unauthorized) ou 403 (Forbidden)
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.log('🚨 Token expirado ou inválido. Deslogando o usuário...');

                    // Mostra o alerta para o usuário
                    Alert.alert(
                        'Sessão Expirada',
                        'Por favor, faça login novamente para continuar.'
                    );

                    // Executa a função de deslogar
                    await signOut();
                }

                // Repassa o erro para o componente tratar (se quiser)
                return Promise.reject(error);
            }
        );

        // Função de limpeza: remove o interceptador se o AuthProvider for desmontado
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    // Função de Login (Chamada lá na LoginScreen)
    async function signIn(token: string, userData: User) {
        await AsyncStorage.setItem('@SalaoApp:token', token);
        await AsyncStorage.setItem('@SalaoApp:user', JSON.stringify(userData));

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    }

    // Função de Logout
    async function signOut() {
        await AsyncStorage.removeItem('@SalaoApp:token');
        await AsyncStorage.removeItem('@SalaoApp:user');

        // Remove o token do cabeçalho das próximas requisições
        delete api.defaults.headers.common['Authorization'];

        // Limpa o estado (o que faz as rotas voltarem para a AuthRoutes/Login)
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook customizado para facilitar o uso nos componentes
export function useAuth() {
    const context = useContext(AuthContext);
    return context;
}