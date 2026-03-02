import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { AuthResponse, LoginRequest, Usuario } from '../types';

interface AuthContextData {
    signed: boolean;
    user: Usuario | null;
    loading: boolean;
    signIn(credentials: LoginRequest): Promise<void>;
    signOut(): void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            try {
                const storageUser = await AsyncStorage.getItem('@SalaoApp:user');
                const storageToken = await AsyncStorage.getItem('@SalaoApp:token');

                if (storageUser && storageToken) {
                    const parsedUser = JSON.parse(storageUser);
                    if (parsedUser && parsedUser.id) {
                        api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
                        setUser(parsedUser);
                    } else {
                        await AsyncStorage.clear();
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar storage:", error);
                await AsyncStorage.clear();
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadStorageData();
    }, []);

    async function signIn(credentials: LoginRequest) {
        try {
            const response = await api.post<AuthResponse>('/auth/login', credentials);

            const { token, usuarioId, nome, role } = response.data;
            const loggedUser: Usuario = {
                id: usuarioId,
                nome,
                email: credentials.email,
                role,
            };

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            await AsyncStorage.setItem('@SalaoApp:user', JSON.stringify(loggedUser));
            await AsyncStorage.setItem('@SalaoApp:token', token);

            setUser(loggedUser);
        } catch (error) {
            console.error("Erro no Login:", error);
            throw error;
        }
    }

    function signOut() {
        AsyncStorage.clear().then(() => {
            setUser(null);
        });
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    return context;
}