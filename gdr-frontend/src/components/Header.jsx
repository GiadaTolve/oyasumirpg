import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

// Aggiunte le nuove props onToggle...
function Header({ user, onLogout, onToggleGuida, onToggleAmbientazione, onToggleShinigami }) {
  const [activeBanner, setActiveBanner] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await api.get('/active-banner');
        setActiveBanner(response.data);
      } catch (error) {
        console.error("Errore nel caricare il banner:", error);
      }
    };

    fetchBanner();
  }, []);

  return (
    <header className="game-header">
      {/* --- BANNER EVENTO (mostrato solo se attivo) --- */}
      {activeBanner ? (
        <a href={activeBanner.link_url || '#'} target="_blank" rel="noopener noreferrer" className="event-banner-container">
          <img src={activeBanner.image_url} alt={activeBanner.title} className="event-banner-image" />
          <span className="event-banner-title">{activeBanner.title}</span>
        </a>
      ) : (
        <div style={{ width: '300px' }}></div> /* Segnaposto per mantenere il layout bilanciato */
      )}

<div className="title-container">
  <div className="gold-title-effect">Oyasumi</div>
  <p className="header-motto">LA REALTA' E' SOLO UN SOGNO CHE SANGUINA.</p>
</div>

      {/* Bottoni a destra */}
      <div className="header-actions">
        <Link to="/" className="header-btn">
          Mappa
        </Link>
        
        {/* Nuovi bottoni per le finestre flottanti */}
        <button onClick={onToggleGuida} className="header-btn">
          Guida
        </button>
        <button onClick={onToggleAmbientazione} className="header-btn">
          Ambientazione
        </button>

        <Link to="/forum" className="header-btn">
          Forum
        </Link>
        
        {(['MASTER', 'MOD', 'ADMIN'].includes(user?.permesso)) && (
          <>
            <button onClick={onToggleShinigami} className="header-btn">
              Shinigami
            </button>
            <Link to="/gestione" className="header-btn">
              Gestione
            </Link>
          </>
        )}
        
        <button onClick={onLogout} className="header-btn">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;