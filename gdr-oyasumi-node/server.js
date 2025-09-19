// --- 1. IMPORT E IMPOSTAZIONI GLOBALI ---
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const nodemailer = require('nodemailer');
const verificaToken = require('./authMiddleware');
const ytdl = require('ytdl-core');
const axios = require('axios'); 


console.log("✅ FASE 1: Tutti i moduli sono stati importati."); 

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: { origin: frontendURL }
});

let db;
let onlineUsers = {};
let userSockets = new Map(); // <-- AGGIUNGI QUESTO




// --- HELPER FUNCTIONS ---
function calculateLevel(exp) {
  if (exp < 100) return 1;
  const level = Math.floor((-5 + Math.sqrt(225 + 4 * exp)) / 10);
  return Math.min(level, 50);
}

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// --- 3. API ROUTES ---

// Middleware di verifica permessi
// Middleware di verifica permessi
const verificaAdmin = (req, res, next) => {
    if (req.utente?.permesso === 'ADMIN') next();
    else res.status(403).json({ message: 'Accesso negato: richiesti permessi di Admin.' });
  };
  
  // MODIFICATO: Ora include anche MOD e ADMIN
  const verificaMaster = (req, res, next) => {
    const permessiValidi = ['MASTER', 'MOD', 'ADMIN'];
    if (permessiValidi.includes(req.utente?.permesso)) next();
    else res.status(403).json({ message: 'Accesso negato: richiesti permessi di Master o superiori.' });
  };
  
  // NUOVO: Middleware per i Moderatori e Admin
  const verificaMod = (req, res, next) => {
    const permessiValidi = ['MOD', 'ADMIN'];
    if (permessiValidi.includes(req.utente?.permesso)) next();
    else res.status(403).json({ message: 'Accesso negato: richiesti permessi di Moderatore o superiori.' });
  };

// API Pubbliche e di base
app.get('/', (req, res) => res.send('Il server è attivo!'));

app.post('/api/register', async (req, res) => {
    try {
        // 1. Estrai il nuovo campo dal body della richiesta
        const { email, password, nome_pg, playerPreferences } = req.body;
        if (!email || !password || !nome_pg) return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 2. Inserisci il nuovo campo nel database
        const risultato = await db.run(
            'INSERT INTO utenti (email, password, nome_pg, preferenze_gioco) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, nome_pg, playerPreferences]
        );


        // --- INIZIO BLOCCO EMAIL AGGIORNATO ---

        // Configura il transporter di Nodemailer (USA VARIABILI D'AMBIENTE IN PRODUZIONE!)
        // NECESSITA di una "Password per le app" se usi Gmail con 2FA
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Usiamo Gmail
            auth: {
                user: process.env.EMAIL_USER || 'oyasumi.staff@gmail.com', // La tua email
                pass: process.env.EMAIL_PASS, // La tua "Password per le app"
            },
        });

        // 1. Email di benvenuto all'utente
        const mailToUser = {
            from: '"Oyasumi Staff" <oyasumi.staff@gmail.com>',
            to: email, // L'email dell'utente che si è registrato
            subject: "Benvenuto in Oyasumi! Il tuo viaggio ha inizio!",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Ciao ${nome_pg}!</h2>
                    <p>Siamo felicissimi di darti il benvenuto nel mondo oscuro e onirico di <strong>Oyasumi</strong>.</p>
                    <p>Il tuo account è stato creato con successo. Ecco un riepilogo dei tuoi dati:</p>
                    <ul>
                        <li><strong>Nome Personaggio:</strong> ${nome_pg}</li>
                        <li><strong>Email:</strong> ${email}</li>
                        <li><strong>Password:</strong> ${password}</li>
                    </ul>
                    <p>Custodisci queste informazioni e preparati a vivere la tua avventura.</p>
                    <p>A presto,<br/>Lo Staff di Oyasumi</p>
                </div>
            `
        };

        // 2. Email di notifica allo staff
        const mailToStaff = {
            from: '"Notifiche Oyasumi" <oyasumi.staff@gmail.com>',
            to: 'oyasumi.staff@gmail.com',
            subject: `🔔 Nuova Registrazione: ${nome_pg}`,
            html: `
                 <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Un nuovo sognatore si è unito a noi!</h2>
                    <p>Un nuovo utente si è registrato su Oyasumi:</p>
                    <ul>
                        <li><strong>ID Utente:</strong> ${risultato.lastID}</li>
                        <li><strong>Nome Personaggio:</strong> ${nome_pg}</li>
                        <li><strong>Email:</strong> ${email}</li>
                    </ul>
                    <hr>
                    <h3>Preferenze/Note del Giocatore:</h3>
                    <p style="background-color: #f4f4f4; border-left: 4px solid #ccc; padding: 10px; font-style: italic;">
                        ${playerPreferences || 'Nessuna preferenza espressa.'}
                    </p>
                </div>
            `
        };

        // Invio di entrambe le email
        await transporter.sendMail(mailToUser);
        await transporter.sendMail(mailToStaff);

        console.log(`✅ Registrazione completata per ${nome_pg}. Email inviate.`);

        // --- FINE BLOCCO EMAIL AGGIORNATO ---

        res.status(201).json({ message: 'Utente registrato con successo!', userId: risultato.lastID });

    } catch (errore) {
        console.error("Errore durante la registrazione:", errore);
        if (errore.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Questa email è già stata utilizzata.' });
        }
        res.status(500).json({ message: 'Errore interno del server durante la registrazione.' });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
        const utente = await db.get('SELECT * FROM utenti WHERE email = ?', [email]);
        if (!utente) return res.status(401).json({ message: 'Credenziali non valide.' });
        const passwordCorrisponde = await bcrypt.compare(password, utente.password);
        if (!passwordCorrisponde) return res.status(401).json({ message: 'Credenziali non valide.' });
        const payload = { id: utente.id_utente, nome_pg: utente.nome_pg, permesso: utente.permesso };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ message: 'Login effettuato con successo!', token });
    } catch (errore) {
        res.status(500).json({ message: 'Errore interno del server.' });
    }
});

app.get('/api/users/find', verificaToken, async (req, res) => {
    console.log("\n=============================================");
    console.log("DEBUG: Richiesta ricevuta su /api/users/find");

    const { name } = req.query;
    console.log(`DEBUG: Sto cercando il nome: "${name}"`);

    const myId = req.utente.id;
    console.log(`DEBUG: L'ID dell'utente che cerca è: ${myId}`);

    if (!name) {
        return res.status(400).json({ message: 'Il nome del personaggio è richiesto.' });
    }

    try {
        const user = await db.get(
            "SELECT id_utente, nome_pg, avatar_chat FROM utenti WHERE nome_pg = TRIM(?) COLLATE NOCASE AND id_utente != ?",
            [name, myId]
        );
        
        console.log("DEBUG: Risultato della query sul database:", user);

        if (user) {
            console.log("DEBUG: Utente trovato! Invio i dati.");
            res.json(user);
        } else {
            console.log("DEBUG: Utente NON trovato. Invio errore 404.");
            res.status(404).json({ message: `Nessun giocatore di nome "${name}" è stato trovato.` });
        }
        console.log("=============================================\n");

    } catch (error) {
        console.error("ERRORE CRITICO nella ricerca dell'utente:", error);
        res.status(500).json({ message: 'Errore interno del server.' });
    }
});




app.get('/api/scheda', verificaToken, async (req, res) => {
    try {
      // La query è la stessa, non serve modificarla perché SELECT * prende già tutto
      const scheda = await db.get('SELECT * FROM utenti WHERE id_utente = ?', [req.utente.id]);
      if (!scheda) return res.status(404).json({ message: 'Scheda non trovata.' });
  
      const livello = calculateLevel(scheda.exp_accumulata);
      delete scheda.password;
      const schedaCompleta = { ...scheda, livello: livello };
      res.status(200).json(schedaCompleta);
    } catch (errore) {
      res.status(500).json({ message: 'Errore interno del server.' });
    }
  });
  
  
  
  // --- NUOVO ENDPOINT PER AGGIORNARE LE STATISTICHE ---
  app.post('/api/scheda/aggiorna-stat', verificaToken, async (req, res) => {
      const { updates, cost } = req.body;
      const userId = req.utente.id;
  
      if (!updates || typeof cost !== 'number') {
          return res.status(400).json({ message: "Dati invalidi per l'aggiornamento." });
      }
  
      try {
          await db.exec('BEGIN TRANSACTION');
  
          const utente = await db.get("SELECT * FROM utenti WHERE id_utente = ?", [userId]);
          if (!utente) {
              await db.exec('ROLLBACK');
              return res.status(404).json({ message: "Utente non trovato." });
          }
  
          // 1. Ricalcola il costo sul backend per sicurezza
          let serverCost = 0;
          const validStats = ['forza', 'destrezza', 'costituzione', 'mente'];
          for (const stat in updates) {
              if (!validStats.includes(stat)) continue; // Ignora statistiche non valide
  
              const originalValue = utente[stat];
              const newValue = updates[stat];
              if (newValue > originalValue) {
                  for (let i = originalValue + 1; i <= newValue; i++) {
                      serverCost += i * 10; // Stessa logica del frontend
                  }
              }
          }
          
          // 2. Confronta il costo del server con quello del client e controlla l'EXP
          if (serverCost !== cost || serverCost > utente.exp) {
              await db.exec('ROLLBACK');
              return res.status(400).json({ message: "Costo non valido o EXP insufficiente." });
          }
  
          // 3. Applica le modifiche
          await db.run(
              `UPDATE utenti SET 
                  exp = exp - ?, 
                  forza = ?, 
                  destrezza = ?, 
                  costituzione = ?, 
                  mente = ? 
              WHERE id_utente = ?`,
              [
                  serverCost,
                  updates.forza,
                  updates.destrezza,
                  updates.costituzione,
                  updates.mente,
                  userId
              ]
          );
  
          await db.exec('COMMIT');
  
          // 4. Invia la scheda aggiornata al client
          const schedaAggiornata = await db.get('SELECT * FROM utenti WHERE id_utente = ?', [userId]);
          delete schedaAggiornata.password;
          schedaAggiornata.livello = calculateLevel(schedaAggiornata.exp_accumulata);
  
          res.status(200).json(schedaAggiornata);
  
      } catch (error) {
          await db.exec('ROLLBACK');
          console.error("Errore aggiornamento statistiche:", error);
          res.status(500).json({ message: "Errore interno del server durante l'aggiornamento." });
      }
  });
  
  // --- NUOVO ENDPOINT PER AGGIORNARE IL PROFILO ---
app.put('/api/scheda/profilo', verificaToken, async (req, res) => {
    const { avatar, avatar_chat, background } = req.body;
    const userId = req.utente.id;

    try {
        await db.run(
            `UPDATE utenti SET 
                avatar = ?, 
                avatar_chat = ?, 
                background = ? 
            WHERE id_utente = ?`,
            [avatar, avatar_chat, background, userId]
        );

        // Invia la scheda aggiornata al client
        const schedaAggiornata = await db.get('SELECT * FROM utenti WHERE id_utente = ?', [userId]);
        delete schedaAggiornata.password;
        schedaAggiornata.livello = calculateLevel(schedaAggiornata.exp_accumulata);

        res.status(200).json(schedaAggiornata);

    } catch (error) {
        console.error("Errore aggiornamento profilo:", error);
        res.status(500).json({ message: "Errore interno del server durante l'aggiornamento del profilo." });
    }
});

// --- API PER IL BANNER PUBBLICO ---
app.get('/api/active-banner', async (req, res) => {
    try {
        const banner = await db.get("SELECT * FROM event_banners WHERE is_active = 1 LIMIT 1");
        res.json(banner || null);
    } catch (error) {
        console.error("Errore recupero banner attivo:", error);
        res.status(500).json({ message: "Errore nel recupero del banner." });
    }
});

// --- API PER LA GESTIONE DEI BANNER (ADMIN) ---
app.get('/api/admin/banners', verificaToken, verificaMod, async (req, res) => {
    try {
        const banners = await db.all("SELECT * FROM event_banners ORDER BY id DESC");
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero dei banner." });
    }
});

app.post('/api/admin/banners', verificaToken, verificaMod, async (req, res) => {
    try {
        const { title, image_url, link_url, is_active } = req.body;
        const result = await db.run("INSERT INTO event_banners (title, image_url, link_url, is_active) VALUES (?, ?, ?, ?)", [title, image_url, link_url, is_active ? 1 : 0]);
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        res.status(500).json({ message: "Errore nella creazione del banner." });
    }
});

app.put('/api/admin/banners/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        const { title, image_url, link_url, is_active } = req.body;
        await db.run("UPDATE event_banners SET title = ?, image_url = ?, link_url = ?, is_active = ? WHERE id = ?", [title, image_url, link_url, is_active ? 1 : 0, req.params.id]);
        res.json({ message: 'Banner aggiornato' });
    } catch (error) {
        res.status(500).json({ message: "Errore nell'aggiornamento del banner." });
    }
});

app.delete('/api/admin/banners/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        await db.run("DELETE FROM event_banners WHERE id = ?", [req.params.id]);
        res.json({ message: 'Banner eliminato' });
    } catch (error) {
        res.status(500).json({ message: "Errore nell'eliminazione del banner." });
    }
});

app.get('/api/chat/:chatId/history', verificaToken, async (req, res) => {
    const history = await db.all(`SELECT autore, permesso, testo, tipo, timestamp, luogo FROM chat_log WHERE chat_id = ? AND timestamp >= datetime('now', '-2 hours') ORDER BY timestamp ASC`, [req.params.chatId]);
    res.json(history);
});

// --- NUOVO BLOCCO API METEO ---
app.get('/api/weather', verificaToken, async (req, res) => {
    const { location } = req.query;
    if (!location) {
        return res.status(400).json({ message: 'Prefettura non specificata.' });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location},JP&appid=${apiKey}&units=metric&lang=it`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        const isDay = data.dt > data.sys.sunrise && data.dt < data.sys.sunset;
        let icon = 'sun.png'; // Default

        switch (data.weather[0].main.toLowerCase()) {
            case 'clear':
                icon = isDay ? 'sun.png' : 'moon.png';
                break;
            case 'clouds': case 'mist': case 'smoke': case 'haze': case 'dust': case 'fog': case 'sand': case 'ash': case 'squall': case 'tornado':
                icon = isDay ? 'sun.png' : 'moon.png'; // Semplificato per ora
                break;
            case 'rain': case 'drizzle': case 'thunderstorm':
                icon = 'rainy.png';
                break;
            case 'snow':
                icon = 'snow.png';
                break;
            default:
                icon = 'windy.png';
                break;
        }

        res.json({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: icon
        });

    } catch (error) {
        console.error("Errore API Meteo:", error.response?.data?.message || error.message);
        res.status(500).json({ message: 'Impossibile recuperare i dati meteo.' });
    }
});

