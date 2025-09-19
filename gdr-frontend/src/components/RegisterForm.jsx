import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import './ChatRegister.css';

// Struttura dati che guida l'intera conversazione (con il dialogo originale ripristinato)
const conversationFlow = {
  0: {
      messages: [
          { text: "Hey ✨ Se sei venuto qui, hai deciso d’intraprendere un percorso totalmente nuovo, facendo un passo al di fuori della realta' ! ", delay: 1000 },
          { text: "...", delay: 1500 },
          { text: "Beh, benvenuto!", delay: 1000 },
          { text: "Hai già giocato ai giochi di ruolo via chat? (GDR PBC)", delay: 1500 },
      ],
      nextStep: 1,
  },
  1: {
      handleUserReply: (input, { openGuida, openLore, advance }) => {
          if (input.toLowerCase().includes('no')) {
              advance(2, [
                  { text: "Non ti preoccupare, abbiamo pensato anche a te.", delay: 500 },
                  { text: <span>Puoi leggere la <strong className="chat-link" onClick={openGuida}>Guida</strong> per scoprire come funziona e come muovere i primi passi.</span>, delay: 1500 },
                  { text: <span>E puoi esplorare <strong className="chat-link" onClick={openLore}>l'Ambientazione</strong> per conoscere il mondo che abiterà il tuo personaggio.</span>, delay: 1500 },
                  { text: "Quando sei pronto, scrivi 'ok' o '...' per continuare.", delay: 1500 },
              ]);
          } else {
              advance(2, [{ text: "Oh, bene. Allora io mi occupero' solo di darti una piccola premessa utile!", delay: 500 }]);
          }
      }
  },
  2: {
      messages: [
          { text: "Ho costruito questo mondo, mattone dopo mattone. L’ho costruito per me, perche' volevo un posto sicuro.", delay: 1500 },
          { text: "L’ho costruito per te, poiche' ti sentissi a casa. Chiunque tu sia, ovunque tu vada e da qualsiasi luogo tu venga.", delay: 2000 },
          { text: "Certo, Oyasumi non e' reale. Il tuo personaggio e' solo un pupazzetto; ma il protagonista inconsapevole sei tu, e sei solo tu a renderti tale. Con la tua fantasia.", delay: 2500 },
          { text: "...", delay: 2000 },
      ],
      nextStep: 3,
  },
  3: {
      messages: [
          { text: "Immagina Oyasumi dopotutto come una festa. Io ho stampato gli inviti, e ho fatto delle regole poiche' tutti si sentano a proprio agio. Tu sei l’invitat*.", delay: 1500 },
          { text: "Divertiti con tutto ciò che ti offriamo e tutto quello che trovi da sol*, senza rovinare la festa a tutti gli invitati.", delay: 2500 },
          { text: "*coff* Bene, proseguiamo! 🎀", delay: 1500 },
          { text: "Qui la narrazione e' la carta vincente. 💫 Del resto alla base del gioco di ruolo c’e' il raccontare una storia, no?", delay: 1500 },
          { text: "E attenzione... 😒 Non sto parlando di esser scrittori da premi nobel, ma di voler raccontare! Bene o male, in modo arzigogolato o semplice. L'unica cosa non opinabile, amico mio, e' la matematica.", delay: 2500 },
          { text: <span>A tal proposito, prima che io e te iniziamo una rissa basata sulla fuffa... 💀 Leggi <strong>"Principia Satirica"</strong>. E poi torna a dirmi se hai capito, e che ne pensi!</span>, delay: 3500 },
      ],
      nextStep: 4,
  },
  4: {
      messages: [{ text: "Ah, ho parlato troppo. Ma almeno le basi sono chiare. Ora parliamo di te, del tuo personaggio! Come ti @chiami?", delay: 500 }],
      action: (input, dataSetter) => dataSetter.setNomePg(input),
      validator: (input) => input.trim().length > 0,
      errorMessage: "Per favore, inserisci un nome per il tuo personaggio.",
      nextStep: 5,
  },
  5: { // STEP MODIFICATO: ora mostra i messaggi E gestisce la risposta
      messages: [
          { text: (data) => `Beh, complimenti ${data.nomePg}. Un pugno di lettere ti hanno appena concesso l’apertura del terzo occhio. Ora sei un’analista.`, delay: 1000 },
          { text: "...oh, beh, per lo meno, lo sarai.", delay: 2000 },
          { text: "Ora sei un “nemuribito”, un sonnambulo. Li chiamano così quelli come te. Deve esser iniziata da poco- e se non è così, sei stat* brav* a nasconderlo. Noi holic amiamo la vostra aria smarrita, eccessivamente emotivamente coinvolta.", delay: 1500 },
          { text: "Comunque non demordere, l’ordine ti troverà. Lo fanno sempre. E' per il tuo bene!", delay: 1500 },
          { text: "Senti, un paio di domande... Sei maggiorenne? Rispondi solo 'Si' o 'No' ", delay: 1500 },
      ],
      handleUserReply: (input, { advance, terminate }) => {
          if (input.toLowerCase().includes('si')) {
              advance(6, [ // Avanza al nuovo step 6
                  { text: "Non per qualcosa. Ma non si sa mai quali argomenti forti possono uscire, sempre meglio prevenire.", delay: 500 },
                  { text: "Hai letto l’informativa @privacy? Se l'hai letta, rispondi \"Si\" 🖤", delay: 2000 },
              ]);
          } else if (input.toLowerCase().includes('no')) {
              terminate("Mi dispiace, Oyasumi e' un mondo riservato ai maggiorenni. Le porte per te, per ora, restano chiuse.");
          } else {
              advance(5, [{ text: "Non ho capito bene. Per favore, rispondi solo 'si' o 'no'.", delay: 500 }]);
          }
      },
  },
  6: { // Questo era lo step 7
      handleUserReply: (input, { advance, userData }) => {
          if (input.toLowerCase().includes('si')) {
              advance(7, [ // Avanza al nuovo step 7
                  { text: `Allora ${userData.nomePg}, credo con le scartoffie siamo a posto.`, delay: 1000 },
                  { text: "Non dare di matto, o quelli della Mugen ti staranno addosso. Prendi un bel respiro, okay? Hai trenta giorni per scegliere cosa fare.", delay: 2000 },
                  { text: "Non molestare nessuno, non parlare con gli ✨Holic✨ davanti ai civili, non fare nessuna cazzo di mossa strana nei paraggi di Edo.", delay: 2000 },
                  { text: "E no, non mi interessa sapere cos’hai fra le gambe. Credo a nessuno interessi qui.", delay: 2000 },
                  { text: "Però… potrebbe interessarmi cos’hai nella testa… Quello sì!", delay: 2000 },
                  { text: "Sei libero di dirmi quello che vuoi, o magari assolutamente nulla. Ma tutto ciò che vorrai dirmi sarà impiegato attivamente per render la tua esperienza di gioco più affine possibile alla tua aspettativa, se possibile!", delay: 1500 },
              ]);
          } else {
              advance(6, [{ text: "Devi confermare di aver letto l'informativa per proseguire. Rispondi 'si' se l'hai fatto.", delay: 500 }]);
          }
      }
  },
  7: { // Questo era lo step 8
      messages: [{ text: "Abbiamo finito! Lasciami un tuo contatto, così ci sentiamo presto!", delay: 500 }],
      action: (input, dataSetter) => dataSetter.setPlayerPreferences(input),
      nextStep: 8, // Avanza al nuovo step 8
  },
  8: { // Questo era lo step 9
      messages: [{ text: "Qual è il tuo indirizzo @email?", delay: 500 }],
      action: (input, dataSetter) => dataSetter.setEmail(input),
      validator: (input) => /\S+@\S+\.\S+/.test(input),
      errorMessage: "Mmmh, questo non sembra un indirizzo email valido. Puoi ricontrollare?",
      nextStep: 9, // Avanza al nuovo step 9
  },
  9: { // Questo era lo step 10
      messages: [{ text: "...ah, e una @password! 👽", delay: 500 }],
      action: (input, dataSetter) => dataSetter.setPassword(input),
      validator: (input) => input.length >= 6,
      errorMessage: "La password deve essere di almeno 6 caratteri.",
      nextStep: 10, // Avanza al nuovo step 10
  },
  10: { // Questo era lo step 11
      messages: [{ text: "Riscrivila per @conferma.", delay: 500 }],
      validator: (input, data) => input === data.password,
      errorMessage: "Le password non coincidono. Riprova.",
      action: (input, dataSetter, submit) => submit(),
  }
};


function RegisterForm({ onRegisterSuccess, openGuida, openLore }) {
    // Stati per i dati dell'utente
    const [userData, setUserData] = useState({
        nomePg: '',
        email: '',
        password: '',
        playerPreferences: '',
    });

    // Stati per la gestione della chat
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [step, setStep] = useState(0);
    const [isYumeTyping, setIsYumeTyping] = useState(true);
    const [isInputDisabled, setIsInputDisabled] = useState(true);
    const [isTerminated, setIsTerminated] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState('');
    
    const chatEndRef = useRef(null);
    const activeTimers = useRef([]);

    // Funzione centralizzata per aggiungere messaggi
    const addMessage = (content, sender) => {
        setMessages(prev => [...prev, { content, sender }]);
    };
    
    // Funzione centralizzata per mostrare una sequenza di messaggi
    const playMessageSequence = (messageList = [], onComplete) => {
        clearAllTimers();
        setIsYumeTyping(true);

        let totalDelay = 0;
        messageList.forEach(({ text, delay }) => {
            const timer = setTimeout(() => {
                const messageText = typeof text === 'function' ? text(userData) : text;
                addMessage(messageText, 'yume');
            }, totalDelay + delay);
            activeTimers.current.push(timer);
            totalDelay += delay;
        });

        const finalTimer = setTimeout(() => {
            setIsYumeTyping(false);
            if (onComplete) onComplete();
        }, totalDelay + 500); // Aggiungi un piccolo buffer alla fine
        activeTimers.current.push(finalTimer);
    };
    
    const clearAllTimers = () => {
        activeTimers.current.forEach(timer => clearTimeout(timer));
        activeTimers.current = [];
    };

    // Effetto per avviare la conversazione
    useEffect(() => {
        playMessageSequence(conversationFlow[0].messages, () => {
            setIsInputDisabled(false);
            setStep(conversationFlow[0].nextStep);
        });
        return () => clearAllTimers();
    }, []);
    
    // Effetto per scrollare alla fine della chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFinalSubmit = async () => {
        if (!userData.nomePg || !userData.email || !userData.password) {
            addMessage("Oh no! Sembra che manchi qualche informazione fondamentale (nome, email o password). Per favore, ricarica la pagina e riprova.", 'yume');
            setError("Dati obbligatori mancanti.");
            setIsYumeTyping(false);
            setIsInputDisabled(true);
            return;
        }
        
        setIsYumeTyping(true);
        setIsInputDisabled(true);
        
        try {
            await api.post('/register', {
                nome_pg: userData.nomePg,
                email: userData.email,
                password: userData.password,
                playerPreferences: userData.playerPreferences || 'Nessuna preferenza espressa.'
            });

            playMessageSequence([
                { text: `Ecco fatto. Ora ${userData.nomePg} è pronto a venire al mondo.`, delay: 1000 },
                { text: "Ti aspettiamo~", delay: 1500 }
            ], () => {
                setIsComplete(true);
                setTimeout(() => onRegisterSuccess(), 3000);
            });

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Qualcosa è andato storto...';
            setError(errorMessage);
            addMessage(`Oh no! C'è stato un problema: ${errorMessage}. Ricarica la pagina per riprovare.`, 'yume');
            setIsYumeTyping(false);
        }
    };
    
    const handleUserReply = (e) => {
        e.preventDefault();
        const userInput = inputValue.trim();
        const isContinuationInput = ['...', 'ok', ''].includes(userInput.toLowerCase());

        // Permette di inviare messaggi vuoti solo se sono 'ok' o '...'
        if (!isContinuationInput && !userInput) return;

        addMessage(inputValue, 'user');
        setInputValue('');
        setIsInputDisabled(true);
        clearAllTimers();

        const currentStepConfig = conversationFlow[step];
        if (!currentStepConfig) return;

        // Gestione avanzata per step con logica complessa
        if (currentStepConfig.handleUserReply) {
            const advance = (nextStep, messages) => {
                playMessageSequence(messages, () => {
                    setStep(nextStep);
                    setIsInputDisabled(false);
                });
            };
            const terminate = (message) => {
                playMessageSequence([{text: message, delay: 500}], () => {
                    setIsTerminated(true);
                });
            };
            currentStepConfig.handleUserReply(userInput, { advance, terminate, openGuida, openLore, userData });
            return;
        }
        
        // Gestione standard per step semplici
        if (currentStepConfig.validator && !currentStepConfig.validator(userInput, userData)) {
            playMessageSequence([{ text: currentStepConfig.errorMessage, delay: 500 }], () => {
                setIsInputDisabled(false);
            });
            return;
        }

        if (currentStepConfig.action) {
            const dataSetter = {
                setNomePg: (val) => setUserData(p => ({...p, nomePg: val})),
                setEmail: (val) => setUserData(p => ({...p, email: val})),
                setPassword: (val) => setUserData(p => ({...p, password: val})),
                setPlayerPreferences: (val) => setUserData(p => ({...p, playerPreferences: val})),
            };
            currentStepConfig.action(userInput, dataSetter, handleFinalSubmit);
        }

        const nextStep = currentStepConfig.nextStep;
        if (nextStep && conversationFlow[nextStep]) {
            const nextStepConfig = conversationFlow[nextStep];
        
            // Se il prossimo step è puramente logico (aspetta una risposta) e non ha messaggi da mostrare...
            if (nextStepConfig.handleUserReply && !nextStepConfig.messages) {
                // ...allora aggiorna subito lo stato e mettiti in ascolto.
                setStep(nextStep);
                setIsInputDisabled(false);
            } else {
                // Altrimenti, continua a mostrare i messaggi come prima.
                playMessageSequence(nextStepConfig.messages, () => {
                    setStep(nextStep);
                    setIsInputDisabled(false);
                });
              }
        }
    };
  
    const getInputType = () => (step === 11 || step === 12) ? 'password' : 'text';
    const getPlaceholderText = () => {
        if (isTerminated) return 'Registrazione non possibile.';
        if (isComplete) return 'Registrazione completata!';
        if (isInputDisabled) return 'Yume-chan sta scrivendo...';
        return 'Scrivi la tua risposta...';
    };

    return (
        <div className="chat-register-container">
            <div className="chat-header"><h2>Parla con Yume-chan</h2><img src="/yumechan/iconayumetalk.png" alt="Yume-chan" className="yume-icon" /></div>
            <div className="chat-messages">
                {messages.map((msg, index) => (<div key={index} className={`message-bubble ${msg.sender}`}><p>{msg.content}</p></div>))}
                {isYumeTyping && <div className="message-bubble yume typing-indicator"><span>.</span><span>.</span><span>.</span></div>}
                {isComplete && <p className="success-message">Benvenuto in Oyasumi! Verrai reindirizzato a breve...</p>}
                {error && <p className="error-message">{error}</p>}
                <div ref={chatEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={handleUserReply}>
                <input type={getInputType()} className="chat-input" placeholder={getPlaceholderText()} value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isInputDisabled || isComplete || isTerminated} />
                <button type="submit" className="chat-send-button" disabled={isInputDisabled || isComplete || isTerminated}>Invia</button>
            </form>
        </div>
    );
}

export default RegisterForm;