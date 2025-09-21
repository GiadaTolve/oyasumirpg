// src/components/WeatherWidget.jsx

import React, { useState, useEffect } from 'react';
import api from '../api';

const styles = {
    widget: {
        backgroundColor: '#2A2930',
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #60519b',
        height: '80px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Work Sans', sans-serif",
        color: '#bfc0d1',
        position: 'relative', 
    },
    dateTime: {
        textAlign: 'center',
        textTransform: 'uppercase',
        fontSize: '11px',
        color: '#888',
        marginBottom: '10px',
    },
    weatherInfo: {
        display: 'flex',
        alignItems: 'left',
        justifyContent: 'left',
        marginLeft: '15px',
        gap: '25px',
        flexGrow: 1,
    },
    weatherIcon: {
        marginTop: '-12px',
        width: '42px',
        height: '42px',
        filter: 'drop-shadow(0 0 8px rgba(8, 8, 8, 0.33)) drop-shadow(0 0 15px rgb(0, 0, 0))',
    },
    temp: {
        fontSize: '24px',
        fontWeight: 'bold',
    },
    calendarButton: {
        position: 'absolute',
        top: '10px',
        right: '6px',
        width: '62px',
        height: '62px',
        background: 'none',
        border: 'none',
        padding: '0',
        cursor: 'pointer',
    },
    calendarIcon: {
        width: '100%',
        height: '100%',
        filter: 'drop-shadow(1px 2px 5px rgba(0, 0, 0, 0.86))',
    },
    // Stile per il messaggio di errore/caricamento
    statusText: {
        ...this.weatherInfo,
        fontSize: '12px',
        fontStyle: 'italic',
        color: '#888',
    }
};

function WeatherWidget({ currentMap, onToggleCalendar }) { 
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState(null); // --- 1. Aggiungiamo uno stato per l'errore
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    useEffect(() => {
        const locationToFetch = currentMap?.prefecture || 'Tokyo';
        
        const fetchWeather = async () => {
            setWeather(null); // Resettiamo il meteo precedente
            setError(null); // Resettiamo l'errore precedente
            try {
                const response = await api.get(`/weather?location=${locationToFetch}`);
                setWeather(response.data);
            } catch (err) {
                // --- 2. In caso di errore, lo salviamo in console E nello stato
                console.error("Errore nel caricamento del meteo:", err.response || err);
                setError("Meteo non disponibile");
                setWeather(null);
            }
        };
        
        fetchWeather();
    }, [currentMap]);

    const formattedDate = time.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    return (
        <div style={styles.widget}>
            <div style={styles.dateTime}>{formattedDate} - {formattedTime}</div>
            
            {/* --- 3. Logica di visualizzazione migliorata --- */}
            {weather ? (
                <div style={styles.weatherInfo}>
                    <img src={`/meteo/${weather.icon}`} alt={weather.description} style={styles.weatherIcon} />
                    <div style={styles.temp}>{weather.temp}°C</div>
                </div>
            ) : error ? (
                <div style={styles.statusText}>{error}</div>
            ) : (
                <div style={styles.statusText}>Caricamento...</div>
            )}
            
            <button 
                style={styles.calendarButton} 
                onClick={onToggleCalendar}
                title="Eventi del giorno"
            >
                <img src="/meteo/calendar.png" alt="Calendario Eventi" style={styles.calendarIcon} />
            </button>
        </div>
    );
}

export default WeatherWidget;