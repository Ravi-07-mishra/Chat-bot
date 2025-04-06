import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/pages/i18n.jsx';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './assets/context/AuthContext.jsx'
import axios from 'axios';

import {Toaster} from 'react-hot-toast'
axios.defaults.baseURL = "http://localhost:4000/api/v1";
axios.defaults.withCredentials = true;
axios.defaults.withCredentials = true; 
axios.defaults.baseURL = "http://localhost:4000/api/v1";
axios.defaults.headers.common["Content-Type"] = "application/json"; 
axios.defaults.headers.common["Accept"] = "application/json";

createRoot(document.getElementById('root')).render(

  <StrictMode>
      <AuthProvider>
        <Toaster position='top-center'/>
    <App />
    </AuthProvider>
  </StrictMode>
 
  ,
)
