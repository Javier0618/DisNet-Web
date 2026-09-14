const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const tmdbService = {
  // Search movies, tv, or all
  searchMulti: async (query, page = 1) => {
    try {
      const response = await fetch(
        `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) throw new Error('Error buscando en TMDb');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("TMDb searchMulti Error:", error);
      throw error;
    }
  },

  searchMovies: async (query, page = 1) => {
    try {
      const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) throw new Error('Error buscando películas');
      return await response.json();
    } catch (error) {
      console.error("TMDb searchMovies Error:", error);
      throw error;
    }
  },

  searchTvShows: async (query, page = 1) => {
    try {
      const response = await fetch(
        `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) throw new Error('Error buscando series');
      return await response.json();
    } catch (error) {
      console.error("TMDb searchTvShows Error:", error);
      throw error;
    }
  },

  // Get detailed info for movie or tv show (including seasons and episodes for TV)
  getDetails: async (id, mediaType = 'movie') => {
    try {
      const type = mediaType === 'tv' || mediaType === 'anime' ? 'tv' : 'movie';
      const response = await fetch(
        `${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=videos,credits,similar`
      );
      if (!response.ok) throw new Error('Error obteniendo detalles de TMDb');
      const details = await response.json();

      // If it's a TV show or Anime, fetch season details (first 5 seasons max to avoid API spam)
      if (type === 'tv' && details.seasons) {
        const seasonsMap = {};
        const seasonsToFetch = details.seasons.filter(s => s.season_number > 0).slice(0, 5);

        for (const season of seasonsToFetch) {
          try {
            const seasonRes = await fetch(
              `${BASE_URL}/tv/${id}/season/${season.season_number}?api_key=${TMDB_API_KEY}&language=es-ES`
            );
            if (seasonRes.ok) {
              const seasonData = await seasonRes.json();
              const episodesMap = {};

              if (seasonData.episodes && seasonData.episodes.length > 0) {
                seasonData.episodes.forEach((ep) => {
                  episodesMap[`episode_${ep.episode_number}`] = {
                    episode_number: ep.episode_number,
                    name: ep.name || `Episodio ${ep.episode_number}`,
                    overview: ep.overview || 'Sin descripción.',
                    still_path: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : (details.backdrop_path ? `https://image.tmdb.org/t/p/w500${details.backdrop_path}` : ''),
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                  };
                });
              } else {
                episodesMap['episode_1'] = {
                  episode_number: 1,
                  name: 'Episodio 1',
                  overview: details.overview || 'Primer episodio',
                  still_path: details.backdrop_path ? `https://image.tmdb.org/t/p/w500${details.backdrop_path}` : '',
                  video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                };
              }

              seasonsMap[`season_${season.season_number}`] = {
                season_number: season.season_number,
                episodes: episodesMap
              };
            }
          } catch (err) {
            console.warn(`Could not fetch season ${season.season_number}`, err);
          }
        }

        // Fallback if no seasons fetched
        if (Object.keys(seasonsMap).length === 0) {
          seasonsMap['season_1'] = {
            season_number: 1,
            episodes: {
              episode_1: {
                episode_number: 1,
                name: 'Episodio 1',
                overview: details.overview || 'Primer episodio',
                still_path: details.backdrop_path ? `https://image.tmdb.org/t/p/w500${details.backdrop_path}` : '',
                video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
              }
            }
          };
        }

        details.seasons_data = seasonsMap;
      }

      return details;
    } catch (error) {
      console.error("TMDb getDetails Error:", error);
      throw error;
    }
  },

  getTrending: async (type = 'all', timeWindow = 'week') => {
    try {
      const response = await fetch(
        `${BASE_URL}/trending/${type}/${timeWindow}?api_key=${TMDB_API_KEY}&language=es-ES`
      );
      if (!response.ok) throw new Error('Error al obtener contenido en tendencia');
      return await response.json();
    } catch (error) {
      console.error("TMDb getTrending Error:", error);
      throw error;
    }
  }
};
