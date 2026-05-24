import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Switch, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

export function AdminScheduleScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);
    const [carregandoListas, setCarregandoListas] = useState(true);

    const [servicos, setServicos] = useState<any[]>([]);
    const [profissionais, setProfissionais] = useState<any[]>([]);

    const [servicoId, setServicoId] = useState('');
    const [profissionalId, setProfissionaisId] = useState('');

    const [dataAgendamento, setDataAgendamento] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modoPicker, setModoPicker] = useState<'date' | 'time'>('date');

    const [isAvulso, setIsAvulso] = useState(true);
    const [clienteId, setClienteId] = useState('');
    const [nomeAvulso, setNomeAvulso] = useState('');
    const [telefoneAvulso, setTelefoneAvulso] = useState('');

    useEffect(() => {
        carregarDadosBasicos();
    }, []);

    async function carregarDadosBasicos() {
        try {
            const [resServicos, resProfissionais] = await Promise.all([
                api.get('/servicos'),
                api.get('/profissionais')
            ]);
            setServicos(resServicos.data);
            setProfissionais(resProfissionais.data);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os serviços e profissionais.');
        } finally {
            setCarregandoListas(false);
        }
    }

    const openPicker = (modo: 'date' | 'time') => {
        setModoPicker(modo);
        setShowDatePicker(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (event.type === 'dismissed') {
            return;
        }

        if (selectedDate) {
            setDataAgendamento(selectedDate);
        }
    };

    async function handleGuardar() {
        if (!servicoId || !profissionalId) {
            Alert.alert('Atenção', 'Por favor, preencha o serviço e o profissional.');
            return;
        }

        if (isAvulso && (!nomeAvulso.trim() || !telefoneAvulso.trim())) {
            Alert.alert('Atenção', 'Preencha o nome e o telefone do cliente avulso.');
            return;
        }

        if (!isAvulso && !clienteId.trim()) {
            Alert.alert('Atenção', 'Preencha o ID do cliente registrado.');
            return;
        }

        setLoading(true);
        try {
            const ano = dataAgendamento.getFullYear();
            const mes = String(dataAgendamento.getMonth() + 1).padStart(2, '0');
            const dia = String(dataAgendamento.getDate()).padStart(2, '0');
            const hora = String(dataAgendamento.getHours()).padStart(2, '0');
            const minuto = String(dataAgendamento.getMinutes()).padStart(2, '0');

            const dataHoraFormatada = `${ano}-${mes}-${dia}T${hora}:${minuto}:00`;

            const payload = {
                servicoId: Number(servicoId),
                profissionalId: Number(profissionalId),
                dataInicio: dataHoraFormatada, // Usa a data formatada
                ...(isAvulso
                        ? { nomeClienteAvulso: nomeAvulso, telefoneClienteAvulso: telefoneAvulso }
                        : { clienteId: Number(clienteId) }
                )
            };

            await api.post('/agendamentos', payload);

            Alert.alert('Sucesso', 'O agendamento foi marcado com sucesso!');
            navigation.goBack();
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string'
                ? error.response.data
                : 'Ocorreu um erro ao tentar agendar.';
            Alert.alert('Erro', msg);
        } finally {
            setLoading(false);
        }
    }

    const dataExibicao = `${String(dataAgendamento.getDate()).padStart(2, '0')}/${String(dataAgendamento.getMonth() + 1).padStart(2, '0')}/${dataAgendamento.getFullYear()}`;
    const horaExibicao = `${String(dataAgendamento.getHours()).padStart(2, '0')}:${String(dataAgendamento.getMinutes()).padStart(2, '0')}`;

    if (carregandoListas) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Agendamento</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.toggleContainer}>
                    <Text style={styles.label}>É um cliente sem cadastro?</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#34C759' }}
                        thumbColor={'#f4f3f4'}
                        value={isAvulso}
                        onValueChange={setIsAvulso}
                    />
                </View>

                {isAvulso ? (
                    <View style={styles.avulsoContainer}>
                        <Text style={styles.label}>Nome do Cliente</Text>
                        <TextInput style={styles.input} value={nomeAvulso} onChangeText={setNomeAvulso} placeholder="Ex: Maria Joaquina" />

                        <Text style={styles.label}>Telefone (WhatsApp)</Text>
                        <TextInput style={styles.input} value={telefoneAvulso} onChangeText={setTelefoneAvulso} placeholder="Ex: (11) 99999-9999" keyboardType="phone-pad" />
                    </View>
                ) : (
                    <View style={styles.registadoContainer}>
                        <Text style={styles.label}>ID do Cliente Registrado</Text>
                        <TextInput style={styles.input} value={clienteId} onChangeText={setClienteId} placeholder="Ex: 15" keyboardType="numeric" />
                        <Text style={styles.hint}>* O cliente tem de ter a aplicação instalada.</Text>
                    </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.label}>ID do Serviço (Ex: 1 para Corte)</Text>
                <TextInput style={styles.input} value={servicoId} onChangeText={setServicoId} placeholder="Introduza o ID do Serviço" keyboardType="numeric" />

                <Text style={styles.label}>ID do Profissional</Text>
                <TextInput style={styles.input} value={profissionalId} onChangeText={setProfissionaisId} placeholder="Introduza o ID do Profissional" keyboardType="numeric" />

                <Text style={styles.label}>Data e Hora do Atendimento</Text>
                <View style={styles.dateTimeRow}>
                    <TouchableOpacity style={styles.dateButton} onPress={() => openPicker('date')}>
                        <Ionicons name="calendar" size={20} color="#007AFF" />
                        <Text style={styles.dateButtonText}>{dataExibicao}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dateButton} onPress={() => openPicker('time')}>
                        <Ionicons name="time" size={20} color="#007AFF" />
                        <Text style={styles.dateButtonText}>{horaExibicao}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={dataAgendamento}
                        mode={modoPicker}
                        is24Hour={true} // Formato 24h (14:30 em vez de 2:30 PM)
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                    />
                )}

                {showDatePicker && Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.iosConfirmButton} onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.iosConfirmText}>Confirmar {modoPicker === 'date' ? 'Data' : 'Hora'}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleGuardar}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Confirmar Agendamento</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA'
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20 },
    avulsoContainer: { backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20 },
    registadoContainer: { backgroundColor: '#F0F0F0', padding: 15, borderRadius: 12, marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#DDD', marginBottom: 15 },
    hint: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: -10, marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#DDD', marginVertical: 10 },

    dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    dateButton: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
    dateButtonText: { marginLeft: 8, fontSize: 16, color: '#333', fontWeight: 'bold' },

    iosConfirmButton: { backgroundColor: '#E5F1FF', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    iosConfirmText: { color: '#007AFF', fontWeight: 'bold' },

    saveButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40 },
    buttonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});