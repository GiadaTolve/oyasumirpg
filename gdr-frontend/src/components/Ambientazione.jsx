import React from 'react';
import ModalWindow from './ModalWindow';

function Ambientazione({ onClose }) {
  return (
    <ModalWindow title="L'Ambientazione di Oyasumi" onClose={onClose}>
        <h1>Il Mondo di Oyasumi</h1>
        <p>
            Ci troviamo in un Giappone futuristico, un luogo dove tecnologia e antiche
            tradizioni si scontrano. Le corporazioni controllano le città illuminate
            dai neon, mentre nelle ombre si muovono creature del folklore...
        </p>
         <p>
            [...continua la descrizione del mondo di gioco...]
        </p>
    </ModalWindow>
  );
}

export default Ambientazione;