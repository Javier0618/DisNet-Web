import React, { useState, useEffect } from 'react';
import { contentService } from '../services/contentService';
import ContentCard from '../components/ContentCard';
import { ContentSkeleton } from '../components/SkeletonLoader';
import { Filter, Film } from 'lucide-react';

export default function Catalog({ mediaType = 'movie', pageTitle = 'Películas', icon: Icon = Film }) {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [genresList, setGenresList] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalogProgressively() {
      const allFirestore = await contentService.getContent();

      if (!isMounted) return;

      const matchedDocs = (allFirestore || []).filter(data =>
        data.media_type === mediaType ||
        (mediaType === 'anime' && (data.genres?.includes('Animación') || data.genres?.includes('Anime')))
      );

      const updateCatalogState = (catalogData) => {
        const allGenres = new Set();
        catalogData.forEach(item => {
          if (Array.isArray(item.genres)) {
            item.genres.forEach(g => allGenres.add(typeof g === 'string' ? g : g.name));
          }
        });

        setGenresList(['Todos', ...Array.from(allGenres)]);
        setItems(catalogData);
        setFilteredItems(catalogData);
      };

      if (matchedDocs.length > 0) {
        updateCatalogState(matchedDocs);
        setLoading(false);
      }

      if (matchedDocs.length < 8) {
        contentService.fetchTmdbFallbacks().then(fallbacks => {
          if (!isMounted) return;
          const filteredFallbacks = fallbacks.filter(item => {
            if (mediaType === 'movie') return item.media_type === 'movie';
            if (mediaType === 'anime') return item.media_type === 'anime' || (item.genre_ids?.includes(16));
            return item.media_type === 'tv' || item.media_type === 'series';
          }).map(item => ({
            ...item,
            media_type: mediaType,
            title: item.title || item.name,
            genres: item.genre_ids ? ['Acción', 'Aventura', 'Animación', 'Drama'].slice(0, 2) : ['Variado']
          }));

          const merged = [...matchedDocs, ...filteredFallbacks];
          updateCatalogState(merged);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }

    loadCatalogProgressively();

    return () => {
      isMounted = false;
    };
  }, [mediaType]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    if (genre === 'Todos') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item =>
        Array.isArray(item.genres) && item.genres.some(g => (typeof g === 'string' ? g : g.name) === genre)
      ));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

      {/* Catalog Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
            <Icon className="w-8 h-8 text-cyan-400" />
            <span>{pageTitle}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Explora la colección completa de {pageTitle.toLowerCase()} disponibles en DisNet
          </p>
        </div>

        {/* Genre Filter Tabs */}
        {genresList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {genresList.slice(0, 6).map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreChange(genre)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-lg'
                    : 'bg-slate-900 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <ContentSkeleton key={i} />)}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-3">
          <p className="text-lg font-medium text-gray-400">No se encontraron contenidos para esta categoría.</p>
        </div>
      )}
    </div>
  );
}
