import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();

    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        carregarDadosUsuario();
    }, []);

    async function carregarDadosUsuario() {
        setLoading(true);
        try {
            const response = await api.get(`/usuarios/pesquisar?termo=${user?.nome}`);
            const dados = response.data[0] || null;

            if(dados){
                setNome(dados.nome);
                setTelefone(dados.telefone || '');
                setEmail(dados.email);
            } else {
                setNome(user?.nome || '');
            }

        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar seus dados.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSalvar() {
        if (!nome.trim() || !telefone.trim()) {
            Alert.alert('Atenção', 'Nome e telefone são obrigatórios.');
            return;
        }

        setSaving(true);
        try {
            await api.put('/usuarios/perfil', {
                nome: nome.trim(),
                telefone: telefone.trim()
            });

            Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
            navigation.goBack();
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string'
                ? error.response.data
                : 'Erro ao salvar os dados.';
            Alert.alert('Erro', msg);
        } finally {
            setSaving(false);
        }
    }

    function confirmarSaida() {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja encerrar a sessão?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: signOut }
            ]
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle" size={100} color="#007AFF" />
                    <Text style={styles.emailText}>{email || user?.email || 'email@exemplo.com'}</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput
                        style={styles.input}
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Digite seu nome"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Telefone (WhatsApp)</Text>
                    <TextInput
                        style={styles.input}
                        value={telefone}
                        onChangeText={setTelefone}
                        placeholder="(11) 99999-9999"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#666" />
                    <Text style={styles.infoText}>
                        O e-mail é utilizado para o login e recebimento de códigos de segurança, portanto não pode ser alterado por aqui.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    onPress={handleSalvar}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={confirmarSaida}>
                    <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                    <Text style={styles.logoutText}>Encerrar Sessão</Text>
                </TouchableOpacity>

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA'
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, padding: 20 },
    avatarContainer: { alignItems: 'center', marginBottom: 30 },
    emailText: { fontSize: 16, color: '#666', marginTop: 5 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EAEAEA',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        alignItems: 'center'
    },
    infoText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#666', lineHeight: 20 },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center'
    },
    buttonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        padding: 15,
    },
    logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});