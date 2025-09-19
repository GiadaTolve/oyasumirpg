// src/components/AuthPage.jsx

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Guida from './Guida';
import Ambientazione from './Ambientazione';

import '../Login.css'; 

function AuthPage({ onLoginSuccess }) {
  const [activeView, setActiveView] = useState('LOGIN');
  const [activeModal, setActiveModal] = useState(null);

  const handleRegisterSuccess = () => {
    setActiveView('LOGIN');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'REGISTER':
        return <RegisterForm onRegisterSuccess={handleRegisterSuccess} />;
      case 'LOGIN':
      default:
        return <LoginForm onLogin={onLoginSuccess} />;
    }
  };
  
  const handleCloseModal = () => setActiveModal(null);

  return (
    <div className="login-page-container">
      <div className="login-background"></div>
      <div className="login-overlay"></div>

      <div className="main-content-wrapper">
        <header className="login-header">
            <div className="title-container">
                <div className="gold-title-effect">Oyasumi</div>
                <p className="header-motto">LA REALTA' E' SOLO UN SOGNO CHE SANGUINA.</p>
            </div>

            <nav className="login-main-nav">
                <button className="button-style" onClick={() => { setActiveView('LOGIN'); handleCloseModal(); }}>Login</button>
                <button className="button-style" onClick={() => { setActiveView('REGISTER'); handleCloseModal(); }}>Iscriviti</button>
                <button className="button-style" onClick={() => setActiveModal('GUIDE')}>Guida</button>
                <button className="button-style" onClick={() => setActiveModal('LORE')}>Ambientazione</button>
            </nav>
        </header>

        {/* === LOGICA DI VISUALIZZAZIONE MODIFICATA === */}
        {/* Se un modale è attivo, lo mostriamo al posto del pannello centrale */}
        {activeModal ? (
            activeModal === 'GUIDE' 
                ? <Guida onClose={handleCloseModal} /> 
                : <Ambientazione onClose={handleCloseModal} />
        ) : (
            // Altrimenti, mostriamo il pannello standard di login/registrazione
            <div className="dynamic-content-panel">
                {renderActiveView()}
            </div>
        )}

        <footer className="login-footer">
          <p>Crediti & PEGI</p>
        </footer>
      </div>
    </div>
  );
}

export default AuthPage;