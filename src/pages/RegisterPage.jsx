import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, displayName);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else {
        setError('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-black text-white">Crear nueva cuenta</h2>
          <p className="text-xs text-gray-400">Únete a DisNet y accede a cientos de películas, series y animes</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Nombre de Usuario</label>
            <div className="relative">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Tu nombre completo o alias"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

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
            <label className="text-xs font-semibold text-gray-300">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Mínimo 6 caracteres"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Repite tu contraseña"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-gray-400">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-bold text-cyan-400 hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
