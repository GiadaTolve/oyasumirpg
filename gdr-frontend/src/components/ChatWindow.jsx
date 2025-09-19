import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { SocketContext } from '../SocketContext.jsx';
import api from '../api.js';
import ChatMessage from './ChatMessage.jsx';
import ShinigamiPanel from './ShinigamiPanel.jsx';

// --- STILI ---
const styles = {
  window: { position: 'absolute', width: '1600px', height: '810px', backgroundColor: '#121212', border: '1px solid #31323e', borderRadius: '8px', display: 'flex', flexDirection: 'column', zIndex: 100, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)', color: '#bfc0d1', resize: 'both', overflow: 'hidden' },
  header: { padding: '10px 15px', backgroundColor: '#1e202c', cursor: 'move', borderBottom: '1px solid #31323e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, fontWeight: 'bold' },
  mainContent: { display: 'flex', flexGrow: 1, height: '100%', overflow: 'hidden' },
  leftColumn: { width: '220px', flexShrink: 0, padding: '15px', borderRight: '1px solid #31323e', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(30, 32, 44, 0.4)', overflowY: 'auto' },
  rightColumn: { flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#121212' },
  messages: { flexGrow: 1, padding: '20px', overflowY: 'auto' },
  inputArea: { padding: '15px', borderTop: '1px solid #31323e', backgroundColor: '#1e202c', flexShrink: 0, position: 'relative' },
  form: { display: 'flex', gap: '10px', alignItems: 'center' },
  luogoInput: {
    background: '#31323e', border: '1px solid #4a4b57', color: '#bfc0d1', padding: '10px',
    borderRadius: '5px', fontFamily: 'inherit', fontSize: '14px', width: '200px',
    height: '42px',
    boxSizing: 'border-box',
  },
  messageInput: {
    flexGrow: 1, background: '#31323e', border: '1px solid #4a4b57', color: '#bfc0d1', padding: '10px',
    borderRadius: '5px', resize: 'vertical',
    fontFamily: 'inherit', fontSize: '14px',
    boxSizing: 'border-box',
    height: '42px', 
  },
  button: {
    padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer',
    background: `linear-gradient(45deg, #60519b, #7e6bbd)`, color: 'white', fontWeight: 'bold',
    height: '42px',
    boxSizing: 'border-box',
  },
  bottomBar: { display: 'flex', justifyContent: 'flex-start', gap: '10px', alignItems: 'center', marginTop: '15px' },
  charCounter: { position: 'absolute', bottom: '5px', right: '20px', fontSize: '10px', color: '#a4a5b9' },
  diceDropdownContainer: { position: 'relative' },
  diceDropdownMenu: { position: 'absolute', bottom: '110%', left: 0, backgroundColor: '#31323e', border: '1px solid #4a4b57', borderRadius: '5px', padding: '5px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 110 },
  iconButton: {
    backgroundColor: '#60519b',
    border: '1px solid #320d41',
    width: '42px',
    height: '42px',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '5px',
    transition: 'all 0.2s ease',
  },
  iconButtonHover: {
    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)',
    filter: 'brightness(1.1)',
  },
  icon: {
    width: '28px',
    height: '28px',
    verticalAlign: 'middle',
  },
  diceButton: {
    width: '100%', padding: '8px', cursor: 'pointer', backgroundColor: '#2a292f',
    border: '1px solid #4a4b57', color: '#bfc0d1', borderRadius: '3px',
  },
  chatImage: { 
    width: '100%', 
    height: '120px', 
    objectFit: 'cover', 
    borderRadius: '4px', 
    backgroundColor: '#121212', 
    marginBottom: '15px',
    border: '2px solid #60519b', // Bordo viola aggiunto
  },
  descriptionBox: { fontSize: '13px', color: '#bfc0d1', flexGrow: 1, lineHeight: '1.6' },
  masterNotesBox: { marginTop: '15px', display: 'flex', flexDirection: 'column' },
  masterNotesTextarea: { width: '100%', boxSizing: 'border-box', minHeight: '80px', background: '#121212', border: `1px solid #60519b`, color: '#bfc0d1', padding: '8px', borderRadius: '4px' },
  divider: { height: '1px', background: `linear-gradient(to right, transparent, #60519b, transparent)`, margin: '20px 0', border: 'none' },
  presentiBox: { backgroundColor: '#2a292f', padding: '15px', borderRadius: '5px', border: '1px solid #31323e', fontFamily: 'OpenRing, sans-serif', color: '#ffd700', fontSize: '13px'},
};

function ChatWindow({ chat, onClose, user }) {
  const socket = useContext(SocketContext);
  const [locationDetails, setLocationDetails] = useState(null);
  const [masterNotes, setMasterNotes] = useState('');
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentLuogo, setCurrentLuogo] = useState("");
  
  const [position, setPosition] = useState(null); 
  const [isDragging, setIsDragging] = useState(false);
  const [showDiceMenu, setShowDiceMenu] = useState(false);
  const [globalGifKey, setGlobalGifKey] = useState(0);
  const [isShinigamiPanelOpen, setIsShinigamiPanelOpen] = useState(false);
  const [activeQuest, setActiveQuest] = useState(null);

  const [hoverStates, setHoverStates] = useState({
    dice: false,
    shinigami: false,
    global: false,
  });

  const dragOffset = useRef({ x: 0, y: 0 });
  const diceMenuRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const windowWidth = 1600; const windowHeight = 810;
    const screenWidth = window.innerWidth; const screenHeight = window.innerHeight;
    setPosition({ x: (screenWidth - windowWidth) / 2, y: (screenHeight - windowHeight) / 1.2 });
  }, []);

  useEffect(() => {
    const fetchLocationDetails = async () => { try { const response = await api.get(`/locations/${chat.id}`); setLocationDetails(response.data); setMasterNotes(response.data.master_notes || ''); } catch (error) { console.error("Errore recupero dettagli location", error); } };
    const fetchHistory = async () => { try { const response = await api.get(`/chat/${chat.id}/history`); setMessages(response.data); } catch (error) { console.error("Impossibile caricare la cronologia", error); } };
    fetchLocationDetails(); fetchHistory();
    socket.emit('join_chat', chat.id);
    const handleNewMessage = (data) => { if (data.tipo === 'globale' || data.chatId === chat.id) setMessages(prev => [...prev, data]); };
    const handleRoomUsersUpdate = (users) => setUsersInRoom(users);
    socket.on('new_message', handleNewMessage);
    socket.on('room_users_update', handleRoomUsersUpdate);
    return () => { socket.emit('leave_chat', chat.id); socket.off('new_message', handleNewMessage); socket.off('room_users_update', handleRoomUsersUpdate); };
  }, [socket, chat.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) { container.scrollTop = container.scrollHeight; }
  }, [messages]);

  const handleSendMessage = (messageType) => {
    if (currentMessage.trim() === "") return;
    const finalMessageType = (activeQuest && ['MASTER', 'ADMIN'].includes(user.permesso) && messageType === 'azione') ? 'masterscreen' : messageType;
    
    const messageData = { 
        chatId: chat.id, 
        testo: currentMessage, 
        tipo: finalMessageType, 
        luogo: currentLuogo,
        quest_id: activeQuest ? activeQuest.questId : null 
    };
    socket.emit('send_message', messageData);
    setCurrentMessage("");
  };

  const handleFormSubmit = (e) => { e.preventDefault(); handleSendMessage('azione'); };
  
  const handleSaveNotes = async () => { try { await api.put(`/chats/${chat.id}/notes`, { master_notes: masterNotes }); alert('Note salvate!'); } catch (error) { console.error("Errore salvataggio note", error); } };
  const handleMouseDown = useCallback((e) => { setIsDragging(true); dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }, [position]);
  const handleMouseMove = useCallback((e) => { if (isDragging) setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }); }, [isDragging]);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  useEffect(() => {
    if (isDragging) { document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); }
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  const handleDiceRoll = (diceType) => { socket.emit('roll_dice', { chatId: chat.id, diceType: diceType }); setShowDiceMenu(false); };
  const handleGlobalClick = () => { handleSendMessage('globale'); setGlobalGifKey(prevKey => prevKey + 1); };
  const handleQuestStart = (questData) => { setActiveQuest(questData); setIsShinigamiPanelOpen(false); };
  const handleQuestEnd = () => { setActiveQuest(null); };

  const handleMouseEnter = (key) => setHoverStates(prev => ({ ...prev, [key]: true }));
  const handleMouseLeave = (key) => setHoverStates(prev => ({ ...prev, [key]: false }));


  if (!position) { return null; }

  return (
    <div style={{ ...styles.window, left: `${position.x}px`, top: `${position.y}px` }}>
      {isShinigamiPanelOpen && <ShinigamiPanel onClose={() => setIsShinigamiPanelOpen(false)} participants={usersInRoom} user={user} activeQuest={activeQuest} onQuestStart={handleQuestStart} onQuestEnd={handleQuestEnd} />}
      <div style={styles.header} onMouseDown={handleMouseDown}>
        <span>{locationDetails?.name || chat.name}{activeQuest && ' [QUEST ATTIVA]'}</span>
        <button onClick={() => onClose(chat.id)}>X</button>
      </div>
      <div style={styles.mainContent}>
        <div style={styles.leftColumn}>
          <img src={locationDetails?.image_url || '/placeholder.jpg'} alt={locationDetails?.name} style={styles.chatImage} />
          <div style={styles.descriptionBox}><p>{locationDetails?.description || 'Nessuna descrizione.'}</p></div>
          {['MASTER', 'ADMIN'].includes(user.permesso) && (<div style={styles.masterNotesBox}><label>Note Master:</label><textarea style={styles.masterNotesTextarea} value={masterNotes} onChange={(e) => setMasterNotes(e.target.value)}></textarea><button onClick={handleSaveNotes} style={{marginTop: '5px'}}>Salva Note</button></div>)}
          <hr style={styles.divider} /><button>Tool Chat</button><hr style={styles.divider} />
          <div style={styles.presentiBox}><strong>Presenti ({usersInRoom.length}):</strong><ul>{usersInRoom.map(u => <li key={u.id}>{u.nome_pg}</li>)}</ul></div>
        </div>

         <div style={styles.rightColumn}>
          <div style={styles.messages} ref={messagesContainerRef}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          </div>
          <div style={styles.inputArea}>
            <form onSubmit={handleFormSubmit} style={styles.form}>
                <input
                    type="text"
                    placeholder="Luogo..."
                    style={styles.luogoInput}
                    value={currentLuogo}
                    onChange={(e) => setCurrentLuogo(e.target.value)}
                />
                <textarea 
                    placeholder="Scrivi un'azione..." 
                    style={styles.messageInput} 
                    value={currentMessage} 
                    onChange={(e) => setCurrentMessage(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }}
                    rows="1"
                />
                <button type="submit" style={styles.button}>Invia</button>
            </form>
            <div style={styles.bottomBar}>
              <div style={styles.diceDropdownContainer} ref={diceMenuRef}>
                <button
                  style={{...styles.iconButton, ...(hoverStates.dice && styles.iconButtonHover)}}
                  onMouseEnter={() => handleMouseEnter('dice')}
                  onMouseLeave={() => handleMouseLeave('dice')}
                  onClick={() => setShowDiceMenu(!showDiceMenu)} title="Lancia i dadi"
                >
                    <img src="/buttons/chat/dice-cube.png" alt="Diceroller" style={styles.icon} />
                </button>
                {showDiceMenu && (
                  <div style={styles.diceDropdownMenu}>
                    <button style={styles.diceButton} onClick={() => handleDiceRoll(6)}>D6</button>
                    <button style={styles.diceButton} onClick={() => handleDiceRoll(10)}>D10</button>
                    <button style={styles.diceButton} onClick={() => handleDiceRoll(20)}>D20</button>
                    <button style={styles.diceButton} onClick={() => handleDiceRoll(100)}>D100</button>
                  </div>
                )}
              </div>
              
              {['MASTER', 'ADMIN'].includes(user.permesso) && (
                <button
                  title="Modalità Shinigami"
                  style={{...styles.iconButton, ...(hoverStates.shinigami && styles.iconButtonHover)}}
                  onMouseEnter={() => handleMouseEnter('shinigami')}
                  onMouseLeave={() => handleMouseLeave('shinigami')}
                  onClick={() => setIsShinigamiPanelOpen(true)}
                >
                    <img src="/buttons/chat/shinigamitool.png" alt="Modalità Shinigami" style={styles.icon} />
                </button>
              )}
              
              {user.permesso === 'ADMIN' && (
                <button
                  title="Messaggio Globale"
                  style={{...styles.iconButton, ...(hoverStates.global && styles.iconButtonHover)}}
                  onMouseEnter={() => handleMouseEnter('global')}
                  onMouseLeave={() => handleMouseLeave('global')}
                  onClick={handleGlobalClick}
                >
                    <img src="/buttons/chat/mondalmessage.png" key={globalGifKey} alt="Messaggio Globale" style={styles.icon} />
                </button>
              )}
              <span style={styles.charCounter}>{currentMessage.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;

