// src/components/ConversationList.jsx
import React, { useState } from 'react';
import api from '../api';

// Stili (invariati, ma li lascio per completezza)
const styles = {
    window: { position: 'fixed', bottom: '20px', right: '300px', width: '320px', height: 'auto', minHeight: '400px', maxHeight: '500px', backgroundColor: '#1e202c', border: '1px solid #31323e', borderRadius: '8px', zIndex: 150, display: 'flex', flexDirection: 'column', boxShadow: '0 5px 20px rgba(0,0,0,0.5)' },
    header: { padding: '12px', borderBottom: '1px solid #31323e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e6e0ff', flexShrink: 0 },
    list: { flexGrow: 1, overflowY: 'auto' },
    item: { display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #2a2c3a' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' },
    info: { flexGrow: 1, color: '#bfc0d1' },
    name: { fontWeight: 'bold' },
    lastMessage: { fontSize: '0.8em', color: '#a4a5b9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    unreadBadge: { backgroundColor: '#60519b', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8em', fontWeight: 'bold' },
    footer: { padding: '10px', borderTop: '1px solid #31323e', flexShrink: 0, backgroundColor: '#121212' },
    emptyState: { textAlign: 'center', color: '#a4a5b9', padding: '40px 20px', fontSize: '0.9em' },
    searchForm: { display: 'flex', gap: '5px' },
    searchInput: { flexGrow: 1, background: '#31323e', border: '1px solid #4a4b57', color: '#bfc0d1', padding: '8px 12px', borderRadius: '5px', fontFamily: 'inherit' },
};

function ConversationList({ conversations, onSelect, unreadCounts, onClose }) {
    const [isSearching, setIsSearching] = useState(false);
    const [searchName, setSearchName] = useState('');

    const handleSearchSubmit = async (e) => {
        // --- LA CORREZIONE CHE RISOLVE LA PAGINA BIANCA ---
        e.preventDefault(); 
        // --------------------------------------------------

        if (searchName.trim() === "") return;

        try {
            const response = await api.get(`/users/find?name=${searchName.trim()}`);
            if (response.data) {
                onSelect(response.data);
                setIsSearching(false);
                setSearchName('');
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                alert(`Nessun giocatore di nome "${searchName}" è stato trovato.`);
            } else {
                console.error("Errore nella ricerca:", error);
                alert("Si è verificato un errore durante la ricerca.");
            }
        }
    };

    return (
        <div style={styles.window}>
            <div style={styles.header}>
                <strong>Messaggi Privati</strong>
                <button onClick={onClose}>×</button>
            </div>
            <div style={styles.list}>
                {conversations.length > 0 ? (
                    conversations.map(conv => (
                        <div key={conv.id_utente} style={styles.item} onClick={() => onSelect(conv)}>
                            <img src={conv.avatar_chat || '/icone/mini_avatar.png'} alt={conv.nome_pg} style={styles.avatar} />
                            <div style={styles.info}>
                                <div style={styles.name}>{conv.nome_pg}</div>
                                <div style={styles.lastMessage}>{conv.last_message || 'Apri la chat per iniziare...'}</div>
                            </div>
                            {unreadCounts[conv.id_utente] > 0 && <div style={styles.unreadBadge}>{unreadCounts[conv.id_utente]}</div>}
                        </div>
                    ))
                ) : (
                    <div style={styles.emptyState}>Non hai conversazioni attive.</div>
                )}
            </div>
            <div style={styles.footer}>
                {!isSearching ? (
                    <button className="button-style" onClick={() => setIsSearching(true)}>
                        Invia nuovo messaggio
                    </button>
                ) : (
                    <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
                        <input
                            type="text"
                            style={styles.searchInput}
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            placeholder="Nome del giocatore..."
                            autoFocus
                        />
                        <button type="submit" className="button-style">Cerca</button>
                        <button type="button" className="button-style" onClick={() => setIsSearching(false)} style={{background: '#555'}}>X</button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ConversationList;