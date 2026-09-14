import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '../services/firebase';
import { tmdbService } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function VideoPlayer() {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const seasonParam = searchParams.get('season') || 1;
  const episodeParam = searchParams.get('episode') || 1;

  const navigate = useNavigate();
  const { saveWatchProgress, userData } = useAuth();

  const [content, setContent] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressTime, setProgressTime] = useState(0);

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
          let rawVideoUrl = data.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ';

          // Extract episode video URL if series or anime
          if (data.seasons) {
            // Find season by key season_N or number
            const seasonObj = data.seasons[`season_${seasonParam}`] ||
              Object.values(data.seasons).find(s => String(s.season_number) === String(seasonParam));

            if (seasonObj && seasonObj.episodes) {
              const episodeObj = seasonObj.episodes[`episode_${episodeParam}`] ||
                Object.values(seasonObj.episodes).find(e => String(e.episode_number) === String(episodeParam));

              if (episodeObj && episodeObj.video_url) {
                rawVideoUrl = episodeObj.video_url;
              }
            }
          }

          // Determine if rawVideoUrl is a direct video file (.mp4, .webm, .m3u8, etc.) or embed URL
          const isDirectFile = /\.(mp4|webm|m3u8|ogg)(\?.*)?$/i.test(rawVideoUrl);
          setIsVideoFile(isDirectFile);

          let finalUrl = rawVideoUrl;
          if (!isDirectFile) {
            // Format YouTube URLs to include autoplay if embed URL
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

          // Restore saved watch progress if available
          const savedProg = userData?.watchProgress?.[String(id)];
          if (savedProg && savedProg.progress) {
            setProgressTime(savedProg.progress);
          }
        }
      } catch (err) {
        console.error("Error loading video player:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideoData();
  }, [type, id, seasonParam, episodeParam]);

  // Periodic watch progress tracking
  useEffect(() => {
    if (!content) return;
    const interval = setInterval(() => {
      setProgressTime((prev) => {
        const nextTime = prev + 5;
        saveWatchProgress(content, {
          progress: nextTime,
          duration: 7200,
          season: seasonParam,
          episode: episodeParam
        });
        return nextTime;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [content, seasonParam, episodeParam]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0b0e14] z-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-bold text-lg">Cargando reproductor DisNet...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">

      {/* Top Header Overlay */}
      <div className="absolute top-0 inset-x-0 p-6 z-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-full bg-black/60 hover:bg-white/20 text-white transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-white font-black text-lg sm:text-xl">
              {content?.title}
            </h2>
            {content?.media_type !== 'movie' && (
              <p className="text-cyan-400 text-xs font-semibold">
                Temporada {seasonParam} • Episodio {episodeParam}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Video Player (HTML5 Video or iFrame Embed) */}
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

    </div>
  );
}
