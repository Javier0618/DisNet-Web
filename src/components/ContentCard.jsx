import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, Star, Calendar, Film, Tv, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ContentCard({ item }) {
  const navigate = useNavigate();
  const { userData, toggleFavorite } = useAuth();

  const isFav = userData?.favorites?.some(fav => String(fav.id) === String(item.id));
  const [favStatus, setFavStatus] = useState(isFav);

  const handleFavClick = async (e) => {
    e.stopPropagation();
    const newStatus = await toggleFavorite(item);
    setFavStatus(newStatus);
  };

  const posterUrl = item.poster_path
    ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';

  const mediaTypeLabel = item.media_type === 'movie'
    ? 'Película'
    : (item.media_type === 'anime' ? 'Anime' : 'Serie');

  const mediaTypeBg = item.media_type === 'movie'
    ? 'bg-blue-600/80 text-blue-100 border-blue-400/30'
    : (item.media_type === 'anime' ? 'bg-red-600/80 text-red-100 border-red-400/30' : 'bg-purple-600/80 text-purple-100 border-purple-400/30');

  const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);

  return (
    <div
      onClick={() => navigate(`/content/${item.media_type || 'movie'}/${item.id}`)}
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-slate-900/60 border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/50 flex flex-col h-full select-none"
    >
      {/* Media Type & Rating Badges */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border ${mediaTypeBg} shadow-md`}>
          {mediaTypeLabel}
        </span>

        {item.vote_average > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30 shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            {Number(item.vote_average).toFixed(1)}
          </span>
        )}
      </div>

      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <img
          src={posterUrl}
          alt={item.title || item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Hover Overlay Desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">

          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              {releaseYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {releaseYear}
                </span>
              )}
              {item.genres && item.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[130px]">
                    {Array.isArray(item.genres) ? item.genres[0] : ''}
                  </span>
                </>
              )}
            </div>

            <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
              {item.overview || 'Sin descripción disponible.'}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/watch/${item.media_type || 'movie'}/${item.id}`);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white py-2 rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Ver Ahora
              </button>

              <button
                onClick={handleFavClick}
                className={`p-2 rounded-xl border transition-colors ${
                  favStatus
                    ? 'bg-red-600/30 border-red-500 text-red-400 hover:bg-red-600/50'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                title={favStatus ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Heart className={`w-4 h-4 ${favStatus ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Title Footer */}
      <div className="p-3.5 flex flex-col justify-between flex-grow bg-slate-900/40 border-t border-white/5">
        <h3 className="font-bold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
          {item.title || item.name}
        </h3>
        <p className="text-xs text-gray-400 mt-1 truncate">
          {releaseYear ? releaseYear : 'Reciente'} {item.genres?.[0] ? `• ${item.genres[0]}` : ''}
        </p>
      </div>
    </div>
  );
}
