import React from 'react';
import ModalWindow from './ModalWindow'; 

function Shinigami({ onClose }) {

  return (
    <ModalWindow title="Pannello Shinigami" onClose={onClose}>

      <h3>Strumenti del Master</h3>
      <p>
          Questo è un segnaposto per il pannello Shinigami globale.
          Qui potrai inserire strumenti utili per i Master e gli Admin, come:
      </p>
      <ul>
          <li>Una lista di tutte le quest attive nel gioco.</li>
          <li>Strumenti per generare eventi globali.</li>
          <li>Accesso rapido ai log di tutti i giocatori.</li>
      </ul>

    </ModalWindow>
  );
}

export default Shinigami;