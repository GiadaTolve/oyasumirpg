// src/components/NewTopicForm.jsx
import React, { useState, useRef } from 'react';
import api from '../api';

const styles = {
    // ... (stili esistenti)
    bbcodePanel: { background: '#3c3c3c', border: '1px solid #555', borderBottom: 'none', padding: '5px', display: 'flex', gap: '5px' },
    bbcodeButton: { background: '#555', border: '1px solid #666', color: 'white', cursor: 'pointer', padding: '5px 10px' },
    textarea: { width: '100%', boxSizing: 'border-box', padding: '10px', background: '#3c3c3c', border: '1px solid #555', color: 'white', borderRadius: '0 0 4px 4px', minHeight: '250px', fontFamily: 'inherit', fontSize: '1rem' },
};

function NewTopicForm({ bachecaId, onTopicCreated, onCancel }) {
    const [titolo, setTitolo] = useState('');
    const [testo, setTesto] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);

    const applyBBCode = (tag) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = testo.substring(start, end);
        const newText = `${testo.substring(0, start)}[${tag}]${selectedText}[/${tag}]${testo.substring(end)}`;
        setTesto(newText);
        textarea.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/forum/topics', { bacheca_id: bachecaId, titolo, testo });
            onTopicCreated();
        } catch (err) {
            setError(err.response?.data?.message || "Si è verificato un errore.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{...styles.overlay, zIndex: 300}} onClick={onCancel}>
            <div style={{...styles.formContainer, width: 'clamp(300px, 80%, 900px)'}} onClick={e => e.stopPropagation()}>
                <h2>Nuova Discussione</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div style={{...styles.formGroup, marginBottom: '20px'}}>
                        <label htmlFor="titolo" style={styles.label}>Titolo:</label>
                        <input type="text" id="titolo" value={titolo} onChange={e => setTitolo(e.target.value)} style={{...styles.input, borderRadius: '4px'}} required />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Contenuto:</label>
                        <div style={styles.bbcodePanel}>
                            <button type="button" style={styles.bbcodeButton} onClick={() => applyBBCode('b')}><b>B</b></button>
                            <button type="button" style={styles.bbcodeButton} onClick={() => applyBBCode('i')}><i>I</i></button>
                            <button type="button" style={styles.bbcodeButton} onClick={() => applyBBCode('u')}><u>U</u></button>
                        </div>
                        <textarea ref={textareaRef} id="testo" value={testo} onChange={e => setTesto(e.target.value)} style={styles.textarea} required></textarea>
                    </div>
                    <div>
                        <button type="submit" style={{...styles.button, padding: '12px 20px'}} disabled={isSubmitting}>
                            {isSubmitting ? 'Pubblicazione...' : 'Pubblica Discussione'}
                        </button>
                        <button type="button" onClick={onCancel} style={{...styles.button, marginLeft: '10px', backgroundColor: '#555'}}>Annulla</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewTopicForm;