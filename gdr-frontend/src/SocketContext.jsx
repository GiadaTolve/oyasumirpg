import React from 'react';
import { io } from 'socket.io-client';

// Creiamo e esportiamo direttamente il contesto
export const SocketContext = React.createContext();

// Creiamo l'istanza del socket
const socket = io("http://localhost:3000", {
  autoConnect: false, // Non si connette finché non facciamo il login
  reconnection: true,
});

// Creiamo il "Provider" che fornirà il socket a tutta l'app
export function SocketProvider({ children }) {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}