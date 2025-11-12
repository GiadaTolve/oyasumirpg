import axios from 'axios';

// 1. Definiamo l'URL di base SENZA /api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 2. Creiamo l'istanza di Axios
const api = axios.create({
  // 3. Aggiungiamo /api al baseURL in modo programmatico
  baseURL: `${BASE_URL}/api`
});

// Questo codice aggiunge automaticamente il token di autenticazione
// a ogni richiesta dopo che hai fatto il login.
api.interceptors.request.use(config => {
  const token = localStorage.getItem('gdr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;