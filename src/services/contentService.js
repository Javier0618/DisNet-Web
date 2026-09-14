import { db, collection, getDocs } from './firebase';
import { tmdbService } from './tmdb';

let memoryCache = {
  content: null,
  timestamp: 0
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const contentService = {
  // Get content with instant cache return and background refresh
  getContent: async (forceRefresh = false) => {
    const now = Date.now();

    // Check in-memory cache
    if (!forceRefresh && memoryCache.content && (now - memoryCache.timestamp < CACHE_TTL)) {
      return memoryCache.content;
    }

    // Check sessionStorage cache for instant load across navigation
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem('disnet_content_cache');
        const cachedTime = sessionStorage.getItem('disnet_content_cache_time');
        if (cached && cachedTime && (now - Number(cachedTime) < CACHE_TTL)) {
          const parsed = JSON.parse(cached);
          memoryCache = { content: parsed, timestamp: Number(cachedTime) };
          return parsed;
        }
      } catch (e) {
        console.warn("Session cache read error", e);
      }
    }

    // Fetch from Firestore
    try {
      const querySnapshot = await getDocs(collection(db, 'content'));
      const firestoreDocs = [];
      querySnapshot.forEach((doc) => {
        firestoreDocs.push({ ...doc.data(), docId: doc.id });
      });

      memoryCache = { content: firestoreDocs, timestamp: now };
      try {
        sessionStorage.setItem('disnet_content_cache', JSON.stringify(firestoreDocs));
        sessionStorage.setItem('disnet_content_cache_time', String(now));
      } catch (e) {
        // ignore quota errors
      }

      return firestoreDocs;
    } catch (err) {
      console.error("Error fetching Firestore content:", err);
      return memoryCache.content || [];
    }
  },

  // Parallel fallback fetcher from TMDb
  fetchTmdbFallbacks: async () => {
    try {
      const results = await Promise.allSettled([
        tmdbService.getTrending('all', 'week'),
        tmdbService.searchMovies('Marvel', 1),
        tmdbService.searchTvShows('Disney', 1),
        tmdbService.searchTvShows('Anime', 1)
      ]);

      const trendingRes = results[0].status === 'fulfilled' ? (results[0].value.results || []) : [];
      const moviesRes = results[1].status === 'fulfilled' ? (results[1].value.results || []).map(m => ({ ...m, media_type: 'movie' })) : [];
      const seriesRes = results[2].status === 'fulfilled' ? (results[2].value.results || []).map(s => ({ ...s, media_type: 'tv' })) : [];
      const animeRes = results[3].status === 'fulfilled' ? (results[3].value.results || []).map(a => ({ ...a, media_type: 'anime' })) : [];

      return [...trendingRes, ...moviesRes, ...seriesRes, ...animeRes];
    } catch (e) {
      console.warn("TMDb parallel fallback error:", e);
      return [];
    }
  }
};
