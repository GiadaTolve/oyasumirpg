import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// --- STILI ---
const styles = {
  panelWrapper: { width: '100%', height: '100%', backgroundColor: 'rgba(23, 23, 23, 0.9)', display: 'flex', fontFamily: "'Work Sans', sans-serif", borderRadius: '5px', overflow: 'hidden' },
  nav: { width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '15px', borderRight: '1px solid #320d41' },
  navButton: { width: '90%', padding: '15px 20px', backgroundColor: '#2a292f', color: '#a4a5b9', border: '1px solid #31323e', borderRadius: '3px', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease-in-out' },
  activeNavButton: { backgroundColor: '#1a1a1a', color: 'white', border: '1px solid #60519b' },
  content: { flexGrow: 1, padding: '30px 40px', height: '100%', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'auto' },
  contentTitle: { fontFamily: "'GoatFont', sans-serif", color: '#e6e0ff', fontSize: '2.5em', borderBottom: '1px solid #60519b', paddingBottom: '10px', marginBottom: '20px' },
  dropzoneActive: { backgroundColor: 'rgba(96, 81, 155, 0.3)' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#a4a5b9', marginTop: '20px', backgroundColor: 'rgba(42, 41, 47, 0.5)' },
  thTd: { border: '1px solid #444', padding: '12px', textAlign: 'left' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px', background: '#3c3c3c', border: '1px solid #555', color: 'white', borderRadius: '3px' },
  button: { padding: '10px 15px', border: '1px solid #60519b', borderRadius: '3px', cursor: 'pointer', backgroundColor: '#60519b', color: 'white', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  modalContent: { background: '#2d2d2d', border: '1px solid #60519b', padding: '30px', borderRadius: '3px', width: '450px' },
  tabsContainer: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #31323e', paddingBottom: '20px' },
  actionButton: { padding: '10px 15px', border: '1px solid #60519b', borderRadius: '3px', cursor: 'pointer', backgroundColor: '#60519b', color: 'white', fontWeight: 'bold', marginBottom: '20px' },
  filterContainer: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' },
  label: { display: 'block', marginBottom: '5px', color: '#ccc' },
  formGroup: { marginBottom: '15px' },
  playlistContainer: { marginTop: '20px' },
  playlistButton: { width: '100%', padding: '15px', background: '#2a292f', border: '1px solid #31323e', color: '#bfc0d1', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  activePlaylistButton: { background: '#60519b', color: 'white' },
  songList: { padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid #31323e', borderTop: 'none' },
  songItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #252526' },
};


// --- INIZIO SOTTCOMPOMENTI ---

const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...user, password: '' });
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSave = () => onSave(formData);
  return ( <div style={styles.modalOverlay}><div style={styles.modalContent}><h3>Modifica Utente: {user.nome_pg}</h3><div style={styles.formGroup}><label style={styles.label}>Nome PG</label><input style={styles.input} type="text" name="nome_pg" value={formData.nome_pg} onChange={handleChange} /></div><div style={styles.formGroup}><label style={styles.label}>Email</label><input style={styles.input} type="email" name="email" value={formData.email} onChange={handleChange} /></div><div style={styles.formGroup}><label style={styles.label}>Permesso</label><select name="permesso" value={formData.permesso} onChange={handleChange} style={styles.input}><option value="PLAYER">UTENTE</option><option value="MASTER">SHINIGAMI</option><option value="MOD">MOD</option><option value="ADMIN">ADMIN</option></select></div><div style={styles.formGroup}><label style={styles.label}>Nuova Password</label><input style={styles.input} type="password" name="password" value={formData.password} onChange={handleChange} /></div><button style={styles.button} onClick={handleSave}>Salva</button><button style={{ ...styles.button, marginLeft: '10px', backgroundColor: '#555' }} onClick={onClose}>Annulla</button></div></div> );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const fetchUsers = useCallback(async () => { try { const res = await api.get('/admin/users'); setUsers(res.data); } catch (e) { console.error(e); } }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const handleSaveUser = async (userData) => { try { await api.put(`/admin/users/${userData.id_utente}`, userData); setEditingUser(null); fetchUsers(); } catch (e) { console.error(e); } };
  return ( <div><table style={styles.table}><thead><tr><th style={styles.thTd}>ID</th><th style={styles.thTd}>Nome PG</th><th style={styles.thTd}>Email</th><th style={styles.thTd}>Permesso</th><th style={styles.thTd}>Azioni</th></tr></thead><tbody>{users.map(user => (<tr key={user.id_utente}><td style={styles.thTd}>{user.id_utente}</td><td style={styles.thTd}>{user.nome_pg}</td><td style={styles.thTd}>{user.email}</td><td style={styles.thTd}>{user.permesso}</td><td style={styles.thTd}><button style={styles.button} onClick={() => setEditingUser(user)}>Modifica</button></td></tr>))}</tbody></table>{editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}</div> );
};

const LogViewer = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [logs, setLogs] = useState([]);
  useEffect(() => { const fetchRooms = async () => { try { const res = await api.get('/admin/chat-rooms'); setChatRooms(res.data); if (res.data.length > 0) setSelectedChat(res.data[0].id); } catch (e) { console.error(e); } }; fetchRooms(); }, []);
  const fetchLogs = useCallback(async () => { if (!selectedChat || !selectedDate) return; try { const res = await api.get('/admin/logs', { params: { chatId: selectedChat, date: selectedDate } }); setLogs(res.data); } catch (e) { console.error(e); setLogs([]); } }, [selectedChat, selectedDate]);
  return ( <div><div style={styles.filterContainer}><label>Chat Room:</label><select style={styles.input} value={selectedChat} onChange={e => setSelectedChat(e.target.value)}>{chatRooms.map(room => (<option key={room.id} value={room.id}>{room.name}</option>))}</select><label>Data:</label><input style={styles.input} type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /><button style={styles.button} onClick={fetchLogs}>Filtra</button></div><table style={styles.table}><thead><tr><th style={styles.thTd}>Ora</th><th style={styles.thTd}>Autore</th><th style={styles.thTd}>Tipo</th><th style={styles.thTd}>Testo</th></tr></thead><tbody>{logs.length > 0 ? logs.map(log => (<tr key={log.id}><td style={styles.thTd}>{new Date(log.timestamp).toLocaleTimeString()}</td><td style={styles.thTd}>{log.autore}</td><td style={styles.thTd}>{log.tipo}</td><td style={styles.thTd}>{log.testo}</td></tr>)) : (<tr><td colSpan="4" style={{...styles.thTd, textAlign: 'center'}}>Nessun log.</td></tr>)}</tbody></table></div> );
};

const LocationEditorModal = ({ location, onSave, onCancel }) => {
  const [formData, setFormData] = useState(location);
  const handleChange = (e) => { const { name, value } = e.target; const finalValue = ['pos_x', 'pos_y'].includes(name) ? Number(value) : value; setFormData(prev => ({ ...prev, [name]: finalValue })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return ( <div style={styles.modalOverlay} onClick={onCancel}><div style={styles.modalContent} onClick={e => e.stopPropagation()}><h3>Modifica: {location.name}</h3><form onSubmit={handleSubmit}><div style={styles.formGroup}><label style={styles.label}>Nome</label><input style={styles.input} type="text" name="name" value={formData.name} onChange={handleChange} required /></div><div style={styles.formGroup}><label style={styles.label}>URL Immagine</label><input style={styles.input} type="text" name="image_url" value={formData.image_url || ''} onChange={handleChange} /></div>{formData.type === 'MAP' && (<div style={styles.formGroup}><label style={styles.label}>Prefettura (es. Tokyo)</label><input style={styles.input} type="text" name="prefecture" value={formData.prefecture || ''} onChange={handleChange} /></div>)}<div style={styles.formGroup}><label style={styles.label}>Descrizione</label><textarea style={{...styles.input, minHeight: '80px'}} name="description" value={formData.description || ''} onChange={handleChange}></textarea></div><div style={{...styles.formGroup, display: 'flex', gap: '20px'}}><div><label style={styles.label}>Posizione X (%)</label><input style={styles.input} type="number" name="pos_x" value={formData.pos_x} onChange={handleChange} /></div><div><label style={styles.label}>Posizione Y (%)</label><input style={styles.input} type="number" name="pos_y" value={formData.pos_y} onChange={handleChange} /></div></div><button type="submit" style={styles.button}>Salva</button><button type="button" style={{...styles.button, marginLeft: '10px', backgroundColor: '#555'}} onClick={onCancel}>Annulla</button></form></div></div> );
};

const LocationCreator = ({ parentId, onCreate }) => {
    const [formData, setFormData] = useState({ name: '', type: 'CHAT', imageUrl: '', description: '', posX: 50, posY: 50, prefecture: '' });
    const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleSubmit = (e) => { e.preventDefault(); onCreate({ parent_id: parentId, ...formData }); setFormData({ name: '', type: 'CHAT', imageUrl: '', description: '', posX: 50, posY: 50, prefecture: '' }); };
    return ( <form onSubmit={handleSubmit} style={{padding: '10px', margin: '10px 0', background: 'rgba(0,0,0,0.2)', borderRadius: '5px'}}><div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}><select name="type" value={formData.type} onChange={handleChange} style={{...styles.input, width: 'auto'}}><option value="MAP">Mappa</option><option value="CHAT">Chat</option></select><input style={{...styles.input, flexGrow: 1}} type="text" name="name" placeholder="Nome" value={formData.name} onChange={handleChange} required /><button type="submit" style={styles.button}>Crea</button></div></form> );
};

const LocationNode = ({ node, index, onCreate, onDelete, onEdit }) => {
    const [showCreator, setShowCreator] = useState(false);
    return ( <Draggable draggableId={String(node.id)} index={index}>{(provided, snapshot) => (<div ref={provided.innerRef} {...provided.draggableProps} style={{ padding: '15px', border: '1px solid #444', marginBottom: '10px', backgroundColor: snapshot.isDragging ? '#4a4b57' : (node.type === 'MAP' ? 'rgba(96, 81, 155, 0.2)' : 'rgba(0, 0, 0, 0.2)'), ...provided.draggableProps.style }}><div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}><span {...provided.dragHandleProps} style={{fontWeight: 'bold', cursor: 'grab'}}>{node.name} <span style={{fontWeight: 'normal'}}>({node.type})</span></span><div style={{display: 'flex', gap: '10px'}}><button onClick={() => onEdit(node)} style={{...styles.button, backgroundColor: '#3c3c3c'}}>Modifica</button><button onClick={() => setShowCreator(!showCreator)} style={{...styles.button, backgroundColor: '#3c3c3c'}}>{showCreator ? 'Annulla' : 'Aggiungi Figlio'}</button><button onClick={() => onDelete(node.id)} style={{...styles.button, backgroundColor: '#8b0000'}}>Elimina</button></div></div>{showCreator && <LocationCreator parentId={node.id} onCreate={(data) => { onCreate(data); setShowCreator(false); }} />}{node.type === 'MAP' && (<Droppable droppableId={String(node.id)} type="LOCATION">{(dropProvided, dropSnapshot) => (<div ref={dropProvided.innerRef} {...dropProvided.droppableProps} style={{ padding: '10px', marginTop: '10px', minHeight: '50px', transition: 'background-color 0.2s ease', backgroundColor: dropSnapshot.isDraggingOver ? styles.dropzoneActive.backgroundColor : 'transparent' }}>{node.children && node.children.map((child, childIndex) => (<LocationNode key={child.id} node={child} index={childIndex} onCreate={onCreate} onDelete={onDelete} onEdit={onEdit} />))}{dropProvided.placeholder}</div>)}</Droppable>)}</div>)}</Draggable> );
};

const MapManagement = () => {
    const [locations, setLocations] = useState([]);
    const [editingLocation, setEditingLocation] = useState(null);
    const buildTree = (list) => { const map = {}; const roots = []; if (!list) return roots; list.forEach(item => { map[item.id] = { ...item, children: [] }; }); list.forEach(item => { if (item.parent_id !== null && map[item.parent_id]) { map[item.parent_id].children.push(map[item.id]); } else { roots.push(map[item.id]); } }); return roots; };
    const fetchLocations = useCallback(async () => { try { const res = await api.get('/admin/locations'); setLocations(res.data); } catch (e) { console.error(e); } }, []);
    useEffect(() => { fetchLocations(); }, [fetchLocations]);
    const onDragEnd = async (result) => { const { destination, source, draggableId } = result; if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return; const locationId = draggableId; const newParentId = destination.droppableId === 'root-dropzone' ? null : destination.droppableId; try { await api.put(`/admin/locations/${locationId}/parent`, { newParentId }); fetchLocations(); } catch (error) { console.error("Errore spostamento:", error); alert("Spostamento non riuscito."); } };
    const handleCreate = async (data) => { try { await api.post('/admin/locations', data); fetchLocations(); } catch (e) { console.error(e); } };
    const handleDelete = async (id) => { if (window.confirm("Sei sicuro? L'azione è irreversibile e cancellerà TUTTI i figli.")) { try { await api.delete(`/admin/locations/${id}`); fetchLocations(); } catch(e) { console.error(e); } } };
    const handleSave = async (data) => { try { await api.put(`/admin/locations/${data.id}`, data); setEditingLocation(null); fetchLocations(); } catch (e) { console.error(e); } };
    const tree = buildTree(locations);
    return ( <DragDropContext onDragEnd={onDragEnd}><div>{editingLocation && <LocationEditorModal location={editingLocation} onSave={handleSave} onCancel={() => setEditingLocation(null)} />}<h3>Crea Nuova Mappa Radice</h3><LocationCreator parentId={null} onCreate={handleCreate} /><hr style={{borderColor: '#444', margin: '30px 0'}}/><h3>Struttura Esistente (Trascina per spostare)</h3><Droppable droppableId="root-dropzone" type="LOCATION">{(provided, snapshot) => (<div ref={provided.innerRef} {...provided.droppableProps} style={{ padding: '10px', border: '2px dashed #444', minHeight: '100px', backgroundColor: snapshot.isDraggingOver ? styles.dropzoneActive.backgroundColor : 'transparent' }}>{tree.map((node, index) => ( <LocationNode key={node.id} node={node} index={index} onCreate={handleCreate} onDelete={handleDelete} onEdit={setEditingLocation} /> ))}{provided.placeholder}</div>)}</Droppable></div></DragDropContext> );
};

const SezioneEditor = ({ sezione, onSave, onCancel }) => {
  const [formData, setFormData] = useState(sezione.id ? sezione : { nome: '', descrizione: '', ordine: 0 }); const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value }); const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (<div style={styles.modalOverlay}><div style={styles.modalContent} onClick={e => e.stopPropagation()}><h3>{sezione.id ? 'Modifica' : 'Nuova'} Sezione</h3><form onSubmit={handleSubmit}><div style={styles.formGroup}><label>Nome</label><input style={styles.input} type="text" name="nome" value={formData.nome} onChange={handleChange} required /></div><div style={styles.formGroup}><label>Descrizione</label><input style={styles.input} type="text" name="descrizione" value={formData.descrizione || ''} onChange={handleChange} /></div><div style={styles.formGroup}><label>Ordine</label><input style={styles.input} type="number" name="ordine" value={formData.ordine} onChange={handleChange} /></div><button type="submit" style={styles.button}>Salva</button><button type="button" style={{...styles.button, marginLeft: '10px', backgroundColor: '#555'}} onClick={onCancel}>Annulla</button></form></div></div>);
};

const BachecaEditor = ({ bacheca, sezioniDisponibili, onSave, onCancel }) => {
  const [formData, setFormData] = useState(bacheca.id ? bacheca : { nome: '', descrizione: '', ordine: 0, sezione_id: sezioniDisponibili[0]?.id }); const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value }); const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return (<div style={styles.modalOverlay}><div style={styles.modalContent} onClick={e => e.stopPropagation()}><h3>{bacheca.id ? 'Modifica' : 'Nuova'} Bacheca</h3><form onSubmit={handleSubmit}><div style={styles.formGroup}><label>Sezione</label><select name="sezione_id" value={formData.sezione_id} onChange={handleChange} style={styles.input} required>{sezioniDisponibili.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div><div style={styles.formGroup}><label>Nome</label><input style={styles.input} type="text" name="nome" value={formData.nome} onChange={handleChange} required /></div><div style={styles.formGroup}><label>Descrizione</label><input style={styles.input} type="text" name="descrizione" value={formData.descrizione || ''} onChange={handleChange} /></div><div style={styles.formGroup}><label>Ordine</label><input style={styles.input} type="number" name="ordine" value={formData.ordine} onChange={handleChange} /></div><button type="submit" style={styles.button}>Salva</button><button type="button" style={{...styles.button, marginLeft: '10px', backgroundColor: '#555'}} onClick={onCancel}>Annulla</button></form></div></div>);
};

