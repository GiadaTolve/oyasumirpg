import React, { useState, useEffect } from 'react';
import api from '../api'; // Importiamo la nostra istanza di axios configurata!
import SchedaPersonaggio from './SchedaPersonaggio';

function Home({ onLogout }) {
  const [scheda, setScheda] = useState(null); // Stato per i dati della scheda
  const [errore, setErrore] = useState('');   // Stato per gli errori

  // useEffect si attiva quando il componente viene montato
  useEffect(() => {
    const recuperaScheda = async () => {
      try {
        // Facciamo la richiesta all'endpoint protetto '/scheda'
        const response = await api.get('/scheda');
        setScheda(response.data); // Salviamo i dati nello stato
      } catch (err) {
        console.error("Errore nel recupero della scheda:", err);
        setErrore('Impossibile caricare la scheda personaggio.');
        // Se l'errore è 403 (token non valido), potremmo anche forzare il logout
        if (err.response && err.response.status === 403) {
          onLogout();
        }
      }
    };

    recuperaScheda();
  }, [onLogout]); // L'array di dipendenze

  return (
    <div>
      <h1>Benvenuto nel GDR!</h1>
      <p>Sei stato autenticato con successo.</p>
      <hr />

      {errore ? <p style={{color: 'red'}}>{errore}</p> : <SchedaPersonaggio datiScheda={scheda} />}

      <hr />
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Home;