import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ChatWindow from './ChatWindow';
import SchedaPersonaggio from './SchedaPersonaggio';
import Banca from './Banca';
// 1. Importa i nuovi componenti finestra
import Guida from './Guida';
import Ambientazione from './Ambientazione';
import Shinigami from './Shinigami';
import api from '../api';

function GameLayout({ user, onLogout }) {
    // Stati esistenti
    const [openChats, setOpenChats] = useState([]);
    const [currentMap, setCurrentMap] = useState(null);
    const [currentChildren, setCurrentChildren] = useState([]);
    const [mapId, setMapId] = useState('root');
    const [isSchedaOpen, setIsSchedaOpen] = useState(false);
    const [isBancaOpen, setIsBancaOpen] = useState(false);

    // 2. Aggiungi gli stati per le nuove finestre
    const [isGuidaOpen, setIsGuidaOpen] = useState(false);
    const [isAmbientazioneOpen, setIsAmbientazioneOpen] = useState(false);
    const [isShinigamiOpen, setIsShinigamiOpen] = useState(false);

    // Funzioni di toggle esistenti
    const handleToggleScheda = () => setIsSchedaOpen(!isSchedaOpen);
    const handleToggleBanca = () => setIsBancaOpen(!isBancaOpen);

    // 3. Aggiungi le nuove funzioni di toggle
    const handleToggleGuida = () => setIsGuidaOpen(!isGuidaOpen);
    const handleToggleAmbientazione = () => setIsAmbientazioneOpen(!isAmbientazioneOpen);
    const handleToggleShinigami = () => setIsShinigamiOpen(!isShinigamiOpen);
    
    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const response = await api.get(`/game/map/${mapId}`);
                setCurrentMap(response.data.mapInfo);
                setCurrentChildren(response.data.children);
            } catch (error) {
                console.error("Impossibile caricare la mappa:", error);
            }
        };
        fetchMapData();
    }, [mapId]);

    const handleZoneClick = (location) => {
        if (location.type === 'CHAT') {
            if (openChats.find(chat => chat.id === location.id)) return;
            setOpenChats(prev => [...prev, location]);
        } else if (location.type === 'MAP') {
            setMapId(location.id);
        }
    };

    const handleCloseChat = (chatId) => {
        setOpenChats(openChats.filter(chat => chat.id !== chatId));
    };

    const handleGoBack = () => {
        if (currentMap && currentMap.parent_id) {
            setMapId(currentMap.parent_id);
        } else {
            setMapId('root');
        }
    };

    return (
        <div className="game-container">
            {/* 4. Passa le nuove funzioni all'Header */}
            <Header 
                user={user} 
                onLogout={onLogout}
                onToggleGuida={handleToggleGuida}
                onToggleAmbientazione={handleToggleAmbientazione}
                onToggleShinigami={handleToggleShinigami}
            />
            
            <LeftSidebar 
                onToggleScheda={handleToggleScheda} 
                onToggleBanca={handleToggleBanca}
                // onToggleMessages andrà qui quando lo integreremo
            />

            <main className="main-content">
                <div className="content-wrapper">
                    <Outlet context={{ map: currentMap, children: currentChildren, onZoneClick: handleZoneClick, onGoBack: handleGoBack }} />
                </div>
            </main>

            <RightSidebar currentMap={currentMap} />
            
            {/* 5. Renderizza le finestre in modo condizionale */}
            {isSchedaOpen && <SchedaPersonaggio user={user} onClose={handleToggleScheda} />}
            {isBancaOpen && <Banca user={user} onClose={handleToggleBanca} />}
            {isGuidaOpen && <Guida onClose={handleToggleGuida} />}
            {isAmbientazioneOpen && <Ambientazione onClose={handleToggleAmbientazione} />}
            {isShinigamiOpen && <Shinigami onClose={handleToggleShinigami} />}

            <div className="chat-windows-area">
                {openChats.map(chat => (
                    <ChatWindow 
                        key={chat.id} 
                        chat={chat} 
                        onClose={handleCloseChat}
                        user={user}
                    />
                ))}
            </div>
        </div>
    );
}

export default GameLayout;