const BachecheManager = ({ sezioniDisponibili }) => {
  const [bacheche, setBacheche] = useState([]); const [editingBacheca, setEditingBacheca] = useState(null);
  const fetchBacheche = useCallback(async () => { try { const res = await api.get('/admin/forum/bacheche'); setBacheche(res.data); } catch (e) { console.error(e) } }, []); useEffect(() => { fetchBacheche() }, [fetchBacheche]);
  const handleSave = async (data) => { const url = data.id ? `/admin/forum/bacheche/${data.id}` : '/admin/forum/bacheche'; const method = data.id ? 'put' : 'post'; try { await api[method](url, data); setEditingBacheca(null); fetchBacheche(); } catch (e) { alert('Errore'); } };
  const handleDelete = async (id) => { if(window.confirm('Sei sicuro?')) { await api.delete(`/admin/forum/bacheche/${id}`); fetchBacheche(); } };
  return (<div>{editingBacheca && <BachecaEditor bacheca={editingBacheca} sezioniDisponibili={sezioniDisponibili} onSave={handleSave} onCancel={() => setEditingBacheca(null)} />}<button style={styles.actionButton} onClick={() => setEditingBacheca({})}>+ Nuova Bacheca</button><table style={styles.table}><thead><tr><th>Nome</th><th>Sezione</th><th>Azioni</th></tr></thead><tbody>{bacheche.map(b => <tr key={b.id}><td>{b.nome}</td><td>{b.sezione_nome}</td><td><button style={styles.button} onClick={() => setEditingBacheca(b)}>Modifica</button><button style={{...styles.button, marginLeft: '10px'}} onClick={() => handleDelete(b.id)}>Elimina</button></td></tr>)}</tbody></table></div>);
};

