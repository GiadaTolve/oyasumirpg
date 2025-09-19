// src/components/MessagingContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SocketContext } from '../SocketContext';

// Creazione del contesto
const MessagingContext = createContext();

// Hook personalizzato per un accesso più semplice
export const useMessaging = () => useContext(MessagingContext);

// Provider che conterrà tutta la logica
export const MessagingProvider = ({ children }) => {
    const socket = useContext(SocketContext);
    const [isFlashing, setIsFlashing] = useState(false);
    
    // Usiamo useRef per l'audio per evitare di ricrearlo a ogni render
    const notificationSound = useRef(null);
    useEffect(() => {
        // Inizializziamo l'audio solo una volta nel browser
        notificationSound.current = new Audio('/musica/notifications/message.one.mp3');
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            // Suona la notifica
            if (notificationSound.current) {
                notificationSound.current.play().catch(error => {
                    console.warn("La riproduzione audio è stata bloccata dal browser:", error);
                });
            }
            // Attiva lo stato "lampeggiante"
            setIsFlashing(true);
        };

        // Mettiti in ascolto di nuovi messaggi privati dal server
        socket.on('new_private_message', handleNewMessage);

        // Pulisci l'evento quando il componente viene smontato
        return () => {
            socket.off('new_private_message', handleNewMessage);
        };
    }, [socket]);

    // Funzione per fermare il lampeggiamento (la useremo quando l'utente clicca l'icona)
    const stopFlashing = () => {
        setIsFlashing(false);
    };

    // Esponiamo lo stato e la funzione al resto dell'app
    const value = { isFlashing, stopFlashing };

    return (
        <MessagingContext.Provider value={value}>
            {children}
        </MessagingContext.Provider>
    );
};