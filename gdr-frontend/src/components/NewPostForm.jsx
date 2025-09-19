import React, { useRef } from 'react';
import api from '../api';

const styles = {
    form: { marginTop: '20px', padding: '20px', backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid #31323e', borderRadius: '5px' },
    bbcodePanel: { background: '#3c3c3c', border: '1px solid #555', borderBottom: 'none', padding: '5px', display: 'flex', gap: '5px' },
    bbcodeButton: { background: '#555', border: '1px solid #666', color: 'white', cursor: 'pointer', padding: '5px 10px' },
    textarea: { 
        width: '100%', 
        boxSizing: 'border-box', 
        padding: '5px', 
        background: '#3c3c3c', 
        border: '1px solid #555', 
        color: 'white', 
        borderRadius: '0 0 4px 4px', 
        // --- MODIFICA APPLICATA QUI ---
        minHeight: '00px', // Ridotto da 150px a 100px
        fontFamily: 'inherit', 
        fontSize: '1rem' 
    },
    button: { marginTop: '10px', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#60519b', color: 'white', fontWeight: 'bold' },
};

function NewPostForm({ topicId, text, setText, isSubmitting, setIsSubmitting, error, setError, onSubmit, formRef }) {
    const textareaRef = useRef(null);

    const applyBBCode = (tag) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = text.substring(start, end);
        const newText = `${text.substring(0, start)}[${tag}]${selectedText}[/${tag}]${text.substring(end)}`;
        setText(newText);
        textarea.focus();
    };

    return (
        <form onSubmit={onSubmit} style={styles.form} ref={formRef}>
          
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={styles.bbcodePanel}>
                <button type="button" style={styles.bbcodeButton} onClick={() => applyBBCode('b')}><b>B</b></button>
                <button type="button" style={styles.bbcodeButton} onClick={() => applyBBCode('i')}><i>I</i></button>
                <button type="button" style={styles.bbcodeButton} onClick={() => applyBBCode('u')}><u>U</u></button>
            </div>
            <textarea
                ref={textareaRef}
                style={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Scrivi qui..."
                required
            />
            <button type="submit" style={styles.button} disabled={isSubmitting}>
                {isSubmitting ? 'Invio...' : 'Invia Risposta'}
            </button>
        </form>
    );
}

export default NewPostForm;