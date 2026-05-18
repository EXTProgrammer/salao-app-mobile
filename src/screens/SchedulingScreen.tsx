import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// --- Traduzindo o Calendário para Português ---
LocaleConfig.locales['pt-br'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

interface Servico { id: number; nome_servico: string; preco: number; duracaoMin: number; }
interface Profissional { id: number; usuario: { nome: string }; }

export function SchedulingScreen({ navigation }: any) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [servicos, setServicos] = useState<Servico[]>([]);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);

    const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
    const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null);
    const [dataSelecionada, setDataSelecionada] = useState<string>('');
    const [horarioSelecionado, setHorarioSelecionado] = useState<string>('');

    const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
    const [loadingHorarios, setLoadingHorarios] = useState(false);

    // --- CÁLCULO DAS DATAS LIMITES ---
    const dataHojeObj = new Date();
    const dataHoje = dataHojeObj.toISOString().split('T')[0];

    // Calcula exatamente 1 ano no futuro
    const dataAnoQueVemObj = new Date();
    dataAnoQueVemObj.setFullYear(dataAnoQueVemObj.getFullYear() + 1);
    const dataMaxima = dataAnoQueVemObj.toISOString().split('T')[0];

    useEffect(() => {
        buscarDados();
    }, []);

    useEffect(() => {
        if (dataSelecionada && profissionalSelecionado && servicoSelecionado) {
            buscarHorariosDaAPI();
        }
    }, [dataSelecionada, profissionalSelecionado, servicoSelecionado]);

    async function buscarDados() {
        setLoading(true);
        try {
            const [resServicos, resProfissionais] = await Promise.all([
                api.get('/servicos'), api.get('/profissionais')
            ]);
            setServicos(resServicos.data);
            setProfissionais(resProfissionais.data);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar o catálogo.');
        } finally {
            setLoading(false);
        }
    }

    async function buscarHorariosDaAPI() {
        setLoadingHorarios(true);
        setHorarioSelecionado(''); // Limpa o horário se o cliente mudar de dia
        try {
            const response = await api.get('/agendamentos/horarios-disponiveis', {
                params: {
                    data: dataSelecionada,
                    profissionalId: profissionalSelecionado?.id,
                    duracao: servicoSelecionado?.duracaoMin
                }
            });
            setHorariosDisponiveis(response.data);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os horários disponíveis.');
        } finally {
            setLoadingHorarios(false);
        }
    }

    async function confirmarAgendamento() {
        if (!servicoSelecionado || !profissionalSelecionado || !dataSelecionada || !horarioSelecionado) return;

        setLoading(true);
        try {
            const dataInicioIso = `${dataSelecionada}T${horarioSelecionado}:00`;

            const payload = {
                servicoId: servicoSelecionado.id,
                profissionalId: profissionalSelecionado.id,
                dataInicio: dataInicioIso,
                clienteId: user?.id
            };

            await api.post('/agendamentos', payload);

            Alert.alert('Sucesso!', 'Seu horário foi agendado com sucesso.', [{
                text: 'OK',
                onPress: () => {
                    setStep(1); setServicoSelecionado(null); setProfissionalSelecionado(null);
                    setDataSelecionada(''); setHorarioSelecionado('');
                    navigation.navigate('Minha Agenda');
                }
            }]);
        } catch (error: any) {
            const msg = typeof error.response?.data === 'string' ? error.response.data : 'Erro ao processar o agendamento.';
            Alert.alert('Ops!', msg);
        } finally {
            setLoading(false);
        }
    }

    const renderPasso1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>1. O que você deseja fazer?</Text>
            <FlatList
                data={servicos}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                    const isSelected = servicoSelecionado?.id === item.id;
                    return (
                        <TouchableOpacity
                            style={[styles.cardItem, isSelected && styles.cardItemSelected]}
                            onPress={() => setServicoSelecionado(item)}
                        >
                            <View>
                                <Text style={[styles.cardTitle, isSelected && styles.textSelected]}>{item.nome_servico}</Text>
                                <Text style={styles.cardDuration}><Ionicons name="time-outline"/> {item.duracaoMin} min</Text>
                            </View>
                            <Text style={styles.cardPrice}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
            <TouchableOpacity
                style={[styles.nextButton, !servicoSelecionado && styles.buttonDisabled]}
                disabled={!servicoSelecionado} onPress={() => setStep(2)}
            >
                <Text style={styles.nextButtonText}>Avançar</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPasso2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>2. Escolha o Profissional</Text>
            <FlatList
                data={profissionais}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                    const isSelected = profissionalSelecionado?.id === item.id;
                    return (
                        <TouchableOpacity
                            style={[styles.cardItem, isSelected && styles.cardItemSelected]}
                            onPress={() => setProfissionalSelecionado(item)}
                        >
                            <Ionicons name="person-circle" size={40} color={isSelected ? '#FFF' : '#007AFF'} />
                            <Text style={[styles.cardTitle, isSelected && styles.textSelected, { marginLeft: 10 }]}>{item.usuario?.nome}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}><Text style={styles.backButtonText}>Voltar</Text></TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextButton, !profissionalSelecionado && styles.buttonDisabled, { flex: 1, marginLeft: 10 }]}
                    disabled={!profissionalSelecionado} onPress={() => setStep(3)}
                >
                    <Text style={styles.nextButtonText}>Avançar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPasso3 = () => (
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>3. Escolha Data e Horário</Text>

            <Calendar
                minDate={dataHoje}
                maxDate={dataMaxima}
                onDayPress={(day: any) => {
                    // Bloqueia Domingo (0) e Segunda (1) no Front-end visualmente
                    const dateObj = new Date(day.dateString + 'T00:00:00');
                    const diaDaSemana = dateObj.getDay();

                    setDataSelecionada(day.dateString);
                }}
                markedDates={{
                    [dataSelecionada]: { selected: true, selectedColor: '#007AFF' }
                }}
                theme={{
                    selectedDayBackgroundColor: '#007AFF',
                    todayTextColor: '#007AFF',
                    arrowColor: '#007AFF',
                    textMonthFontWeight: 'bold',
                }}
                style={styles.calendar}
            />

            {dataSelecionada ? (
                <>
                    <Text style={styles.sectionLabel}>Horários para {dataSelecionada.split('-').reverse().join('/')}:</Text>

                    {loadingHorarios ? (
                        <View style={{ padding: 20 }}><ActivityIndicator size="large" color="#007AFF" /></View>
                    ) : (
                        <View style={styles.gridContainer}>
                            {horariosDisponiveis.length > 0 ? (
                                horariosDisponiveis.map((hora) => (
                                    <TouchableOpacity
                                        key={hora}
                                        style={[styles.gridItem, horarioSelecionado === hora && styles.pillSelected]}
                                        onPress={() => setHorarioSelecionado(hora)}
                                    >
                                        <Text style={[styles.pillText, horarioSelecionado === hora && styles.textSelected]}>{hora}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.helperText}>Não há mais horários disponíveis para este dia com este profissional.</Text>
                            )}
                        </View>
                    )}
                </>
            ) : (
                <Text style={styles.helperText}>Selecione um dia no calendário acima para ver os horários livres.</Text>
            )}

            <View style={[styles.buttonRow, { marginTop: 30 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}><Text style={styles.backButtonText}>Voltar</Text></TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextButton, (!dataSelecionada || !horarioSelecionado) && styles.buttonDisabled, { flex: 1, marginLeft: 10 }]}
                    disabled={!dataSelecionada || !horarioSelecionado} onPress={() => setStep(4)}
                >
                    <Text style={styles.nextButtonText}>Revisar</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderPasso4 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>4. Confirme seu Agendamento</Text>
            <View style={styles.resumeCard}>
                <Text style={styles.resumeLabel}>Serviço:</Text>
                <Text style={styles.resumeValue}>{servicoSelecionado?.nome_servico} ({servicoSelecionado?.duracaoMin} min)</Text>
                <Text style={styles.resumeLabel}>Profissional:</Text>
                <Text style={styles.resumeValue}>{profissionalSelecionado?.usuario?.nome}</Text>
                <Text style={styles.resumeLabel}>Data e Hora:</Text>
                <Text style={styles.resumeValue}>
                    {dataSelecionada.split('-').reverse().join('/')} às {horarioSelecionado}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.resumeLabel}>Total a pagar no local:</Text>
                <Text style={styles.resumeTotal}>R$ {servicoSelecionado?.preco.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}><Text style={styles.backButtonText}>Voltar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.confirmButton, { flex: 1, marginLeft: 10 }]} onPress={confirmarAgendamento}>
                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Agendamento</Text>
                <Text style={styles.stepIndicator}>Passo {step} de 4</Text>
            </View>
            <View style={styles.content}>
                {step === 1 && renderPasso1()}
                {step === 2 && renderPasso2()}
                {step === 3 && renderPasso3()}
                {step === 4 && renderPasso4()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    stepIndicator: { fontSize: 16, color: '#007AFF', marginTop: 5, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    cardItem: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent', elevation: 2 },
    cardItemSelected: { borderColor: '#007AFF', backgroundColor: '#E5F1FF' },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    cardDuration: { fontSize: 12, color: '#666', marginTop: 4 },
    cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
    textSelected: { color: '#007AFF' },
    buttonRow: { flexDirection: 'row', marginTop: 10, marginBottom: 20 },
    nextButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    confirmButton: { backgroundColor: '#34C759', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonDisabled: { backgroundColor: '#CCC' },
    nextButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    confirmButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    backButton: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CCC', flex: 1 },
    backButtonText: { color: '#666', fontSize: 18, fontWeight: 'bold' },
    calendar: { borderRadius: 12, elevation: 2, marginBottom: 20, paddingBottom: 10 },
    helperText: { textAlign: 'center', color: '#666', marginTop: 20, fontStyle: 'italic' },
    sectionLabel: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 5, marginBottom: 15 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: { backgroundColor: '#FFF', paddingVertical: 15, width: '31%', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#CCC' },
    pillSelected: { backgroundColor: '#E5F1FF', borderColor: '#007AFF' },
    pillText: { fontSize: 16, color: '#333', fontWeight: '600' },
    resumeCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 20 },
    resumeLabel: { fontSize: 16, color: '#666', marginTop: 10 },
    resumeValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    divider: { height: 1, backgroundColor: '#EAEAEA', marginVertical: 15 },
    resumeTotal: { fontSize: 24, fontWeight: 'bold', color: '#34C759' }
});