import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api'; // A nossa instância do Axios configurada com o Token

// Definimos o tipo de dado que esperamos receber do Java
interface Servico {
    id: number;
    nome_servico: string;
    descricao: string;
    preco: number;
    duracaoMin: number;
}

export function ServicesScreen() {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);

    // O useEffect corre assim que a tela abre, para buscar os dados
    useEffect(() => {
        buscarServicos();
    }, []);

    async function buscarServicos() {
        try {
            // Faz o pedido GET ao nosso back-end (certifique-se que esta rota existe no Java)
            const response = await api.get('/servicos');
            setServicos(response.data);
        } catch (error) {
            console.log("Erro ao buscar serviços:", error);
            Alert.alert("Erro", "Não foi possível carregar os serviços do salão.");
        } finally {
            setLoading(false); // Pára a rodinha de loading, quer dê erro ou sucesso
        }
    }

    // Função que diz como cada "cartão" de serviço deve ser desenhado
    const renderItem = ({ item }: { item: Servico }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nome_servico}</Text>
                <Text style={styles.cardPrice}>
                    {/* Formata o preço para Reais/Euros dependendo da sua moeda */}
                    R$ {item.preco.toFixed(2).replace('.', ',')}
                </Text>
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>
                {item.descricao}
            </Text>

            <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.cardDuration}>{item.duracaoMin} min</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Nossos Serviços</Text>
                <Text style={styles.subtitle}>Escolha o que deseja fazer hoje</Text>
            </View>

            {/* Se estiver a carregar, mostra a rodinha. Senão, mostra a lista. */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : servicos.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="sad-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
                </View>
            ) : (
                <FlatList
                    data={servicos}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Sombra no Android
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1, // Para o título não empurrar o preço para fora do ecrã
    },
    cardPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardDuration: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
    }
});