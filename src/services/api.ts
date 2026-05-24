import axios from 'axios';

const BASE_URL = 'http://192.168.0.102:8080/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;