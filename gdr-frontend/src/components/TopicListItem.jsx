import React from 'react';
import { Link } from 'react-router-dom';
import NewIndicator from './NewIndicator'; 

const styles = {
    listItem: { borderBottom: '1px solid #31323e', listStyle: 'none' },
    topicRow: { display: 'flex', alignItems: 'center', padding: '15px', flexWrap: 'wrap' },
    topicTitleContainer: { flexGrow: 1, display: 'flex', alignItems: 'center', gap: '10px' },
    titleIcon: { width: '16px', height: '16px', verticalAlign: 'middle' },
    topicTitleLink: { display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' },
    topicInfo: { fontSize: '0.8rem', color: '#a4a5b9', padding: '0 15px' },
    adminActions: { marginLeft: 'auto', display: 'flex', gap: '8px' },
    iconButton: {
        background: 'rgba(49, 50, 60, 0.5)',
        border: '1px solid #4a4b57',
        padding: '6px',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
    },
    icon: {
        width: '18px',
        height: '18px',
    },
};

// --- Stile per l'effetto al passaggio del mouse e al click ---
const handleMouseOver = (e) => {
    e.currentTarget.style.backgroundColor = 'rgba(96, 81, 155, 0.5)';
    e.currentTarget.style.borderColor = '#7e6bbd';
};
const handleMouseOut = (e, isLiked) => {
    if (!isLiked) {
        e.currentTarget.style.backgroundColor = 'rgba(49, 50, 60, 0.5)';
        e.currentTarget.style.borderColor = '#4a4b57';
    }
};
const handleMouseDown = (e) => {
    e.currentTarget.style.transform = 'scale(0.95)';
};
const handleMouseUp = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
};


function TopicListItem({ topic, user, onPinToggle, onDeleteTopic }) {
    const formatDate = (dateString) => new Date(dateString).toLocaleString('it-IT');

    return (
        <li style={styles.listItem}>
            <div style={styles.topicRow}>
                <div style={styles.topicTitleContainer}>
                    
                {topic.is_pinned ? <img src="/icone/ui-forum/pinned.png" alt="Pinned" style={styles.titleIcon} /> : null}
                    
                    <Link to={`/forum/topic/${topic.id}`} style={styles.topicTitle}>
                        
                        {topic.is_locked ? <img src="/icone/ui-forum/locked.png" alt="Locked" style={{...styles.titleIcon, marginRight: '8px'}} /> : null}
                        {topic.titolo}
                    </Link>
                    {topic.has_new_posts ? <NewIndicator /> : null}

                </div>
                
                <div style={{...styles.topicInfo, width: '150px'}}>
                    <div>di: <strong>{topic.autore_nome}</strong></div>
                    <div>{formatDate(topic.timestamp_creazione)}</div>
                </div>
                
                <div style={{...styles.topicInfo, width: '100px'}}>
                    <div>Risposte: {Math.max(0, topic.post_count - 1)}</div>
                </div>

                <div style={{...styles.topicInfo, width: '150px'}}>
                    <div>Ultimo post di:</div>
                    <strong>{topic.ultimo_post_autore || 'N/A'}</strong>
                    <div>{formatDate(topic.ultimo_post_timestamp)}</div>
                </div>
                
                <div style={styles.adminActions}>
                    {user.permesso === 'ADMIN' && (
                        <>
                            <button 
                                style={styles.iconButton}
                                onMouseOver={handleMouseOver} onMouseOut={(e) => handleMouseOut(e, false)}
                                onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                                onClick={() => onPinToggle(topic.id, !topic.is_pinned)}
                                title={topic.is_pinned ? 'Sblocca Discussione' : 'Fissa Discussione'}
                            >
                                <img src="/icone/ui-forum/pinned.png" alt="Fissa" style={styles.icon} />
                            </button>
                            <button
                                style={styles.iconButton}
                                onMouseOver={handleMouseOver} onMouseOut={(e) => handleMouseOut(e, false)}
                                onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
                                onClick={() => onDeleteTopic(topic.id)}
                                title="Elimina Discussione"
                            >
                                <img src="/icone/ui-forum/trash.png" alt="Elimina" style={styles.icon} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

export default TopicListItem;