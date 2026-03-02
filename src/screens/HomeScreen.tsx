import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function HomeScreen() {
    const { signOut, user } = useAuth();

    // DEBUG: Vamos ver quem é esse usuário no terminal do WebStorm
    console.log(">>> DADOS DO USUÁRIO NA HOME:", user);

    function handleSignOut() {
        console.log(">>> Botão Sair pressionado!");
        signOut();
    }

    return (
        <View style={styles.container}>
            {/* O '?' evita erro se o nome for nulo */}
            <Text style={styles.title}>Bem-vindo, {user?.nome || 'Visitante'}!</Text>

            <Text style={styles.subtitle}>ID: {user?.id}</Text>
            <Text style={styles.subtitle}>Email: {user?.email}</Text>
            <Text style={styles.subtitle}>Role: {user?.role}</Text>

            <View style={styles.buttonContainer}>
                <Button title="Sair (Logout)" onPress={handleSignOut} color="red" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 5,
        color: '#666'
    },
    buttonContainer: {
        marginTop: 30,
        width: '100%'
    }
});