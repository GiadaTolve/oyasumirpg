import React from 'react';
import TextParser from './TextParser.jsx';

// --- STILI AGGIORNATI E COMPLETI ---
// Questi stili implementano il nuovo layout che hai richiesto
const styles = {
  // Contenitore principale del messaggio, ora occupa tutta la larghezza
  messageContainer: { 
    width: '100%',
    marginBottom: '25px', // Spazio tra un messaggio e l'altro
    color: '#a4a5b9', // Colore del testo di base
  },
  // Header del messaggio: contiene data, nome e luogo
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#bfc0d1', // Colore più chiaro per le informazioni importanti
  },
  timestamp: {
    marginRight: '10px',
    fontSize: '11px',
    color: '#888', // Grigio per l'orario
  },
  author: { 
    fontWeight: 'bold', 
    marginRight: '10px',
  },
  luogoTag: {
    backgroundColor: 'rgba(96, 81, 155, 0.4)', // Sfondo viola semitrasparente
    border: '1px solid #60519b', // Bordo viola
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  // Contenitore per il contenuto principale (avatar e testo)
  content: { 
    // Questa proprietà CSS moderna permette di contenere elementi "fluttuanti" (come l'avatar)
    // senza bisogno di altri hack.
    display: 'flow-root', 
  },
  // Nuovo stile per l'avatar, come da tue specifiche
  avatar: { 
    width: '120px',
    height: '50px', 
    borderRadius: '8px', 
    marginRight: '15px', 
    marginBottom: '5px', // Aggiunge un piccolo spazio sotto l'avatar
    border: '2px solid #60519b', // Bordo viola, come richiesto
    objectFit: 'cover', // Assicura che l'immagine riempia lo spazio
    float: 'left', // La magia: l'avatar "galleggia" a sinistra e il testo gli scorre accanto
  },
  // Stile per il blocco di testo
  text: { 
    margin: 0, 
    lineHeight: '1.6', 
    whiteSpace: 'pre-wrap', // Mantiene gli "a capo" e gli spazi multipli
    wordBreak: 'break-word', // Va a capo se una parola è troppo lunga
  },
  // Stili speciali per DADO, MASTERSCREEN e GLOBALE (invariati)
  dado: { 
    padding: '10px', 
    backgroundColor: 'rgba(49, 50, 60, 0.5)', 
    borderLeft: '3px solid #60519b', 
    color: '#bfc0d1', 
    fontWeight: 'bold' 
  },
  masterscreen: { 
    border: '1px dashed #60519b', 
    padding: '10px', 
    color: '#bfc0d1', 
    fontStyle: 'italic' 
  },
  globale: { 
    border: '2px solid #60519b', 
    padding: '10px', 
    color: '#bfc0d1', 
    fontWeight: 'bold', 
    textAlign: 'center', 
    margin: '15px 0' 
  },
};

// Funzione helper per formattare la data e l'ora
const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Estrae solo l'ora e i minuti in formato HH:MM
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

function ChatMessage({ msg }) {
  // Gestione speciale per il MESSAGGIO GLOBALE (rimane a sé stante)
  if (msg.tipo === 'globale') {
    return (
      <div style={styles.globale}>
        <strong>[MESSAGGIO GLOBALE di {msg.autore}]</strong>
        <p style={{margin: '5px 0 0 0', fontWeight: 'normal'}}>{msg.testo}</p>
      </div>
    );
  }

  // NUOVO LAYOUT per tutti gli altri tipi di messaggio
  return (
    <div style={styles.messageContainer}>
        {/* Riga 1: Header con metadata (orario, autore, luogo) */}
        <div style={styles.header}>
            <span style={styles.timestamp}>{formatTimestamp(msg.timestamp)}</span>
            <span style={styles.author}>{msg.autore}</span>
            {/* Qui puoi aggiungere i simboli del PG se li hai in una variabile */}
            {msg.luogo && msg.luogo.trim() !== '' && (
                <span style={styles.luogoTag}>[{msg.luogo}]</span>
            )}
        </div>

        {/* Riga 2: Contenuto principale con avatar flottante e testo */}
        <div style={styles.content}>
            <img 
                // Usa l'avatar specifico del messaggio se esiste, altrimenti un'immagine di default
                src={msg.avatar_url || '/icone/mini_avatar.png'} 
                alt={msg.autore} 
                style={styles.avatar}
            />
            {/* Il div del testo ora eredita lo stile base più quello specifico del tipo */}
            <div style={{...styles.text, ...styles[msg.tipo]}}>
                {msg.tipo === 'dado' && '🎲 '}
                {msg.tipo === 'masterscreen' && <strong>[MASTERSCREEN] </strong>}
                <TextParser text={msg.testo} />
            </div>
        </div>
    </div>
  );
}

export default ChatMessage;
