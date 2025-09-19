import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

// --- STILI ---
const styles = {
    // --- STILE FINESTRA AGGIORNATO ---
    // Dimensioni e stile ora corrispondono a ChatWindow.jsx
    window: { 
        position: 'absolute', 
        width: '1600px', 
        height: '810px', 
        backgroundColor: '#1e202c', 
        border: '1px solid #31323e', 
        borderRadius: '8px', 
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: 120, 
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)', 
        color: '#bfc0d1',
        overflow: 'hidden' // Aggiunto per coerenza
    },
    header: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #31323e', cursor: 'move' }, // Aggiunto cursor: move
    title: { fontFamily: "'GoatFont', sans-serif", color: '#e6e0ff', margin: 0, fontSize: '2em' },
    closeButton: { background: 'none', border: 'none', color: '#e6e0ff', fontSize: '1.5em', cursor: 'pointer' },
    content: { display: 'flex', flexGrow: 1, overflow: 'hidden' },
    nav: { width: '220px', flexShrink: 0, borderRight: '1px solid #31323e', padding: '20px', backgroundColor: 'rgba(30, 32, 44, 0.4)' },
    navButton: { display: 'block', width: '100%', padding: '12px', background: '#2a292f', border: '1px solid #4a4b57', color: '#bfc0d1', borderRadius: '4px', marginBottom: '10px', cursor: 'pointer', textAlign: 'left' },
    activeNavButton: { backgroundColor: '#60519b', color: 'white', borderColor: '#60519b' },
    main: { flexGrow: 1, padding: '20px 30px', overflowY: 'auto' },
    balance: { fontSize: '2.5em', fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: '20px' },
    historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #31323e', fontSize: '14px' },
    amountIn: { color: '#4caf50', fontWeight: 'bold' },
    amountOut: { color: '#f44336', fontWeight: 'bold' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px' },
    input: { width: '100%', boxSizing: 'border-box', padding: '10px', background: '#31323e', border: '1px solid #4a4b57', color: 'white', borderRadius: '4px' },
    button: { padding: '10px 20px', backgroundColor: '#60519b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    jobList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' },
    jobCard: { background: '#2a292f', border: '1px solid #4a4b57', padding: '15px', borderRadius: '4px', textAlign: 'center' },
    currentJobDisplay: { textAlign: 'center', padding: '20px', background: '#2a292f', border: '1px solid #60519b', borderRadius: '4px', marginBottom: '20px' },
    toaster: {
        position: 'fixed', bottom: '20px', left: '270px', transform: 'none', 
        backgroundColor: '#1e202c', color: 'white', padding: '20px', borderRadius: '8px',
        border: '2px solid #60519b', boxShadow: '0 5px 20px rgba(0,0,0,0.5)', zIndex: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        transition: 'opacity 0.5s, bottom 0.5s',
    },
    toasterImage: {
        width: '100px', height: 'auto', marginBottom: '15px',
        filter: 'drop-shadow(0 4px 6px rgba(96, 81, 155, 0.6))',
    },
    toasterMessage: { fontWeight: 'bold', fontSize: '1.2em', textTransform: 'uppercase', margin: 0 }
};

// Lista dei lavori disponibili
const JOBS = [
    { name: 'Fioraio/a a Ikebukuro', dailyPay: 90 }, { name: 'Tecnico di Pachinko', dailyPay: 90 },
    { name: 'Addetto/a pulizie di Shibuya', dailyPay: 90 }, { name: 'Cuoco/a di ramen', dailyPay: 90 },
    { name: 'Commesso/a in un konbini', dailyPay: 90 }, { name: 'Guardia in un love hotel', dailyPay: 90 },
    { name: 'Manutentore/trice di distributori', dailyPay: 90 }, { name: 'Corriere notturno', dailyPay: 90 },
    { name: 'Host/Hostess a Kabukicho', dailyPay: 90 }, { name: 'Operatore/trice sala giochi', dailyPay: 90 },
];

