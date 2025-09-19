import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import NewIndicator from './NewIndicator';

const styles = {
    // --- MODIFICATO ---
    // Questo è ora il contenitore principale che riempie tutto lo spazio.
    container: { 
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        borderRadius: '5px',
        display: 'flex', // Layout a colonna
        flexDirection: 'column',
        overflow: 'hidden', // Nasconde lo scroll dal contenitore principale
    },
    header: { 
        padding: '20px 40px',
        borderBottom: '2px solid #60519b',
        flexShrink: 0, // L'header non si rimpicciolisce
    },
    title: { fontFamily: 'oyasumifont', color: '#e6e0ff', fontSize: '3rem', margin: 0, textShadow: '0 0 5px #bfc0d1', textAlign: 'center' },
    // --- NUOVO ---
    // Questo contenitore interno conterrà gli elementi e sarà scrollabile.
    contentArea: {
        flexGrow: 1, // Occupa tutto lo spazio rimanente
        overflowY: 'auto', // Abilita lo scroll verticale qui
        padding: '20px 40px', // Spaziatura interna
    },
    sezione: { backgroundColor: 'rgba(30, 32, 44, 0.2)', border: '1px solid #31323e', borderRadius: '5px', marginBottom: '30px' },
    sezioneHeader: { backgroundColor: 'rgba(30, 32, 44, 0.8)', padding: '15px', borderBottom: '1px solid #31323e', borderRadius: '5px 5px 0 0' },
    sezioneTitle: { margin: 0, fontSize: '1.5rem' },
    bachecaRow: { display: 'flex', alignItems: 'center', padding: '15px', borderTop: '1px solid #252526' },
    bachecaIcon: { fontSize: '1.5rem', marginRight: '15px' },
    bachecaInfo: { flexGrow: 1, display: 'flex', alignItems: 'center', gap: '10px' },
    bachecaTitle: { margin: 0, fontSize: '1.1rem' },
    bachecaDesc: { margin: '4px 0 0', fontSize: '0.9rem', color: '#a4a5b9' },
    bachecaStats: { width: '120px', textAlign: 'center', flexShrink: 0, fontSize: '0.9rem' },
    bachecaLastPost: { width: '200px', flexShrink: 0, fontSize: '0.8rem', color: '#a4a5b9' },
    markAllReadButton: {
        display: 'block', margin: '20px auto', padding: '10px 25px', backgroundColor: '#31323e',
        color: '#bfc0d1', border: '1px solid #4a4b57', borderRadius: '5px', cursor: 'pointer'
    },
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT');
}

function Forum() {
    const [forumData, setForumData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchForumData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/forum');
            setForumData(response.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchForumData(); }, [fetchForumData]);
   
    const handleMarkAllAsRead = async () => {
        try {
            setForumData(prevData => prevData.map(sezione => ({ ...sezione, bacheche: sezione.bacheche.map(bacheca => ({ ...bacheca, has_new_posts: false, }))})) );
            await api.post('/forum/mark-all-as-read');
        } catch (error) {
            console.error("Errore nel segnare tutto come letto:", error);
            fetchForumData();
        }
    };

    if (loading) return <div style={styles.container}><p style={{margin: 'auto'}}>Caricamento forum...</p></div>;
    const hasAnyUnread = forumData.some(sezione => sezione.bacheche.some(b => b.has_new_posts));

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Forum</h1>
            </header>
            
            <div style={styles.contentArea}>
                {forumData.map(sezione => (
                    <div key={sezione.id} style={styles.sezione}>
                        <div style={styles.sezioneHeader}> <h2 style={styles.sezioneTitle}>{sezione.nome}</h2> </div>
                        <div>
                            {sezione.bacheche.map(bacheca => (
                                <Link to={`/forum/bacheca/${bacheca.id}`} key={bacheca.id} style={{textDecoration: 'none', color: 'inherit'}}>
                                    <div style={styles.bachecaRow}>
                                        <div style={styles.bachecaInfo}>
                                            <div>
                                                <h3 style={styles.bachecaTitle}>{bacheca.nome}</h3>
                                                <p style={styles.bachecaDesc}>{bacheca.descrizione}</p>
                                            </div>
                                            {bacheca.has_new_posts ? <NewIndicator /> : null}
                                        </div>
                                        <div style={styles.bachecaStats}>
                                            <div><strong>{bacheca.topic_count}</strong> discussioni</div>
                                        </div>
                                        <div style={styles.bachecaLastPost}>
                                            <div>{formatDate(bacheca.last_post_timestamp)}</div>
                                            <div>da <strong>{bacheca.last_post_author || 'N/A'}</strong></div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            
                {hasAnyUnread && (
                    <button style={styles.markAllReadButton} onClick={handleMarkAllAsRead}>
                        Segna tutto come già letto
                    </button>
                )}
            </div>
        </div>
    );
}

export default Forum;