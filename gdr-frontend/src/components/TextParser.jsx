import React from 'react';

// Definiamo i nostri stili per i tag speciali
const styles = {
  spoken: {
    fontStyle: 'italic',
    color: '#60519b', // <-- NUOVO COLORE VIOLA!
    fontWeight: 'bold',
  },
  tag: {
    fontWeight: 'bold',
    color: '#bfc0d1', // Usiamo il colore chiaro per i tag
  },
};

function TextParser({ text }) {
  // Questa è la nostra "formula magica" (Regular Expression)
  // Cerca qualsiasi testo tra <...> o [...]
  const regex = /(<[^>]+>|\[[^\]]+\])/g;

  // Suddivide il testo in un array, separando i tag dal resto
  const parts = text.split(regex).filter(part => part);

  return (
    <span>
      {parts.map((part, index) => {
        // Controlla se è testo parlato
        if (part.startsWith('<') && part.endsWith('>')) {
          // Rimuovi < e > e applica lo stile
          return <span key={index} style={styles.spoken}>«{part.slice(1, -1)}»</span>;
        }
        // Controlla se è un tag
        if (part.startsWith('[') && part.endsWith(']')) {
          // Applica lo stile
          return <span key={index} style={styles.tag}>{part}</span>;
        }
        // Altrimenti, è testo normale
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default TextParser;