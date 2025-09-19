// src/components/PrivateChatWindow.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { SocketContext } from '../SocketContext';
import api from '../api';

// --- STILI ---
const styles = {
    window: { position: 'fixed', bottom: '20px', right: '640px', width: '380px', height: '500px', backgroundColor: '#121212', border: '1px solid #31323e', borderRadius: '8px', zIndex: 160, display: 'flex', flexDirection: 'column', boxShadow: '0 5px 20px rgba(0,0,0,0.5)', color: '#bfc0d1' },
    header: { padding: '12px', backgroundColor: '#1e202c', borderBottom: '1px solid #31323e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e6e0ff', fontWeight: 'bold' },
    messages: { flexGrow: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    inputArea: { padding: '10px', borderTop: '1px solid #31323e', backgroundColor: '#1e202c' },
    inputForm: { display: 'flex', gap: '10px' },
    input: { flexGrow: 1, background: '#31323e', border: '1px solid #4a4b57', color: '#bfc0d1', padding: '10px', borderRadius: '5px', resize: 'none', fontFamily: 'inherit' },
    messageBubble: { maxWidth: '80%', padding: '8px 12px', borderRadius: '15px', marginBottom: '10px', wordBreak: 'break-word', lineHeight: '1.4' },
    myMessage: { backgroundColor: '#60519b', color: 'white', alignSelf: 'flex-end' },
    theirMessage: { backgroundColor: '#31323e', color: '#bfc0d1', alignSelf: 'flex-start' },
};

function PrivateChatWindow({ partner, onClose }) {
    const socket = useContext(SocketContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const myId = JSON.parse(atob(localStorage.getItem('gdr_token').split('.')[1])).id;

    // Funzione per scrollare in fondo alla chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(scrollToBottom, [messages]);

    // Carica la cronologia dei messaggi quando la finestra si apre
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/pm/conversation/${partner.id_utente}`);
                setMessages(res.data);
            } catch (error) { console.error("Errore caricamento cronologia:", error); }
        };
        fetchHistory();
    }, [partner.id_utente]);

    // Si mette in ascolto di nuovi messaggi in tempo reale
    useEffect(() => {
        const handleNewMessage = (message) => {
            // Aggiunge il messaggio solo se appartiene a questa conversazione
            if (message.sender_id === partner.id_utente || message.receiver_id === partner.id_utente) {
                setMessages(prev => [...prev, message]);
            }
        };
        socket.on('new_private_message', handleNewMessage);
        socket.on('private_message_sent', handleNewMessage); // Ascolta anche la conferma di invio
        return () => {
            socket.off('new_private_message', handleNewMessage);
            socket.off('private_message_sent', handleNewMessage);
        };
    }, [socket, partner.id_utente]);
    
    // Invia un nuovo messaggio
    const handleSend = (e) => {
        e.preventDefault(); // Previene il ricaricamento della pagina
        if (newMessage.trim()) {
            socket.emit('send_private_message', {
                receiverId: partner.id_utente,
                text: newMessage,
            });
            setNewMessage('');
        }
    };

    return (
        <div style={styles.window}>
            <div style={styles.header}>
                <span>Conversazione con {partner.nome_pg}</span>
                <button onClick={onClose} style={{background: 'none', border: 'none', color: '#e6e0ff', fontSize: '1.2em', cursor: 'pointer'}}>×</button>
            </div>
            <div style={styles.messages}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ ...styles.messageBubble, ...(msg.sender_id === myId ? styles.myMessage : styles.theirMessage) }}>
                        {msg.text}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputArea}>
                <form onSubmit={handleSend} style={styles.inputForm}>
                    <textarea
                        style={styles.input}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Scrivi un messaggio..."
                        rows="2"
                    />
                    <button type="submit" className="button-style">Invia</button>
                </form>
            </div>
        </div>
    );
}

export default PrivateChatWindow;