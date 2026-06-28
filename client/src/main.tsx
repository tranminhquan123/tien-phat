// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontSize: '14px',
            fontFamily: '"Be Vietnam Pro", sans-serif',
          },
          success: { iconTheme: { primary: '#ea580c', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
