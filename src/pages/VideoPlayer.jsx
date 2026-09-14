import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '../services/firebase';
import { tmdbService } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ListVideo, SkipForward, X, Play, Check } from 'lucide-react';

export default function VideoPlayer() {
  const { type, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const seasonParam = parseInt(searchParams.get('season') || '1', 10);
  const episodeParam = parseInt(searchParams.get('episode') || '1', 10);

  const navigate = useNavigate();
  const { saveWatchProgress, userData } = useAuth();

  const [content, setContent] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(seasonParam);

  useEffect(() => {
    async function fetchVideoData() {
      try {
        setLoading(true);
        const docRef = doc(db, 'content', String(id));
        const docSnap = await getDoc(docRef);

        let data = null;
        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          const tmdbData = await tmdbService.getDetails(id, type);
          if (tmdbData) {
            data = {
              id: tmdbData.id,
              media_type: type,
              title: tmdbData.title || tmdbData.name,
              video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              seasons: tmdbData.seasons_data || null
            };
          }
        }

        if (data) {
          setContent(data);
          updatePlaybackUrl(data, seasonParam, episodeParam);
        }
      } catch (err) {
        console.error("Error loading video player:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideoData();
  }, [type, id]);

  // Update video player whenever season or episode query changes
  useEffect(() => {
    if (content) {
      setSelectedSeason(seasonParam);
      updatePlaybackUrl(content, seasonParam, episodeParam);
    }
  }, [seasonParam, episodeParam, content]);

  const updatePlaybackUrl = (data, sNum, eNum) => {
    let rawVideoUrl = data.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ';

    if (data.seasons) {
      const seasonObj = data.seasons[`season_${sNum}`] ||
        Object.values(data.seasons).find(s => Number(s.season_number) === Number(sNum));

      if (seasonObj && seasonObj.episodes) {
        const episodeObj = seasonObj.episodes[`episode_${eNum}`] ||
          Object.values(seasonObj.episodes).find(e => Number(e.episode_number) === Number(eNum));

        if (episodeObj && episodeObj.video_url) {
          rawVideoUrl = episodeObj.video_url;
        }
      }
    }

    const isDirectFile = /\.(mp4|webm|m3u8|ogg)(\?.*)?$/i.test(rawVideoUrl);
    setIsVideoFile(isDirectFile);

    let finalUrl = rawVideoUrl;
    if (!isDirectFile) {
      if (finalUrl.includes('youtube.com/watch?v=')) {
        const videoId = finalUrl.split('v=')[1]?.split('&')[0];
        finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      } else if (finalUrl.includes('youtu.be/')) {
        const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
        finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      } else if (finalUrl.includes('youtube.com/embed/')) {
        finalUrl = finalUrl.includes('?') ? `${finalUrl}&autoplay=1&enablejsapi=1` : `${finalUrl}?autoplay=1&enablejsapi=1`;
      }
    }

    setVideoUrl(finalUrl);

    // Save watch progress
    saveWatchProgress(data, {
      progress: 0,
      duration: 7200,
      season: sNum,
      episode: eNum
    });
  };

  const handleSelectEpisode = (seasonNum, episodeNum) => {
    setSearchParams({ season: String(seasonNum), episode: String(episodeNum) });
    setShowEpisodeDrawer(false);
  };

  // Compute next episode if available
  const getNextEpisode = () => {
    if (!content?.seasons) return null;
    const seasonObj = content.seasons[`season_${seasonParam}`] ||
      Object.values(content.seasons).find(s => Number(s.season_number) === Number(seasonParam));

    if (!seasonObj || !seasonObj.episodes) return null;
    const episodesArr = Object.values(seasonObj.episodes).sort((a, b) => a.episode_number - b.episode_number);
    const currentIndex = episodesArr.findIndex(e => Number(e.episode_number) === Number(episodeParam));

    if (currentIndex !== -1 && currentIndex < episodesArr.length - 1) {
      return { season: seasonParam, episode: episodesArr[currentIndex + 1].episode_number };
    } else {
      // Check next season
      const seasonsArr = Object.values(content.seasons).sort((a, b) => a.season_number - b.season_number);
      const currentSeasonIndex = seasonsArr.findIndex(s => Number(s.season_number) === Number(seasonParam));
      if (currentSeasonIndex !== -1 && currentSeasonIndex < seasonsArr.length - 1) {
        const nextSeason = seasonsArr[currentSeasonIndex + 1];
        const nextSeasonEpisodes = Object.values(nextSeason.episodes || {}).sort((a, b) => a.episode_number - b.episode_number);
        if (nextSeasonEpisodes.length > 0) {
          return { season: nextSeason.season_number, episode: nextSeasonEpisodes[0].episode_number };
        }
      }
    }
    return null;
  };

  const nextEpisode = getNextEpisode();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0b0e14] z-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-bold text-lg">Cargando reproductor DisNet...</p>
      </div>
    );
  }

  // Current season episodes list for drawer
  const currentSeasonObj = content?.seasons
    ? (content.seasons[`season_${selectedSeason}`] || Object.values(content.seasons).find(s => Number(s.season_number) === Number(selectedSeason)))
    : null;

  const currentEpisodesList = currentSeasonObj?.episodes ? Object.values(currentSeasonObj.episodes).sort((a, b) => a.episode_number - b.episode_number) : [];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">

      {/* Top Header Overlay Controls */}
      <div className="absolute top-0 inset-x-0 p-6 z-20 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/details/${content?.media_type || type}/${id}`)}
            className="p-3 rounded-full bg-black/60 hover:bg-white/20 text-white transition-all border border-white/20"
            title="Volver a los detalles"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-white font-black text-lg sm:text-xl line-clamp-1">
              {content?.title}
            </h2>
            {content?.media_type !== 'movie' && (
              <p className="text-cyan-400 text-xs font-semibold">
                Temporada {seasonParam} • Episodio {episodeParam}
              </p>
            )}
          </div>
        </div>

        {/* Header Action Buttons (Episode Selector & Next Episode) */}
        {content?.media_type !== 'movie' && content?.seasons && (
          <div className="flex items-center gap-3">
            {nextEpisode && (
              <button
                onClick={() => handleSelectEpisode(nextEpisode.season, nextEpisode.episode)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs shadow-lg transition-all"
              >
                <SkipForward className="w-4 h-4" />
                Siguiente Episodio
              </button>
            )}

            <button
              onClick={() => setShowEpisodeDrawer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-white/20 shadow-lg transition-all"
            >
              <ListVideo className="w-4 h-4 text-cyan-400" />
              Episodios y Temporadas
            </button>
          </div>
        )}
      </div>

      {/* Main Video Viewport */}
      <div className="w-full h-full flex items-center justify-center">
        {videoUrl ? (
          isVideoFile ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <iframe
              src={videoUrl}
              title={content?.title || 'Reproductor DisNet'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )
        ) : (
          <div className="text-gray-400 font-medium">No se pudo cargar la fuente de video.</div>
        )}
      </div>

      {/* Episode Selector Drawer / Modal (Disney+ & Netflix hybrid overlay) */}
      {showEpisodeDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-md h-full bg-[#0d1117] border-l border-white/10 flex flex-col p-6 space-y-6 shadow-2xl overflow-hidden animate-slide-in">

            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-cyan-400" />
                  Seleccionar Episodio
                </h3>
                <p className="text-xs text-gray-400 truncate max-w-[280px]">{content?.title}</p>
              </div>
              <button
                onClick={() => setShowEpisodeDrawer(false)}
                className="p-2 rounded-full bg-slate-900 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Season Selector Tabs */}
            {content?.seasons && Object.keys(content.seasons).length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-shrink-0">
                {Object.values(content.seasons).map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => setSelectedSeason(s.season_number)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedSeason === s.season_number
                        ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-md'
                        : 'bg-slate-900 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    Temporada {s.season_number}
                  </button>
                ))}
              </div>
            )}

            {/* Episode List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {currentEpisodesList.map((ep) => {
                const isCurrent = Number(seasonParam) === Number(selectedSeason) && Number(episodeParam) === Number(ep.episode_number);
                return (
                  <div
                    key={ep.episode_number}
                    onClick={() => handleSelectEpisode(selectedSeason, ep.episode_number)}
                    className={`group cursor-pointer p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                      isCurrent
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-900/60 border-white/5 hover:bg-slate-800 hover:border-white/20'
                    }`}
                  >
                    <div className="relative w-24 h-14 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                      <img
                        src={ep.still_path || content?.backdrop_path || content?.poster_path}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-black/60 group-hover:bg-blue-600 text-white flex items-center justify-center transition-colors">
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-cyan-400">Episodio {ep.episode_number}</span>
                        {isCurrent && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-600 text-white rounded-full">Reproduciendo</span>}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">{ep.name}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{ep.overview || 'Sin descripción.'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
