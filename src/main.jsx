import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './router';
import { AuthProvider } from './auth/AuthContext';
import AuthGate from './auth/AuthGate';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </AuthProvider>
  </StrictMode>
);
