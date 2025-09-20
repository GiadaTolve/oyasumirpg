import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../SocketContext';
import WeatherWidget from './WeatherWidget';
import api from '../api';

    const styles = {
        // Stile della sidebar ripristinato
        sidebar: {
            width: '240px',
            backgroundColor: 'rgba(30, 31, 33, 0.8)',
            backgroundImage: 'url(/backgrounds/cloudy.png)', // Ripristinata texture originale
            backgroundSize: 'cover',
            padding: '20px',
            color: '#bfc0d1',
            borderLeft: '1px solid #31323e',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        },
        // Stili per il pannello eventi (invariati)
        eventsPanel: {
            backgroundColor: '#2A2930',
            border: '1px solid #60519b',
            borderRadius: '5px',
            padding: '15px',
            boxShadow: '0 0 15px rgba(96, 81, 155, 0.4)',
            transition: 'all 0.3s ease-in-out',
            maxHeight: '500px',
            opacity: 1,
        },
        eventsPanelHidden: {
            maxHeight: '0',
            opacity: 0,
            paddingTop: '0',
            paddingBottom: '0',
            marginTop: '0',
            border: '1px solid transparent',
            overflow: 'hidden',
        },
        eventsTitle: {
            fontSize: '1.1em',
            fontWeight: 'bold',
            color: '#e6e0ff',
            marginBottom: '10px',
        },
        noEventsText: {
            fontStyle: 'italic',
            color: '#888',
            textAlign: 'center',
        },
        
        // --- STILE "ORIGINALE" RIPRISTINATO E MIGLIORATO PER IL BOX PRESENTI ---
        onlineTitle: { 
            width: '100%', 
            padding: '2px 0', 
            backgroundColor: '#2A2930', // Sfondo scuro come il pulsante scheda
            border: '1px solid #31323e',
            borderRadius: '5px', 
            fontFamily: "work sans", 
            color: '#60519b', // Colore testo standard
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
            textAlign: 'center', 
            fontSize: '1em', 
            boxSizing: 'border-box',
            textTransform: 'uppercase', 
            fontWeight: 'bold' 
        },
        userListBox: { 
            width: '100%', 
            height: '250px', // Altezza fissa
            padding: '15px', 
            marginTop: '1px', // Spazio dal titolo
            backgroundColor: '#2A2930', // Sfondo nero semitrasparente
            border: '1px solid #31323e', 
            borderRadius: '5px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
        },
        userList: { 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            overflowY: 'auto', // Scroll interno se necessario
        },
        userListItem: { 
            color: '#bfc0d1', 
            marginBottom: '8px', 
            fontSize: '14px',
            textAlign: 'center'
        },
    };
    
    function RightSidebar({ currentMap }) {
        const socket = useContext(SocketContext);
        const [onlineUsers, setOnlineUsers] = useState([]);
        const [showEvents, setShowEvents] = useState(false);
        const [dailyEvent, setDailyEvent] = useState(null);
    
        useEffect(() => {
            const handleUserListUpdate = (users) => setOnlineUsers(users);
            socket.on('update_online_list', handleUserListUpdate);
            return () => socket.off('update_online_list', handleUserListUpdate);
        }, [socket]);
    
        useEffect(() => {
            const fetchDailyEvent = async () => {
                try {
                    const response = await api.get('/daily-event');
                    setDailyEvent(response.data);
                } catch (error) {
                    console.error("Errore nel recupero dell'evento giornaliero:", error.response);
                }
            };
            fetchDailyEvent();
        }, []);
    
        const handleToggleCalendar = () => {
            setShowEvents(prev => !prev);
        };
    
        return (
            <aside style={styles.sidebar}>
                <WeatherWidget currentMap={currentMap} onToggleCalendar={handleToggleCalendar} />
                
                <div style={showEvents ? styles.eventsPanel : {...styles.eventsPanel, ...styles.eventsPanelHidden}}>
                    {dailyEvent ? (
                        <>
                            <div style={styles.eventsTitle}>{dailyEvent.title}</div>
                            <p>{dailyEvent.description}</p>
                        </>
                    ) : (
                        <p style={styles.noEventsText}>Nessun evento speciale per oggi.</p>
                    )}
                </div>
    
                {/* --- SEZIONE "PRESENTI" CON STILE RIPRISTINATO --- */}
                <div>
                    <div style={styles.onlineTitle}>
                        Presenti ({onlineUsers.length})
                    </div>
                    <div style={styles.userListBox}>
                        <ul style={styles.userList}>
                            {onlineUsers.map(user => (
                                <li key={user.id} style={styles.userListItem}>
                                    {user.nome_pg}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </aside>
        );
    }
    
    export default RightSidebar;
    