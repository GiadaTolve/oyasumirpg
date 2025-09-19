import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { SocketContext } from './SocketContext.jsx';
import { MessagingProvider } from './components/MessagingContext'; // L'import è già corretto
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

  const handleLogout = () => {
    localStorage.removeItem('gdr_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        socket.auth = { token };
        socket.connect();
      } catch (error) {
        console.error("Token non valido, logout in corso:", error);
        handleLogout();
      }
    }
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [token, socket]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('gdr_token', newToken);
    setToken(newToken);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {!token ? (
            <Route path="*" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
          ) : (
            // L'elemento di questa rotta ora è il Provider che avvolge il Layout
            <Route 
              path="/" 
              element={
                <MessagingProvider>
                  <GameLayout user={user} onLogout={handleLogout} />
                </MessagingProvider>
              }
            >
              
              {/* Le rotte figlie rimangono invariate e funzioneranno correttamente */}
              
              <Route index element={<MapContent />} />
              
              <Route path="gestione" element={
  (['MOD', 'ADMIN'].includes(user?.permesso)) ? // <-- ORA CONTROLLA ANCHE MOD
    <Gestione user={user} /> :
    <Navigate to="/" replace />
} />

              {/* --- FORUM --- */}
              <Route path="forum" element={<Forum />} />
              <Route path="forum/bacheca/:bachecaId" element={<BachecaPage user={user} />} />
              <Route path="forum/topic/:topicId" element={<TopicPage user={user} />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;