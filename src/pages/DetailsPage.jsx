import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '../services/firebase';
import { tmdbService } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import ContentRow from '../components/ContentRow';
import {
  Play,
  Heart,
  Star,
  Calendar,
  Clock,
  Film,
  Tv,
  Sparkles,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function DetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { userData, toggleFavorite } = useAuth();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const [similarContent, setSimilarContent] = useState([]);

  const isFav = userData?.favorites?.some(fav => String(fav.id) === String(id));
  const [favStatus, setFavStatus] = useState(isFav);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        // 1. Check Firestore document first
        const docRef = doc(db, 'content', String(id));
        const docSnap = await getDoc(docRef);

        let data = null;
        if (docSnap.exists()) {
          data = { ...docSnap.data(), docId: docSnap.id };
        } else {
          // 2. Fetch from TMDb API
          const tmdbData = await tmdbService.getDetails(id, type);
          if (tmdbData) {
            data = {
              id: tmdbData.id,
              media_type: type === 'tv' || type === 'anime' ? type : 'movie',
              title: tmdbData.title || tmdbData.name,
              original_title: tmdbData.original_title || tmdbData.original_name || '',
              overview: tmdbData.overview || 'Sin descripción disponible.',
              poster_path: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
              backdrop_path: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : '',
              genres: tmdbData.genres ? tmdbData.genres.map(g => g.name) : [],
              release_date: tmdbData.release_date || tmdbData.first_air_date || '',
              vote_average: tmdbData.vote_average || 0,
              runtime: tmdbData.runtime || (tmdbData.episode_run_time && tmdbData.episode_run_time[0]) || 0,
              status: tmdbData.status || 'Estrenado',
              seasons: tmdbData.seasons_data || null,
              similar: tmdbData.similar?.results || []
            };
          }
        }

        if (data) {
          setContent(data);
          if (data.similar) {
            setSimilarContent(data.similar.map(s => ({
              ...s,
              media_type: type === 'tv' || type === 'anime' ? type : 'movie'
            })));
          }

          // Handle season selection if available
          if (data.seasons) {
            const seasonKeys = Object.keys(data.seasons);
            if (seasonKeys.length > 0) {
              const firstSeasonKey = seasonKeys[0];
              const seasonNum = data.seasons[firstSeasonKey].season_number || 1;
              setSelectedSeason(seasonNum);
              setEpisodesList(Object.values(data.seasons[firstSeasonKey].episodes || {}));
            }
          }
        }
      } catch (err) {
        console.error("Error loading content details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [type, id]);

  useEffect(() => {
    setFavStatus(userData?.favorites?.some(fav => String(fav.id) === String(id)));
  }, [userData, id]);

  const handleSeasonChange = (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    if (content?.seasons) {
      const seasonKey = `season_${seasonNumber}`;
      if (content.seasons[seasonKey]) {
        setEpisodesList(Object.values(content.seasons[seasonKey].episodes || {}));
      }
    }
  };

  const handleFavClick = async () => {
    if (!content) return;
    const newStatus = await toggleFavorite(content);
    setFavStatus(newStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Contenido no encontrado</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-sm"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const backdropUrl = content.backdrop_path || content.poster_path;
  const releaseYear = (content.release_date || '').substring(0, 4);

  return (
    <div className="min-h-screen pb-16">

      {/* Header Backdrop Hero */}
      <div className="relative w-full h-[65vh] min-h-[450px] max-h-[700px] overflow-hidden">
        <img
          src={backdropUrl}
          alt={content.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/50 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-6 z-30 p-3 rounded-full glass-panel text-white hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
      </div>

      {/* Main Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-30">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Poster Image */}
          <div className="w-48 sm:w-64 md:w-72 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 mx-auto md:mx-0 bg-slate-900">
            <img
              src={content.poster_path}
              alt={content.title}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Info Column */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-600 text-white shadow-md">
                {content.media_type === 'movie' ? 'Película' : (content.media_type === 'anime' ? 'Anime' : 'Serie')}
              </span>

              {content.vote_average > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-black/60 text-amber-400 border border-amber-400/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {Number(content.vote_average).toFixed(1)}
                </span>
              )}

              {releaseYear && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  {releaseYear}
                </span>
              )}

              {content.runtime > 0 && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {content.runtime} min
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {content.title}
            </h1>

            {content.original_title && content.original_title !== content.title && (
              <p className="text-sm text-cyan-300 font-medium italic -mt-2">
                Título Original: {content.original_title}
              </p>
            )}

            {content.genres && content.genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {content.genres.map((g, i) => (
                  <span key={i} className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 text-gray-300 border border-white/5">
                    {typeof g === 'string' ? g : g.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
              {content.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <button
                onClick={() => {
                  const savedProg = userData?.watchProgress?.[String(content.id)];
                  const targetSeason = savedProg?.season || (content.seasons ? (Object.values(content.seasons)[0]?.season_number || 1) : 1);
                  const targetEpisode = savedProg?.episode || 1;
                  navigate(`/watch/${content.media_type || 'movie'}/${content.id}${content.media_type !== 'movie' ? `?season=${targetSeason}&episode=${targetEpisode}` : ''}`);
                }}
                className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-all"
              >
                <Play className="w-5 h-5 fill-white" />
                Reproducir
              </button>

              <button
                onClick={handleFavClick}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-full border text-sm font-bold transition-all ${
                  favStatus
                    ? 'bg-red-600/30 border-red-500 text-red-400 hover:bg-red-600/50'
                    : 'glass-panel border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <Heart className={`w-5 h-5 ${favStatus ? 'fill-red-500 text-red-500' : ''}`} />
                {favStatus ? 'En Favoritos' : 'Añadir a Favoritos'}
              </button>
            </div>

          </div>
        </div>

        {/* Seasons & Episodes Section (If Series or Anime) */}
        {content.seasons && Object.keys(content.seasons).length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Tv className="w-6 h-6 text-cyan-400" />
                Episodios y Temporadas
              </h3>

              {/* Season Selector Dropdown / Buttons */}
              <div className="flex items-center gap-2">
                {Object.values(content.seasons).map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => handleSeasonChange(s.season_number)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedSeason === s.season_number
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    Temporada {s.season_number}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodesList.map((ep) => (
                <div
                  key={ep.episode_number}
                  onClick={() => navigate(`/watch/${content.media_type}/${content.id}?season=${selectedSeason}&episode=${ep.episode_number}`)}
                  className="group cursor-pointer glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all shadow-md flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={ep.still_path || backdropUrl}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[11px] font-bold text-cyan-400">
                      E{ep.episode_number}
                    </span>
                  </div>

                  <div className="p-4 space-y-1">
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {ep.episode_number}. {ep.name}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {ep.overview || 'Sin descripción para este episodio.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Content */}
        {similarContent.length > 0 && (
          <div className="mt-16">
            <ContentRow title="Contenido Similar" items={similarContent} icon={Sparkles} />
          </div>
        )}

      </div>
    </div>
  );
}
