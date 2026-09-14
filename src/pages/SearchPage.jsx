import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, collection, getDocs } from '../services/firebase';
import { tmdbService } from '../services/tmdb';
import { normalizeString } from '../utils/helpers';
import ContentCard from '../components/ContentCard';
import { ContentSkeleton } from '../components/SkeletonLoader';
import { Search, Film, Tv, Sparkles, Filter } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setSearchTerm(queryParam);
    if (queryParam.trim()) {
      performSearch(queryParam.trim());
    } else {
      setResults([]);
    }
  }, [queryParam]);

  const performSearch = async (query) => {
    setLoading(true);
    const normalizedQuery = normalizeString(query);

    try {
      // 1. Search in Firestore content collection
      const firestoreSnap = await getDocs(collection(db, 'content'));
      const firestoreResults = [];
      firestoreSnap.forEach(doc => {
        const item = doc.data();
        const normTitle = normalizeString(item.title || '');
        const normOriginalTitle = normalizeString(item.original_title || '');
        const normOverview = normalizeString(item.overview || '');
        const normGenres = Array.isArray(item.genres) ? item.genres.map(g => normalizeString(typeof g === 'string' ? g : g.name)).join(' ') : '';

        if (
          normTitle.includes(normalizedQuery) ||
          normOriginalTitle.includes(normalizedQuery) ||
          normOverview.includes(normalizedQuery) ||
          normGenres.includes(normalizedQuery)
        ) {
          firestoreResults.push({ ...item, docId: doc.id });
        }
      });

      // 2. Search in TMDb API for broader results
      let tmdbResults = [];
      try {
        const tmdbData = await tmdbService.searchMulti(query, 1);
        if (tmdbData && tmdbData.results) {
          tmdbResults = tmdbData.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .map(item => ({
              id: item.id,
              media_type: item.media_type,
              title: item.title || item.name,
              original_title: item.original_title || item.original_name || '',
              overview: item.overview || '',
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
              release_date: item.release_date || item.first_air_date || '',
              vote_average: item.vote_average || 0,
              genres: item.genre_ids ? ['Variado'] : []
            }));
        }
      } catch (e) {
        console.warn("TMDb search error:", e);
      }

      // 3. Merge and deduplicate results
      const combinedMap = new Map();
      firestoreResults.forEach(item => combinedMap.set(String(item.id), item));
      tmdbResults.forEach(item => {
        if (!combinedMap.has(String(item.id))) {
          combinedMap.set(String(item.id), item);
        }
      });

      setResults(Array.from(combinedMap.values()));

    } catch (err) {
      console.error("Error executing search:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  // Filter results according to tabs
  const filteredResults = results.filter(item => {
    if (activeTab === 'movies') return item.media_type === 'movie';
    if (activeTab === 'series') return item.media_type === 'tv' || item.media_type === 'series';
    if (activeTab === 'animes') {
      return item.media_type === 'anime' ||
             (item.original_language === 'ja' && (item.genre_ids?.includes(16) || item.genres?.includes('Animación')));
    }
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

      {/* Search Header Form */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Buscador <span className="disnet-gradient-text">DisNet</span>
        </h1>
        <p className="text-sm text-gray-400">
          Encuentra tus películas, series o animes favoritos por nombre, género o palabras clave
        </p>

        <form onSubmit={handleFormSubmit} className="relative mt-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ej: Avengers, Naruto, Disney, Acción..."
            className="w-full bg-slate-900/90 text-white placeholder-gray-500 rounded-full pl-12 pr-32 py-4 border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 shadow-2xl transition-all text-base"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-md transition-all"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      {queryParam && (
        <div className="flex items-center justify-center gap-2 pt-4 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            Todos ({results.length})
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'movies'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            Películas
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'series'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            Series
          </button>
          <button
            onClick={() => setActiveTab('animes')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'animes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            Animes
          </button>
        </div>
      )}

      {/* Search Results Display */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <ContentSkeleton key={i} />)}
        </div>
      ) : queryParam && filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredResults.map((item) => (
            <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      ) : queryParam ? (
        <div className="text-center py-20 space-y-3 glass-panel rounded-3xl p-8 max-w-xl mx-auto border border-white/5">
          <p className="text-lg font-bold text-white">Sin resultados para "{queryParam}"</p>
          <p className="text-sm text-gray-400">
            Intenta buscando con palabras clave diferentes o revisa el nombre del título.
          </p>
        </div>
      ) : null}
    </div>
  );
}
