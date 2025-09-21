import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. Assicurati che sia importato
import App from './App.jsx';
import './index.css';
import { SocketProvider } from './SocketContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- 2. Deve avvolgere tutto */}
      <SocketProvider>
        <App />
      </SocketProvider>
    </BrowserRouter> {/* <-- 3. E chiudersi qui */}
  </React.StrictMode>,
)