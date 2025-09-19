import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

// --- STILI COMPLETAMENTE RINNOVATI ---
const styles = {
    playerContainer: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#2a292f',
        border: '1px solid #31323e',
        fontFamily: "'Work Sans', sans-serif",
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(96, 81, 155, 0.4)',
    },
    coverArtContainer: {
        position: 'relative',
        width: '100%',
        height: '80px', 
        marginBottom: '5px',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    coverArt: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    neonFrame: {
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '3px',
        boxShadow: '0 0 8px rgba(180, 150, 220, 0.6) inset, 0 0 8px rgba(180, 150, 220, 0.6)',
        pointerEvents: 'none',
    },
    titleContainer: {
        backgroundColor: 'black',
        padding: '2px 0',
        marginBottom: '10px',
        borderRadius: '2px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
    titleMarquee: {
        fontFamily: "arcade", // Assicurati che 'ArcadeClassic' sia il nome del tuo font
        color: '#e6e0ff',
        fontSize: '16px',
        textTransform: 'uppercase',
        display: 'inline-block',
        paddingLeft: '100%',
        animation: 'marquee 15s linear infinite',
    },
    controls: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px', // Spazio tra i gruppi di bottoni
    },
    controlButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0',
        width: '24px',
        height: '24px',
        transition: 'all 0.2s ease',
        outline: 'none', // Rimuove il bordo rosa/blu al focus
    },
    playPauseButton: {
        width: '32px',
        height: '32px',
    },
    // Stile dell'icona (separato dal bottone)
    icon: {
        width: '100%',
        height: '100%',
        transition: 'filter 0.2s ease', // Transizione per il filtro
    },
    // Stili per gli effetti (da applicare all'icona)
    iconHover: {
        filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.8))', // Ombra nera
    },
    iconActive: {
        filter: 'drop-shadow(0 0 6px #c8a2c8) drop-shadow(0 0 12px #c8a2c8)', // Glow lilla
    },

    playlistSelect: { width: '100%', padding: '8px', backgroundColor: '#1e2124', color: '#a4a5b9', border: '1px solid #60519b', borderRadius: '3px', marginTop: '15px', fontSize: '13px' }

};


const MusicPlayer = () => {
    const [playlists, setPlaylists] = useState([]);
    const [currentPlaylist, setCurrentPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(() => localStorage.getItem('oyasumi-player-muted') !== 'false');
    const [hoveredButton, setHoveredButton] = useState(null);
    const [activeButton, setActiveButton] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => { api.get('/playlists').then(res => { setPlaylists(res.data); if (res.data.length > 0) { api.get(`/playlists/${res.data[0].id}/songs`).then(songRes => { setCurrentPlaylist(songRes.data); }); } }); }, []);
    useEffect(() => { if (audioRef.current) audioRef.current.muted = isMuted; localStorage.setItem('oyasumi-player-muted', isMuted); }, [isMuted]);
    useEffect(() => { if (currentPlaylist.length > 0 && audioRef.current) { audioRef.current.load(); if (isPlaying) { audioRef.current.play().catch(e => console.warn("Autoplay bloccato:", e.message)); } } }, [currentTrackIndex, currentPlaylist]);
    const playNextSong = () => { if (currentPlaylist.length === 0) return; setCurrentTrackIndex(prevIndex => (prevIndex + 1) % currentPlaylist.length); };
    const playPrevSong = () => { if (currentPlaylist.length === 0) return; setCurrentTrackIndex(prevIndex => (prevIndex - 1 + currentPlaylist.length) % currentPlaylist.length); };
    const handleEnded = () => { playNextSong(); };
    const togglePlay = () => { if (!audioRef.current || !audioRef.current.src || audioRef.current.src === window.location.href) { console.warn("Nessuna traccia audio valida da riprodurre."); return; } const newIsPlaying = !isPlaying; if (newIsPlaying) { audioRef.current.play().catch(e => console.error("Errore di riproduzione:", e.message)); } else { audioRef.current.pause(); } setIsPlaying(newIsPlaying); };
    const toggleMute = () => setIsMuted(!isMuted);
    const handlePlaylistChange = (e) => { const playlistId = e.target.value; setIsPlaying(false); setCurrentTrackIndex(0); api.get(`/playlists/${playlistId}/songs`).then(songRes => { setCurrentPlaylist(songRes.data); }); };
    const currentTrack = currentPlaylist[currentTrackIndex];
    const getAudioSource = () => { if (!currentTrack) return null; if (currentTrack.source_type === 'youtube') { const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/; const match = currentTrack.url.match(regex); const videoId = match ? match[1] : null; if (videoId) return `/api/youtube-stream/${videoId}`; return null; } return currentTrack.url; };
    const getIconStyle = (buttonName) => {
        let style = styles.icon;
        if (activeButton === buttonName) {
            return { ...style, ...styles.iconActive };
        }
        if (hoveredButton === buttonName) {
            return { ...style, ...styles.iconHover };
        }
        return style;
    };

    return (
        <div style={styles.playerContainer}>
            <audio ref={audioRef} src={getAudioSource()} onEnded={handleEnded} controls={false} />
            
            <div style={styles.coverArtContainer}><img src={currentTrack?.cover_image_url || '/placeholder.jpg'} alt="cover" style={styles.coverArt} /><div style={styles.neonFrame}></div></div>
            <div style={styles.titleContainer}><div style={styles.titleMarquee}>{currentTrack?.title || 'NESSUNA TRACCIA'}</div></div>

            <div style={styles.controls}>
                <button 
                    style={styles.controlButton} 
                    onClick={playPrevSong} 
                    onMouseEnter={() => setHoveredButton('prev')} 
                    onMouseLeave={() => setHoveredButton(null)}
                    onMouseDown={() => setActiveButton('prev')}
                    onMouseUp={() => setActiveButton(null)}
                >
                    <img src="/musica/previous.png" alt="Previous" style={getIconStyle('prev')} />
                </button>

                <button 
                    style={{...styles.controlButton, ...styles.playPauseButton}} 
                    onClick={togglePlay}
                    onMouseEnter={() => setHoveredButton('play')} 
                    onMouseLeave={() => setHoveredButton(null)}
                    onMouseDown={() => setActiveButton('play')}
                    onMouseUp={() => setActiveButton(null)}
                >
                    <img src={isPlaying ? "/musica/pause.png" : "/musica/play.png"} alt="Play/Pausa" style={getIconStyle('play')} />
                </button>

                <button 
                    style={styles.controlButton} 
                    onClick={playNextSong}
                    onMouseEnter={() => setHoveredButton('next')} 
                    onMouseLeave={() => setHoveredButton(null)}
                    onMouseDown={() => setActiveButton('next')}
                    onMouseUp={() => setActiveButton(null)}
                >
                    <img src="/musica/next.png" alt="Next" style={getIconStyle('next')} />
                </button>
                
                <button 
                    style={styles.controlButton} 
                    onClick={toggleMute}
                    onMouseEnter={() => setHoveredButton('mute')} 
                    onMouseLeave={() => setHoveredButton(null)}
                    onMouseDown={() => setActiveButton('mute')}
                    onMouseUp={() => setActiveButton(null)}
                >
                    <img src={isMuted ? "/musica/mute.png" : "/musica/volumeup.png"} alt="Muto" style={getIconStyle('mute')} />
                </button>
            </div>

            {playlists.length > 0 && (
                <select onChange={handlePlaylistChange} style={styles.playlistSelect}>
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            )}
        </div>
    );
};

export default MusicPlayer;
