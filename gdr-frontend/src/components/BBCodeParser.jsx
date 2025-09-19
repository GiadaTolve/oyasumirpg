// src/components/BBCodeParser.jsx
import React from 'react';

// Stili per i nostri tag BBCode
const styles = {
    quote: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderLeft: '4px solid #60519b',
        padding: '10px 15px',
        margin: '10px 0',
        borderRadius: '4px',
    },
    quoteAuthor: {
        fontWeight: 'bold',
        fontSize: '0.9em',
        marginBottom: '5px',
    }
};

function BBCodeParser({ text }) {
    if (!text) return null;

    // Questa espressione regolare trova tutti i nostri tag
    const regex = /\[(b|i|u)\](.*?)\[\/\1\]|\[quote=(.*?)\](.*?)\[\/quote\]/gs;

    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Aggiungi il testo normale prima del tag
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const [fullMatch, simpleTag, simpleText, quoteAuthor, quoteText] = match;

        if (simpleTag) {
            // Gestisce [b], [i], [u]
            switch (simpleTag) {
                case 'b': parts.push(<b>{simpleText}</b>); break;
                case 'i': parts.push(<i>{simpleText}</i>); break;
                case 'u': parts.push(<u>{simpleText}</u>); break;
                default: break;
            }
        } else if (quoteAuthor) {
            // Gestisce [quote=...]
            parts.push(
                <blockquote style={styles.quote}>
                    <div style={styles.quoteAuthor}>{quoteAuthor} ha scritto:</div>
                    {/* Usiamo la ricorsione per parsare il testo dentro la citazione! */}
                    <BBCodeParser text={quoteText} />
                </blockquote>
            );
        }

        lastIndex = regex.lastIndex;
    }

    // Aggiungi il testo rimanente dopo l'ultimo tag
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}</>;
}

export default BBCodeParser;