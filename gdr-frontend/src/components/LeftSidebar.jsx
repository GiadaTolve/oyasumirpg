import React, { useState, useEffect } from 'react';
import api from '../api';
import MusicPlayer from './MusicPlayer'; 
import { useMessaging } from './MessagingContext'; 

// --- STILI ---
// Ho aggiunto gli stili per i nuovi elementi in fondo a questo oggetto
const styles = {
  sidebar: {
    width: '250px',
    backgroundColor: 'rgba(30, 31, 33, 0.8)', 
    backgroundImage: 'url(/backgrounds/cloudy.png)',
    backgroundSize: 'cover',
    padding: '20px',
    color: '#bfc0d1',
    borderRight: '3px solid #31323e',
    position: 'relative',
    zIndex: 10
  },
  schedaButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #31323e',
      background: '#1e202c',
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer',
      color: '#bfc0d1',
      fontFamily: "'Work Sans', sans-serif",
      fontSize: '16px',
      fontWeight: 'bold',
  },
  schedaAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      marginRight: '15px',
      objectFit: 'cover'
  },
  schedaName: {
      fontWeight: 'bold',
      fontSize: '16px'
  },

  // --- NUOVI STILI ---
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '20px',
  },
  iconButton: {
    backgroundColor: '#2a292f',
    border: '1px solid #31323e',
    borderRadius: '3px',
    padding: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    textAlign: 'center',
    color: '#a4a5b9',
    fontSize: '11px',
    fontFamily: "'Work Sans', sans-serif",
    position: 'relative',
  },
  iconImage: {
    width: '24px',
    height: '24px',
    marginBottom: '5px',
    transition: 'filter 0.2s ease',
  },
  iconButtonActive: {
    // Stile per l'effetto "flash" al click
    transform: 'scale(0.95)',
    filter: 'drop-shadow(0 0 8px #c8a2c8)',
  },
  newsVisor: {
    width: '100%',
    height: '120px',
    margin: '15px 0',
    backgroundColor: 'black',
    border: '1px solid #31323e',
    fontFamily: "arcade",
    borderRadius: '3px',
    padding: '8px 12px',
    boxSizing: 'border-box',
    lineheight: "2px",
    overflow: 'hidden',
    display: 'flex', // Centra verticalmente il contenuto
    alignItems: 'center',
    textAlign: 'justify',
  },
  newsContent: {
    color: '#a4a5b9',
    fontSize: '13px',
    width: '100%',
    // Applica l'animazione che abbiamo creato
    animation: 'news-fade-in-out 5s ease-in-out infinite',
  },
  newsTitleBold: {
    color: '#9E23C2', // Testo del titolo più chiaro per contrasto
    fontWeight: 'bold',
  },

  newsTimestamp: {
    fontSize: '9px',
    color: '#888', // Un grigio scuro per non dare troppo nell'occhio
    marginBottom: '2px',
    textAlign: 'center',
  },
}

