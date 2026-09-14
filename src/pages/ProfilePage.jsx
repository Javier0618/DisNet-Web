import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldAlert, Heart, Clock, Check, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { currentUser, userData, updateUserProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userData?.displayName || currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || currentUser?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const avatarPresets = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid || '1'}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=disnet1`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=disnet2`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=disnet3`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=hero`
  ];

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        photoURL: photoURL.trim()
      });
      setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const favoritesCount = userData?.favorites?.length || 0;
  const historyCount = Object.keys(userData?.watchProgress || {}).length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">

      {/* Header Profile Info */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover bg-slate-900 border-2 border-blue-500 shadow-xl"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {userData?.displayName || currentUser.email.split('@')[0]}
              </h1>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600/30 text-red-400 border border-red-500/40 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" />
              {currentUser.email}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600/20 text-red-400">
              <Heart className="w-6 h-6 fill-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{favoritesCount}</p>
              <p className="text-xs text-gray-400">Favoritos guardados</p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-600/20 text-cyan-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{historyCount}</p>
              <p className="text-xs text-gray-400">Contenidos iniciados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Editar Información
        </h3>

        {message.text && (
          <div className={`p-4 rounded-2xl text-sm font-semibold mb-6 ${
            message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Nombre de Usuario</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="Tu nombre o alias"
              required
            />
          </div>

          {/* Preset Avatars */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-300">Seleccionar Avatar</label>
            <div className="flex flex-wrap gap-3">
              {avatarPresets.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhotoURL(url)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    photoURL === url ? 'border-cyan-400 scale-110 shadow-lg' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover bg-slate-800" />
                  {photoURL === url && (
                    <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">URL Personalizada de Foto</label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-xl transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