// API DI GESTIONE (ADMIN)
app.get('/api/admin/users', verificaToken, verificaMod, async (req, res) => {
    const users = await db.all("SELECT id_utente, email, nome_pg, permesso FROM utenti");
    res.json(users);
});
app.put('/api/admin/users/:id', verificaToken, verificaMod, async (req, res) => {
    const { id } = req.params;
    const { email, nome_pg, permesso, password } = req.body;
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run("UPDATE utenti SET email = ?, nome_pg = ?, permesso = ?, password = ? WHERE id_utente = ?", [email, nome_pg, permesso, hashedPassword, id]);
    } else {
        await db.run("UPDATE utenti SET email = ?, nome_pg = ?, permesso = ? WHERE id_utente = ?", [email, nome_pg, permesso, id]);
    }
    res.json({ message: "Utente aggiornato con successo." });
});

app.get('/api/admin/chat-rooms', verificaToken, verificaAdmin, async (req, res) => {
    // SOSTITUISCI IL VECCHIO CODICE CON QUESTO:
    const rooms = await db.all("SELECT id, name FROM locations WHERE type = 'CHAT' ORDER BY name ASC");
    res.json(rooms);
});

app.get('/api/admin/logs', verificaToken, verificaMod, async (req, res) => {
    const { chatId, date } = req.query;
    if (!chatId || !date) return res.status(400).json({ message: "ID della chat e data sono richiesti." });
    const logs = await db.all("SELECT * FROM chat_log WHERE chat_id = ? AND date(timestamp) = ? ORDER BY timestamp ASC", [chatId, date]);
    res.json(logs);
});

