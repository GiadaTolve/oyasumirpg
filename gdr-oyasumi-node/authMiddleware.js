const jwt = require('jsonwebtoken');

const verificaToken = (req, res, next) => {
  // 1. Cerchiamo il token nell'header della richiesta
  const authHeader = req.headers['authorization'];
  // L'header è nel formato "Bearer TOKEN". Noi vogliamo solo il TOKEN.
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Se non c'è il token, neghiamo l'accesso
  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  // 3. Verifichiamo che il token sia valido
  jwt.verify(token, process.env.JWT_SECRET, (err, utente) => {
    if (err) {
      return res.sendStatus(403); // Forbidden (token non valido o scaduto)
    }

    // Se il token è valido, alleghiamo i dati dell'utente alla richiesta
    req.utente = utente;

    // E passiamo al prossimo step (la funzione dell'API vera e propria)
    next();
  });
};

module.exports = verificaToken;