import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function ProfessionalHomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            buscarAgendaDeHoje();
        });
        return unsubscribe;
    }, [navigation]);

    async function buscarAgendaDeHoje() {
        setLoading(true);
        try {
            const response = await api.get('/agendamentos/agenda-profissional');
            setAgendamentos(response.data);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar a agenda de hoje.');
        } finally {
            setLoading(false);
        }
    }

    // --- FUNÇÕES DE ALTERAÇÃO DE STATUS ---
    async function handleConfirmar(id: number) {
        Alert.alert('Confirmar', 'Deseja confirmar este agendamento?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', onPress: async () => {
                    try {
                        await api.put(`/agendamentos/${id}/confirmar`);
                        buscarAgendaDeHoje();
                    } catch (error) {
                        Alert.alert('Erro', 'Não foi possível confirmar.');
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
                        buscarAgendaDeHoje();
                    } catch (error) {
                        Alert.alert('Erro', 'Não foi possível concluir.');
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
                            buscarAgendaDeHoje();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível cancelar o agendamento.');
                        }
                    }
                }
            ]
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.greeting}>Olá, {user?.nome}</Text>
                    <Text style={styles.subtitle}>Os seus clientes de hoje</Text>
                </View>

                <TouchableOpacity
                    style={styles.btnVerTodos}
                    onPress={() => navigation.navigate('AgendaCompleta')}
                >
                    <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                    <Text style={styles.btnVerTodosText}>Ver Todos</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>
            ) : agendamentos.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cafe-outline" size={60} color="#CCC" />
                    <Text style={styles.emptyText}>A sua agenda está livre hoje!</Text>
                </View>
            ) : (
                <FlatList
                    data={agendamentos}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => {
                        const isFinalizadoOuCancelado = item.status === 'CONCLUIDO' || item.status === 'CANCELADO';

                        return (
                            <View style={[styles.card, isFinalizadoOuCancelado && styles.cardFinalizado]}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.clientName}>{item.cliente?.nome || 'Cliente'}</Text>
                                    <Text style={styles.serviceName}>
                                        {item.servico?.nome_servico} - {item.dataInicio?.split('T')[1]?.substring(0, 5) || ''}
                                    </Text>
                                    <Text style={[
                                        styles.statusBadge,
                                        item.status === 'CANCELADO' && { color: '#FF3B30' },
                                        item.status === 'CONCLUIDO' && { color: '#34C759' }
                                    ]}>
                                        {item.status}
                                    </Text>
                                </View>

                                {!isFinalizadoOuCancelado && (
                                    <View style={styles.actionButtons}>
                                        {item.status === 'PENDENTE' && (
                                            <TouchableOpacity style={styles.btnConfirmar} onPress={() => handleConfirmar(item.id)}>
                                                <Ionicons name="thumbs-up" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        )}
                                        {item.status === 'CONFIRMADO' && (
                                            <TouchableOpacity style={styles.btnConcluir} onPress={() => handleConcluir(item.id)}>
                                                <Ionicons name="checkmark-done" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        )}

                                        {/* NOVO BOTÃO DE CANCELAR (Disponível em PENDENTE e CONFIRMADO) */}
                                        <TouchableOpacity style={styles.btnCancelar} onPress={() => handleCancelar(item.id)}>
                                            <Ionicons name="close" size={20} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA',
        flexDirection: 'row', alignItems: 'center'
    },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    btnVerTodos: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5F1FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    btnVerTodosText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginTop: 4 },

    listContainer: { padding: 16 },
    card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1, alignItems: 'center', justifyContent: 'space-between' },
    cardFinalizado: { opacity: 0.6, backgroundColor: '#FAFAFA' },
    cardInfo: { flex: 1 },
    clientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    serviceName: { fontSize: 14, color: '#666', marginTop: 4 },
    statusBadge: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginTop: 6 },

    actionButtons: { flexDirection: 'row', gap: 10 },
    btnConfirmar: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    btnConcluir: { backgroundColor: '#34C759', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    btnCancelar: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, // ESTILO DO NOVO BOTÃO

    emptyText: { marginTop: 10, color: '#666', fontSize: 16 }
});