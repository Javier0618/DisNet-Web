import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Play, Film, Sparkles } from 'lucide-react';

export default function ContinueWatchingPage() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();

  const watchProgressList = userData?.watchProgress
    ? Object.values(userData.watchProgress).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    : [];

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <Clock className="w-16 h-16 text-cyan-400 animate-pulse" />
        <h2 className="text-3xl font-black text-white">Inicia sesión para ver tu historial de reproducción</h2>
        <p className="text-gray-400 text-sm max-w-md">
          DisNet guarda tu progreso automáticamente para que puedas retomar tus películas y series desde donde lo dejaste.
        </p>
        <div className="flex gap-4 pt-4">
          <Link to="/login" className="px-6 py-2.5 rounded-full bg-blue-600 font-bold text-white text-sm">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-cyan-400" />
          <span>Continuar Viendo</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Retoma el contenido que estabas disfrutando previamente
        </p>
      </div>

      {watchProgressList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watchProgressList.map((item) => (
            <div
              key={item.contentId}
              onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.contentId}${item.season ? `?season=${item.season}&episode=${item.episode}` : ''}`)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 hover:border-blue-500/50 transition-all shadow-xl flex flex-col"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={item.backdrop_path ? (item.backdrop_path.startsWith('http') ? item.backdrop_path : `https://image.tmdb.org/t/p/w500${item.backdrop_path}`) : item.poster_path}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ width: `${item.percentage || 10}%` }}
                  />
                </div>
              </div>

              <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.season ? `Temporada ${item.season} • Episodio ${item.episode}` : 'Película'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                  <span>Progreso</span>
                  <span className="font-bold text-cyan-400">{item.percentage || 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4 glass-panel rounded-3xl p-8 max-w-xl mx-auto border border-white/5">
          <Film className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No tienes reproducciones recientes</h3>
          <p className="text-sm text-gray-400">
            Comienza a ver cualquier película, serie o anime y guardaremos automáticamente tu avance.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 text-white font-bold text-sm shadow-lg"
          >
            Explorar Contenido
          </Link>
        </div>
      )}
    </div>
  );
}
