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
import api from '../services/api';

// Tipagem baseada na Entidade Profissional do Java
// Assumimos que o Java devolve o objeto aninhado (profissional com o usuário dentro)
interface UsuarioInfo {
    nome: string;
}

interface Profissional {
    id: number;
    usuario: UsuarioInfo;
    especialidades: string[];
}

export function ProfessionalsScreen() {
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        buscarProfissionais();
    }, []);

    async function buscarProfissionais() {
        try {
            const response = await api.get('/profissionais');
            setProfissionais(response.data);
        } catch (error) {
            console.log("Erro ao buscar profissionais:", error);
            Alert.alert("Erro", "Não foi possível carregar a equipe do salão.");
        } finally {
            setLoading(false);
        }
    }

    const renderItem = ({ item }: { item: Profissional }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                {/* Avatar Placeholder */}
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.cardTitle}>{item.usuario?.nome || 'Profissional'}</Text>
                    <Text style={styles.cardSubtitle}>Especialista</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Especialidades:</Text>
            <View style={styles.badgesContainer}>
                {item.especialidades && item.especialidades.length > 0 ? (
                    item.especialidades.map((esp, index) => (
                        <View key={index} style={styles.badge}>
                            <Text style={styles.badgeText}>{esp}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noSpecialtyText}>Nenhuma especialidade registada.</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>A Nossa Equipe</Text>
                <Text style={styles.subtitle}>Conheça os nossos especialistas</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : profissionais.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Nenhum profissional disponível no momento.</Text>
                </View>
            ) : (
                <FlatList
                    data={profissionais}
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
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E5F1FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#999',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8, // Espaçamento entre os badges
    },
    badge: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    badgeText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
    },
    noSpecialtyText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    }
});