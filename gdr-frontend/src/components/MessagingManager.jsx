// src/components/MessagingManager.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { SocketContext } from '../SocketContext';
import ConversationList from './ConversationList';
import PrivateChatWindow from './PrivateChatWindow';
import api from '../api';

function MessagingManager({ isVisible, onClose }) {
    const socket = useContext(SocketContext);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // Contiene l'oggetto utente con cui si sta chattando
    const [unreadCounts, setUnreadCounts] = useState({});

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/pm/conversations');
            setConversations(res.data);
            const counts = res.data.reduce((acc, c) => {
                acc[c.id_utente] = c.unread_count;
                return acc;
            }, {});
            setUnreadCounts(counts);
        } catch (error) {
            console.error("Errore caricamento conversazioni:", error);
        }
    }, []);

    useEffect(() => {
        if (isVisible) {
            fetchConversations();
        }
    }, [isVisible, fetchConversations]);

    useEffect(() => {
        const handleNewMessage = (message) => {
            // Se la chat con quel mittente è attiva, non fare nulla (la finestra si aggiorna da sola)
            // Altrimenti, ricarica le conversazioni per mostrare il nuovo messaggio e aggiornare il contatore
            if (!activeChat || activeChat.id_utente !== message.sender_id) {
                 fetchConversations();
            }
        };
        socket.on('new_private_message', handleNewMessage);
        return () => socket.off('new_private_message', handleNewMessage);
    }, [socket, activeChat, fetchConversations]);

    const handleSelectConversation = (user) => {
        setActiveChat(user);
        // Resetta ottimisticamente il contatore
        setUnreadCounts(prev => ({...prev, [user.id_utente]: 0}));
    };
    
    const handleCloseChatWindow = () => {
        setActiveChat(null);
        fetchConversations(); // Ricarica per avere lo stato aggiornato
    }

    if (!isVisible) return null;

    return (
        <>
            <ConversationList
                conversations={conversations}
                onSelect={handleSelectConversation}
                unreadCounts={unreadCounts}
                onClose={onClose}
            />
            {activeChat && (
                <PrivateChatWindow
                    partner={activeChat}
                    onClose={handleCloseChatWindow}
                />
            )}
        </>
    );
}

export default MessagingManager;