const Toaster = ({ message, image, onHide }) => {
    useEffect(() => { const timer = setTimeout(onHide, 3000); return () => clearTimeout(timer); }, [onHide]);
    // --- ERRORE CORRETTO QUI ---
    // Rimosso il carattere '<' extra prima della parentesi graffa
    return ( <div style={styles.toaster}>{image && <img src={image} alt="notifica" style={styles.toasterImage} />}<p style={styles.toasterMessage}>{message}</p></div> );
};

function Banca({ user, onClose }) {
    const [activeTab, setActiveTab] = useState('arubaito');
    const [accountData, setAccountData] = useState({ rem: 0, job: null, last_salary_collection: null });
    const [history, setHistory] = useState([]);
    const [transferData, setTransferData] = useState({ receiverName: '', amount: '', reason: '' });
    const [position, setPosition] = useState(null);
    const [toaster, setToaster] = useState({ show: false, message: '', image: null });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // --- POSIZIONAMENTO AGGIORNATO (copiato da ChatWindow) ---
    useEffect(() => {
        const windowWidth = 1600; const windowHeight = 810;
        const screenWidth = window.innerWidth; const screenHeight = window.innerHeight;
        setPosition({ x: (screenWidth - windowWidth) / 2, y: (screenHeight - windowHeight) / 1.2 });
    }, []);

    const fetchAccountData = useCallback(async () => {
        try {
            const schedaRes = await api.get('/scheda');
            const historyRes = await api.get('/bank/history');
            setAccountData(schedaRes.data);
            setHistory(historyRes.data);
        } catch (error) { console.error("Errore caricamento dati bancari:", error); }
    }, []);

    useEffect(() => { fetchAccountData(); }, [fetchAccountData]);
    
    // --- LOGICA DI TRASCINAMENTO (aggiunta per coerenza) ---
    const handleMouseDown = useCallback((e) => { setIsDragging(true); dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }, [position]);
    const handleMouseMove = useCallback((e) => { if (isDragging) setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }); }, [isDragging]);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    useEffect(() => {
        if (isDragging) { document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); }
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const showToaster = (message, image = null) => { setToaster({ show: true, message, image }); };
    const handleSetJob = async (jobName) => { if (window.confirm(`Sei sicuro di voler diventare ${jobName}? La scelta è definitiva.`)) { try { const response = await api.post('/api/bank/set-job', { jobName }); showToaster(response.data.message); fetchAccountData(); } catch (error) { showToaster(error.response?.data?.message || "Errore."); } } };
    const handleCollectSalary = async () => { try { const response = await api.post('/api/bank/collect-salary'); showToaster(response.data.message); fetchAccountData(); } catch (error) { showToaster(error.response?.data?.message || "Errore."); } };
    const handleTransferChange = (e) => setTransferData({ ...transferData, [e.target.name]: e.target.value });
    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        if (!transferData.receiverName || !transferData.amount || !transferData.reason) { return showToaster("Compila tutti i campi."); }
        try {
            const response = await api.post('/bank/transfer', { ...transferData, amount: parseInt(transferData.amount, 10) });
            showToaster(response.data.message);
            setTransferData({ receiverName: '', amount: '', reason: '' });
            fetchAccountData(); setActiveTab('conto');
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Errore.";
            if (errorMessage.includes("insufficienti")) { showToaster("OH NO, SEI UN PEZZENTE!", '/yumechan/yumechan.nomoney.png'); } 
            else { showToaster(errorMessage); }
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const hasCollectedToday = accountData.last_salary_collection === today;

    if (!position) return null;

    return (
        <>
            <div style={{ ...styles.window, left: `${position.x}px`, top: `${position.y}px` }}>
                <div style={styles.header} onMouseDown={handleMouseDown}>
                    <h2 style={styles.title}>Banca di Oyasumi</h2>
                    <button style={styles.closeButton} onClick={onClose}>×</button>
                </div>
                <div style={styles.content}>
                    <nav style={styles.nav}>
                        <button style={activeTab === 'arubaito' ? {...styles.navButton, ...styles.activeNavButton} : styles.navButton} onClick={() => setActiveTab('arubaito')}>Arubaito</button>
                        <button style={activeTab === 'conto' ? {...styles.navButton, ...styles.activeNavButton} : styles.navButton} onClick={() => setActiveTab('conto')}>Conto Corrente</button>
                        <button style={activeTab === 'operazioni' ? {...styles.navButton, ...styles.activeNavButton} : styles.navButton} onClick={() => setActiveTab('operazioni')}>Operazioni</button>
                    </nav>
                    <main style={styles.main}>
                        {activeTab === 'arubaito' && (
                            <div>
                                <h3>Lavoro e Paga Giornaliera</h3>
                                {accountData.job ? (
                                    <div style={styles.currentJobDisplay}>
                                        <p style={{ margin: 0, color: '#a4a5b9' }}>La tua occupazione attuale è:</p>
                                        <h4 style={{ margin: '10px 0', fontSize: '1.5em' }}>{accountData.job}</h4>
                                        <button style={styles.button} onClick={handleCollectSalary} disabled={hasCollectedToday}>
                                            {hasCollectedToday ? 'Paga già ritirata' : 'Ritira 90 Rem'}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p>Scegli un lavoro per iniziare a guadagnare Rem ogni giorno. La scelta è definitiva.</p>
                                        <div style={styles.jobList}>
                                            {JOBS.map(job => ( <div key={job.name} style={styles.jobCard}> <h5 style={{margin: '0 0 10px 0'}}>{job.name}</h5> <p style={{fontSize: '12px', color: '#a4a5b9'}}>Paga: {job.dailyPay} Rem / giorno</p> <button style={styles.button} onClick={() => handleSetJob(job.name)}>Scegli</button> </div> ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'conto' && ( <div> <p style={{textAlign: 'center', textTransform: 'uppercase', color: '#a4a5b9'}}>Saldo Disponibile</p> <div style={styles.balance}>{accountData.rem} Rem</div> <h3 style={{borderTop: '1px solid #31323e', paddingTop: '20px'}}>Storico Transazioni</h3> <div> {history.map(tx => ( <div key={tx.id} style={styles.historyItem}> <div> <p style={{margin: '0 0 5px 0'}}>{tx.reason}</p> <p style={{margin: 0, fontSize: '12px', color: '#a4a5b9'}}> {tx.sender_id === user.id ? `A: ${tx.receiver_name}` : `Da: ${tx.sender_name || 'Sistema'}`} </p> </div> <div style={tx.receiver_id === user.id ? styles.amountIn : styles.amountOut}> {tx.receiver_id === user.id ? '+' : '-'}{tx.amount} Rem </div> </div> ))} </div> </div> )}
                        {activeTab === 'operazioni' && ( <div> <h3>Trasferisci Rem</h3> <form onSubmit={handleTransferSubmit}> <div style={styles.formGroup}><label style={styles.label}>Destinatario (Nome PG)</label><input type="text" name="receiverName" value={transferData.receiverName} onChange={handleTransferChange} style={styles.input} /></div> <div style={styles.formGroup}><label style={styles.label}>Importo (Rem)</label><input type="number" name="amount" value={transferData.amount} onChange={handleTransferChange} style={styles.input} min="1" /></div> <div style={styles.formGroup}><label style={styles.label}>Causale</label><input type="text" name="reason" value={transferData.reason} onChange={handleTransferChange} style={styles.input} /></div> <button type="submit" style={styles.button}>Trasferisci</button> </form> </div> )}
                    </main>
                </div>
            </div>
            {toaster.show && <Toaster message={toaster.message} image={toaster.image} onHide={() => setToaster({ show: false, message: '', image: null })} />}
        </>
    );
}

export default Banca;
