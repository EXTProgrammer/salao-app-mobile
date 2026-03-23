import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Servico {
    id: number;
    nome_servico: string;
    descricao: string;
    preco: number;
    duracaoMin: number;
}

export function AdminServicesScreen() {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para o Modal de Criação
    const [modalVisible, setModalVisible] = useState(false);
    const [novoNome, setNovoNome] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novoPreco, setNovoPreco] = useState('');
    const [novaDuracao, setNovaDuracao] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        buscarServicos();
    }, []);

    async function buscarServicos() {
        setLoading(true);
        try {
            const response = await api.get('/servicos');
            setServicos(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar os serviços.");
        } finally {
            setLoading(false);
        }
    }

    // --- Função para Criar Serviço (POST) ---
    async function handleCriarServico() {
        if (!novoNome || !novoPreco || !novaDuracao) {
            Alert.alert("Atenção", "Preencha o nome, preço e duração.");
            return;
        }

        setSalvando(true);
        try {
            const payload = {
                nome_servico: novoNome,
                descricao: novaDescricao,
                preco: parseFloat(novoPreco.replace(',', '.')), // Converte "50,00" para 50.00 numérico
                duracaoMin: parseInt(novaDuracao, 10)
            };

            await api.post('/servicos', payload); // Endpoint protegido para ADMIN
            Alert.alert("Sucesso", "Serviço adicionado ao catálogo!");

            // Limpa o formulário e recarrega a lista
            fecharModal();
            buscarServicos();
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string' ? error.response.data : "Erro ao salvar serviço.";
            Alert.alert("Erro", msg);
        } finally {
            setSalvando(false);
        }
    }

    // --- Função para Deletar Serviço (DELETE) ---
    function confirmarDeletar(id: number, nome: string) {
        Alert.alert("Excluir Serviço", `Tem certeza que deseja apagar "${nome}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Sim, Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/servicos/${id}`);
                        Alert.alert("Sucesso", "Serviço removido.");
                        buscarServicos(); // Atualiza a lista
                    } catch (error) {
                        Alert.alert("Erro", "Não foi possível remover o serviço.");
                    }
                }
            }
        ]);
    }

    function fecharModal() {
        setModalVisible(false);
        setNovoNome('');
        setNovaDescricao('');
        setNovoPreco('');
        setNovaDuracao('');
    }

    const renderItem = ({ item }: { item: Servico }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.nome_servico}</Text>
                <Text style={styles.cardDesc}>{item.descricao || "Sem descrição"}</Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
                    <Text style={styles.cardDuration}><Ionicons name="time-outline"/> {item.duracaoMin} min</Text>
                </View>
            </View>

            {/* Botão de Excluir */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmarDeletar(item.id, item.nome_servico)}
            >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
            ) : (
                <FlatList
                    data={servicos}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>}
                />
            )}

            {/* Botão Flutuante (FAB) para Adicionar */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Modal de Criação */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Novo Serviço</Text>

                        <TextInput style={styles.input} placeholder="Nome (Ex: Corte Masculino)" value={novoNome} onChangeText={setNovoNome} />
                        <TextInput style={styles.input} placeholder="Descrição (Opcional)" value={novaDescricao} onChangeText={setNovaDescricao} />
                        <View style={styles.row}>
                            <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Preço (Ex: 50.00)" keyboardType="numeric" value={novoPreco} onChangeText={setNovoPreco} />
                            <TextInput style={[styles.input, {flex: 1}]} placeholder="Duração (minutos)" keyboardType="numeric" value={novaDuracao} onChangeText={setNovaDuracao} />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={fecharModal}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnSave} onPress={handleCriarServico} disabled={salvando}>
                                {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Salvar</Text>}
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
    listContainer: { padding: 16, paddingBottom: 80 },

    card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardDesc: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginRight: 15 },
    cardDuration: { fontSize: 14, color: '#666' },
    deleteButton: { padding: 10, marginLeft: 10 },

    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },

    // Estilos do Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    input: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12 },
    row: { flexDirection: 'row' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    btnCancel: { padding: 14, marginRight: 10 },
    btnCancelText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
    btnSave: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8 },
    btnSaveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});