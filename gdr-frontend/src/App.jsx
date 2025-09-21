// src/App.jsx

import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { SocketContext } from './SocketContext.jsx';
import { MessagingProvider } from './components/MessagingContext';
import AuthPage from './components/AuthPage.jsx';
import GameLayout from './components/GameLayout.jsx';
import Gestione from './components/Gestione.jsx';
import MapContent from './components/MapContent.jsx';
import Forum from './components/Forum.jsx';
import BachecaPage from './components/BachecaPage.jsx'; 
import TopicPage from './components/TopicPage.jsx';   
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('gdr_token'));
  const [user, setUser] = useState(null);
  const socket = useContext(SocketContext);

  console.log("--- RENDER COMPONENTE APP --- Token attuale:", token);

  const handleLogout = () => {
    console.log("DEBUG APP: Eseguo il logout.");
    localStorage.removeItem('gdr_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    console.log("DEBUG APP: useEffect è stato eseguito. Controllo il token.");
    
    if (token) {
      console.log("DEBUG APP: Token trovato! Provo a connettere il socket.");
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);

        // Aggiungiamo log prima di ogni azione critica del socket
        console.log("DEBUG APP: Imposto il token di autenticazione per il socket.");
        socket.auth = { token };
        
        console.log("DEBUG APP: Chiamo socket.connect()...");
        socket.connect();
        
        console.log("DEBUG APP: Chiamata a socket.connect() eseguita.");

      } catch (error) {
        console.error("Token non valido, logout in corso:", error);
        handleLogout();
      }
    } else {
        console.log("DEBUG APP: Nessun token trovato. Salto la connessione del socket.");
    }

    return () => {
      if (socket.connected) {
        console.log("DEBUG APP: Eseguo la pulizia (cleanup) dello useEffect. Disconnetto il socket.");
        socket.disconnect();
      }
    };
  }, [token, socket]);

  const handleLoginSuccess = (newToken) => {
    console.log("DEBUG APP: Login riuscito! Aggiorno il token nello stato.");
    localStorage.setItem('gdr_token', newToken);
    setToken(newToken);
  };

  return (
    <div className="App">
      <Routes>
        {!token ? (
          <Route path="*" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          <Route 
            path="/" 
            element={
              <MessagingProvider>
                <GameLayout user={user} onLogout={handleLogout} />
              </MessagingProvider>
            }
          >
            <Route index element={<MapContent />} />
            <Route path="gestione" element={
              (['MOD', 'ADMIN'].includes(user?.permesso)) ? 
              <Gestione user={user} /> :
              <Navigate to="/" replace />
            } />
            <Route path="forum" element={<Forum />} />
            <Route path="forum/bacheca/:bachecaId" element={<BachecaPage user={user} />} />
            <Route path="forum/topic/:topicId" element={<TopicPage user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </div>
  );
}

export default App;