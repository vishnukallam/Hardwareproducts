import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A26',
            color: '#E6E1E5',
            border: '1px solid rgba(124,77,255,0.3)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '15px',
          },
          success: {
            iconTheme: { primary: '#03DAC6', secondary: '#0A0A0F' },
          },
          error: {
            iconTheme: { primary: '#CF6679', secondary: '#0A0A0F' },
            duration: 4000,
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
