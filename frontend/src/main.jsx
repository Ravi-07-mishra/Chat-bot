import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/pages/i18n.jsx';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './assets/context/AuthContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);