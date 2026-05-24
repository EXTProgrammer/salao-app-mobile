import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface Agendamento {
    id: number;
    dataInicio: string;
    status: string;
    servico: { nome_servico: string; preco: number };
    cliente: { nome: string; telefone: string } | null; // Pode ser null
    nomeClienteAvulso?: string; // Novo campo
    telefoneClienteAvulso?: string; // Novo campo
    profissional: { usuario: { nome: string; } };
}

export function AgendaScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState<{title: string, data: Agendamento[]}[]>([]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            buscarAgendaFutura();
        });
        return unsubscribe;
    }, [navigation]);

    async function buscarAgendaFutura() {
        setLoading(true);
        try {
            const response = await api.get('/agendamentos/todos');
            const agendamentos: Agendamento[] = response.data;

            // Agrupa por dia
            const agrupado = agendamentos.reduce((acc: any, agendamento) => {
                const dataApenas = agendamento.dataInicio.split('T')[0];
                if (!acc[dataApenas]) acc[dataApenas] = [];
                acc[dataApenas].push(agendamento);
                return acc;
            }, {});

            // Transforma em array para o SectionList
            const arraySections = Object.keys(agrupado).map(dataString => {
                const dataBR = dataString.split('-').reverse().join('/');
                return { title: dataBR, data: agrupado[dataString] };
            });

            setSections(arraySections);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar a agenda completa.');
        } finally {
            setLoading(false);
        }
    }

    // --- NOVAS FUNÇÕES DE ALTERAÇÃO DE STATUS ---
    async function handleConfirmar(id: number) {
        Alert.alert('Confirmar', 'Deseja confirmar este agendamento?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', onPress: async () => {
                    try {
                        await api.put(`/agendamentos/${id}/confirmar`);
                        buscarAgendaFutura(); // Recarrega a lista
                    } catch (error) {
                        Alert.alert('Erro', 'Não foi possível confirmar o agendamento.');
                    }
                }
            }
        ]);
    }

    async function handleConcluir(id: number) {
        Alert.alert('Concluir', 'Deseja finalizar este atendimento?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', onPress: async () => {
                    try {
                        await api.put(`/agendamentos/${id}/concluir`);
                        buscarAgendaFutura(); // Recarrega a lista
                    } catch (error) {
                        Alert.alert('Erro', 'Não foi possível finalizar o atendimento.');
                    }
                }
            }
        ]);
    }

    // NOVO: Função para o profissional cancelar / assinalar falta
    async function handleCancelar(id: number) {
        Alert.alert(
            'Cancelar Atendimento',
            'Tem a certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.',
            [
                { text: 'Voltar', style: 'cancel' },
                {
                    text: 'Sim, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.put(`/agendamentos/${id}/cancelar`);
                            buscarAgendaFutura();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível cancelar o agendamento.');
                        }
                    }
                }
            ]
        );
    }

    const renderAgendamento = ({ item }: { item: Agendamento }) => {
        const horario = item.dataInicio.split('T')[1].substring(0, 5);
        const isFinalizadoOuCancelado = item.status === 'CONCLUIDO' || item.status === 'CANCELADO';

        const nomeExibido = item.cliente
            ? item.cliente.nome
            : (item.nomeClienteAvulso || 'Cliente Avulso');

        const telefoneExibido = item.cliente
            ? item.cliente.telefone
            : (item.telefoneClienteAvulso || '');

        return (
            <View style={[styles.card, isFinalizadoOuCancelado && styles.cardFinalizado]}>
                <View style={styles.timeColumn}><Text style={styles.timeText}>{horario}</Text></View>
                <View style={styles.detailsColumn}>
                    <Text style={styles.clientName}>{nomeExibido}</Text>
                    <Text style={styles.serviceName}>{item.servico?.nome_servico}</Text>
                    {telefoneExibido !== '' && (
                        <Text style={styles.clientPhone}>
                            <Ionicons name="logo-whatsapp" size={12} color="#25D366" /> {telefoneExibido}
                        </Text>
                    )}
                    <Text style={[
                        styles.statusBadge,
                        item.status === 'CANCELADO' && { color: '#FF3B30' },
                        item.status === 'CONCLUIDO' && { color: '#34C759' }
                    ]}>
                        {item.status}
                    </Text>
                </View>

                {!isFinalizadoOuCancelado && (
                    <View style={styles.actionColumn}>
                        {item.status === 'PENDENTE' && (
                            <TouchableOpacity style={styles.confirmButton} onPress={() => handleConfirmar(item.id)}>
                                <Ionicons name="thumbs-up" size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}
                        {item.status === 'CONFIRMADO' && (
                            <TouchableOpacity style={styles.finishButton} onPress={() => handleConcluir(item.id)}>
                                <Ionicons name="checkmark-done" size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelar(item.id)}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#007AFF" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* --- O BOTÃO DE VOLTAR PARA A TELA DE HOJE --- */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>

                <View>
                    <Text style={styles.headerTitle}>Agenda Completa</Text>
                    <Text style={styles.headerSubtitle}>Todos os próximos atendimentos</Text>
                </View>
            </View>

            {sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-clear-outline" size={60} color="#CCC" />
                    <Text style={styles.emptyText}>Nenhum agendamento futuro.</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderAgendamento}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{title}</Text></View>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NovaMarcacao')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA',
        flexDirection: 'row', alignItems: 'center'
    },
    backButton: { marginRight: 15, padding: 5 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },

    listContent: { padding: 15, paddingBottom: 40 },
    sectionHeader: { backgroundColor: '#E5F1FF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, marginBottom: 10, marginTop: 10 },
    sectionHeaderText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },

    card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
    cardFinalizado: { opacity: 0.6, backgroundColor: '#FAFAFA' },

    timeColumn: { justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#EAEAEA', paddingRight: 15, marginRight: 15 },
    timeText: { fontSize: 20, fontWeight: 'bold', color: '#333' },

    detailsColumn: { flex: 1, justifyContent: 'center' },
    clientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    serviceName: { fontSize: 14, color: '#666' },
    statusBadge: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginTop: 4 },
    clientPhone: { color: '#25D366', fontSize: 12, marginTop: 4 },

    actionColumn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    confirmButton: { backgroundColor: '#007AFF', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    finishButton: { backgroundColor: '#34C759', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    cancelButton: { backgroundColor: '#FF3B30', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    statusText: { fontSize: 12, fontWeight: 'bold', color: '#666' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 15, color: '#666' },

    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#007AFF',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3
    }
});