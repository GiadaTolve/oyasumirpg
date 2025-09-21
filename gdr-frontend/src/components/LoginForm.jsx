import React, { useState } from 'react';
//import axios from 'axios';
import api from '../api'; 

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true); // 2. Imposta loading a true all'inizio
    try {
      const response = await api.post('/login', {
        email: email,
        password: password
      });
      onLogin(response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Errore di connessione');
    } finally {
      setLoading(false); // 3. In ogni caso, imposta loading a false alla fine
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Accesso Giocatore</h2>
      <hr style={{borderColor: '#4a5568', margin: '1rem 0'}} />
      {error && <p className="login-error">{error}</p>}
      
      <div className="login-form-group">
        <input
          type="email"
          className="login-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="login-form-group">
        <input
          type="password"
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" className="button-style" disabled={loading}>
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </button>
    </form>
  );
}

export default LoginForm;