import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './assets/context/AuthContext.jsx'
import axios from 'axios';

import {Toaster} from 'react-hot-toast'
axios.defaults.baseURL = "http://localhost:4000/api/v1";
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(

  <StrictMode>
      <AuthProvider>
        <Toaster position='top-center'/>
    <App />
    </AuthProvider>
  </StrictMode>
 
  ,
)
