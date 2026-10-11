import { RouterProvider } from 'react-router/dom';
import { router } from './router';
import { AuthProvider } from './auth/AuthContext';
import AuthGate from './auth/AuthGate';

export default function PrivateApp() {
  return <AuthProvider><AuthGate><RouterProvider router={router} /></AuthGate></AuthProvider>;
}
