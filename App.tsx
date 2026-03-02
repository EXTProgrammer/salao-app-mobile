import React from 'react';
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";

import { AuthProvider } from "./src/context/AuthContext";
import { Routes } from "./src/routes";

function App() {
    return (
        <NavigationContainer>
            <AuthProvider>
                <StatusBar style="auto" />
                <Routes />
            </AuthProvider>
        </NavigationContainer>
    );
}
export default App;