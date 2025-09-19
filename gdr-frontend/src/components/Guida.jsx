import React from 'react';
import ModalWindow from './ModalWindow'; // Importiamo il nostro nuovo componente

function Guida({ onClose }) {
  return (
    <ModalWindow title="Guida Introduttiva" onClose={onClose}>
      {/* Qui dentro va tutto il contenuto specifico della guida */}
      <h1>Benvenuto in Oyasumi</h1>
      <p>
        Questa guida ti aiuterà a muovere i primi passi nel mondo di gioco.
        Il sistema si basa su un'interfaccia a finestre...
      </p>
      <h2>Comandi di base</h2>
      <p>
        Per parlare usa la sintassi <strong>&lt;...&gt;</strong> che verrà trasformata in «...».<br/>
        Per lanciare i dadi, usa il menu a tendina nell'area di input della chat.
      </p>
    </ModalWindow>
  );
}

export default Guida;