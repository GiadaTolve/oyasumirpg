import React, { useState, useEffect } from 'react';
import api from '../api';

// --- STILI (invariati) ---
const styles = {
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18, 18, 18, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 150 },
  panel: { width: '650px', backgroundColor: 'rgba(30, 32, 44, 0.9)', border: `1px solid #60519b`, boxShadow: `0 0 15px #60519b, inset 0 0 15px rgba(96, 81, 155, 0.3)`, padding: '40px', textAlign: 'center', color: '#bfc0d1' },
  title: { fontFamily: 'oyasumifont', color: '#e6e0ff', fontSize: '4rem', margin: '0 0 10px 0', textShadow: `0 0 7px #bfc0d1, 0 0 15px #bfc0d1, 0 0 30px #60519b, 0 0 50px #60519b` },
  subtitle: { fontSize: '1.1rem', margin: '0 0 40px 0', color: '#bfc0d1', letterSpacing: '1px' },
  button: { padding: '12px 28px', fontSize: '1rem', border: `1px solid #60519b`, borderRadius: '0px', cursor: 'pointer', background: 'transparent', color: '#bfc0d1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'all 0.3s ease', boxShadow: `0 0 5px #60519b` },
  closeButton: { marginTop: '30px', fontSize: '0.8rem', background: 'none', border: 'none', color: '#bfc0d1', cursor: 'pointer', textDecoration: 'underline' },
  loadingContainer: { width: '100%' },
  loadingBarTrack: { width: '100%', height: '30px', backgroundColor: '#1e202c', border: '1px solid #31323e', padding: '4px', boxSizing: 'border-box' },
  loadingBarFill: { height: '100%', backgroundColor: '#60519b', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)', transition: 'width 0.1s linear' },
  loadingText: { marginTop: '15px', fontSize: '1rem', letterSpacing: '3px' },
  formGroup: { marginBottom: '20px', textAlign: 'left' },
  formLabel: { display: 'block', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem', color: '#60519b' },
  formInput: { width: '100%', padding: '10px', backgroundColor: '#1e202c', border: '1px solid #31323e', borderRadius: '0px', color: '#bfc0d1', boxSizing: 'border-box' },
  participantsContainer: { maxHeight: '150px', overflowY: 'auto', border: '1px solid #31323e', padding: '10px' },
  rewardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  divider: { height: '1px', background: `linear-gradient(to right, transparent, ${'#31323e'}, transparent)`, margin: '20px 0', border: 'none' },
  pausedQuestsContainer: { marginBottom: '30px', border: '1px solid #31323e', padding: '20px' },
  pausedTitle: { margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '0.9rem', color: '#a4a5b9' },
  pausedQuestButton: { width: '100%', textAlign: 'left', marginBottom: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #4a4b57', color: '#bfc0d1', padding: '10px', cursor: 'pointer', transition: 'background-color 0.2s ease, border-color 0.2s ease' },
  actionButtonContainer: { marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '15px' },
};

// --- SOTTOCOMPONENTE: FORM DI CREAZIONE ---
const QuestCreationForm = ({ participants = [], onQuestCreate, user }) => {
  const [questName, setQuestName] = useState('');
  const [questType, setQuestType] = useState('BATTLE');
  const [existingPlots, setExistingPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [newPlotName, setNewPlotName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  useEffect(() => {
    if (questType === 'TRAMA') {
      const fetchPlots = async () => { try { const response = await api.get('/quests/trame'); setExistingPlots(response.data); } catch (error) { console.error("Errore recupero trame", error); } };
      fetchPlots();
    }
  }, [questType]);

  const handleParticipantChange = (userId) => { setSelectedParticipants(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]); };
  const handleSubmit = (e) => {
    e.preventDefault();
    const questData = { name: questName, type: questType, parent_quest_id: (questType === 'TRAMA' && selectedPlot !== 'new' && selectedPlot) ? selectedPlot : null, filone_name: (questType === 'TRAMA' && selectedPlot === 'new') ? newPlotName : null, participants: selectedParticipants };
    onQuestCreate(questData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ ...styles.title, fontSize: '2.5rem' }}>Nuova Quest</h2>
      <div style={styles.formGroup}><label style={styles.formLabel}>Nome Quest:</label><input style={styles.formInput} type="text" value={questName} onChange={e => setQuestName(e.target.value)} required /></div>
      <div style={styles.formGroup}><label style={styles.formLabel}>Tipologia:</label><select style={styles.formInput} value={questType} onChange={e => setQuestType(e.target.value)}><option value="BATTLE">Battle</option><option value="AMBIENT">Ambient</option><option value="TRAMA">Trama</option><option value="GLOBALE" disabled={user?.permesso !== 'ADMIN'}>Globale</option></select></div>
      {questType === 'TRAMA' && (<div style={styles.formGroup}><label style={styles.formLabel}>Filone Narrativo:</label><select style={styles.formInput} value={selectedPlot} onChange={e => setSelectedPlot(e.target.value)} required><option value="">Seleziona un filone...</option><option value="new">[ NUOVA TRAMA ]</option>{existingPlots.map(plot => <option key={plot.id} value={plot.id}>{plot.name}</option>)}</select>{selectedPlot === 'new' && (<input type="text" placeholder="Nome del nuovo filone" value={newPlotName} onChange={e => setNewPlotName(e.target.value)} required style={{ ...styles.formInput, marginTop: '10px' }} />)}</div>)}
      <div style={styles.formGroup}><label style={styles.formLabel}>Partecipanti:</label><div style={styles.participantsContainer}>{(participants && participants.length > 0) ? participants.map(p => (<div key={p.id}><input type="checkbox" id={`part-${p.id}`} onChange={() => handleParticipantChange(p.id)} /><label htmlFor={`part-${p.id}`} style={{ marginLeft: '5px' }}>{p.nome_pg}</label></div>)) : <p>Nessun altro giocatore in questa chat.</p>}</div></div>
      <button type="submit" style={styles.button}>Salva e Avvia Quest</button>
    </form>
  );
};

// --- SOTTOCOMPONENTE: SCHERMATA DI PREMIAZIONE ---
const RewardScreen = ({ quest, participants, onRewardsSubmit }) => {
    const [rewards, setRewards] = useState({});
    const [fraseFinale] = useState("Il sipario cala, ma le leggende restano.");

    const handleRewardChange = (userId, amount) => {
        setRewards(prev => ({ ...prev, [userId]: parseInt(amount, 10) || 0 }));
    };

    const handleSubmit = () => {
        const rewardData = Object.keys(rewards).map(userId => ({
            userId: parseInt(userId, 10),
            amount: rewards[userId]
        }));
        onRewardsSubmit(quest.questId, quest.name, rewardData);
    };

    return (
        <div>
            <h2 style={{...styles.subtitle, color: '#60519b'}}>{fraseFinale}</h2>
            <p>Assegna le ricompense per la quest: <strong>{quest.name}</strong></p>
            <div style={{...styles.participantsContainer, marginTop: '20px'}}>
                {participants.map(p => (
                    <div key={p.id} style={styles.rewardRow}>
                        <label>{p.nome_pg}</label>
                        <input type="number" style={{...styles.formInput, width: '100px'}} onChange={(e) => handleRewardChange(p.id, e.target.value)} placeholder="EXP"/>
                    </div>
                ))}
            </div>
            <button onClick={handleSubmit} style={{...styles.button, marginTop: '20px'}}>Assegna Ricompense e Concludi</button>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
function ShinigamiPanel({ onClose, participants, user, activeQuest, onQuestStart, onQuestEnd }) {
  const [view, setView] = useState(activeQuest ? 'active' : 'initial');
  const [progress, setProgress] = useState(0);
  const [pausedQuests, setPausedQuests] = useState([]);
  const [selectedPausedQuest, setSelectedPausedQuest] = useState(null);
  const [questToReward, setQuestToReward] = useState(null);
  const [rewardParticipants, setRewardParticipants] = useState([]);

  useEffect(() => {
    if (view === 'initial' && !activeQuest) {
      const fetchPausedQuests = async () => {
        try { const response = await api.get('/quests/paused'); setPausedQuests(response.data); } 
        catch (error) { console.error("Errore recupero quest in pausa", error); }
      };
      fetchPausedQuests();
    }
  }, [view, activeQuest]);

  const handleStartClick = () => setView('loading');

  const handleQuestCreate = async (questData) => {
    try {
      const response = await api.post('/quests', questData);
      onQuestStart({ ...questData, questId: response.data.questId });
    } catch (error) {
      console.error("Errore creazione quest:", error);
      alert("Errore: " + (error.response?.data?.message || "Impossibile creare la quest."));
      setView('form');
    }
  };
  
  const handleUpdateStatus = async (status, questToUpdate) => {
    const quest = questToUpdate || activeQuest;
    if (!quest) return;
    const questIdToUpdate = quest.questId || quest.id;

    try {
      await api.put(`/quests/${questIdToUpdate}/status`, { status });
      if (status === 'PAUSA') {
        alert("Quest messa in pausa.");
        onQuestEnd();
        onClose();
      } else if (status === 'CONCLUSA') {
        const response = await api.get(`/quests/${questIdToUpdate}`);
        const fullQuestData = response.data;
        setQuestToReward(fullQuestData);
        setRewardParticipants(fullQuestData.participants);
        setView('rewarding');
      }
    } catch (error) {
      console.error("Errore aggiornamento stato quest", error);
    }
  };

  const handleAssignRewards = async (questId, questName, rewards) => {
    try {
      await api.post(`/quests/${questId}/rewards`, { questId, questName, rewards });
      alert("Ricompense assegnate!");
      onQuestEnd();
      onClose();
    } catch (error) { console.error("Errore assegnazione ricompense", error); }
  };

  const handleResumeQuest = async () => {
    if (!selectedPausedQuest) return;
    try {
      await api.put(`/quests/${selectedPausedQuest.id}/status`, { status: 'IN_CORSO' });
      const response = await api.get(`/quests/${selectedPausedQuest.id}`);
      onQuestStart(response.data);
    } catch (error) {
      console.error("Errore nel riprendere la quest:", error);
      alert("Impossibile riprendere la quest.");
    }
  };

  const handleDeleteQuest = async () => {
    if (!selectedPausedQuest) return;
    if (window.confirm(`Sei sicuro di voler eliminare la quest "${selectedPausedQuest.name}"?`)) {
        try {
            await api.delete(`/quests/${selectedPausedQuest.id}`);
            alert("Quest eliminata.");
            setPausedQuests(prev => prev.filter(q => q.id !== selectedPausedQuest.id));
            setSelectedPausedQuest(null);
        } catch(error) { console.error("Errore eliminazione quest", error); }
    }
  };

  useEffect(() => {
    if (view === 'loading') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) { clearInterval(interval); setView('form'); return 100; }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [view]);

  const renderContent = () => {
    // --- CORREZIONE LOGICA ---
    // La vista "rewarding" ora ha la precedenza su tutto
    if (view === 'rewarding') {
      return <RewardScreen quest={questToReward} participants={rewardParticipants} onRewardsSubmit={handleAssignRewards} />;
    }
    // Se c'è una quest attiva, mostra il pannello di controllo
    if (activeQuest) {
      return (
        <div>
          <h2 style={styles.subtitle}>Quest Attiva: {activeQuest.name}</h2>
          <p>La quest è in corso. Chiudi questo pannello per giocare.</p>
          <button onClick={() => handleUpdateStatus('PAUSA')} style={styles.button}>Pausa</button>
          <button onClick={() => handleUpdateStatus('CONCLUSA')} style={{ ...styles.button, marginLeft: '10px', background: '#8b0000', border: '1px solid #ff4d4d' }}>Fine</button>
        </div>
      );
    }
    // Altrimenti, mostra le viste iniziali
    switch (view) {
      case 'loading':
        return (
          <div style={styles.loadingContainer}><div style={styles.loadingBarTrack}><div style={{ ...styles.loadingBarFill, width: `${progress}%` }}></div></div><p style={styles.loadingText}>INIZIALIZZAZIONE... {progress}%</p></div>
        );
      case 'form':
        return <QuestCreationForm participants={participants} user={user} onQuestCreate={handleQuestCreate} />;
      default: // 'initial'
        return (
          <>
            <h1 style={styles.title}>Shinigami</h1>
            <p style={styles.subtitle}>Pronto a tessere le fila del destino?</p>
            {pausedQuests && pausedQuests.length > 0 && (
              <div style={styles.pausedQuestsContainer}>
                <h3 style={styles.pausedTitle}>Quest in Pausa</h3>
                {pausedQuests.map(quest => (<button key={quest.id} style={{...styles.pausedQuestButton, border: selectedPausedQuest?.id === quest.id ? '2px solid #60519b' : '1px solid #4a4b57' }} onClick={() => setSelectedPausedQuest(quest)}><strong>{quest.name}</strong></button>))}
              </div>
            )}
            {selectedPausedQuest && (
                <div style={{animation: 'fadeIn 0.5s ease'}}>
                    <hr style={styles.divider} />
                    <div style={styles.actionButtonContainer}>
                        <button style={styles.button} onClick={handleResumeQuest}>Riprendi</button>
                        <button style={{...styles.button, borderColor: '#ffd89b'}} onClick={() => handleUpdateStatus('CONCLUSA', selectedPausedQuest)}>Concludi</button>
                        <button style={{...styles.button, background: '#8b0000', border: '1px solid #ff4d4d'}} onClick={handleDeleteQuest}>Cancella</button>
                    </div>
                </div>
            )}
            <hr style={styles.divider} />
            <button style={styles.button} onClick={handleStartClick}>Nuova Quest</button>
          </>
        );
    }
  };

  return (
    <div style={styles.overlay}><div style={styles.panel} onClick={e => e.stopPropagation()}>{renderContent()}<button style={styles.closeButton} onClick={onClose}>Chiudi Pannello</button></div></div>
  );
}

export default ShinigamiPanel;