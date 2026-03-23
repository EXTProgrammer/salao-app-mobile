import axios from 'axios';

const BASE_URL = 'http://191.4.96.124:8080/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;