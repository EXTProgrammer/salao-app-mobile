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
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api'; // Importe a sua instância do Axios
import { RegisterRequest } from '../types';

export function RegisterScreen() {
    const navigation = useNavigation<any>(); // Usamos <any> para simplificar agora

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [loading, setLoading] = useState(false);

    async function handleRegister() {
        // 1. Validações básicas do Front-end
        if (!nome || !email || !telefone || !senha) {
            Alert.alert("Atenção", "Por favor, preencha todos os campos.");
            return;
        }

        if (senha !== confirmarSenha) {
            Alert.alert("Erro", "As senhas não coincidem.");
            return;
        }

        if (senha.length < 8) {
            Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            // 2. Monta o objeto para o Backend
            const requestData: RegisterRequest = {
                nome,
                email,
                telefone,
                senha,
                role: 'ROLE_CLIENTE' // Forçamos que seja cliente
            };

            // 3. Faz o pedido (Endpoint que criamos no Spring Boot)
            await api.post('/usuarios/registrar', requestData);

            // 4. Sucesso!
            Alert.alert(
                "Sucesso!",
                "Conta criada com sucesso. Por favor, faça login.",
                [{ text: "OK", onPress: () => navigation.goBack() }] // Volta para a tela de Login
            );

        } catch (error: any) {
            console.log("Erro no registo:", error);

            // Tratamento de erro detalhado (se o backend enviar mensagem)
            const mensagemErro = error.response?.data?.message || "Não foi possível criar a conta. O e-mail já pode estar em uso.";
            Alert.alert("Erro no Registro", mensagemErro);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* Botão de Voltar */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Criar Conta</Text>
                    <Text style={styles.subtitle}>Junte-se ao nosso salão</Text>
                </View>

                <View style={styles.form}>

                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Seu nome"
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                        value={nome}
                        onChangeText={setNome}
                    />

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

                    <Text style={styles.label}>Telefone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="(00) 00000-0000"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={telefone}
                        onChangeText={setTelefone}
                    />

                    <Text style={styles.label}>Senha</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Mínimo 8 caracteres"
                            placeholderTextColor="#999"
                            secureTextEntry={hidePassword}
                            value={senha}
                            onChangeText={setSenha}
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setHidePassword(!hidePassword)}>
                            <Ionicons name={hidePassword ? 'eye-off' : 'eye'} size={24} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirmar Senha</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Digite a senha novamente"
                            placeholderTextColor="#999"
                            secureTextEntry={hideConfirmPassword}
                            value={confirmarSenha}
                            onChangeText={setConfirmarSenha}
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setHideConfirmPassword(!hideConfirmPassword)}>
                            <Ionicons name={hideConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.buttonText}>REGISTRAR</Text>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10, // Para ficar por cima de tudo
    },
    header: {
        marginTop: 60,
        marginBottom: 30,
        alignItems: 'center',
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
    },
    form: {
        width: '100%',
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30, // Espaço extra no fundo da rolagem
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});