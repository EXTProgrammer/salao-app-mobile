import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

interface Agendamento {
    id: number;
    dataInicio: string;
    status: string;
    servico: { nome_servico: string; preco: number; };
    profissional: { usuario: { nome: string; } };
}

export function MyScheduleScreen() {
    const navigation = useNavigation<any>();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);

    // Controle das Abas: 'proximos' ou 'historico'
    const [abaAtiva, setAbaAtiva] = useState<'proximos' | 'historico'>('proximos');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            buscarMeusAgendamentos();
        });
        buscarMeusAgendamentos();
        return unsubscribe;
    }, [navigation]);

    async function buscarMeusAgendamentos() {
        setLoading(true);
        try {
            const response = await api.get('/agendamentos/meus');
            setAgendamentos(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar sua agenda.");
        } finally {
            setLoading(false);
        }
    }

    const cancelarAgendamento = (id: number) => {
        Alert.alert(
            "Cancelar Horário",
            "Tem certeza que deseja cancelar este agendamento?",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, cancelar", style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.put(`/agendamentos/${id}/cliente-cancelar`);
                            Alert.alert("Sucesso", "Agendamento cancelado.");
                            buscarMeusAgendamentos();
                        } catch (error: any) {
                            // Se o Java bloquear porque está "CONFIRMADO", a mensagem do Java aparece aqui!
                            const msgJava = typeof error.response?.data === 'string'
                                ? error.response.data
                                : "Não foi possível cancelar.";
                            Alert.alert("Aviso", msgJava);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // --- FILTROS DAS ABAS ---
    // Separa a lista principal em duas sub-listas baseadas no status
    const listaProximos = agendamentos.filter(item =>
        item.status.toUpperCase() === 'PENDENTE' || item.status.toUpperCase() === 'CONFIRMADO'
    );

    const listaHistorico = agendamentos.filter(item =>
        item.status.toUpperCase() === 'CANCELADO' || item.status.toUpperCase() === 'CONCLUIDO'
    );

    // Define qual lista será mostrada na tela
    const listaAtual = abaAtiva === 'proximos' ? listaProximos : listaHistorico;

    const formatarDataHora = (dataIso: string) => {
        if (!dataIso) return 'Data não informada';
        const dataObj = new Date(dataIso);
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const hora = String(dataObj.getHours()).padStart(2, '0');
        const minuto = String(dataObj.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${dataObj.getFullYear()} às ${hora}:${minuto}`;
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDENTE': return '#FFA500';
            case 'CONFIRMADO': return '#34C759';
            case 'CANCELADO': return '#FF3B30';
            case 'CONCLUIDO': return '#007AFF';
            default: return '#999';
        }
    };

    const renderItem = ({ item }: { item: Agendamento }) => {
        const status = item.status?.toUpperCase();

        return (
            <View style={[styles.card, status === 'CANCELADO' && styles.cardDesbotado]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>
                        <Ionicons name="calendar-outline" size={16} /> {formatarDataHora(item.dataInicio)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.serviceName}>{item.servico?.nome_servico || 'Serviço Excluído'}</Text>
                    <Text style={styles.professionalName}>Com: {item.profissional?.usuario?.nome || 'Profissional'}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>
                        R$ {item.servico?.preco ? item.servico.preco.toFixed(2).replace('.', ',') : '0,00'}
                    </Text>

                    {/* LÓGICA DE EXIBIÇÃO DO BOTÃO DE CANCELAR */}
                    {status === 'PENDENTE' ? (
                        <TouchableOpacity style={styles.cancelButton} onPress={() => cancelarAgendamento(item.id)}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    ) : status === 'CONFIRMADO' ? (
                        <Text style={styles.warningText}>Contate o salão para cancelar</Text>
                    ) : null}
                    {/* Se for CANCELADO ou CONCLUIDO, não mostra nada neste canto */}

                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Minha Agenda</Text>

                {/* MENUS DAS ABAS */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, abaAtiva === 'proximos' && styles.tabAtiva]}
                        onPress={() => setAbaAtiva('proximos')}
                    >
                        <Text style={[styles.tabText, abaAtiva === 'proximos' && styles.tabTextAtiva]}>Próximos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, abaAtiva === 'historico' && styles.tabAtiva]}
                        onPress={() => setAbaAtiva('historico')}
                    >
                        <Text style={[styles.tabText, abaAtiva === 'historico' && styles.tabTextAtiva]}>Histórico</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
            ) : listaAtual.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name={abaAtiva === 'proximos' ? "calendar-clear-outline" : "time-outline"} size={64} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {abaAtiva === 'proximos'
                            ? "Você não tem agendamentos futuros."
                            : "Seu histórico está vazio."}
                    </Text>

                    {abaAtiva === 'proximos' && (
                        <TouchableOpacity style={styles.newScheduleButton} onPress={() => navigation.navigate('Agendar')}>
                            <Text style={styles.newScheduleButtonText}>Agendar agora</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={listaAtual}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={buscarMeusAgendamentos}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { paddingTop: 60, paddingHorizontal: 0, paddingBottom: 0, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333', paddingHorizontal: 20, marginBottom: 15 },

    // Estilos das Abas
    tabContainer: { flexDirection: 'row', width: '100%' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabAtiva: { borderBottomColor: '#007AFF' },
    tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
    tabTextAtiva: { color: '#007AFF', fontWeight: 'bold' },

    listContainer: { padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    cardDesbotado: { opacity: 0.6 }, // Deixa o card cancelado mais clarinho
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    dateText: { fontSize: 14, fontWeight: '600', color: '#333' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
    statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    cardBody: { marginBottom: 12 },
    serviceName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    professionalName: { fontSize: 14, color: '#666' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
    cancelButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#FF3B30' },
    cancelButtonText: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },
    warningText: { color: '#999', fontSize: 12, fontStyle: 'italic' },
    emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 16, marginBottom: 24 },
    newScheduleButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    newScheduleButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});