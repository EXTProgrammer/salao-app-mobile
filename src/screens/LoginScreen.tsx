import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();

    async function handleLogin() {
        if (!email || !senha) {
            Alert.alert('Atenção', 'Por favor, preencha seu e-mail e senha.');
            return;
        }

        setLoading(true);
        try {
            // 1. O App envia o Request DTO para o Java e recebe a resposta
            const response = await api.post('/auth/login', { email, senha });

            // 2. Extraímos a string do token exatamente como veio do Java
            const tokenString = response.data.token;

            // 3. Como os dados do usuário vieram "soltos" na resposta do Java,
            // nós precisamos montar um objeto User para o React Native salvar
            const usuarioLogado = {
                id: response.data.usuarioId,
                nome: response.data.nome,
                email: email, // Usamos o e-mail que ele acabou de digitar, pois não veio no JSON
                role: response.data.role
            };

            // 4. Enviamos os dados perfeitos para o Contexto salvar e logar!
            await signIn(tokenString, usuarioLogado);

        } catch (error: any) {
            console.log("Erro no login:", error);
            Alert.alert('Erro', 'Não foi possível fazer o login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Bem-vindo!</Text>
                <Text style={styles.subtitle}>Faça login para agendar seu horário</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite sua senha"
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerText}>Não tem uma conta? <Text style={styles.registerTextBold}>Cadastre-se</Text></Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    registerText: {
        color: '#666',
        fontSize: 14,
    },
    registerTextBold: {
        color: '#007AFF',
        fontWeight: 'bold',
    }
});