import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export function ForgotPasswordScreen({ navigation }: any) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Estados dos inputs
    const [email, setEmail] = useState('');
    const [codigo, setCodigo] = useState('');
    const [novaSenha, setNovaSenha] = useState('');

    // --- Passo 1: Pedir o código ao Java ---
    async function handleSolicitarCodigo() {
        if (!email.trim()) {
            Alert.alert('Atenção', 'Por favor, digite o seu e-mail.');
            return;
        }

        setLoading(true);
        try {
            // Envia o e-mail no corpo da requisição (JSON), combinando com o ForgotPasswordDTO
            await api.post('/auth/esqueci-senha', {
                email: email.trim()
            });

            Alert.alert('Código Enviado', 'Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos em instantes.');
            setStep(2); // Avança para a tela de inserir o código
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível solicitar a recuperação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    // --- Passo 2: Enviar código e nova senha ---
    async function handleRedefinirSenha() {
        if (!codigo.trim() || !novaSenha.trim()) {
            Alert.alert('Atenção', 'Preencha o código e a nova senha.');
            return;
        }

        if (novaSenha.length < 6) {
            Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            // Envia os dados no corpo da requisição, combinando com o ResetPasswordDTO
            await api.post('/auth/redefinir-senha', {
                email: email.trim(),
                token: codigo.trim(),
                newPass: novaSenha
            });

            Alert.alert(
                'Sucesso!',
                'Sua senha foi alterada com sucesso. Você já pode fazer login.',
                [{ text: 'Ir para o Login', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            // Pega a mensagem de erro que o Java enviou (ex: "Token expirado")
            const msg = typeof error.response?.data === 'string'
                ? error.response.data
                : 'Código inválido ou expirado.';
            Alert.alert('Erro', msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed-outline" size={60} color="#007AFF" />
                </View>

                <Text style={styles.title}>Recuperar Senha</Text>

                {step === 1 ? (
                    <>
                        <Text style={styles.subtitle}>
                            Digite o endereço de e-mail associado à sua conta para receber o código de recuperação.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Seu E-mail"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSolicitarCodigo}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Enviar Código</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            Enviamos um código para <Text style={{fontWeight: 'bold'}}>{email}</Text>. Digite-o abaixo.
                        </Text>

                        <TextInput
                            style={[styles.input, { textAlign: 'center', fontSize: 20, letterSpacing: 5 }]}
                            placeholder="000000"
                            keyboardType="default"
                            maxLength={6}
                            value={codigo}
                            onChangeText={setCodigo}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Sua Nova Senha"
                            secureTextEntry
                            value={novaSenha}
                            onChangeText={setNovaSenha}
                        />

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#34C759' }, loading && styles.buttonDisabled]}
                            onPress={handleRedefinirSenha}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Redefinir Senha</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkButton} onPress={() => setStep(1)} disabled={loading}>
                            <Text style={styles.linkText}>Não recebeu o código? Tentar novamente</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
    iconContainer: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EAEAEA' },
    button: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    linkButton: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#007AFF', fontSize: 14, fontWeight: '600' }
});