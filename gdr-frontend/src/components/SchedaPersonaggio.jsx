import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

// --- STILI (con aggiunte per i form) ---
const styles = {
  window: { position: 'absolute', width: '600px', minHeight: '600px', backgroundColor: '#121212', border: '1px solid #31323e', borderRadius: '8px', display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)', color: '#bfc0d1' },
  header: { padding: '10px 15px', backgroundColor: '#1e202c', cursor: 'move', borderBottom: '1px solid #31323e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, fontWeight: 'bold' },
  closeButton: { background: 'none', border: 'none', color: '#bfc0d1', fontSize: '1.2rem', cursor: 'pointer' },
  contentArea: { flexGrow: 1 },
  idPanel: { display: 'flex', flexDirection: 'column', padding: '20px' },
  avatar: { width: '550px', height: '350px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #31323e', alignSelf: 'center' },
  statsContainer: { marginTop: '20px', padding: '20px', backgroundColor: 'rgba(30, 32, 44, 0.4)', border: '1px solid #31323e', borderRadius: '5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 20px' },
  statItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  genericPanel: { padding: '20px', whiteSpace: 'pre-wrap' },
  footerTabs: { display: 'flex', borderTop: '1px solid #31323e' },
  tabButton: { 
      flexGrow: 1, 
      padding: '12px 15px', 
      backgroundColor: '#1e202c', 
      border: 'none', 
      borderRight: '1px solid #31323e', 
      color: '#a4a5b9', 
      cursor: 'pointer', 
      fontSize: '14px' 
  },
  activeTab: { 
      backgroundColor: '#60519b', 
      color: 'white', 
      fontWeight: 'bold' 
  },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', color: '#ccc' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px', background: '#3c3c3c', border: '1px solid #555', color: 'white', borderRadius: '4px' },
  textarea: { width: '100%', boxSizing: 'border-box', minHeight: '200px', padding: '10px', background: '#3c3c3c', border: '1px solid #555', color: 'white', borderRadius: '4px', fontFamily: 'inherit' }
};

// --- COMPONENTE ---
function SchedaPersonaggio({ user, onClose }) {
    const [schedaData, setSchedaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ID');
    
    // --- STATO PER LA MODALITÀ MODIFICA ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedProfile, setEditedProfile] = useState({ avatar: '', avatar_chat: '', background: '' });

    const [position, setPosition] = useState({ x: 300, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const fetchScheda = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/scheda');
            setSchedaData(response.data);
            // Inizializza i dati per il form di modifica
            setEditedProfile({
                avatar: response.data.avatar || '',
                avatar_chat: response.data.avatar_chat || '',
                background: response.data.background || ''
            });
        } catch (error) {
            console.error("Errore nel caricamento della scheda:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchScheda(); }, [fetchScheda]);

    // --- NUOVE FUNZIONI PER LA MODIFICA ---
    const handleEditChange = (e) => {
        setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
    };

    const handleProfileSave = async () => {
        try {
            const response = await api.put('/scheda/profilo', editedProfile);
            setSchedaData(response.data); // Aggiorna i dati visualizzati con la risposta del server
            setIsEditMode(false);
            alert("Profilo aggiornato con successo!");
        } catch (error) {
            console.error("Errore salvataggio profilo:", error);
            alert(error.response?.data?.message || "Si è verificato un errore durante il salvataggio.");
        }
    };

    const handleCancelEdit = () => {
        // Ripristina i valori del form a quelli originali
        setEditedProfile({
            avatar: schedaData.avatar || '',
            avatar_chat: schedaData.avatar_chat || '',
            background: schedaData.background || ''
        });
        setIsEditMode(false);
    };

    // Logica per il trascinamento (invariata)
    const handleMouseDown = useCallback((e) => { setIsDragging(true); dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }, [position]);
    const handleMouseMove = useCallback((e) => { if (isDragging) setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }); }, [isDragging]);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    useEffect(() => { if (isDragging) { document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); } return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); }; }, [isDragging, handleMouseMove, handleMouseUp]);
    
    if (loading) return <div style={{...styles.window, padding: '20px'}}>Caricamento scheda...</div>;
    if (!schedaData) return <div style={{...styles.window, padding: '20px'}}>Impossibile caricare la scheda.</div>;

    const renderContent = () => {
        if (isEditMode) {
            return (
                <div style={styles.genericPanel}>
                    <h2>Modifica Profilo</h2>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>URL Avatar Grande (per la scheda)</label>
                        <input style={styles.input} type="text" name="avatar" value={editedProfile.avatar} onChange={handleEditChange} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>URL Avatar Piccolo (per la chat)</label>
                        <input style={styles.input} type="text" name="avatar_chat" value={editedProfile.avatar_chat} onChange={handleEditChange} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Background del Personaggio</label>
                        <textarea style={styles.textarea} name="background" value={editedProfile.background} onChange={handleEditChange}></textarea>
                    </div>
                </div>
            );
        }

        if (activeTab === 'ID') {
            return (
                <div style={styles.idPanel}>
                    <img src={schedaData.avatar || '/placeholder_avatar_grande.jpg'} alt={`Avatar di ${schedaData.nome_pg}`} style={styles.avatar} />
                    <div style={styles.statsContainer}>
                        {/* ... statistiche ... */}
                    </div>
                </div>
            );
        }

        if (activeTab === 'Background') {
            return (
                <div style={styles.genericPanel}>
                    <h2>Background</h2>
                    <p>{schedaData.background || "Nessun background inserito."}</p>
                </div>
            );
        }

        return (
            <div style={styles.genericPanel}>
                <h2>{activeTab}</h2>
                <p>Contenuto per la sezione "{activeTab}" da implementare.</p>
            </div>
        );
    };

    const renderTabButton = (tabName) => ( <button style={activeTab === tabName ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton} onClick={() => setActiveTab(tabName)}> {tabName} </button> );

    return (
        <div style={{ ...styles.window, left: `${position.x}px`, top: `${position.y}px` }}>
            <div style={styles.header} onMouseDown={handleMouseDown}>
                <span>Scheda di {schedaData.nome_pg}</span>
                <button onClick={onClose} style={styles.closeButton}>×</button>
            </div>
            
            <div style={styles.contentArea}>{renderContent()}</div>

            <div style={styles.footerTabs}>
                {isEditMode ? (
                    <>
                        <button style={{...styles.tabButton, backgroundColor: '#28a745'}} onClick={handleProfileSave}>Salva Modifiche</button>
                        <button style={{...styles.tabButton, backgroundColor: '#6c757d'}} onClick={handleCancelEdit}>Annulla</button>
                    </>
                ) : (
                    <>
                        {renderTabButton('ID')}
                        {renderTabButton('Background')}
                        {renderTabButton('Skills')}
                        {renderTabButton('Inventario')}
                        {user.id === schedaData.id_utente && <button style={{...styles.tabButton, color: '#60519b', fontWeight: 'bold'}} onClick={() => setIsEditMode(true)}>Modifica</button>}
                    </>
                )}
            </div>
        </div>
    );
}

export default SchedaPersonaggio;