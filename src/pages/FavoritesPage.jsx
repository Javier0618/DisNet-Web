import React from 'react';
import { useAuth } from '../context/AuthContext';
import ContentCard from '../components/ContentCard';
import { Heart, Sparkles, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  const { userData, currentUser } = useAuth();
  const favorites = userData?.favorites || [];

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <Heart className="w-16 h-16 text-red-500 animate-pulse" />
        <h2 className="text-3xl font-black text-white">Inicia sesión para ver tus favoritos</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Guarda tus películas, series y animes preferidos para acceder a ellos rápidamente en cualquier momento.
        </p>
        <div className="flex gap-4 pt-4">
          <Link to="/login" className="px-6 py-2.5 rounded-full bg-blue-600 font-bold text-white text-sm">
            Iniciar sesión
          </Link>
          <Link to="/register" className="px-6 py-2.5 rounded-full glass-panel font-bold text-white text-sm">
            Registrarse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <span>Mis Favoritos</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {favorites.length} {favorites.length === 1 ? 'título guardado' : 'títulos guardados'} en tu lista personal
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {favorites.map((item) => (
            <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4 glass-panel rounded-3xl p-8 max-w-xl mx-auto border border-white/5">
          <Film className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Tu lista de favoritos está vacía</h3>
          <p className="text-sm text-gray-400">
            Explora la plataforma y presiona el ícono del corazón en cualquier película, serie o anime para agregarlo a tus favoritos.
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
