import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
// Importamos os ícones padrão do Expo
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    // Novo estado para controlar se mostra ou esconde a senha
    const [hidePassword, setHidePassword] = useState(true);
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (email.length === 0 || senha.length === 0) {
            Alert.alert("Atenção", "Por favor, preencha e-mail e senha.");
            return;
        }

        setLoading(true);

        try {
            await signIn({ email, senha });
        } catch (error) {
            console.log("Erro no login:", error);
            Alert.alert("Erro", "E-mail ou senha inválidos. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.form}>
                <Text style={styles.title}>Seu Salão</Text>
                <Text style={styles.subtitle}>Faça login para começar</Text>

                <Text style={styles.label}>E-mail</Text>
                <TextInput
                    style={styles.input}
                    placeholder="exemplo@email.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <Text style={styles.label}>Senha</Text>

                {/* Container especial para alinhar o Input com o Ícone */}
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput} // Estilo ajustado para não ter borda própria
                        placeholder="Sua senha secreta"
                        placeholderTextColor="#999"
                        secureTextEntry={hidePassword} // Controlado pelo estado
                        value={senha}
                        onChangeText={setSenha}
                    />

                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setHidePassword(!hidePassword)}
                    >
                        <Ionicons
                            name={hidePassword ? 'eye-off' : 'eye'}
                            size={24}
                            color="#999"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>ENTRAR</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Esqueci minha senha</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
    },
    form: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 48,
    },
    label: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    // Novos estilos para o campo de senha com ícone
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 16, // Padding lateral no container
    },
    passwordInput: {
        flex: 1, // Ocupa todo o espaço sobrando
        paddingVertical: 16,
        fontSize: 16,
        // Removemos padding horizontal e bordas do input pois o container já tem
    },
    eyeIcon: {
        padding: 4, // Área de toque maior
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotText: {
        color: '#007AFF',
        fontSize: 14,
    }
});