import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import NewPostForm from './NewPostForm';
import BBCodeParser from './BBCodeParser';

const styles = {
    // --- MODIFICATO ---
    // Rimosso 'wrapper', questo è ora il contenitore radice.
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
        flexShrink: 0,
    },
    title: { color: '#e6e0ff', fontSize: '2.5rem', margin: 0 },
    postsList: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '0 20px',
    },
    post: { 
        display: 'flex', 
        borderBottom: '1px solid #31323e', 
        padding: '20px', 
        backgroundColor: 'rgba(30,32,44,0.3)', 
        margin: '20px', 
        borderRadius: '5px' 
    },
    postAuthor: { width: '150px', flexShrink: 0, textAlign: 'center', padding: '0 10px' },
    avatar: {
        width: '90px', height: '50px', objectFit: 'cover',
        backgroundColor: '#1e202c', border: '1px solid #31323c', marginBottom: '10px',
    },
    postContent: { flexGrow: 1, paddingLeft: '20px', borderLeft: '1px solid #31323e', display: 'flex', flexDirection: 'column' },
    postBody: { whiteSpace: 'pre-wrap', lineHeight: '1.6', flexGrow: 1 },
    postFooter: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' },
    iconButton: {
        background: 'rgba(49, 50, 60, 0.5)', border: '1px solid #4a4b57', padding: '6px',
        borderRadius: '5px', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease-in-out',
    },
    icon: { width: '18px', height: '18px' },
    likeButtonLiked: { background: 'rgba(96, 81, 155, 0.3)', border: '1px solid #60519b' },
    likeCount: { color: '#a4a5b9', fontSize: '0.9em', marginLeft: '5px' },
    replyFormContainer: {
        flexShrink: 0,
        padding: '20px 40px',
        borderTop: '2px solid #31323e',
        backgroundColor: 'rgba(23, 23, 23, 0.8)',
    },
    lockedMessage: { padding: '15px', textAlign: 'center', backgroundColor: 'rgba(168, 50, 50, 0.3)', border: '1px solid #a83232', borderRadius: '5px' },
};

// ... (Funzioni hover invariate)
const handleMouseOver = (e) => { e.currentTarget.style.backgroundColor = 'rgba(96, 81, 155, 0.5)'; e.currentTarget.style.borderColor = '#7e6bbd'; };
const handleMouseOut = (e, isLiked) => { if (!isLiked) { e.currentTarget.style.backgroundColor = 'rgba(49, 50, 60, 0.5)'; e.currentTarget.style.borderColor = '#4a4b57'; } };
const handleMouseDown = (e) => { e.currentTarget.style.transform = 'scale(0.95)'; };
const handleMouseUp = (e) => { e.currentTarget.style.transform = 'scale(1)'; };


