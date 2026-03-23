import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Profissional {
    id: number;
    usuario: { nome: string; email: string };
    especialidades: string[];
}

export function AdminProfessionalScreen() {
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados do Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [emailBusca, setEmailBusca] = useState('');
    const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null);
    const [especialidadesTexto, setEspecialidadesTexto] = useState('');
    const [buscandoUser, setBuscandoUser] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        buscarProfissionais();
    }, []);

    async function buscarProfissionais() {
        setLoading(true);
        try {
            const response = await api.get('/profissionais');
            setProfissionais(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar a equipe.");
        } finally {
            setLoading(false);
        }
    }

    // --- 1. Busca o usuário que será promovido a Profissional ---
    async function buscarUsuarioParaPromover() {
        if (!emailBusca) return;
        setBuscandoUser(true);
        setUsuarioEncontrado(null);
        try {
            const response = await api.get(`/usuarios/buscar-por-email?email=${emailBusca}`);
            setUsuarioEncontrado(response.data);
        } catch (error) {
            Alert.alert("Não encontrado", "Nenhum usuário cadastrado com esse e-mail.");
        } finally {
            setBuscandoUser(false);
        }
    }

    // --- 2. Promove o Usuário a Profissional ---
    async function handlePromoverProfissional() {
        if (!usuarioEncontrado || !especialidadesTexto) {
            Alert.alert("Atenção", "Selecione um usuário e digite as especialidades.");
            return;
        }

        setSalvando(true);
        try {
            const listaEspecialidades = especialidadesTexto
                .split(',')
                .map(e => e.trim())
                .filter(e => e.length > 0);

            const payload = {
                usuarioId: usuarioEncontrado.id,
                especialidades: listaEspecialidades
            };

            await api.post('/profissionais', payload);

            Alert.alert("Sucesso", `${usuarioEncontrado.nome} agora faz parte da equipe!`);
            fecharModal();
            buscarProfissionais();
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string' ? error.response.data : "Erro ao promover usuário.";
            Alert.alert("Erro", msg);
        } finally {
            setSalvando(false);
        }
    }

    // --- 3. Remove o Profissional (Demissão/Retorno a Cliente) ---
    function confirmarRemover(id: number, nome: string) {

        // Proteção: Impede que o app envie 'undefined' para o Java
        if (!id) {
            Alert.alert("Erro", "ID do profissional ausente. Verifique se o seu Java está retornando o campo 'id'.");
            return;
        }

        Alert.alert(
            "Remover da Equipe",
            `Tem certeza que deseja remover ${nome} da equipe?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sim, Remover",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete(`/profissionais/${id}`);
                            Alert.alert("Sucesso", "Profissional removido com sucesso.");
                            buscarProfissionais(); // Atualiza a lista
                        } catch (error: any) {
                            const status = error.response?.status;
                            const data = error.response?.data;

                            let msgErro = "Não foi possível remover o profissional.";

                            if (status === 404) {
                                msgErro = "Rota não encontrada no Java (Erro 404). Verifique se o método @DeleteMapping(\"/{id}\") existe no seu ProfissionalController.";
                            } else if (status === 403 || status === 401) {
                                msgErro = "Acesso Negado (Erro 403). Você não tem permissão ou sua sessão expirou.";
                            } else if (typeof data === 'string') {
                                msgErro = data;
                            }

                            Alert.alert(`Erro ${status || ''}`, msgErro);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }

    function fecharModal() {
        setModalVisible(false);
        setEmailBusca('');
        setUsuarioEncontrado(null);
        setEspecialidadesTexto('');
    }

    const renderItem = ({ item }: { item: Profissional }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Ionicons name="star" size={24} color="#007AFF" />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.usuario?.nome}</Text>
                <Text style={styles.cardSubtitle}>{item.usuario?.email}</Text>

                <Text style={styles.labelEspecialidade}>Especialidades:</Text>
                <View style={styles.badgesContainer}>
                    {item.especialidades?.map((esp, i) => (
                        <View key={i} style={styles.badge}><Text style={styles.badgeText}>{esp}</Text></View>
                    ))}
                </View>
            </View>

            {/* Botão de Excluir */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmarRemover(item.id, item.usuario?.nome)}
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
                    data={profissionais}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum profissional cadastrado.</Text>}
                />
            )}

            {/* Botão Flutuante (FAB) para Adicionar */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="person-add" size={28} color="#FFF" />
            </TouchableOpacity>

            {/* Modal de Promoção a Profissional */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Adicionar à Equipe</Text>
                        <Text style={styles.modalHelper}>O membro já deve ter criado uma conta de Cliente no App.</Text>

                        {/* Passo 1: Achar o usuário */}
                        <View style={styles.searchUserRow}>
                            <TextInput
                                style={[styles.input, {flex: 1, marginBottom: 0}]}
                                placeholder="E-mail exato do usuário..."
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={emailBusca}
                                onChangeText={setEmailBusca}
                            />
                            <TouchableOpacity style={styles.btnSearchUser} onPress={buscarUsuarioParaPromover}>
                                {buscandoUser ? <ActivityIndicator color="#FFF"/> : <Ionicons name="search" size={20} color="#FFF"/>}
                            </TouchableOpacity>
                        </View>

                        {/* Feedback se achou */}
                        {usuarioEncontrado && (
                            <View style={styles.userFoundCard}>
                                <Ionicons name="checkmark-circle" size={24} color="#34C759" style={{marginRight: 10}}/>
                                <Text style={styles.userFoundText}>Usuário encontrado: {usuarioEncontrado.nome}</Text>
                            </View>
                        )}

                        {/* Passo 2: Definir Especialidades */}
                        <TextInput
                            style={[styles.input, {marginTop: 15}]}
                            placeholder="Especialidades (separadas por vírgula)"
                            value={especialidadesTexto}
                            onChangeText={setEspecialidadesTexto}
                        />
                        <Text style={styles.miniHelper}>Exemplo: Corte, Pintura, Barba, Massagem</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={fecharModal}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btnSave, !usuarioEncontrado && {backgroundColor: '#ccc'}]}
                                onPress={handlePromoverProfissional}
                                disabled={salvando || !usuarioEncontrado}
                            >
                                {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Salvar Equipe</Text>}
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
    card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5F1FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 10 },
    labelEspecialidade: { fontSize: 12, color: '#999', fontWeight: 'bold' },
    badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    badge: { backgroundColor: '#F0F0F0', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA' },
    badgeText: { fontSize: 12, color: '#333' },
    deleteButton: { padding: 10, marginLeft: 10, justifyContent: 'center' },
    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    modalHelper: { fontSize: 14, color: '#666', marginBottom: 20 },
    searchUserRow: { flexDirection: 'row', alignItems: 'center' },
    btnSearchUser: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginLeft: 10, justifyContent: 'center' },
    userFoundCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F0', padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#34C759' },
    userFoundText: { color: '#248A3D', fontWeight: 'bold' },
    input: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 8, padding: 14, fontSize: 16 },
    miniHelper: { fontSize: 12, color: '#999', marginTop: 4 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
    btnCancel: { padding: 14, marginRight: 10 },
    btnCancelText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
    btnSave: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, justifyContent: 'center' },
    btnSaveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});