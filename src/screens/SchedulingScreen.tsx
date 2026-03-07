import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // 1. Importando o hook de autenticação

// --- Tipagens ---
interface Servico {
    id: number;
    nome_servico: string;
    preco: number;
    duracaoMin: number;
}

interface Profissional {
    id: number;
    usuario: { nome: string };
}

export function SchedulingScreen({ navigation }: any) {
    // 2. Pegando os dados do usuário logado
    const { user } = useAuth();

    // Controle do Passo a Passo (1 a 4)
    const [step, setStep] = useState(1);

    // Estados de carregamento
    const [loading, setLoading] = useState(false);

    // Listas vindas do backend
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);

    // Horários e Dias fictícios para o front-end (depois podemos puxar do Java)
    const [diasDisponiveis, setDiasDisponiveis] = useState<string[]>([]);
    const horarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    // Escolhas da cliente
    const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
    const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null);
    const [dataSelecionada, setDataSelecionada] = useState<string>('');
    const [horarioSelecionado, setHorarioSelecionado] = useState<string>('');

    // Carrega os dados iniciais ao abrir a tela
    useEffect(() => {
        buscarDados();
        gerarProximosDias();
    }, []);

    async function buscarDados() {
        setLoading(true);
        try {
            const [resServicos, resProfissionais] = await Promise.all([
                api.get('/servicos'),
                api.get('/profissionais')
            ]);
            setServicos(resServicos.data);
            setProfissionais(resProfissionais.data);
        } catch (error) {
            console.log('Erro ao carregar dados para agendamento', error);
            Alert.alert('Erro', 'Não foi possível carregar as opções.');
        } finally {
            setLoading(false);
        }
    }

    // Gera uma lista simples dos próximos 7 dias úteis
    function gerarProximosDias() {
        const dias = [];
        for (let i = 1; i <= 7; i++) {
            const data = new Date();
            data.setDate(data.getDate() + i);
            // Formata para DD/MM
            const diaStr = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;
            dias.push(diaStr);
        }
        setDiasDisponiveis(dias);
    }

    // Função final para enviar ao Java
    async function confirmarAgendamento() {
        if (!servicoSelecionado || !profissionalSelecionado || !dataSelecionada || !horarioSelecionado) {
            Alert.alert('Atenção', 'Preencha todos os dados antes de confirmar.');
            return;
        }

        setLoading(true);
        try {
            // 1. Converter "DD/MM" e "HH:mm" para o formato ISO 8601 (YYYY-MM-DDTHH:mm:00) esperado pelo Java
            const [dia, mes] = dataSelecionada.split('/');
            const anoAtual = new Date().getFullYear();

            // Formata a string exata que o LocalDateTime do Spring Boot consegue ler
            const dataHoraInicioIso = `${anoAtual}-${mes}-${dia}T${horarioSelecionado}:00`;

            // 3. Montar o Payload CORRIGIDO com as chaves exatas que o Java espera
            const payload = {
                servicoId: servicoSelecionado.id,
                profissionalId: profissionalSelecionado.id,
                dataInicio: dataHoraInicioIso, // CORREÇÃO: Atualizado de dataHoraInicio para dataInicio
                clienteId: user?.id            // CORREÇÃO: Enviando o ID do usuário logado
            };

            // Enviar para o Back-end!
            await api.post('/agendamentos', payload);

            Alert.alert(
                'Sucesso!',
                'Seu horário foi agendado com sucesso.',
                [{ text: 'OK', onPress: () => {
                        // Reseta o form e volta pro início
                        setStep(1);
                        setServicoSelecionado(null);
                        setProfissionalSelecionado(null);
                        setDataSelecionada('');
                        setHorarioSelecionado('');
                        navigation.navigate('Início'); // Volta para a tela inicial
                    }}]
            );
        } catch (error: any) {
            console.log("--- ERRO AO AGENDAR ---");
            console.log("Status Code:", error.response?.status);
            console.log("Resposta do Servidor:", error.response?.data);
            console.log("-----------------------");

            let mensagemErro = 'Não foi possível confirmar o agendamento.';

            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    mensagemErro = error.response.data;
                } else if (typeof error.response.data === 'object') {
                    // Extraindo as mensagens de erro do objeto do Spring Boot (Ex: "dataInicio: Obrigatória")
                    const errosValidacao = Object.values(error.response.data).join('\n');
                    mensagemErro = "Por favor, verifique:\n" + errosValidacao;
                }
            }

            Alert.alert('Ops! Algo deu errado', mensagemErro);
        } finally {
            setLoading(false);
        }
    }

    // --- RENDERIZAÇÃO DE CADA PASSO ---

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
                            <Text style={[styles.cardTitle, isSelected && styles.textSelected]}>{item.nome_servico}</Text>
                            <Text style={styles.cardPrice}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
            <TouchableOpacity
                style={[styles.nextButton, !servicoSelecionado && styles.buttonDisabled]}
                disabled={!servicoSelecionado}
                onPress={() => setStep(2)}
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
                            <Text style={[styles.cardTitle, isSelected && styles.textSelected, { marginLeft: 10 }]}>
                                {item.usuario?.nome}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextButton, !profissionalSelecionado && styles.buttonDisabled, { flex: 1, marginLeft: 10 }]}
                    disabled={!profissionalSelecionado}
                    onPress={() => setStep(3)}
                >
                    <Text style={styles.nextButtonText}>Avançar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPasso3 = () => (
        <ScrollView style={styles.stepContainer}>
            <Text style={styles.stepTitle}>3. Escolha Data e Horário</Text>

            <Text style={styles.sectionLabel}>Dias Disponíveis:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                {diasDisponiveis.map((dia) => (
                    <TouchableOpacity
                        key={dia}
                        style={[styles.pill, dataSelecionada === dia && styles.pillSelected]}
                        onPress={() => setDataSelecionada(dia)}
                    >
                        <Text style={[styles.pillText, dataSelecionada === dia && styles.textSelected]}>{dia}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Horários:</Text>
            <View style={styles.gridContainer}>
                {horarios.map((hora) => (
                    <TouchableOpacity
                        key={hora}
                        style={[styles.gridItem, horarioSelecionado === hora && styles.pillSelected]}
                        onPress={() => setHorarioSelecionado(hora)}
                    >
                        <Text style={[styles.pillText, horarioSelecionado === hora && styles.textSelected]}>{hora}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={[styles.buttonRow, { marginTop: 30 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextButton, (!dataSelecionada || !horarioSelecionado) && styles.buttonDisabled, { flex: 1, marginLeft: 10 }]}
                    disabled={!dataSelecionada || !horarioSelecionado}
                    onPress={() => setStep(4)}
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
                <Text style={styles.resumeValue}>{servicoSelecionado?.nome_servico}</Text>

                <Text style={styles.resumeLabel}>Profissional:</Text>
                <Text style={styles.resumeValue}>{profissionalSelecionado?.usuario?.nome}</Text>

                <Text style={styles.resumeLabel}>Data e Hora:</Text>
                <Text style={styles.resumeValue}>{dataSelecionada} às {horarioSelecionado}</Text>

                <View style={styles.divider} />

                <Text style={styles.resumeLabel}>Total a pagar no local:</Text>
                <Text style={styles.resumeTotal}>R$ {servicoSelecionado?.preco.toFixed(2).replace('.', ',')}</Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.confirmButton, { flex: 1, marginLeft: 10 }]}
                    onPress={confirmarAgendamento}
                >
                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && step === 1) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Preparando sua agenda...</Text>
            </View>
        );
    }

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
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#666',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    stepIndicator: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 5,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    cardItem: {
        backgroundColor: '#FFF',
        padding: 20, // Padding grande para facilitar o toque
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 2,
    },
    cardItemSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#E5F1FF',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    cardPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    textSelected: {
        color: '#007AFF',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 20,
    },
    nextButton: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    confirmButton: {
        backgroundColor: '#34C759', // Verde para confirmar
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#CCC',
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        backgroundColor: '#FFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#CCC',
        flex: 1,
    },
    backButtonText: {
        color: '#666',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 15,
        marginBottom: 10,
    },
    horizontalList: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    pill: {
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#CCC',
    },
    pillSelected: {
        backgroundColor: '#E5F1FF',
        borderColor: '#007AFF',
    },
    pillText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    gridItem: {
        backgroundColor: '#FFF',
        paddingVertical: 15,
        width: '30%', // Cabem 3 por linha
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CCC',
    },
    resumeCard: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        marginBottom: 20,
    },
    resumeLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    resumeValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#EAEAEA',
        marginVertical: 15,
    },
    resumeTotal: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#34C759',
    }
});