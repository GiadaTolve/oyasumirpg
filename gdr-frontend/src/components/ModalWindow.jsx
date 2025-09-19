import React, { useState, useEffect, useRef, useCallback } from 'react';

// Stili aggiornati con le nuove richieste
const styles = {
  window: {
    position: 'absolute',
    width: '1600px',
    height: '810px',
    backgroundColor: '#242424', 
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    // Rimuoviamo i bordi e l'ombra precedenti per far spazio alla nuova cornice
    overflow: 'hidden', 
  },
  header: {
    padding: '10px 30px',
    height: '50px',
    cursor: 'move',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative', // Necessario per posizionare lo sfondo e il contenuto
    zIndex: 10, // Assicura che l'header sia sopra il contenuto ma sotto la cornice
    overflow: 'hidden', // Nasconde le parti dell'immagine di sfondo che escono
  },
  // Div per lo sfondo dell'header, permette di capovolgerlo senza toccare il testo
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // 2. Immagine di sfondo per l'header
    backgroundImage: 'url(/backgrounds/cloudy.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // 2. L'immagine viene capovolta verticalmente
    transform: 'scaleY(-1)',
    zIndex: 1, // Sta dietro al testo
  },
  // Contenitore per il titolo e il pulsante, per metterli sopra lo sfondo
  headerContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    color: '#E6E0FF', // Un colore che risalti
  },
  title: {
    // 2. Titolo in maiuscolo, come in AuthPage
    fontFamily: "'Gothicha'",
    textTransform: 'uppercase',
    fontSize: '1.2em',
    // Aggiungiamo un leggero effetto neon per coerenza
    textShadow: '0 0 5px #c0a8ff, 0 0 10px #c0a8ff',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#E6E0FF',
    fontSize: '2rem',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    lineHeight: '1.7',
    color: '#bfc0d1',
    // Aggiungiamo un padding per non far finire il testo sotto la cornice
    padding: '25px 60px',
  },
  // 3. Stili per la cornice dorata
  frame: {
    position: 'absolute',
    zIndex: 20, // La cornice sta sopra a tutto
    pointerEvents: 'none', // Permette di cliccare attraverso la cornice
    backgroundRepeat: 'no-repeat',
  },
  frameTop: {
    top: 0,
    left: 0,
    right: 0,
    height: '5px', // Altezza della cornice, regolabile
    backgroundImage: 'url(/frames/top.frame.png)',
    backgroundSize: '100% 100%',
  },
  frameBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: '5px',
    backgroundImage: 'url(/frames/top.frame.png)',
    backgroundSize: '100% 100%',
    transform: 'scaleY(-1)', // Capovolgiamo l'immagine per il lato inferiore
  },
  frameLeft: {
    top: 0,
    bottom: 0,
    left: 0,
    width: '5px', // Larghezza della cornice, regolabile
    backgroundImage: 'url(/frames/lateral.frame.png)',
    backgroundSize: '100% 100%',
  },
  frameRight: {
    top: 0,
    bottom: 0,
    right: 0,
    width: '5px',
    backgroundImage: 'url(/frames/lateral.frame.png)',
    backgroundSize: '100% 100%',
    transform: 'scaleX(-1)', // Capovolgiamo l'immagine per il lato destro
  }
};

function ModalWindow({ title, onClose, children }) {
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const windowWidth = 1600;
    const windowHeight = 810;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    setPosition({
      x: (screenWidth - windowWidth) / 2,
      y: (screenHeight - windowHeight) / 1.2,
    });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!position) return null;

  return (
    <div style={{ ...styles.window, left: `${position.x}px`, top: `${position.y}px` }}>
      {/* Elementi della cornice */}
      <div style={{...styles.frame, ...styles.frameTop}}></div>
      <div style={{...styles.frame, ...styles.frameBottom}}></div>
      <div style={{...styles.frame, ...styles.frameLeft}}></div>
      <div style={{...styles.frame, ...styles.frameRight}}></div>

      <div style={styles.header} onMouseDown={handleMouseDown}>
        <div style={styles.headerBackground}></div>
        <div style={styles.headerContent}>
          <span style={styles.title}>{title}</span>

          <button style={styles.closeButton} className="modal-close-button" onClick={onClose}>×</button>
        </div>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}

export default ModalWindow;