const SezioniManager = ({ sezioni, onUpdate }) => {
  const [editingSezione, setEditingSezione] = useState(null);
  const handleSave = async (data) => { const url = data.id ? `/admin/forum/sezioni/${data.id}` : '/admin/forum/sezioni'; const method = data.id ? 'put' : 'post'; try { await api[method](url, data); setEditingSezione(null); onUpdate(); } catch (e) { alert('Errore'); } };
  const handleDelete = async (id) => { if(window.confirm('Sei sicuro?')) { await api.delete(`/admin/forum/sezioni/${id}`); onUpdate(); } };
  return (<div>{editingSezione && <SezioneEditor sezione={editingSezione} onSave={handleSave} onCancel={() => setEditingSezione(null)} />}<button style={styles.actionButton} onClick={() => setEditingSezione({})}>+ Nuova Sezione</button><table style={styles.table}><thead><tr><th>Nome</th><th>Descrizione</th><th>Azioni</th></tr></thead><tbody>{sezioni.map(s => <tr key={s.id}><td>{s.nome}</td><td>{s.descrizione}</td><td><button style={styles.button} onClick={() => setEditingSezione(s)}>Modifica</button><button style={{...styles.button, marginLeft: '10px'}} onClick={() => handleDelete(s.id)}>Elimina</button></td></tr>)}</tbody></table></div>);
};

