// migrate.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function runMigration() {
  const db = await open({ filename: './gdr.db', driver: sqlite3.Database });
  console.log('Avvio migrazione per EXP Log e Quest...');

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS exp_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quest_id INTEGER,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        master_signature TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES utenti(id_utente),
        FOREIGN KEY (quest_id) REFERENCES quests(id)
      )
    `);
    console.log("✅ Tabella 'exp_log' pronta.");
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log("🟡 Tabella 'exp_log' esiste già.");
    } else {
      console.error("❌ Errore durante la migrazione:", error);
    }
  }
  await db.close();
}
runMigration();