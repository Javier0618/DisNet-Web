// Utility function to normalize search strings (lowercase, remove accents/diacritics)
export function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

import { serverTimestamp } from '../services/firebase';

// Convert TMDb item into Firestore content schema matching security rules
export function formatContentForFirestore(tmdbItem, mediaType = 'movie', userEmail = '') {
  const isMovie = mediaType === 'movie';
  const isAnime = mediaType === 'anime' || (tmdbItem.original_language === 'ja' && (tmdbItem.genre_ids?.includes(16) || tmdbItem.genres?.some(g => g.id === 16)));

  const computedMediaType = isAnime ? 'anime' : (isMovie ? 'movie' : 'tv');

  const genresList = tmdbItem.genres
    ? tmdbItem.genres.map(g => typeof g === 'string' ? g : g.name)
    : (tmdbItem.genre_ids ? tmdbItem.genre_ids.map(id => getGenreNameById(id)) : []);

  const releaseDate = tmdbItem.release_date || tmdbItem.first_air_date || '';

  const formattedDoc = {
    id: Number(tmdbItem.id),
    media_type: computedMediaType,
    title: tmdbItem.title || tmdbItem.name || 'Sin título',
    original_title: tmdbItem.original_title || tmdbItem.original_name || tmdbItem.title || tmdbItem.name || '',
    overview: tmdbItem.overview || 'Sin descripción disponible.',
    poster_path: tmdbItem.poster_path ? (tmdbItem.poster_path.startsWith('http') ? tmdbItem.poster_path : `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}`) : '',
    backdrop_path: tmdbItem.backdrop_path ? (tmdbItem.backdrop_path.startsWith('http') ? tmdbItem.backdrop_path : `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}`) : '',
    genres: genresList,
    release_date: releaseDate,
    vote_average: Number(tmdbItem.vote_average || 0),
    popularity: Number(tmdbItem.popularity || 0),
    runtime: Number(tmdbItem.runtime || (tmdbItem.episode_run_time && tmdbItem.episode_run_time[0]) || 0),
    status: tmdbItem.status || 'Released',
    origin_country: tmdbItem.origin_country || (tmdbItem.production_countries ? tmdbItem.production_countries.map(c => c.iso_3166_1) : []),
    video_url: tmdbItem.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default fallback video embed/stream
    imported_by: userEmail,
    imported_at: serverTimestamp(),
    display_options: {
      main_sections: tmdbItem.display_options?.main_sections || ['Inicio', computedMediaType === 'movie' ? 'Películas' : (computedMediaType === 'anime' ? 'Animes' : 'Series')],
      home_sections: tmdbItem.display_options?.home_sections || ['Tendencias', 'Populares', 'Recomendaciones'],
      platforms: tmdbItem.display_options?.platforms || ['DisNet Premier']
    }
  };

  // Add seasons structure if tv/anime and detailed details are fetched
  if (computedMediaType !== 'movie' && tmdbItem.seasons_data) {
    formattedDoc.seasons = tmdbItem.seasons_data;
  } else if (computedMediaType !== 'movie' && !formattedDoc.seasons) {
    // Provide standard Season 1 fallback structure if missing to satisfy strict rules if added later
    formattedDoc.seasons = {
      season_1: {
        season_number: 1,
        episodes: {
          episode_1: {
            episode_number: 1,
            name: "Episodio 1",
            overview: tmdbItem.overview || "Primer episodio",
            still_path: formattedDoc.backdrop_path || formattedDoc.poster_path,
            video_url: formattedDoc.video_url
          }
        }
      }
    };
  }

  return formattedDoc;
}

const GENRE_MAP = {
  28: "Acción", 12: "Aventura", 16: "Animación", 35: "Comedia", 80: "Crimen",
  99: "Documental", 18: "Drama", 10751: "Familia", 14: "Fantasía", 36: "Historia",
  27: "Terror", 10402: "Música", 9648: "Misterio", 10749: "Romance", 878: "Ciencia ficción",
  10770: "Película de TV", 53: "Suspense", 10752: "Bélica", 37: "Wéstern",
  10759: "Acción y aventura", 10762: "Infantil", 10763: "Noticias", 10764: "Reality",
  10765: "Sci-Fi y Fantasía", 10766: "Telenovela", 10767: "Talk show", 10768: "Guerra y política"
};

export function getGenreNameById(id) {
  return GENRE_MAP[id] || "Entretenimiento";
}
