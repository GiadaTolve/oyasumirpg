import React, { useState } from 'react';
import axios from 'axios';

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        email: email,
        password: password
      });
      onLogin(response.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Errore di connessione');
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
      
      <button type="submit" className="button-style">Accedi</button>
    </form>
  );
}

export default LoginForm;