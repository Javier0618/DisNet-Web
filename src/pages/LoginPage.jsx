import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo electrónico o contraseña incorrectos.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico para restablecer la contraseña.');
      return;
    }
    try {
      setError('');
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar el correo de recuperación.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">

        {/* Title Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-black text-white">
              DIS<span className="text-red-500">NET</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-white">¡Hola de nuevo!</h2>
          <p className="text-xs text-gray-400">Ingresa a tu cuenta para disfrutar de todo el catálogo</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            Te hemos enviado un correo para restablecer tu contraseña.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Correo Electrónico</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="ejemplo@correo.com"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300">Contraseña</label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs font-semibold text-cyan-400 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-gray-400">
          ¿No tienes una cuenta aún?{' '}
          <Link to="/register" className="font-bold text-cyan-400 hover:underline">
            Regístrate gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