const ForumManagement = () => {
  const [activeTab, setActiveTab] = useState('bacheche'); const [sezioni, setSezioni] = useState([]);
  const fetchSezioni = useCallback(async () => { try { const res = await api.get('/admin/forum/sezioni'); setSezioni(res.data); } catch (e) { console.error(e); } }, []); useEffect(() => { fetchSezioni(); }, [fetchSezioni]);
  const getTabButtonStyle = (tabName) => ({ ...styles.navButton, ...(activeTab === tabName ? styles.activeNavButton : {}) });
  return (<div><div style={styles.tabsContainer}><button style={getTabButtonStyle('bacheche')} onClick={() => setActiveTab('bacheche')}>Gestione Bacheche</button><button style={getTabButtonStyle('sezioni')} onClick={() => setActiveTab('sezioni')}>Gestione Sezioni</button></div>{activeTab === 'bacheche' ? <div key="bacheche-manager"><BachecheManager sezioniDisponibili={sezioni} /></div> : <div key="sezioni-manager"><SezioniManager sezioni={sezioni} onUpdate={fetchSezioni} /></div>}</div>);
};

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const fetchBanners = useCallback(async () => { try { const response = await api.get('/admin/banners'); setBanners(response.data); } catch (error) { console.error(error); } }, []);
  useEffect(() => { fetchBanners(); }, [fetchBanners]);
  const handleSave = async (bannerData) => { const data = { ...bannerData, is_active: bannerData.is_active ? 1 : 0 }; const method = data.id ? 'put' : 'post'; const url = data.id ? `/admin/banners/${data.id}` : '/admin/banners'; try { await api[method](url, data); setEditingBanner(null); fetchBanners(); } catch (error) { alert("Errore nel salvataggio del banner."); } };
  const handleDelete = async (id) => { if (window.confirm("Sei sicuro?")) { try { await api.delete(`/admin/banners/${id}`); fetchBanners(); } catch (error) { alert("Errore nell'eliminazione."); } } };
  return ( <div><button style={styles.actionButton} onClick={() => setEditingBanner({})}>+ Nuovo Banner</button><table style={styles.table}><thead><tr><th style={styles.thTd}>Titolo</th><th style={styles.thTd}>Attivo</th><th style={styles.thTd}>Azioni</th></tr></thead><tbody>{banners.map(b => (<tr key={b.id}><td style={styles.thTd}>{b.title}</td><td style={styles.thTd}>{b.is_active ? 'Sì' : 'No'}</td><td style={styles.thTd}><button style={styles.button} onClick={() => setEditingBanner(b)}>Modifica</button><button style={{...styles.button, marginLeft: '10px', backgroundColor: '#8b0000'}} onClick={() => handleDelete(b.id)}>Elimina</button></td></tr>))}</tbody></table>{editingBanner && <BannerEditorModal banner={editingBanner} onSave={handleSave} onCancel={() => setEditingBanner(null)} />}</div> );
};