// API GESTIONE LOCATIONS
app.get('/api/admin/locations', verificaToken, verificaAdmin, async (req, res) => {
    const locations = await db.all("SELECT * FROM locations ORDER BY parent_id, name");
    res.json(locations);
});
app.post('/api/admin/locations', verificaToken, verificaAdmin, async (req, res) => {
    const { parent_id, name, type, image_url, description, pos_x, pos_y, prefecture } = req.body;
    const result = await db.run("INSERT INTO locations (parent_id, name, type, image_url, description, pos_x, pos_y, master_notes, prefecture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [parent_id || null, name, type, image_url || null, description || '', pos_x || 50, pos_y || 50, '', prefecture || null]);
    res.status(201).json({ id: result.lastID, ...req.body });
});
app.put('/api/admin/locations/:id', verificaToken, verificaAdmin, async (req, res) => {
    const { name, image_url, description, pos_x, pos_y, prefecture } = req.body;
    await db.run("UPDATE locations SET name = ?, image_url = ?, description = ?, pos_x = ?, pos_y = ?, prefecture = ? WHERE id = ?", [name, image_url, description, pos_x, pos_y, prefecture, req.params.id]);
    res.json({ message: 'Location aggiornata con successo.' });
});
app.delete('/api/admin/locations/:id', verificaToken, verificaAdmin, async (req, res) => {
    await db.run("DELETE FROM locations WHERE id = ?", [req.params.id]);
    res.json({ message: 'Location eliminata con successo.' });
});

app.put('/api/admin/locations/:id/parent', verificaToken, verificaAdmin, async (req, res) => {
    const { newParentId } = req.body;
    const locationId = req.params.id;

    // Controllo per evitare che un elemento diventi genitore di se stesso
    if (Number(locationId) === Number(newParentId)) {
        return res.status(400).json({ message: "Una location non può essere figlia di se stessa." });
    }

    try {
        await db.run(
            "UPDATE locations SET parent_id = ? WHERE id = ?",
            [newParentId, locationId]
        );
        res.json({ message: 'Gerarchia mappa aggiornata con successo.' });
    } catch (error) {
        console.error("Errore nell'aggiornamento del genitore della location:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});


// API GESTIONE QUEST
app.get('/api/quests/trame', verificaToken, verificaMaster, async (req, res) => {
    const trame = await db.all("SELECT id, name FROM quests WHERE type = 'TRAMA' AND parent_quest_id IS NULL");
    res.json(trame);
});
app.post('/api/quests', verificaToken, verificaMaster, async (req, res) => {
    try {
        const { name, type, filone_name, parent_quest_id, participants } = req.body;
        const master_id = req.utente.id;
        const result = await db.run("INSERT INTO quests (name, type, master_id, filone_name, parent_quest_id) VALUES (?, ?, ?, ?, ?)", [name, type, master_id, filone_name, parent_quest_id]);
        const questId = result.lastID;
        if (participants && participants.length > 0) {
            const stmt = await db.prepare("INSERT INTO quest_participants (quest_id, user_id) VALUES (?, ?)");
            for (const userId of participants) { await stmt.run(questId, userId); }
            await stmt.finalize();
        }
        res.status(201).json({ message: 'Quest creata con successo!', questId: questId });
    } catch (error) {
        console.error("Errore creazione quest:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});
app.put('/api/quests/:id/status', verificaToken, verificaMaster, async (req, res) => {
    const { status } = req.body;
    if (status === 'CONCLUSA') {
        await db.run("UPDATE quests SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?", [status, req.params.id]);
    } else {
        await db.run("UPDATE quests SET status = ? WHERE id = ?", [status, req.params.id]);
    }
    res.json({ message: `Stato della quest aggiornato a ${status}` });
});

app.get('/api/quests/paused', verificaToken, verificaMaster, async (req, res) => {
    try {
      const pausedQuests = await db.all("SELECT id, name FROM quests WHERE master_id = ? AND status = 'PAUSA'", [req.utente.id]);
      res.json(pausedQuests);
    } catch (error) { res.status(500).json({ message: "Errore recupero quest in pausa." }); }
});


// --- API AGGIUNTA PER RISOLVERE IL BUG ---
app.get('/api/quests/:id', verificaToken, verificaMaster, async (req, res) => {
    try {
        const { id } = req.params;
        const questInfo = await db.get("SELECT * FROM quests WHERE id = ? AND master_id = ?", [id, req.utente.id]);
        if (!questInfo) return res.status(404).json({ message: 'Quest non trovata o non autorizzato.' });
        
        const participantsData = await db.all("SELECT u.id_utente AS id, u.nome_pg FROM quest_participants qp JOIN utenti u ON qp.user_id = u.id_utente WHERE qp.quest_id = ?", [id]);
        
        res.json({ 
            questId: questInfo.id, 
            name: questInfo.name, 
            type: questInfo.type, 
            participants: participantsData
        });
    } catch (error) {
        console.error("Errore recupero dettagli quest:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});
app.post('/api/quests/:id/rewards', verificaToken, verificaMaster, async (req, res) => {
  try {
      const { questId, questName, rewards } = req.body;
      await db.exec('BEGIN TRANSACTION');
      for (const reward of rewards) {
          if (reward.amount > 0) {
              await db.run("UPDATE utenti SET exp = exp + ?, exp_accumulata = exp_accumulata + ? WHERE id_utente = ?", [reward.amount, reward.amount, reward.userId]);
              await db.run("INSERT INTO exp_log (user_id, quest_id, amount, reason, master_signature) VALUES (?, ?, ?, ?, ?)", [reward.userId, questId, reward.amount, questName, `Shinigami (${req.utente.nome_pg})`]);
          }
      }
      await db.exec('COMMIT');
      res.json({ message: "Ricompense assegnate." });
  } catch (error) {
      await db.exec('ROLLBACK');
      console.error("Errore assegnazione ricompense:", error);
      res.status(500).json({ message: "Errore interno del server." });
  }
});

// --- API AGGIUNTA PER RISOLVERE IL BUG "CANCELLA" ---
app.delete('/api/quests/:id', verificaToken, verificaMaster, async (req, res) => {
  try {
      const { id } = req.params;
      // La cancellazione a cascata nel DB eliminerà anche i partecipanti
      await db.run("DELETE FROM quests WHERE id = ? AND master_id = ?", [id, req.utente.id]);
      res.json({ message: 'Quest eliminata con successo.' });
  } catch (error) {
      console.error("Errore nell'eliminazione della quest:", error);
      res.status(500).json({ message: "Errore interno del server." });
  }
});

// API PER IL GIOCO
app.get('/api/game/map/:mapId', verificaToken, async (req, res) => {
    let map;
    if (req.params.mapId === 'root') {
      map = await db.get("SELECT * FROM locations WHERE parent_id IS NULL AND type = 'MAP' LIMIT 1");
    } else {
      map = await db.get("SELECT * FROM locations WHERE id = ? AND type = 'MAP'", [req.params.mapId]);
    }
    if (!map) return res.status(404).json({ message: 'Mappa non trovata.' });
    const children = await db.all("SELECT * FROM locations WHERE parent_id = ?", [map.id]);
    res.json({ mapInfo: map, children: children });
});

app.get('/api/locations/:id', verificaToken, async (req, res) => {
    const location = await db.get("SELECT * FROM locations WHERE id = ?", [req.params.id]);
    if (location) res.json(location);
    else res.status(404).json({ message: 'Location non trovata.' });
});

app.put('/api/chats/:id/notes', verificaToken, verificaMaster, async (req, res) => {
    await db.run("UPDATE locations SET master_notes = ? WHERE id = ? AND type = 'CHAT'", [req.body.master_notes, req.params.id]);
    res.json({ message: 'Note del master aggiornate.' });
});

// =================================================================
// --- BLOCCO API FORUM ---
// =================================================================

// --- API PUBBLICHE (per visualizzare il forum) ---
app.get('/api/forum', verificaToken, async (req, res) => {
    try {
        const { id: userId } = req.utente; // Recupera l'ID utente per la query
        const sezioni = await db.all("SELECT * FROM forum_sezioni ORDER BY ordine ASC");
        
        const bacheche = await db.all(`
            SELECT 
                b.*,
                (SELECT COUNT(t.id) FROM forum_topics t WHERE t.bacheca_id = b.id) as topic_count,
                (SELECT t.ultimo_post_timestamp FROM forum_topics t WHERE t.bacheca_id = b.id ORDER BY t.ultimo_post_timestamp DESC LIMIT 1) as last_post_timestamp,
                (SELECT u.nome_pg FROM forum_topics t JOIN forum_posts p ON p.topic_id = t.id JOIN utenti u ON u.id_utente = p.autore_id WHERE t.bacheca_id = b.id ORDER BY p.timestamp_creazione DESC LIMIT 1) as last_post_author,
                EXISTS (
                    SELECT 1 FROM forum_topics t 
                    WHERE t.bacheca_id = b.id AND (t.ultimo_post_timestamp > IFNULL((SELECT r.last_read_timestamp FROM forum_topic_reads r WHERE r.topic_id = t.id AND r.user_id = ?), '1970-01-01'))
                ) as has_new_posts
            FROM forum_bacheche b 
            ORDER BY b.ordine ASC
        `, [userId]); // Passa l'ID utente come parametro alla query

        const forumData = sezioni.map(sezione => ({
            ...sezione,
            bacheche: bacheche.filter(bacheca => bacheca.sezione_id === sezione.id)
        }));
        res.json(forumData);
    } catch (error) {
        console.error("Errore recupero dati forum:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});


app.get('/api/forum/bacheca/:bachecaId/topics', verificaToken, async (req, res) => {
    try {
        const { bachecaId } = req.params;
        const { id: userId } = req.utente;

        const bacheca = await db.get("SELECT * FROM forum_bacheche WHERE id = ?", [bachecaId]);
        if (!bacheca) return res.status(404).json({ message: 'Bacheca non trovata.' });

        const topics = await db.all(`
            SELECT
                t.*,
                u.nome_pg AS autore_nome,
                (SELECT COUNT(p.id) FROM forum_posts p WHERE p.topic_id = t.id) as post_count,
                (SELECT u2.nome_pg FROM forum_posts p2 JOIN utenti u2 ON p2.autore_id = u2.id_utente WHERE p2.topic_id = t.id ORDER BY p2.timestamp_creazione DESC LIMIT 1) as ultimo_post_autore,

                -- --- ECCO LA LOGICA CORRETTA ---
                -- Se la data dell'ultimo post è più recente della data di lettura, O se la data di lettura non esiste (IFNULL), allora ci sono nuovi post.
                (t.ultimo_post_timestamp > IFNULL((SELECT r.last_read_timestamp FROM forum_topic_reads r WHERE r.topic_id = t.id AND r.user_id = ?), '1970-01-01 00:00:00')) as has_new_posts

            FROM forum_topics t
            JOIN utenti u ON t.autore_id = u.id_utente
            WHERE t.bacheca_id = ?
            ORDER BY t.is_pinned DESC, t.ultimo_post_timestamp DESC
        `, [userId, bachecaId]);

        res.json({ bacheca, topics });
    } catch (error) {
        console.error("Errore recupero topics per bacheca:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});

app.get('/api/forum/topic/:topicId', verificaToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const { id: userId } = req.utente;
        const topic = await db.get("SELECT t.*, u.nome_pg as autore_nome FROM forum_topics t JOIN utenti u ON t.autore_id = u.id_utente WHERE t.id = ?", [topicId]);
        if (!topic) return res.status(404).json({ message: 'Discussione non trovata.' });
        const posts = await db.all(`
            SELECT 
                p.*,
                u.nome_pg as autore_nome,
                u.permesso as autore_permesso,
                -- Se u.avatar_chat è NULL, usa '/icone/mini_avatar.png'
                COALESCE(u.avatar_chat, '/icone/mini_avatar.png') as autore_avatar_url,
                EXISTS(SELECT 1 FROM forum_post_likes WHERE post_id = p.id AND user_id = ?) as user_has_liked
            FROM forum_posts p 
            JOIN utenti u ON p.autore_id = u.id_utente 
            WHERE p.topic_id = ? 
            ORDER BY p.timestamp_creazione ASC
        `, [userId, topicId]);
        
        res.json({ ...topic, posts });
    } catch (error) { res.status(500).json({ message: "Errore interno del server." }); }
});

// =================================================================
// --- INIZIO BLOCCO API FORUM ---
// =================================================================

// --- API PUBBLICHE (per visualizzare il forum) ---


// Prende le discussioni all'interno di una singola bacheca
app.get('/api/forum/bacheca/:bachecaId/topics', verificaToken, async (req, res) => {
    try {
        const { bachecaId } = req.params;
        const { id: userId } = req.utente; // Prendiamo l'ID dell'utente che fa la richiesta

        const bacheca = await db.get("SELECT * FROM forum_bacheche WHERE id = ?", [bachecaId]);
        if (!bacheca) return res.status(404).json({ message: 'Bacheca non trovata.' });

        const topics = await db.all(`
            SELECT
                t.*,
                u.nome_pg AS autore_nome,
                (SELECT COUNT(p.id) FROM forum_posts p WHERE p.topic_id = t.id) as post_count,
                (SELECT u2.nome_pg FROM forum_posts p2 JOIN utenti u2 ON p2.autore_id = u2.id_utente WHERE p2.topic_id = t.id ORDER BY p2.timestamp_creazione DESC LIMIT 1) as ultimo_post_autore,
                -- La nuova logica per le notifiche:
                (t.ultimo_post_timestamp > (SELECT r.last_read_timestamp FROM forum_topic_reads r WHERE r.topic_id = t.id AND r.user_id = ?)) as has_new_posts
            FROM forum_topics t
            JOIN utenti u ON t.autore_id = u.id_utente
            WHERE t.bacheca_id = ?
            ORDER BY t.is_pinned DESC, t.ultimo_post_timestamp DESC
        `, [userId, bachecaId]);

        res.json({ bacheca, topics });
    } catch (error) {
        console.error("Errore recupero topics per bacheca:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});

// Prende una singola discussione con tutti i suoi post
app.get('/api/forum/topic/:topicId', verificaToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const { id: userId } = req.utente;
        const topic = await db.get("SELECT t.*, u.nome_pg as autore_nome FROM forum_topics t JOIN utenti u ON t.autore_id = u.id_utente WHERE t.id = ?", [topicId]);
        if (!topic) return res.status(404).json({ message: 'Discussione non trovata.' });

        const posts = await db.all(`
            SELECT 
                p.*,
                u.nome_pg as autore_nome,
                u.permesso as autore_permesso,
                u.avatar_chat as autore_avatar_url, -- MODIFICATO QUI
                EXISTS(SELECT 1 FROM forum_post_likes WHERE post_id = p.id AND user_id = ?) as user_has_liked
            FROM forum_posts p 
            JOIN utenti u ON p.autore_id = u.id_utente 
            WHERE p.topic_id = ? 
            ORDER BY p.timestamp_creazione ASC
        `, [userId, topicId]);
        
        res.json({ ...topic, posts });
    } catch (error) {
        console.error("Errore recupero discussione:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});


// --- API AZIONI UTENTE (creare, rispondere, etc.) ---

// Crea una nuova discussione
app.post('/api/forum/topics', verificaToken, async (req, res) => {
    try {
        const { bacheca_id, titolo, testo } = req.body;
        const autore_id = req.utente.id;
        if (!bacheca_id || !titolo || !testo) return res.status(400).json({ message: "Bacheca, titolo e testo sono obbligatori." });
        
        const bacheca = await db.get("SELECT is_locked FROM forum_bacheche WHERE id = ?", [bacheca_id]);
        if (bacheca && bacheca.is_locked) return res.status(403).json({ message: "Questa bacheca è chiusa e non è possibile creare nuove discussioni." });

        await db.exec('BEGIN TRANSACTION');
        const topicResult = await db.run("INSERT INTO forum_topics (bacheca_id, autore_id, titolo) VALUES (?, ?, ?)", [bacheca_id, autore_id, titolo]);
        const newTopicId = topicResult.lastID;
        await db.run("INSERT INTO forum_posts (topic_id, autore_id, testo) VALUES (?, ?, ?)", [newTopicId, autore_id, testo]);
        await db.exec('COMMIT');
        res.status(201).json({ message: 'Discussione creata con successo!', topicId: newTopicId });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Errore creazione discussione:", error);
        res.status(500).json({ message: "Errore durante la creazione della discussione." });
    }
});

// Aggiunge una risposta a una discussione
app.post('/api/forum/posts', verificaToken, async (req, res) => {
    try {
        const { topic_id, testo } = req.body;
        const autore_id = req.utente.id;
        if (!topic_id || !testo) return res.status(400).json({ message: "ID della discussione e testo sono obbligatori." });

        const topic = await db.get("SELECT is_locked FROM forum_topics WHERE id = ?", [topic_id]);
        if (!topic) return res.status(404).json({ message: "Discussione non trovata." });
        if (topic.is_locked) return res.status(403).json({ message: "Questa discussione è chiusa e non accetta nuove risposte." });

        await db.exec('BEGIN TRANSACTION');
        await db.run("INSERT INTO forum_posts (topic_id, autore_id, testo) VALUES (?, ?, ?)", [topic_id, autore_id, testo]);
        await db.run("UPDATE forum_topics SET ultimo_post_timestamp = CURRENT_TIMESTAMP WHERE id = ?", [topic_id]);
        await db.exec('COMMIT');
        res.status(201).json({ message: 'Risposta inviata con successo!' });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Errore invio risposta:", error);
        res.status(500).json({ message: "Errore durante l'invio della risposta." });
    }
});

// Mette o toglie un "like" a un post
app.post('/api/forum/posts/:id/like', verificaToken, async (req, res) => {
    const { id: postId } = req.params;
    const { id: userId } = req.utente;

    try {
        await db.exec('BEGIN TRANSACTION');
        const existingLike = await db.get("SELECT 1 FROM forum_post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
        let liked;

        if (existingLike) {
            // L'utente ha già messo like, quindi lo togliamo (UNLIKE)
            await db.run("DELETE FROM forum_post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);
            await db.run("UPDATE forum_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?", [postId]);
            liked = false;
        } else {
            // L'utente non ha messo like, quindi lo aggiungiamo (LIKE)
            await db.run("INSERT INTO forum_post_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
            await db.run("UPDATE forum_posts SET like_count = like_count + 1 WHERE id = ?", [postId]);
            liked = true;
        }

        await db.exec('COMMIT');

        // Dopo che la transazione è completata, leggiamo il nuovo conteggio aggiornato
        const { like_count } = await db.get("SELECT like_count FROM forum_posts WHERE id = ?", postId);

        res.json({ liked, newLikeCount: like_count });

    } catch (e) {
        await db.exec('ROLLBACK');
        console.error("Errore operazione like:", e);
        res.status(500).json({ message: "Errore durante l'operazione di 'like'." });
    }
});

// API per segnare una singola discussione come letta (quando l'utente la visita)
app.post('/api/forum/topics/:topicId/mark-as-read', verificaToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const { id: userId } = req.utente;
        // Inserisce o aggiorna il timestamp di lettura per l'utente e la discussione specifici
        await db.run(
            `INSERT INTO forum_topic_reads (user_id, topic_id, last_read_timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, topic_id) DO UPDATE SET last_read_timestamp = CURRENT_TIMESTAMP`,
            [userId, topicId]
        );
        res.status(200).json({ message: 'Discussione segnata come letta.' });
    } catch (error) {
        res.status(500).json({ message: "Errore nel segnare la discussione come letta." });
    }
});

// API per segnare TUTTE le discussioni del forum come lette
app.post('/api/forum/mark-all-as-read', verificaToken, async (req, res) => {
    try {
        const { id: userId } = req.utente;

        const topics = await db.all("SELECT id FROM forum_topics");
        if (topics.length === 0) {
            return res.status(200).json({ message: 'Nessuna discussione da segnare.' });
        }

        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare(
            `INSERT INTO forum_topic_reads (user_id, topic_id, last_read_timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, topic_id) DO UPDATE SET last_read_timestamp = CURRENT_TIMESTAMP`
        );
        for (const topic of topics) {
            await stmt.run(userId, topic.id);
        }
        await stmt.finalize();
        await db.exec('COMMIT');

        res.status(200).json({ message: 'Tutte le discussioni sono state segnate come lette.' });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Errore nel segnare tutto come letto:", error);
        res.status(500).json({ message: "Errore nel segnare tutto come letto." });
    }
});

// -- API PER BANCA E TRANSAZIONI

// =================================================================
// --- BLOCCO API BANCA ---
// =================================================================

// [ADMIN/MASTER] Assegna Rem a un giocatore
app.post('/api/admin/grant-rem', verificaToken, verificaMaster, async (req, res) => {
    const { receiverName, amount, reason } = req.body;
    const masterName = req.utente.nome_pg;

    if (!receiverName || !amount || !reason || amount <= 0) {
        return res.status(400).json({ message: "Dati mancanti o importo non valido." });
    }

    try {
        await db.exec('BEGIN TRANSACTION');

        const receiver = await db.get("SELECT id_utente FROM utenti WHERE nome_pg = ? COLLATE NOCASE", [receiverName]);
        if (!receiver) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ message: "Giocatore non trovato." });
        }

        await db.run("UPDATE utenti SET rem = rem + ? WHERE id_utente = ?", [amount, receiver.id_utente]);
        await db.run(
            "INSERT INTO transactions (receiver_id, amount, reason) VALUES (?, ?, ?)",
            [receiver.id_utente, amount, `${reason} (da: ${masterName})`]
        );

        await db.exec('COMMIT');
        res.json({ message: `${amount} Rem inviati a ${receiverName} con successo.` });

    } catch (error) {
        await db.exec('ROLLBACK');
        res.status(500).json({ message: "Errore interno del server." });
    }
});

// [PLAYER] Trasferisce Rem a un altro giocatore
app.post('/api/bank/transfer', verificaToken, async (req, res) => {
    const { receiverName, amount, reason } = req.body;
    const senderId = req.utente.id;

    if (!receiverName || !amount || !reason || amount <= 0) {
        return res.status(400).json({ message: "Dati mancanti o importo non valido." });
    }

    try {
        await db.exec('BEGIN TRANSACTION');

        const sender = await db.get("SELECT rem FROM utenti WHERE id_utente = ?", [senderId]);
        if (sender.rem < amount) {
            await db.exec('ROLLBACK');
            return res.status(400).json({ message: "Fondi insufficienti." });
        }

        const receiver = await db.get("SELECT id_utente FROM utenti WHERE nome_pg = ? COLLATE NOCASE AND id_utente != ?", [receiverName, senderId]);
        if (!receiver) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ message: "Giocatore destinatario non trovato." });
        }

        // Esegui il trasferimento
        await db.run("UPDATE utenti SET rem = rem - ? WHERE id_utente = ?", [amount, senderId]);
        await db.run("UPDATE utenti SET rem = rem + ? WHERE id_utente = ?", [amount, receiver.id_utente]);

        // Registra la transazione
        await db.run(
            "INSERT INTO transactions (sender_id, receiver_id, amount, reason) VALUES (?, ?, ?, ?)",
            [senderId, receiver.id_utente, amount, reason]
        );

        await db.exec('COMMIT');
        res.json({ message: "Trasferimento completato." });

    } catch (error) {
        await db.exec('ROLLBACK');
        res.status(500).json({ message: "Errore interno del server durante il trasferimento." });
    }
});

// [PLAYER] Recupera lo storico delle transazioni
app.get('/api/bank/history', verificaToken, async (req, res) => {
    const userId = req.utente.id;
    try {
        const history = await db.all(`
            SELECT 
                t.id, t.amount, t.reason, t.timestamp,
                t.sender_id,
                sender.nome_pg as sender_name,
                receiver.nome_pg as receiver_name
            FROM transactions t
            LEFT JOIN utenti sender ON t.sender_id = sender.id_utente
            JOIN utenti receiver ON t.receiver_id = receiver.id_utente
            WHERE t.sender_id = ? OR t.receiver_id = ?
            ORDER BY t.timestamp DESC
            LIMIT 50
        `, [userId, userId]);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Errore nel recupero dello storico." });
    }
});

// [PLAYER] Imposta il lavoro del giocatore
app.post('/api/bank/set-job', verificaToken, async (req, res) => {
    const { jobName } = req.body;
    const userId = req.utente.id;

    if (!jobName) {
        return res.status(400).json({ message: "Nome del lavoro non specificato." });
    }

    try {
        // Impedisce di scegliere un lavoro se ne hai già uno
        const utente = await db.get("SELECT job FROM utenti WHERE id_utente = ?", [userId]);
        if (utente.job) {
            return res.status(400).json({ message: "Hai già un lavoro." });
        }

        await db.run("UPDATE utenti SET job = ? WHERE id_utente = ?", [jobName, userId]);
        res.json({ message: `Hai scelto il lavoro: ${jobName}.` });
    } catch (error) {
        res.status(500).json({ message: "Errore durante la scelta del lavoro." });
    }
});

// [PLAYER] Ritira la paga giornaliera
app.post('/api/bank/collect-salary', verificaToken, async (req, res) => {
    const userId = req.utente.id;
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    try {
        await db.exec('BEGIN TRANSACTION');

        const utente = await db.get("SELECT job, last_salary_collection FROM utenti WHERE id_utente = ?", [userId]);

        if (!utente.job) {
            await db.exec('ROLLBACK');
            return res.status(400).json({ message: "Devi prima scegliere un lavoro." });
        }
        if (utente.last_salary_collection === today) {
            await db.exec('ROLLBACK');
            return res.status(400).json({ message: "Hai già ritirato la paga oggi. Riprova domani." });
        }

        const salary = 90;
        await db.run("UPDATE utenti SET rem = rem + ?, last_salary_collection = ? WHERE id_utente = ?", [salary, today, userId]);
        await db.run(
            "INSERT INTO transactions (receiver_id, amount, reason) VALUES (?, ?, ?)",
            [userId, salary, `Paga giornaliera: ${utente.job}`]
        );

        await db.exec('COMMIT');
        const updatedUser = await db.get("SELECT rem FROM utenti WHERE id_utente = ?", [userId]);
        res.json({ message: `Hai ricevuto ${salary} Rem per il tuo lavoro.`, newBalance: updatedUser.rem });

    } catch (error) {
        await db.exec('ROLLBACK');
        res.status(500).json({ message: "Errore durante il ritiro della paga." });
    }
});

//FINE API BANCA

// --- API GESTIONE FORUM (SOLO ADMIN) ---

// Gestione Sezioni
app.get('/api/admin/forum/sezioni', verificaToken, verificaMod, async (req, res) => {
    try {
        const sezioni = await db.all("SELECT * FROM forum_sezioni ORDER BY ordine ASC, nome ASC");
        res.json(sezioni);
    } catch (error) { res.status(500).json({ message: "Errore interno." }); }
});
app.post('/api/admin/forum/sezioni', verificaToken, verificaMod, async (req, res) => {
    try {
        const { nome, descrizione, ordine } = req.body;
        if (!nome) return res.status(400).json({ message: "Il nome è obbligatorio." });
        const result = await db.run("INSERT INTO forum_sezioni (nome, descrizione, ordine) VALUES (?, ?, ?)", [nome, descrizione || null, ordine || 0]);
        res.status(201).json({ id: result.lastID, ...req.body });
    } catch (error) { res.status(500).json({ message: 'Errore interno.' }); }
});
app.put('/api/admin/forum/sezioni/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descrizione, ordine } = req.body;
        if (!nome) return res.status(400).json({ message: "Il nome è obbligatorio." });
        await db.run("UPDATE forum_sezioni SET nome = ?, descrizione = ?, ordine = ? WHERE id = ?", [nome, descrizione, ordine, id]);
        res.json({ message: 'Sezione aggiornata.' });
    } catch (error) { res.status(500).json({ message: 'Errore interno.' }); }
});
app.delete('/api/admin/forum/sezioni/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        await db.run("DELETE FROM forum_sezioni WHERE id = ?", [req.params.id]);
        res.json({ message: 'Sezione eliminata.' });
    } catch (error) { res.status(500).json({ message: "Errore interno." }); }
});

// Gestione Bacheche
app.get('/api/admin/forum/bacheche', verificaToken, verificaMod, async (req, res) => {
    try {
        const bacheche = await db.all("SELECT b.*, s.nome as sezione_nome FROM forum_bacheche b JOIN forum_sezioni s ON b.sezione_id = s.id ORDER BY s.ordine, b.ordine");
        res.json(bacheche);
    } catch (error) { res.status(500).json({ message: "Errore interno." }); }
});
app.post('/api/admin/forum/bacheche', verificaToken, verificaMod, async (req, res) => {
    try {
        const { sezione_id, nome, descrizione, ordine } = req.body;
        if (!sezione_id || !nome) return res.status(400).json({ message: "Sezione e nome sono obbligatori."});
        const result = await db.run("INSERT INTO forum_bacheche (sezione_id, nome, descrizione, ordine) VALUES (?, ?, ?, ?)", [sezione_id, nome, descrizione, ordine || 0]);
        res.status(201).json({ id: result.lastID, ...req.body });
    } catch (error) { res.status(500).json({ message: "Errore interno." }); }
});
app.put('/api/admin/forum/bacheche/:id', verificaToken, verificaMod , async (req, res) => {
    try {
        const { id } = req.params;
        const { sezione_id, nome, descrizione, ordine } = req.body;
        if (!sezione_id || !nome) return res.status(400).json({ message: "Sezione e nome sono obbligatori."});
        await db.run("UPDATE forum_bacheche SET sezione_id = ?, nome = ?, descrizione = ?, ordine = ? WHERE id = ?", [sezione_id, nome, descrizione, ordine, id]);
        res.json({ message: 'Bacheca aggiornata.' });
    } catch (error) { res.status(500).json({ message: "Errore interno." }); }
});
app.delete('/api/admin/forum/bacheche/:id', verificaToken, verificaMod , async (req, res) => {
    try {
        await db.run("DELETE FROM forum_bacheche WHERE id = ?", [req.params.id]);
        res.json({ message: 'Bacheca eliminata.' });
    } catch (error) { res.status(500).json({ message: "Errore interno." }); }
});
app.put('/api/admin/forum/bacheche/:id/lock', verificaToken, verificaMod , async (req, res) => {
    try {
        const { id } = req.params;
        const { is_locked } = req.body;
        await db.run("UPDATE forum_bacheche SET is_locked = ? WHERE id = ?", [is_locked ? 1 : 0, id]);
        res.json({ message: `Bacheca ${is_locked ? 'bloccata' : 'sbloccata'}.` });
    } catch (error) { res.status(500).json({ message: "Errore durante l'operazione di blocco." }); }
});

// Gestione Discussioni
// lock
app.put('/api/admin/forum/topics/:id/lock', verificaToken, verificaMod , async (req, res) => {
    try {
        const { id } = req.params;
        const { is_locked } = req.body;
        await db.run("UPDATE forum_topics SET is_locked = ? WHERE id = ?", [is_locked ? 1 : 0, id]);
        res.json({ message: `Discussione ${is_locked ? 'bloccata' : 'sbloccata'}.` });
    } catch (error) { res.status(500).json({ message: "Errore durante l'operazione di blocco." }); }
});
//cancella discussione
app.delete('/api/admin/forum/topics/:id', verificaToken, verificaMod , async (req, res) => {
    try {
        const { id } = req.params;
        // Grazie a ON DELETE CASCADE, verranno eliminati anche tutti i post e i like collegati.
        await db.run("DELETE FROM forum_topics WHERE id = ?", [id]);
        res.json({ message: 'Discussione eliminata con successo.' });
    } catch (error) {
        console.error("Errore eliminazione discussione:", error);
        res.status(500).json({ message: "Errore durante l'eliminazione della discussione." });
    }
});

// pin
app.put('/api/admin/forum/topics/:id/pin', verificaToken, verificaMod , async (req, res) => {
    try {
        const { id } = req.params;
        const { is_pinned } = req.body; // si aspetta true o false
        await db.run("UPDATE forum_topics SET is_pinned = ? WHERE id = ?", [is_pinned ? 1 : 0, id]);
        res.json({ message: `Discussione ${is_pinned ? 'fissata' : 'sbloccata'} con successo.` });
    } catch (error) {
        console.error("Errore durante l'operazione di pin:", error);
        res.status(500).json({ message: "Errore durante l'operazione di pin." });
    }
});
// cancella post
app.delete('/api/admin/forum/posts/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        const { id } = req.params;

        const post = await db.get("SELECT id FROM forum_posts WHERE id = ?", [id]);
        if (!post) {
            return res.status(404).json({ message: "Post non trovato." });
        }

        await db.run("DELETE FROM forum_posts WHERE id = ?", [id]);
        res.json({ message: 'Post eliminato con successo.' });

    } catch (error) {
        console.error("Errore durante l'eliminazione del post:", error);
        res.status(500).json({ message: "Errore durante l'eliminazione del post." });
    }
});



// =================================================================
// --- FINE BLOCCO API FORUM ---
// =================================================================



//  =================================
//  --- API PER VISORI (NEWS)
//  =================================
// API per recuperare gli ultimi topic per il news visor

app.get('/api/forum/bacheca/:bachecaId/latest-topics', verificaToken, async (req, res) => {
    try {
        const { bachecaId } = req.params;
        const topics = await db.all(`
            SELECT 
                t.titolo,
                SUBSTR(p.testo, 1, 120) || ' ...' as anteprima,
                t.timestamp_creazione
            FROM forum_topics t
            JOIN forum_posts p ON p.topic_id = t.id
            WHERE t.bacheca_id = ? 
              AND p.id = (SELECT MIN(id) FROM forum_posts WHERE topic_id = t.id)
            ORDER BY t.ultimo_post_timestamp DESC
            LIMIT 5
        `, [bachecaId]);
        res.json(topics);
    } catch (error) {
        console.error("Errore recupero latest topics:", error);
        res.status(500).json({ message: 'Errore interno del server' });
    }
});
// --- FINE VISORE NEWS - HOT TOPIC

// --- 4. GESTIONE WEBSOCKET ---
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Autenticazione fallita: token mancante."));
    jwt.verify(token, process.env.JWT_SECRET, (err, utente) => {
        if (err) return next(new Error("Autenticazione fallita: token non valido."));
        socket.utente = utente;
        next();
    });
});
io.on('connection', async (socket) => { 
    try {
        const userData = await db.get("SELECT nome_pg, permesso, avatar_chat FROM utenti WHERE id_utente = ?", [socket.utente.id]);
        
        
        const userProfile = {
            id: socket.utente.id,
            nome_pg: userData.nome_pg,
            permesso: userData.permesso,
            avatar_chat: userData.avatar_chat || '/icone/mini_avatar.png'
        };

        console.log(`✅ Utente AUTENTICATO connesso: ${userProfile.nome_pg}`);
        onlineUsers[socket.id] = userProfile;
        userSockets.set(userProfile.id, socket.id); 
        io.emit('update_online_list', Object.values(onlineUsers));
        
        const updateRoomUsers = async (chatId) => {
            const socketsInRoom = await io.in(chatId).fetchSockets();
            const usersInRoom = socketsInRoom.map(s => onlineUsers[s.id]); // Usiamo i dati aggiornati
            io.to(chatId).emit('room_users_update', usersInRoom);
        };

        socket.on('join_chat', (chatId) => { socket.join(chatId); updateRoomUsers(chatId); });
        socket.on('leave_chat', (chatId) => { socket.leave(chatId); updateRoomUsers(chatId); });

        socket.on('send_message', async (data) => {
            // 4. Quando invia un messaggio, aggiungiamo l'URL dell'avatar
            const messageData = { 
                ...data, 
                autore: userProfile.nome_pg, 
                permesso: userProfile.permesso,
                avatar_url: userProfile.avatar_chat 
            };

        if (messageData.tipo === 'azione') {
            const userId = socket.utente.id;
            const textLength = messageData.testo.length;
            const expGained = Math.floor(textLength / 500) * 2;
            if (expGained > 0) {
                try {
                    const userExpData = await db.get("SELECT daily_exp_earned, last_exp_date FROM utenti WHERE id_utente = ?", [userId]);
                    const today = new Date().toISOString().split('T')[0];
                    let dailyExp = userExpData.daily_exp_earned || 0;
                    if (userExpData.last_exp_date !== today) { dailyExp = 0; }
                    const maxExpToday = 100 - dailyExp;
                    const expToAward = Math.min(expGained, maxExpToday);
                    if (expToAward > 0) {
                        await db.run(`UPDATE utenti SET exp = exp + ?, exp_accumulata = exp_accumulata + ?, daily_exp_earned = ?, last_exp_date = ? WHERE id_utente = ?`, [expToAward, expToAward, dailyExp + expToAward, today, userId]);
                        console.log(`✨ ${socket.utente.nome_pg} ha guadagnato ${expToAward} EXP!`);
                    }
                } catch (expError) { console.error("Errore nell'assegnazione dell'EXP:", expError); }
            }
        }
        try { await db.run('INSERT INTO chat_log (chat_id, autore, permesso, testo, tipo, quest_id, luogo) VALUES (?, ?, ?, ?, ?, ?, ?)', [messageData.chatId, messageData.autore, messageData.permesso, messageData.testo, messageData.tipo, messageData.quest_id, messageData.luogo]); } catch (dbError) { console.error("Errore nel salvataggio del messaggio:", dbError); }
            switch (messageData.tipo) {
                case 'globale': if (userProfile.permesso === 'ADMIN') io.emit('new_message', messageData); break;
                default: io.to(messageData.chatId).emit('new_message', messageData); break;
            }
        });

    socket.on('roll_dice', async (data) => {
        const { chatId, diceType } = data;
        if (!chatId || !diceType) return;
        const result = Math.floor(Math.random() * diceType) + 1;
        const diceText = `lancia un D${diceType} e ottiene: ${result}`;
        const messageData = { chatId, autore: socket.utente.nome_pg, permesso: socket.utente.permesso, testo: diceText, tipo: 'dado' };
        try {
            await db.run('INSERT INTO chat_log (chat_id, autore, permesso, testo, tipo) VALUES (?, ?, ?, ?, ?)', [messageData.chatId, messageData.autore, messageData.permesso, messageData.testo, messageData.tipo]);
        } catch (dbError) { console.error("Errore nel salvataggio del lancio di dado:", dbError); }
        io.to(chatId).emit('new_message', messageData);
    });

    //socket.on per messaggi privati 
socket.on('send_private_message', async ({ receiverId, text }) => {
    const senderId = socket.utente.id;
    if (!receiverId || !text) return;

    try {
        // 1. Salva il messaggio nel DB
        const result = await db.run(
            'INSERT INTO private_messages (sender_id, receiver_id, text) VALUES (?, ?, ?)',
            [senderId, receiverId, text]
        );
        const message = await db.get('SELECT * FROM private_messages WHERE id = ?', result.lastID);

        // 2. Prepara il payload completo del messaggio
        const senderData = await db.get('SELECT nome_pg, avatar_chat FROM utenti WHERE id_utente = ?', senderId);
        const messagePayload = { ...message, sender_name: senderData.nome_pg, sender_avatar: senderData.avatar_chat };

        // 3. Invia al destinatario, se online
        const receiverSocketId = userSockets.get(Number(receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_private_message', messagePayload);
        }

        // 4. Invia una conferma al mittente per aggiornare la sua UI
        socket.emit('private_message_sent', messagePayload);

    } catch (error) {
        console.error("Errore invio messaggio privato:", error);
    }
});

   socket.on('disconnect', () => {
            console.log(`❌ Utente ${userProfile.nome_pg} si è disconnesso.`);
            userSockets.delete(userProfile.id);
            delete onlineUsers[socket.id];
            io.emit('update_online_list', Object.values(onlineUsers));
        });

    } catch(e) {
        console.error("Errore durante la connessione del socket:", e);
        socket.disconnect();
    }
});



// --- API PER LA MUSICA ---

// Recupera tutte le playlist
app.get('/api/playlists', verificaToken, async (req, res) => {
    try {
        const playlists = await db.all("SELECT * FROM playlists ORDER BY name ASC");
        res.json(playlists);
    } catch (e) { res.status(500).json({ message: "Errore recupero playlist."}); }
});

// Recupera le canzoni di una playlist
app.get('/api/playlists/:id/songs', verificaToken, async (req, res) => {
    try {
        const songs = await db.all("SELECT * FROM songs WHERE playlist_id = ? ORDER BY id ASC", [req.params.id]);
        res.json(songs);
    } catch (e) { res.status(500).json({ message: "Errore recupero canzoni."}); }
});

// Endpoint speciale per lo streaming da YouTube

app.get('/api/youtube-stream/:videoId', async (req, res) => {
    const videoId = req.params.videoId;
    console.log(`[Server] Ricevuta richiesta per lo streaming di: ${videoId}`); // Messaggio chiave

    try {
        if (!ytdl.validateID(videoId)) {
            console.error(`[Server] ID video non valido: ${videoId}`);
            return res.status(400).send("ID video non valido");
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(videoUrl);
        
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio', 
            filter: 'audioonly' 
        });

        if (!format) {
            console.error(`[Server] Nessun formato solo audio trovato per ${videoId}.`);
            return res.status(404).send("Formato audio non trovato per questo video.");
        }
        
        console.log(`[Server] Formato audio trovato. Avvio dello streaming...`);
        ytdl(videoUrl, { format: format }).pipe(res);

    } catch (error) {
        console.error(`[Server] ERRORE CRITICO nello streaming di ${videoId}:`, error.message);
        res.status(500).send("Errore durante il recupero dello stream audio.");
    }
});


// API per la gestione della musica (ADMIN)
app.post('/api/admin/playlists', verificaToken, verificaMod, async (req, res) => {
    const { name } = req.body;
    const result = await db.run("INSERT INTO playlists (name) VALUES (?)", [name]);
    res.status(201).json({ id: result.lastID });
});

app.post('/api/admin/songs', verificaToken, verificaMod, async (req, res) => {
    const { playlist_id, title, source_type, url, cover_image_url } = req.body;
    const result = await db.run("INSERT INTO songs (playlist_id, title, source_type, url, cover_image_url) VALUES (?, ?, ?, ?, ?)", [playlist_id, title, source_type, url, cover_image_url]);
    res.status(201).json({ id: result.lastID });
});

// --- MODIFICARE UNA CANZONE ---
app.put('/api/admin/songs/:id', verificaToken, verificaMod, async (req, res) => {
    const { playlist_id, title, source_type, url, cover_image_url } = req.body;
    try {
        await db.run(
            `UPDATE songs SET 
                playlist_id = ?, 
                title = ?, 
                source_type = ?, 
                url = ?, 
                cover_image_url = ? 
            WHERE id = ?`,
            [playlist_id, title, source_type, url, cover_image_url, req.params.id]
        );
        res.json({ message: 'Canzone aggiornata con successo' });
    } catch (error) {
        console.error("Errore nell'aggiornamento della canzone:", error);
        res.status(500).json({ message: 'Errore interno del server' });
    }
});

app.delete('/api/admin/songs/:id', verificaToken, verificaMod, async (req, res) => {
    await db.run("DELETE FROM songs WHERE id = ?", [req.params.id]);
    res.json({ message: 'Canzone eliminata' });
});

//FINE API MUSICA


// API PER EVENTI MONDANI

// --- API GESTIONE EVENTI GIORNALIERI (ADMIN) ---
app.get('/api/admin/daily-events', verificaToken, verificaMod, async (req, res) => {
    try {
        const events = await db.all("SELECT * FROM daily_events ORDER BY event_date DESC");
        res.json(events);
    } catch (error) {
        console.error("Errore recupero eventi giornalieri (admin):", error);
        res.status(500).json({ message: "Errore nel recupero degli eventi giornalieri." });
    }
});

app.post('/api/admin/daily-events', verificaToken, verificaMod, async (req, res) => {
    try {
        const { event_date, title, description } = req.body;
        if (!event_date || !title || !description) {
            return res.status(400).json({ message: "Data, titolo e descrizione sono obbligatori." });
        }
        const result = await db.run("INSERT INTO daily_events (event_date, title, description) VALUES (?, ?, ?)", [event_date, title, description]);
        res.status(201).json({ id: result.lastID, ...req.body });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Esiste già un evento per questa data.' });
        }
        console.error("Errore creazione evento giornaliero:", error);
        res.status(500).json({ message: "Errore nella creazione dell'evento giornaliero." });
    }
});

app.put('/api/admin/daily-events/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        const { event_date, title, description } = req.body;
        await db.run("UPDATE daily_events SET event_date = ?, title = ?, description = ? WHERE id = ?", [event_date, title, description, req.params.id]);
        res.json({ message: 'Evento giornaliero aggiornato.' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ message: 'Esiste già un evento per questa data.' });
        }
        console.error("Errore aggiornamento evento giornaliero:", error);
        res.status(500).json({ message: "Errore nell'aggiornamento dell'evento giornaliero." });
    }
});

app.delete('/api/admin/daily-events/:id', verificaToken, verificaMod, async (req, res) => {
    try {
        await db.run("DELETE FROM daily_events WHERE id = ?", [req.params.id]);
        res.json({ message: 'Evento giornaliero eliminato.' });
    } catch (error) {
        console.error("Errore eliminazione evento giornaliero:", error);
        res.status(500).json({ message: "Errore nell'eliminazione dell'evento giornaliero." });
    }
});

// --- API PUBBLICA PER OTTENERE L'EVENTO DI OGGI ---
app.get('/api/daily-event', verificaToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const event = await db.get("SELECT title, description FROM daily_events WHERE event_date = ?", [today]);
        res.json(event || null);
    } catch (error) {
        console.error("Errore recupero evento giornaliero di oggi:", error);
        res.status(500).json({ message: "Errore nel recupero dell'evento giornaliero." });
    }
});

// =================================================================
// --- BLOCCO API MESSAGGISTICA PRIVATA ---
// =================================================================

// Prende la lista di tutte le conversazioni dell'utente
app.get('/api/pm/conversations', verificaToken, async (req, res) => {
    try {
        const myId = req.utente.id;
        const conversations = await db.all(`
            SELECT
                u.id_utente,
                u.nome_pg,
                u.avatar_chat,
                (SELECT text FROM private_messages WHERE (sender_id = u.id_utente AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id_utente) ORDER BY timestamp DESC LIMIT 1) as last_message,
                (SELECT timestamp FROM private_messages WHERE (sender_id = u.id_utente AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id_utente) ORDER BY timestamp DESC LIMIT 1) as last_message_timestamp,
                (SELECT COUNT(*) FROM private_messages WHERE sender_id = u.id_utente AND receiver_id = ? AND is_read = 0) as unread_count
            FROM (
                SELECT DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as user_id
                FROM private_messages WHERE sender_id = ? OR receiver_id = ?
            ) as conv
            JOIN utenti u ON conv.user_id = u.id_utente
            ORDER BY last_message_timestamp DESC
        `, [myId, myId, myId, myId, myId, myId, myId, myId]);
        res.json(conversations);
    } catch (error) {
        console.error("Errore recupero conversazioni:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});

// Prende la cronologia di una singola conversazione e la segna come letta
app.get('/api/pm/conversation/:userId', verificaToken, async (req, res) => {
    try {
        const myId = req.utente.id;
        const otherUserId = req.params.userId;

        const messages = await db.all(`
            SELECT pm.*, s.nome_pg as sender_name, s.avatar_chat as sender_avatar
            FROM private_messages pm
            JOIN utenti s ON pm.sender_id = s.id_utente
            WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
            ORDER BY pm.timestamp ASC
        `, [myId, otherUserId, otherUserId, myId]);

        // Segna i messaggi come letti
        await db.run(
            'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
            [otherUserId, myId]
        );

        res.json(messages);
    } catch (error) {
        console.error("Errore recupero messaggi privati:", error);
        res.status(500).json({ message: "Errore interno del server." });
    }
});

// FINE MESSAGGI PRIVATI 


// --- 5. FUNZIONE DI AVVIO ---
const avviaApplicazione = async () => {
    try {
        db = await open({ filename: './gdr.db', driver: sqlite3.Database });
        await db.run('PRAGMA foreign_keys = ON;');
        await db.run('PRAGMA journal_mode = WAL;');
        console.log('DB Connesso.');

        // --- Creazione e Aggiornamento Tabelle ---
// Dentro la funzione avviaApplicazione in server.js

await db.exec(`
    CREATE TABLE IF NOT EXISTS utenti (
        id_utente INTEGER PRIMARY KEY AUTOINCREMENT, 
        email TEXT NOT NULL UNIQUE, 
        password TEXT NOT NULL, 
        nome_pg TEXT, 
        permesso TEXT DEFAULT 'PLAYER', 
        exp INTEGER DEFAULT 0, 
        exp_accumulata INTEGER DEFAULT 0, 
        daily_exp_earned INTEGER DEFAULT 0, 
        last_exp_date TEXT, 
        mente INTEGER DEFAULT 5, 
        forza INTEGER DEFAULT 5, 
        destrezza INTEGER DEFAULT 5, 
        costituzione INTEGER DEFAULT 5, 
        avatar TEXT, 
        avatar_chat TEXT,
        preferenze_gioco TEXT  
    )
`);        
        await db.exec(`CREATE TABLE IF NOT EXISTS chat_log (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT NOT NULL, autore TEXT NOT NULL, permesso TEXT, testo TEXT NOT NULL, tipo TEXT NOT NULL, quest_id INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        await db.exec(`CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER, name TEXT NOT NULL, type TEXT NOT NULL, image_url TEXT, description TEXT, master_notes TEXT, pos_x INTEGER, pos_y INTEGER, prefecture TEXT, FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE CASCADE)`);
        
        await db.exec(`CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'IN_CORSO', master_id INTEGER NOT NULL, filone_name TEXT, parent_quest_id INTEGER, start_time DATETIME DEFAULT CURRENT_TIMESTAMP, end_time DATETIME, FOREIGN KEY (master_id) REFERENCES utenti(id_utente))`);
        
        await db.exec(`CREATE TABLE IF NOT EXISTS quest_participants (id INTEGER PRIMARY KEY AUTOINCREMENT, quest_id INTEGER NOT NULL, user_id INTEGER NOT NULL, exp_reward INTEGER DEFAULT 0, FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES utenti(id_utente) ON DELETE CASCADE)`);


        // Tabelle del Forum
        await db.exec(`CREATE TABLE IF NOT EXISTS forum_sezioni (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL UNIQUE, descrizione TEXT, ordine INTEGER DEFAULT 0)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS forum_bacheche (id INTEGER PRIMARY KEY AUTOINCREMENT, sezione_id INTEGER NOT NULL, nome TEXT NOT NULL, descrizione TEXT, ordine INTEGER DEFAULT 0, is_locked INTEGER DEFAULT 0 NOT NULL, FOREIGN KEY (sezione_id) REFERENCES forum_sezioni(id) ON DELETE CASCADE)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS forum_topics (id INTEGER PRIMARY KEY AUTOINCREMENT, bacheca_id INTEGER NOT NULL, autore_id INTEGER NOT NULL, titolo TEXT NOT NULL, is_locked INTEGER DEFAULT 0 NOT NULL, is_pinned INTEGER DEFAULT 0 NOT NULL, timestamp_creazione DATETIME DEFAULT CURRENT_TIMESTAMP, ultimo_post_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (bacheca_id) REFERENCES forum_bacheche(id) ON DELETE CASCADE, FOREIGN KEY (autore_id) REFERENCES utenti(id_utente) ON DELETE SET NULL)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS forum_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, autore_id INTEGER NOT NULL, testo TEXT NOT NULL, like_count INTEGER DEFAULT 0 NOT NULL, timestamp_creazione DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE, FOREIGN KEY (autore_id) REFERENCES utenti(id_utente) ON DELETE SET NULL)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS forum_post_likes (post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES utenti(id_utente) ON DELETE CASCADE, PRIMARY KEY (post_id, user_id))`);
        await db.exec(`CREATE TABLE IF NOT EXISTS forum_topic_reads (user_id INTEGER NOT NULL, topic_id INTEGER NOT NULL, last_read_timestamp DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES utenti(id_utente) ON DELETE CASCADE, FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE, PRIMARY KEY (user_id, topic_id))`);
        
        // Tabelle Banner e Musica
        await db.exec(`CREATE TABLE IF NOT EXISTS event_banners (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, image_url TEXT NOT NULL, link_url TEXT, is_active INTEGER DEFAULT 0)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`);
        await db.exec(`CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_id INTEGER NOT NULL, title TEXT NOT NULL, source_type TEXT NOT NULL, url TEXT NOT NULL, cover_image_url TEXT, FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE)`);
        
        // Esegui migrazioni/alterazioni qui per evitare di perdere dati
        await db.exec(`ALTER TABLE utenti ADD COLUMN background TEXT DEFAULT ''`).catch(() => {});
        await db.exec(`ALTER TABLE locations ADD COLUMN prefecture TEXT`).catch(() => {});
        await db.exec(`ALTER TABLE chat_log ADD COLUMN luogo TEXT`).catch(() => {}); //luogo alla chat
        await db.exec(`ALTER TABLE utenti ADD COLUMN job TEXT`).catch(() => {});
        await db.exec(`ALTER TABLE utenti ADD COLUMN last_salary_collection TEXT`).catch(() => {});


        // Daily Eventsss

        await db.exec(`
            CREATE TABLE IF NOT EXISTS daily_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_date TEXT NOT NULL UNIQUE, -- Formato YYYY-MM-DD
                title TEXT NOT NULL,
                description TEXT NOT NULL
            )
        `);

        // MESSAGGISTICA PRIVATA MP
        await db.exec(`CREATE TABLE IF NOT EXISTS private_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES utenti(id_utente) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES utenti(id_utente) ON DELETE CASCADE
        )`);
        
            // BANCA E MONEYS
            await db.exec(`ALTER TABLE utenti ADD COLUMN rem INTEGER DEFAULT 0 NOT NULL`).catch(() => {});

await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        receiver_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES utenti(id_utente) ON DELETE SET NULL,
        FOREIGN KEY (receiver_id) REFERENCES utenti(id_utente) ON DELETE CASCADE
    )
`);

        console.log("Tutte le tabelle sono pronte.");
        
        httpServer.listen(port, () => {
            console.log(`🚀 Server avviato su http://localhost:${port}`);
        });
    } catch (errore) {
        console.error("ERRORE CRITICO:", errore);
    }
};

// --- 6. AVVIO DELL'APPLICAZIONE ---
avviaApplicazione();
