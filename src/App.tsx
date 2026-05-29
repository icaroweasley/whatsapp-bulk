import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Paywall from './components/Paywall';
import AppV2 from './v2/AppV2';

function App() {
  const { user, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver logado, mostra Landing Page ou Login
  if (!user) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  // Se estiver logado mas o plano for inativo, mostra o paywall
  if (user.planStatus !== 'active') {
    return <Paywall />;
  }

  // Se estiver logado e ativo, mostra o painel
  return <AppV2 />;
}

export default App;