// --- NUOVO SOTTOCOMPONENTE PER IL VISORE DI NOTIZIE ---
const NewsVisor = () => {
    const [topics, setTopics] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
  
    // Funzione per formattare la data
    const formatTimestamp = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return `[ ${day}/${month}/${year} / ${time} ]`;
    };
  
    useEffect(() => {
      // !!! Assicurati che '1' sia l'ID corretto della tua bacheca "ON GAME" !!!
      const ON_GAME_BACHECA_ID = 1; 
  
      const fetchTopics = async () => {
        try {
          const response = await api.get(`/forum/bacheca/${ON_GAME_BACHECA_ID}/latest-topics`);
          setTopics(response.data);
        } catch (error) { console.error("Errore caricamento notizie:", error); }
      };
      fetchTopics();
    }, []);
  
    useEffect(() => {
      if (topics.length === 0) return;
      const timer = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % topics.length);
      }, 5000);
      return () => clearInterval(timer);
    }, [topics]);
  
    const currentTopic = topics[currentIndex];
  
    return (
      <div style={styles.newsVisor}>
        {currentTopic ? (
          <div key={currentIndex} style={styles.newsContent}>
            {/* Elemento aggiunto per la data */}
            <div style={styles.newsTimestamp}>{formatTimestamp(currentTopic.timestamp_creazione)}</div>
            
            <div> {/* Contenitore per titolo e anteprima */}
              <strong style={styles.newsTitleBold}>[ {currentTopic.titolo} ]</strong>
              <span> {currentTopic.anteprima}</span>
            </div>
          </div>
        ) : (
          <div style={{...styles.newsContent, animation: 'none'}}>Caricamento notizie...</div>
        )}
      </div>
    );
  };
  


  const SidebarIconButton = ({ label, iconSrc, onClick }) => { 
    const [isActive, setIsActive] = useState(false); 
    const handleClick = () => { 
      setIsActive(true); 
      setTimeout(() => setIsActive(false), 200);
      if (onClick) { // Esegue la funzione passata, se esiste
        onClick();
      }
    }; 
    const buttonStyle = { ...styles.iconButton, ...(isActive ? styles.iconButtonActive : {}) }; 
    return ( <button style={buttonStyle} onClick={handleClick}> <img src={iconSrc} alt={label} style={styles.iconImage} /> {label} </button> ); 
  }; 
  
  // --- COMPONENTE PRINCIPALE --- 
  // --- MODIFICATO: Ora riceve 'onToggleBanca' ---
  function LeftSidebar({ onToggleScheda, onToggleMessages, onToggleBanca }) { 
    const { isFlashing } = useMessaging(); 
    const [schedaBreve, setSchedaBreve] = useState(null); 
  
    useEffect(() => { 
        const fetchSchedaBreve = async () => { 
            try { 
                const response = await api.get('/scheda'); 
                setSchedaBreve(response.data); 
            } catch (err) { console.error("Errore caricamento dati per sidebar", err); } 
        }; 
        fetchSchedaBreve(); 
    }, []); 
  
    if (!schedaBreve) { return <aside style={styles.sidebar}>Caricamento...</aside>; } 
  
    const iconPath = "/buttons/bottoni-colonna-sx/smokemagic.png"; 
  
    return ( 
        <aside style={styles.sidebar}> 
            <button style={styles.schedaButton} onClick={onToggleScheda} title="Apri/Chiudi Scheda Personaggio"> 
                <img src={schedaBreve.avatar_chat || '/icone/mini_avatar.png'} alt="Avatar" style={styles.schedaAvatar} /> 
                <span style={styles.schedaName}>{schedaBreve.nome_pg}</span> 
            </button> 
            <hr style={{borderColor: '#31323e', margin: '20px 0'}}/> 
            <MusicPlayer /> 
            <div style={styles.iconGrid}> 
              <button style={styles.iconButton} className={isFlashing ? 'new-message-flash' : ''} onClick={onToggleMessages} title="Messaggi Privati"> 
                <img src="/buttons/bottoni-colonna-sx/message.png" alt="Messaggi" style={styles.iconImage} /> 
                Messaggi 
              </button> 
              {/* --- MODIFICATO: Passa la funzione onClick al bottone della banca --- */}
              <SidebarIconButton label="Banca" iconSrc={iconPath} onClick={onToggleBanca} /> 
              <SidebarIconButton label="Mercato" iconSrc={iconPath} /> 
            </div> 
            <NewsVisor /> 
            <div style={styles.iconGrid}> 
              <SidebarIconButton label="Skills" iconSrc={iconPath} /> 
              <SidebarIconButton label="Madosho" iconSrc={iconPath} /> 
              <SidebarIconButton label="Bestiario" iconSrc={iconPath} /> 
            </div> 
        </aside> 
      ); 
  } 
  
  export default LeftSidebar;