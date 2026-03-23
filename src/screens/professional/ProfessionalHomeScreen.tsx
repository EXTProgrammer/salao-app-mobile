import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AgendamentoProfissional {
    id: number;
    dataInicio: string;
    status: string;
    servico: { nome_servico: string; preco: number; };
    cliente: { usuario: { nome: string; } }; // Repare que aqui vemos o CLIENTE, e não o profissional
}

export function ProfessionalHomeScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<AgendamentoProfissional[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            buscarAgendaDoProfissional();
        });
        buscarAgendaDoProfissional();
        return unsubscribe;
    }, [navigation]);

    async function buscarAgendaDoProfissional() {
        setLoading(true);
        try {
            // ATENÇÃO: Precisaremos criar este endpoint no Java no próximo passo!
            const response = await api.get('/agendamentos/agenda-profissional');
            setAgendamentos(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar a sua agenda.");
        } finally {
            setLoading(false);
        }
    }

    // --- AÇÕES DO PROFISSIONAL ---

    const alterarStatus = async (id: number, novoStatus: string, endpoint: string) => {
        setLoading(true);
        try {
            // Chamaremos endpoints específicos como /confirmar ou /concluir
            await api.put(`/agendamentos/${id}/${endpoint}`);
            buscarAgendaDoProfissional();
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string' ? error.response.data : "Ocorreu um erro ao processar sua solicitação.";
            Alert.alert("Erro", msg);
            setLoading(false);
        }
    };

    const confirmarAgendamento = (id: number) => {
        Alert.alert("Confirmar", "Deseja confirmar este horário com o cliente?", [
            { text: "Não", style: "cancel" },
            { text: "Sim, Confirmar", onPress: () => alterarStatus(id, 'CONFIRMADO', 'confirmar') }
        ]);
    };

    const concluirAgendamento = (id: number) => {
        Alert.alert("Finalizar Serviço", "O serviço foi finalizado com sucesso?", [
            { text: "Ainda não", style: "cancel" },
            { text: "Sim, Concluir", onPress: () => alterarStatus(id, 'CONCLUIDO', 'concluir') }
        ]);
    };

    // --- RENDERIZAÇÃO ---

    const formatarHora = (dataIso: string) => {
        if (!dataIso) return '--:--';
        const dataObj = new Date(dataIso);
        return `${String(dataObj.getHours()).padStart(2, '0')}:${String(dataObj.getMinutes()).padStart(2, '0')}`;
    };

    const renderItem = ({ item }: { item: AgendamentoProfissional }) => {
        const status = item.status?.toUpperCase();

        return (
            <View style={styles.card}>
                <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{formatarHora(item.dataInicio)}</Text>
                    <View style={[styles.statusDot,
                        status === 'PENDENTE' ? {backgroundColor: '#FFA500'} :
                            status === 'CONFIRMADO' ? {backgroundColor: '#34C759'} :
                                status === 'CONCLUIDO' ? {backgroundColor: '#007AFF'} : {backgroundColor: '#FF3B30'}
                    ]} />
                </View>

                <View style={styles.contentColumn}>
                    <Text style={styles.clientName}>{item.cliente?.usuario?.nome || 'Cliente Desconhecido'}</Text>
                    <Text style={styles.serviceName}>{item.servico?.nome_servico}</Text>

                    <View style={styles.actionRow}>
                        {status === 'PENDENTE' && (
                            <TouchableOpacity style={[styles.actionButton, styles.btnConfirm]} onPress={() => confirmarAgendamento(item.id)}>
                                <Text style={styles.btnTextConfirm}>Confirmar</Text>
                            </TouchableOpacity>
                        )}

                        {status === 'CONFIRMADO' && (
                            <TouchableOpacity style={[styles.actionButton, styles.btnComplete]} onPress={() => concluirAgendamento(item.id)}>
                                <Text style={styles.btnTextComplete}>Finalizar Serviço</Text>
                            </TouchableOpacity>
                        )}

                        {(status === 'CONCLUIDO' || status === 'CANCELADO') && (
                            <Text style={styles.statusLabel}>{status}</Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Olá, {user?.nome}</Text>
                <Text style={styles.subtitle}>Aqui estão os seus clientes de hoje</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
            ) : agendamentos.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cafe-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Você não tem agendamentos para hoje.</Text>
                </View>
            ) : (
                <FlatList
                    data={agendamentos}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshing={loading}
                    onRefresh={buscarAgendaDoProfissional}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    listContainer: { padding: 16 },

    card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
    timeColumn: { width: 60, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#EAEAEA', paddingRight: 10, marginRight: 10 },
    timeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 8 },

    contentColumn: { flex: 1, justifyContent: 'center' },
    clientName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    serviceName: { fontSize: 14, color: '#666', marginBottom: 10 },

    actionRow: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1 },

    btnConfirm: { borderColor: '#34C759', backgroundColor: '#E8F8F0' },
    btnTextConfirm: { color: '#34C759', fontWeight: 'bold' },

    btnComplete: { borderColor: '#007AFF', backgroundColor: '#E5F1FF' },
    btnTextComplete: { color: '#007AFF', fontWeight: 'bold' },

    statusLabel: { fontSize: 14, fontWeight: 'bold', color: '#999', fontStyle: 'italic' },
    emptyText: { fontSize: 16, color: '#666', marginTop: 16 }
});