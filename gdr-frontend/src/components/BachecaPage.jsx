import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import TopicListItem from './TopicListItem';
import NewTopicForm from './NewTopicForm';

const styles = {
    container: { 
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        borderRadius: '5px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: { 
        padding: '20px 40px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '2px solid #60519b', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        flexShrink: 0,
    },
    title: { color: '#e6e0ff', fontSize: '2.5rem', margin: 0 },
    contentArea: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '0 40px 20px 40px',
    },
    newPostButton: { padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#60519b', color: 'white', fontWeight: 'bold' },
    lockedMessage: { padding: '15px', textAlign: 'center', backgroundColor: 'rgba(168, 50, 50, 0.3)', border: '1px solid #a83232', borderRadius: '5px', marginTop: '10px' },
    markReadButton: {
        display: 'block', margin: '20px auto', padding: '10px 25px',
        backgroundColor: '#31323e', color: '#bfc0d1', border: '1px solid #4a4b57',
        borderRadius: '5px', cursor: 'pointer'
    },
};

function BachecaPage({ user }) {
    const { bachecaId } = useParams();
    const [bacheca, setBacheca] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const fetchBachecaData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/forum/bacheca/${bachecaId}/topics`);
            setBacheca(response.data.bacheca);
            setTopics(response.data.topics);
        } catch (error) { console.error("Errore caricamento bacheca:", error); } 
        finally { setLoading(false); }
    }, [bachecaId]);

    useEffect(() => { fetchBachecaData(); }, [fetchBachecaData]);

    const handleMarkBachecaAsRead = async () => {
        try {
            setTopics(prevTopics =>
                prevTopics.map(t => ({ ...t, has_new_posts: false }))
            );
            await api.post('/api/forum/mark-all-as-read');
        } catch (error) {
            console.error("Errore nel segnare la bacheca come letta:", error);
            fetchBachecaData();
        }
    };

    const handleTopicCreated = () => { setIsFormVisible(false); fetchBachecaData(); };

    const handlePinToggle = async (topicId, newPinStatus) => {
        try {
            setTopics(prevTopics => {
                const updatedTopics = prevTopics.map(t => t.id === topicId ? { ...t, is_pinned: newPinStatus ? 1 : 0 } : t);
                return updatedTopics.sort((a, b) => (b.is_pinned || 0) - (a.is_pinned || 0) || new Date(b.ultimo_post_timestamp) - new Date(a.ultimo_post_timestamp));
            });
            await api.put(`/admin/forum/topics/${topicId}/pin`, { is_pinned: newPinStatus });
        } catch (error) { console.error("Errore durante il pin:", error); fetchBachecaData(); }
    };

    const handleDeleteTopic = async (topicId) => {
        if (window.confirm('Sei sicuro di voler eliminare questa discussione?')) {
            try {
                await api.delete(`/admin/forum/topics/${topicId}`);
                setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
            } catch (error) { console.error("Errore eliminazione discussione:", error); }
        }
    };
    
    if (loading) return <div style={styles.container}><p style={{margin: 'auto'}}>Caricamento...</p></div>;
    if (!bacheca) return <div style={styles.container}><p style={{margin: 'auto'}}>Bacheca non trovata.</p></div>;
    
    const hasUnreadTopics = topics.some(t => t.has_new_posts);

    return (
        <div style={styles.container}>
            {isFormVisible && <NewTopicForm bachecaId={bacheca.id} onTopicCreated={handleTopicCreated} onCancel={() => setIsFormVisible(false)} />}
            
            <header style={styles.header}>
                <div>
                    <Link to="/forum" style={{color: '#bfc0d1', fontSize: '0.9em'}}>&larr; Torna al Forum</Link>
                    <h1 style={styles.title}>{bacheca.nome}</h1>
                    <p>{bacheca.descrizione}</p>
                </div>
                {!bacheca.is_locked && <button style={styles.newPostButton} onClick={() => setIsFormVisible(true)}>+ Nuovo Topic</button>}
            </header>
            
            <div style={styles.contentArea}>
                {/* --- MODIFICA APPLICATA QUI --- */}
                {bacheca.is_locked ? <div style={styles.lockedMessage}>Questa bacheca è chiusa. Non è possibile creare nuove discussioni.</div> : null}
                
                <div>
                    {topics.length > 0 ? (
                        topics.map(topic => (
                            <TopicListItem 
                                key={topic.id} 
                                topic={topic}
                                user={user}
                                onPinToggle={handlePinToggle}
                                onDeleteTopic={handleDeleteTopic}
                            />
                        ))
                    ) : ( <p>Non ci sono ancora discussioni in questa bacheca.</p> )}
                </div>

                {hasUnreadTopics && (
                    <button 
                        style={styles.markReadButton}
                        onClick={handleMarkBachecaAsRead}
                    >
                        Segna tutto come già letto
                    </button>
                )}
            </div>
        </div>
    );
}

export default BachecaPage;