const BannerEditorModal = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState(banner.id ? banner : { title: 'Banner', image_url: '/placeholder.jpg', is_active: false });
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return ( <div style={styles.modalOverlay}><div style={styles.modalContent}><h3>{banner.id ? 'Modifica Banner' : 'Nuovo Banner'}</h3><form onSubmit={handleSubmit}><div style={styles.formGroup}><label>Titolo</label><input style={styles.input} type="text" name="title" value={formData.title} onChange={handleChange} /></div><div style={styles.formGroup}><label>URL Immagine</label><input style={styles.input} type="text" name="image_url" value={formData.image_url} onChange={handleChange} /></div><div style={styles.formGroup}><label>URL Link</label><input style={styles.input} type="text" name="link_url" value={formData.link_url || ''} onChange={handleChange} /></div><div style={styles.formGroup}><label><input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} /> Attivo</label></div><button type="submit" style={styles.button}>Salva</button><button type="button" style={{...styles.button, marginLeft: '10px'}} onClick={onCancel}>Annulla</button></form></div></div> );
};

const DailyEventModal = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState(event || { event_date: '', title: '', description: '' });
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  return ( <div style={styles.modalOverlay} onClick={onCancel}><div style={styles.modalContent} onClick={e => e.stopPropagation()}><h3>{event ? 'Modifica Evento' : 'Crea Nuovo Evento'}</h3><form onSubmit={handleSubmit}><div style={styles.formGroup}><label>Data (YYYY-MM-DD)</label><input style={styles.input} type="date" name="event_date" value={formData.event_date} onChange={handleChange} required /></div><div style={styles.formGroup}><label>Titolo</label><input style={styles.input} type="text" name="title" value={formData.title} onChange={handleChange} required /></div><div style={styles.formGroup}><label>Descrizione</label><textarea style={{...styles.input, minHeight: '100px'}} name="description" value={formData.description} onChange={handleChange} required></textarea></div><button type="submit" style={styles.button}>Salva</button><button type="button" style={{...styles.button, marginLeft: '10px'}} onClick={onCancel}>Annulla</button></form></div></div> );
};

