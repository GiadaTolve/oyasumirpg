import axios from 'axios';

// Creiamo un'istanza di Axios con una configurazione centralizzata
const api = axios.create({
  // QUESTA RIGA È LA SOLUZIONE
  // Assicura che ogni chiamata inizi con l'indirizzo corretto + /api
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
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