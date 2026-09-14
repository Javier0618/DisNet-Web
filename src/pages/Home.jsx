import React, { useState, useEffect } from 'react';
import { contentService } from '../services/contentService';
import HeroSlider from '../components/HeroSlider';
import ContentRow from '../components/ContentRow';
import { HeroSkeleton, ContentSkeleton } from '../components/SkeletonLoader';
import { TrendingUp, Film, Tv, Play, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [heroItems, setHeroItems] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [popularAnimes, setPopularAnimes] = useState([]);
  const { userData } = useAuth();
  const navigate = useNavigate();

  const processAndSetContent = (allContent) => {
    if (!allContent || allContent.length === 0) return;

    setHeroItems(allContent.slice(0, 5));
    setTrending(allContent.slice(0, 15));

    const movies = allContent.filter(item => item.media_type === 'movie');
    setPopularMovies(movies.length > 0 ? movies : allContent.slice(0, 10));

    const series = allContent.filter(item => item.media_type === 'tv' || item.media_type === 'series');
    setPopularSeries(series.length > 0 ? series : allContent.slice(5, 15));

    const animes = allContent.filter(item =>
      item.media_type === 'anime' ||
      (item.original_language === 'ja' && (item.genre_ids?.includes(16) || item.genres?.includes('Animación')))
    );
    setPopularAnimes(animes.length > 0 ? animes : allContent.slice(2, 12));
  };

  useEffect(() => {
    let isMounted = true;

    async function loadDataProgressively() {
      // 1. Instant check/load from Firestore/Cache
      const firestoreData = await contentService.getContent();

      if (!isMounted) return;

      if (firestoreData && firestoreData.length > 0) {
        processAndSetContent(firestoreData);
        setLoading(false); // Instantly render UI if cache/firestore has data!
      }

      // 2. If firestore content is small (< 8 items), fetch TMDb fallbacks in background without blocking initial UI
      if (!firestoreData || firestoreData.length < 8) {
        contentService.fetchTmdbFallbacks().then(fallbacks => {
          if (!isMounted) return;
          const merged = [...(firestoreData || []), ...fallbacks];
          processAndSetContent(merged);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }

    loadDataProgressively();

    return () => {
      isMounted = false;
    };
  }, []);

  // Continue watching items from user profile state
  const continueWatchingList = userData?.watchProgress
    ? Object.values(userData.watchProgress).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    : [];

  return (
    <div className="min-h-screen pb-12">
      {loading ? (
        <div className="space-y-8">
          <HeroSkeleton />
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <ContentSkeleton key={i} />)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Hero Banner Slider */}
          <HeroSlider items={heroItems} />

          <div className="max-w-7xl mx-auto space-y-8 -mt-10 relative z-30">

            {/* Continue Watching Row (If available for logged in user) */}
            {continueWatchingList.length > 0 && (
              <section className="px-4 sm:px-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-cyan-400" />
                    Continuar Viendo
                  </h2>
                  <button
                    onClick={() => navigate('/continue-watching')}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Ver todo
                  </button>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto scrollbar-none py-2">
                  {continueWatchingList.slice(0, 6).map((item) => (
                    <div
                      key={item.contentId}
                      onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.contentId}`)}
                      className="w-[200px] sm:w-[240px] flex-shrink-0 group cursor-pointer rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-blue-500/50 transition-all shadow-lg"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img
                          src={item.backdrop_path ? (item.backdrop_path.startsWith('http') ? item.backdrop_path : `https://image.tmdb.org/t/p/w500${item.backdrop_path}`) : item.poster_path}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg">
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
                      <div className="p-3">
                        <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.season ? `T${item.season} E${item.episode} • ` : ''}{item.percentage || 0}% completado
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Content Rows */}
            <ContentRow title="Tendencias de la Semana" items={trending} icon={TrendingUp} />
            <ContentRow title="Películas Populares" items={popularMovies} icon={Film} />
            <ContentRow title="Series y Shows" items={popularSeries} icon={Tv} />
            <ContentRow title="Animes Destacados" items={popularAnimes} icon={Sparkles} />
          </div>
        </>
      )}
    </div>
  );
}