const DailyEventsManagement = ({ events, onEdit, onDelete, onNew }) => {
  return ( <div><button style={styles.actionButton} onClick={onNew}>+ Crea Nuovo Evento</button><table style={styles.table}><thead><tr><th style={styles.thTd}>Data</th><th style={styles.thTd}>Titolo</th><th style={styles.thTd}>Azioni</th></tr></thead><tbody>{events && events.length > 0 ? ( events.map(event => (<tr key={event.id}><td style={styles.thTd}>{event.event_date}</td><td style={styles.thTd}>{event.title}</td><td style={styles.thTd}><button style={styles.button} onClick={() => onEdit(event)}>Modifica</button><button style={{...styles.button, marginLeft: '10px'}} onClick={() => onDelete(event.id)}>Elimina</button></td></tr>)) ) : ( <tr><td colSpan="3" style={{textAlign: 'center'}}>Nessun evento.</td></tr> )}</tbody></table></div> );
};

const SongEditorModal = ({ song, onSave, onCancel, playlists }) => {
  const isEditing = !!song.id;
  const [formData, setFormData] = useState(isEditing ? song : { playlist_id: playlists[0]?.id || '', title: '', source_type: 'youtube', url: '', cover_image_url: '' });
  const handleChange = e => setFormData({...formData, [e.target.name]: e.target.value});
  const handleSubmit = e => { e.preventDefault(); onSave(formData); };
  return ( <div style={styles.modalOverlay}><div style={styles.modalContent}><h3>{isEditing ? 'Modifica Canzone' : 'Aggiungi Canzone'}</h3><form onSubmit={handleSubmit}><div style={styles.formGroup}><label>Playlist</label><select name="playlist_id" value={formData.playlist_id} onChange={handleChange} style={styles.input}>{playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div style={styles.formGroup}><label>Titolo</label><input style={styles.input} type="text" name="title" value={formData.title} onChange={handleChange} required/></div><div style={styles.formGroup}><label>Tipo</label><select name="source_type" value={formData.source_type} onChange={handleChange} style={styles.input}><option value="youtube">YouTube</option><option value="mp3">MP3 Link</option></select></div><div style={styles.formGroup}><label>URL</label><input style={styles.input} type="text" name="url" value={formData.url} onChange={handleChange} required/></div><div style={styles.formGroup}><label>URL Copertina</label><input style={styles.input} type="text" name="cover_image_url" value={formData.cover_image_url || ''} onChange={handleChange} /></div><button type="submit" style={styles.button}>{isEditing ? 'Salva' : 'Aggiungi'}</button><button type="button" style={{...styles.button, marginLeft: '10px'}} onClick={onCancel}>Annulla</button></form></div></div> );
};

const MusicManagement = () => {
  const [playlists, setPlaylists] = useState([]);
  const [songsByPlaylist, setSongsByPlaylist] = useState({});
  const [editingSong, setEditingSong] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const fetchPlaylistsAndSongs = useCallback(async () => { try { const pls = await api.get('/playlists'); setPlaylists(pls.data); const sgs = {}; for (const p of pls.data) { const res = await api.get(`/playlists/${p.id}/songs`); sgs[p.id] = res.data; } setSongsByPlaylist(sgs); } catch (e) { console.error(e); } }, []);
  useEffect(() => { fetchPlaylistsAndSongs(); }, [fetchPlaylistsAndSongs]);
  const handleAddPlaylist = async () => { const n = prompt("Nome:"); if (n) { await api.post('/admin/playlists', { name: n }); fetchPlaylistsAndSongs(); } };
  const handleSaveSong = async (d) => { const m = d.id ? 'put' : 'post'; const u = d.id ? `/admin/songs/${d.id}` : '/admin/songs'; try { await api[m](u, d); setEditingSong(null); fetchPlaylistsAndSongs(); } catch(e) { alert("Errore."); } };
  const handleDeleteSong = async (id) => { if(window.confirm("Sicuro?")) { await api.delete(`/admin/songs/${id}`); fetchPlaylistsAndSongs(); } };
  const togglePlaylist = (id) => setActivePlaylistId(p => (p === id ? null : id));
  return (
      <div>
          {editingSong && <SongEditorModal song={editingSong} onSave={handleSaveSong} onCancel={() => setEditingSong(null)} playlists={playlists} />}
          <div style={{display: 'flex', gap: '15px'}}><button style={styles.actionButton} onClick={handleAddPlaylist}>+ Playlist</button><button style={styles.actionButton} onClick={() => setEditingSong({})}>+ Canzone</button></div>
          <div style={styles.playlistContainer}><h3>Playlists</h3>{playlists.map(p => (<div key={p.id}><button style={activePlaylistId === p.id ? {...styles.playlistButton, ...styles.activePlaylistButton} : styles.playlistButton} onClick={() => togglePlaylist(p.id)}><span>{p.name}</span><span>{activePlaylistId === p.id ? '−' : '+'}</span></button>{activePlaylistId === p.id && (<div style={styles.songList}>{songsByPlaylist[p.id]?.length > 0 ? (songsByPlaylist[p.id].map(s => (<div key={s.id} style={styles.songItem}><span>{s.title}</span><div><button onClick={() => setEditingSong(s)}>Modifica</button><button onClick={() => handleDeleteSong(s.id)}>Elimina</button></div></div>))) : ( <p>Nessuna canzone.</p> )}</div>)}</div>))}</div>
      </div>
  );
};


// --- COMPONENTE PRINCIPALE: GESTIONE ---
function Gestione({ user }) {
  // --- MODIFICA 1: LOGICA PER DETERMINARE I MODULI VISIBILI ---
  const getVisibleModules = () => {
    const allModules = [
      { id: 'users', label: 'Utenti', roles: ['ADMIN','MOD',] },
      { id: 'maps', label: 'Mappe', roles: ['ADMIN', 'MASTER'] },
      { id: 'logs', label: 'Log Chat', roles: ['ADMIN', 'MASTER', 'MOD',] },
      { id: 'forum', label: 'Forum', roles: ['ADMIN', 'MOD'] },
      { id: 'banners', label: 'Banner', roles: ['ADMIN', 'MOD',] },
      { id: 'music', label: 'Musica', roles: ['ADMIN', 'MOD',] },
      { id: 'events', label: 'Eventi', roles: ['ADMIN', 'MOD',] }
    ];

    return allModules.filter(module => module.roles.includes(user?.permesso));
  };

  const visibleModules = getVisibleModules();
  
  // --- MODIFICA 2: IMPOSTA LO STATO INIZIALE CORRETTAMENTE ---
  const [activeModule, setActiveModule] = useState(visibleModules[0]?.id || null);
  
  const [dailyEvents, setDailyEvents] = useState([]);
  const [selectedDailyEvent, setSelectedDailyEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const fetchDailyEvents = useCallback(async () => { try { const response = await api.get('/admin/daily-events'); setDailyEvents(response.data); } catch (err) { console.error(err); } }, []);
  useEffect(() => { if (activeModule === 'events') { fetchDailyEvents(); } }, [activeModule, fetchDailyEvents]);
  const handleSaveDailyEvent = async (eventData) => { const isEditing = !!eventData.id; const method = isEditing ? 'put' : 'post'; const url = isEditing ? `/admin/daily-events/${eventData.id}` : '/admin/daily-events'; try { await api[method](url, eventData); fetchDailyEvents(); setShowEventModal(false); } catch (err) { alert(err.response?.data?.message || "Errore."); } };
  const handleDeleteDailyEvent = async (eventId) => { if (window.confirm("Sei sicuro?")) { try { await api.delete(`/admin/daily-events/${eventId}`); fetchDailyEvents(); } catch (err) { alert("Errore."); } } };

  const renderModule = () => {
    // Aggiungiamo un controllo per sicurezza
    if (!visibleModules.find(m => m.id === activeModule)) return null;

    switch (activeModule) {
      case 'users': return (<div><h2 style={styles.contentTitle}>Gestione Utenti</h2><UserManagement /></div>);
      case 'logs': return (<div><h2 style={styles.contentTitle}>Visualizzatore Log</h2><LogViewer /></div>);
      case 'maps': return (<div><h2 style={styles.contentTitle}>Gestione Mappe</h2><MapManagement /></div>);
      case 'forum': return (<div><h2 style={styles.contentTitle}>Gestione Forum</h2><ForumManagement /></div>);
      case 'banners': return (<div><h2 style={styles.contentTitle}>Gestione Banner</h2><BannerManagement /></div>);
      case 'music': return (<div><h2 style={styles.contentTitle}>Gestione Musica</h2><MusicManagement /></div>);
      case 'events': return (<div><h2 style={styles.contentTitle}>Gestione Eventi</h2><DailyEventsManagement events={dailyEvents} onNew={() => { setSelectedDailyEvent(null); setShowEventModal(true); }} onEdit={(event) => { setSelectedDailyEvent(event); setShowEventModal(true); }} onDelete={handleDeleteDailyEvent} /></div>);
      default: return null;
    }
  };

  const getButtonStyle = (moduleName) => ({
    ...styles.navButton,
    ...(activeModule === moduleName ? styles.activeNavButton : {})
  });

  return (
    <div style={styles.panelWrapper}>
      <nav style={styles.nav}>
        {/* --- MODIFICA 3: RENDERIZZA SOLO I PULSANTI AUTORIZZATI --- */}
        {visibleModules.map(module => (
          <button 
            key={module.id}
            style={getButtonStyle(module.id)} 
            onClick={() => setActiveModule(module.id)}
          >
            {module.label}
          </button>
        ))}
      </nav>
      <main style={styles.content}>
        {renderModule()}
      </main>
      {showEventModal && <DailyEventModal event={selectedDailyEvent} onSave={handleSaveDailyEvent} onCancel={() => setShowEventModal(false)} />}
    </div>
  );
}

export default Gestione;