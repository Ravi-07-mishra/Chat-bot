import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/pages/i18n.jsx';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './assets/context/AuthContext.jsx';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

axios.defaults.baseURL = "http://localhost:4000/api/v1";
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json"; 
axios.defaults.headers.common["Accept"] = "application/json";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
