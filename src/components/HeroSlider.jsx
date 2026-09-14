import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HeroSlider({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { toggleFavorite, userData } = useAuth();

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const backdropUrl = currentItem.backdrop_path
    ? (currentItem.backdrop_path.startsWith('http') ? currentItem.backdrop_path : `https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`)
    : (currentItem.poster_path ? currentItem.poster_path : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1920&auto=format&fit=crop');

  const releaseYear = (currentItem.release_date || currentItem.first_air_date || '').substring(0, 4);

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] max-h-[850px] overflow-hidden select-none">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          key={currentItem.id}
          src={backdropUrl}
          alt={currentItem.title || currentItem.name}
          className="w-full h-full object-cover object-center transition-all duration-1000 transform scale-105 animate-in fade-in"
        />

        {/* Gradients to merge seamlessly with site dark background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/60 to-transparent w-full md:w-3/4" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0b0e14] to-transparent" />
      </div>

      {/* Hero Content Information */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 z-20">
        <div className="max-w-2xl space-y-4">

          {/* Featured Badge & Info */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest bg-gradient-to-r from-blue-600 to-red-600 text-white uppercase shadow-lg shadow-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              DESTACADO EN DISNET
            </span>

            {currentItem.vote_average > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {Number(currentItem.vote_average).toFixed(1)}
              </span>
            )}

            {releaseYear && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-gray-200 border border-white/10 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {releaseYear}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {currentItem.title || currentItem.name}
          </h1>

          {/* Genres */}
          {currentItem.genres && currentItem.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-cyan-300">
              {currentItem.genres.slice(0, 3).map((g, idx) => (
                <span key={idx} className="bg-slate-900/60 px-2.5 py-1 rounded-md border border-cyan-500/20">
                  {typeof g === 'string' ? g : g.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow-sm">
            {currentItem.overview || 'Disfruta de este contenido exclusivo en DisNet.'}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/watch/${currentItem.media_type || 'movie'}/${currentItem.id}`)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transform hover:scale-105 transition-all duration-200"
            >
              <Play className="w-5 h-5 fill-white" />
              Ver Ahora
            </button>

            <button
              onClick={() => navigate(`/content/${currentItem.media_type || 'movie'}/${currentItem.id}`)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-full glass-panel hover:bg-white/20 text-white font-bold text-sm border border-white/20 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Info className="w-5 h-5 text-cyan-400" />
              Más Información
            </button>
          </div>

        </div>
      </div>

      {/* Slide Navigation Arrows */}
      {items.length > 1 && (
        <div className="absolute right-6 bottom-16 z-30 flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="flex items-center gap-1.5 px-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