function TopicPage({ user }) {
    // ... (Logica del componente invariata)
    const { topicId } = useParams();
    const [topic, setTopic] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const replyFormRef = useRef(null);

    const fetchTopicData = useCallback(async () => {
        try {
            const response = await api.get(`/forum/topic/${topicId}`);
            setTopic(response.data);
            api.post(`/forum/topics/${topicId}/mark-as-read`).catch(err => console.error("Impossibile segnare come letto:", err));
        } catch (error) { 
            console.error("Errore durante il caricamento della discussione:", error);
            setTopic(null);
        }
    }, [topicId]);

    useEffect(() => { fetchTopicData(); }, [fetchTopicData]);

    const handleLockToggle = async () => {
        if (!topic) return;
        try {
            const newLockStatus = !topic.is_locked;
            await api.put(`/admin/forum/topics/${topic.id}/lock`, { is_locked: newLockStatus });
            setTopic(prevTopic => ({ ...prevTopic, is_locked: newLockStatus }));
        } catch (error) {
            console.error("Errore durante il blocco/sblocco della discussione:", error);
            alert("Impossibile modificare lo stato della discussione.");
        }
    };
    
    const formatDate = (dateString) => new Date(dateString).toLocaleString('it-IT');
    
    const handleLike = async (postId) => {
        try {
            const newPosts = topic.posts.map(p => {
                if (p.id === postId) { return { ...p, user_has_liked: !p.user_has_liked, like_count: p.user_has_liked ? p.like_count - 1 : p.like_count + 1 }; }
                return p;
            });
            setTopic(prev => ({ ...prev, posts: newPosts }));
            await api.post(`/forum/posts/${postId}/like`);
        } catch (error) {
            console.error("Errore nell'aggiornare il like:", error);
            fetchTopicData();
        }
    };
    
    const handleQuote = (author, text) => {
        const quotedText = `[quote=${author}]${text}[/quote]\n\n`;
        setReplyText(prevText => prevText + quotedText);
        replyFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            await api.post('/forum/posts', { topic_id: topicId, testo: replyText });
            setReplyText('');
            fetchTopicData();
        } catch (err) { setSubmitError(err.response?.data?.message || 'Errore'); } 
        finally { setIsSubmitting(false); }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm('Sei sicuro di voler eliminare questo post? L\'azione è irreversibile.')) {
            try {
                await api.delete(`/admin/forum/posts/${postId}`);
                setTopic(prevTopic => ({ ...prevTopic, posts: prevTopic.posts.filter(p => p.id !== postId) }));
            } catch (error) {
                console.error("Errore durante l'eliminazione del post:", error);
                alert('Impossibile eliminare il post.');
            }
        }
    };

    if (!topic) return <div style={styles.container}><p style={{margin: 'auto'}}>Caricamento...</p></div>;

    // --- MODIFICATO ---
    // Rimosso il div wrapper esterno
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <Link to={`/forum/bacheca/${topic.bacheca_id}`} style={{color: '#bfc0d1', fontSize: '0.9em'}}>&larr; Torna alla bacheca</Link>
                    <h1 style={styles.title}>{topic.titolo}</h1>
                </div>
                {user.permesso === 'ADMIN' && (
                    <button style={styles.iconButton} onClick={handleLockToggle} title={topic.is_locked ? 'Sblocca Discussione' : 'Blocca Discussione'}>
                        <img src={topic.is_locked ? '/icone/ui-forum/unlocked.png' : '/icone/ui-forum/locked.png'} alt="Lock" style={styles.icon} />
                    </button>
                )}
            </div>

            <div style={styles.postsList}>
                {topic.posts && topic.posts.map(post => (
                    <div key={post.id} style={styles.post}>
                        <div style={styles.postAuthor}>
                            <strong>{post.autore_nome}</strong>
                            <p style={{fontSize: '0.8em', margin: '5px 0 10px'}}>{post.autore_permesso}</p>
                            <img src={post.autore_avatar_url || '/default-avatar.png'} alt={post.autore_nome} style={styles.avatar}/>
                        </div>
                        <div style={styles.postContent}>
                            <div style={{fontSize: '0.8em', color: '#a4a5b9', marginBottom: '10px'}}>{formatDate(post.timestamp_creazione)}</div>
                            <div style={styles.postBody}><BBCodeParser text={post.testo} /></div>
                            <div style={styles.postFooter}>
                                {user.permesso === 'ADMIN' && (
                                    <button style={styles.iconButton} onClick={() => handleDeletePost(post.id)} title="Elimina Post" onMouseOver={handleMouseOver} onMouseOut={(e) => handleMouseOut(e, false)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                        <img src="/icone/ui-forum/trash.png" alt="Elimina" style={styles.icon} />
                                    </button>
                                )}
                                <button style={styles.iconButton} onClick={() => handleQuote(post.autore_nome, post.testo)} title="Cita" onMouseOver={handleMouseOver} onMouseOut={(e) => handleMouseOut(e, false)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                                    <img src="/icone/ui-forum/quotes.png" alt="Cita" style={styles.icon} />
                                </button>
                                <button 
                                    style={{...styles.iconButton, ...(post.user_has_liked ? styles.likeButtonLiked : {})}}
                                    onClick={() => handleLike(post.id)} title="Like"
                                    onMouseOver={handleMouseOver} onMouseOut={(e) => handleMouseOut(e, post.user_has_liked)} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                                >
                                    <img src="/icone/ui-forum/like.png" alt="Like" style={styles.icon} />
                                    <span style={styles.likeCount}>{post.like_count}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.replyFormContainer} ref={replyFormRef}>
                {topic.is_locked ? (
                    <div style={styles.lockedMessage}><h4>Discussione Chiusa</h4></div>
                ) : (
                    <NewPostForm
                        topicId={topicId} text={replyText} setText={setReplyText} isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting} error={submitError} setError={setSubmitError} onSubmit={handleSubmitReply}
                    />
                )}
            </div>
        </div>
    );
}

export default TopicPage;