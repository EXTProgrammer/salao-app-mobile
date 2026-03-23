import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Usuario {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    role: string;
}

export function AdminClientsScreen() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loadingPesquisa, setLoadingPesquisa] = useState(false);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // Estados para o Modal de Criação
    const [modalVisible, setModalVisible] = useState(false);
    const [novoNome, setNovoNome] = useState('');
    const [novoTelefone, setNovoTelefone] = useState('');
    const [novoEmail, setNovoEmail] = useState('');
    const [salvando, setSalvando] = useState(false);

    // --- Função para Pesquisar Clientes ---
    async function handlePesquisar() {
        if (!termoPesquisa.trim()) {
            Alert.alert("Aviso", "Digite um nome ou telefone para pesquisar.");
            return;
        }

        setLoadingPesquisa(true);
        try {
            const response = await api.get(`/usuarios/pesquisar?termo=${termoPesquisa}`);
            setUsuarios(response.data);
            if (response.data.length === 0) {
                Alert.alert("Ops", "Nenhum usuário encontrado com esse termo.");
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível realizar a pesquisa.");
        } finally {
            setLoadingPesquisa(false);
        }
    }

    // --- Função para Criar Cliente pelo Admin ---
    async function handleCriarCliente() {
        if (!novoNome || !novoTelefone) {
            Alert.alert("Atenção", "Nome e Telefone são obrigatórios.");
            return;
        }

        setSalvando(true);
        try {
            const payload = {
                nome: novoNome,
                telefone: novoTelefone,
                email: novoEmail || undefined // O e-mail é opcional no nosso Java
            };

            await api.post('/usuarios/admin/criar-cliente', payload);
            Alert.alert("Sucesso", "Cliente cadastrado com sucesso!");

            fecharModal();
            // Pesquisa o cliente recém-criado para ele aparecer na lista
            setTermoPesquisa(novoTelefone);
            handlePesquisar();
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string'
                ? error.response.data
                : "Erro ao cadastrar cliente. Verifique se o telefone já existe.";
            Alert.alert("Erro", msg);
        } finally {
            setSalvando(false);
        }
    }

    function fecharModal() {
        setModalVisible(false);
        setNovoNome('');
        setNovoTelefone('');
        setNovoEmail('');
    }

    const renderItem = ({ item }: { item: Usuario }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#007AFF" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text style={styles.cardSubtitle}><Ionicons name="call-outline"/> {item.telefone || 'Sem telefone'}</Text>
                <Text style={styles.cardSubtitle}><Ionicons name="mail-outline"/> {item.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{item.role.replace('ROLE_', '')}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Barra de Pesquisa */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nome ou telefone..."
                    value={termoPesquisa}
                    onChangeText={setTermoPesquisa}
                    onSubmitEditing={handlePesquisar}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handlePesquisar}>
                    <Ionicons name="search" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Lista de Resultados */}
            {loadingPesquisa ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
            ) : (
                <FlatList
                    data={usuarios}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Use a barra acima para buscar clientes.</Text>
                    }
                />
            )}

            {/* Botão Flutuante (FAB) para Adicionar */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Modal de Criação Rápida */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Novo Cliente</Text>
                        <Text style={styles.modalHelper}>Ideal para quem ligou para o salão e não tem o App.</Text>

                        <TextInput style={styles.input} placeholder="Nome Completo *" value={novoNome} onChangeText={setNovoNome} />
                        <TextInput style={styles.input} placeholder="Telefone (Com DDD) *" keyboardType="phone-pad" value={novoTelefone} onChangeText={setNovoTelefone} />
                        <TextInput style={styles.input} placeholder="E-mail (Opcional)" keyboardType="email-address" autoCapitalize="none" value={novoEmail} onChangeText={setNovoEmail} />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={fecharModal}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnSave} onPress={handleCriarCliente} disabled={salvando}>
                                {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Cadastrar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', elevation: 2 },
    searchInput: { flex: 1, backgroundColor: '#F0F0F0', padding: 12, borderRadius: 8, fontSize: 16, marginRight: 10 },
    searchButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, paddingBottom: 80 },
    card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5F1FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
    roleBadge: { alignSelf: 'flex-start', backgroundColor: '#EAEAEA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
    roleText: { fontSize: 10, fontWeight: 'bold', color: '#666' },
    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    modalHelper: { fontSize: 14, color: '#666', marginBottom: 20, fontStyle: 'italic' },
    input: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    btnCancel: { padding: 14, marginRight: 10 },
    btnCancelText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
    btnSave: { backgroundColor: '#34C759', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, justifyContent: 'center' },
    btnSaveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});