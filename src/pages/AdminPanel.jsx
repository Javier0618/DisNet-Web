import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, setDoc, deleteDoc, getDocs, collection, serverTimestamp } from '../services/firebase';
import { tmdbService } from '../services/tmdb';
import { formatContentForFirestore } from '../utils/helpers';
import {
  ShieldAlert,
  Download,
  Plus,
  Edit3,
  Trash2,
  Search,
  Film,
  Tv,
  Sparkles,
  BarChart2,
  Check,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('import'); // 'import', 'manage', 'add', 'stats'

  // TMDb Importer State
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbMediaType, setTmdbMediaType] = useState('movie'); // 'movie', 'tv', 'anime'
  const [tmdbResults, setTmdbResults] = useState([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [importingId, setImportingId] = useState(null);

  // Firestore Content Manager State
  const [firebaseContent, setFirebaseContent] = useState([]);
  const [loadingFirebase, setLoadingFirebase] = useState(false);
  const [searchFirebaseQuery, setSearchFirebaseQuery] = useState('');

  // Feedback Messages
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Manual Form State
  const [editingDocId, setEditingDocId] = useState(null);
  const [formData, setFormData] = useState({
    id: Date.now(),
    media_type: 'movie',
    title: '',
    original_title: '',
    overview: '',
    poster_path: '',
    backdrop_path: '',
    genres: 'Acción, Aventura',
    release_date: new Date().toISOString().substring(0, 10),
    vote_average: 8.5,
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  });

  useEffect(() => {
    if (activeTab === 'manage' || activeTab === 'stats') {
      loadFirebaseContent();
    }
  }, [activeTab]);

  const loadFirebaseContent = async () => {
    try {
      setLoadingFirebase(true);
      const querySnapshot = await getDocs(collection(db, 'content'));
      const list = [];
      querySnapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), docId: docSnap.id });
      });
      setFirebaseContent(list);
    } catch (err) {
      console.error("Error loading Firebase content:", err);
    } finally {
      setLoadingFirebase(false);
    }
  };

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
        <h2 className="text-3xl font-black text-white">Acceso Restringido</h2>
        <p className="text-gray-400 text-sm">
          Esta sección es exclusiva para la administración de la plataforma DisNet.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-sm"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // 1. Search TMDb API
  const handleTmdbSearch = async (e) => {
    e.preventDefault();
    if (!tmdbQuery.trim()) return;
    setSearchingTmdb(true);
    setStatusMessage({ type: '', text: '' });

    try {
      let data;
      if (tmdbMediaType === 'movie') {
        data = await tmdbService.searchMovies(tmdbQuery.trim());
      } else {
        data = await tmdbService.searchTvShows(tmdbQuery.trim());
      }

      const results = (data.results || []).map(item => ({
        ...item,
        media_type: tmdbMediaType === 'anime' ? 'anime' : (tmdbMediaType === 'tv' ? 'tv' : 'movie')
      }));

      setTmdbResults(results);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error al buscar en TMDb.' });
    } finally {
      setSearchingTmdb(false);
    }
  };

  // 2. Import Content from TMDb to Firebase
  const handleImportContent = async (item) => {
    setImportingId(item.id);
    setStatusMessage({ type: '', text: '' });

    try {
      // Get detailed specs including season info if tv/anime
      const fullDetails = await tmdbService.getDetails(item.id, item.media_type);

      const firestorePayload = formatContentForFirestore(
        fullDetails,
        item.media_type,
        currentUser.email
      );

      // Save to Firestore under doc ID string(id)
      const contentRef = doc(db, 'content', String(item.id));
      await setDoc(contentRef, firestorePayload);

      setStatusMessage({
        type: 'success',
        text: `¡"${firestorePayload.title}" importado exitosamente a Firebase!`
      });

      // Update local managed list if open
      setFirebaseContent(prev => [...prev.filter(c => String(c.id) !== String(item.id)), firestorePayload]);

    } catch (err) {
      console.error("Firestore import error:", err);
      setStatusMessage({
        type: 'error',
        text: `Error al importar "${item.title || item.name}". Asegúrate de cumplir las reglas de Firebase.`
      });
    } finally {
      setImportingId(null);
    }
  };

  // 3. Manual Content Creation / Update
  const handleSaveManualContent = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    try {
      const genresArray = typeof formData.genres === 'string'
        ? formData.genres.split(',').map(g => g.trim())
        : formData.genres;

      const payload = {
        id: Number(formData.id),
        media_type: formData.media_type,
        title: formData.title,
        original_title: formData.original_title || formData.title,
        overview: formData.overview,
        poster_path: formData.poster_path,
        backdrop_path: formData.backdrop_path || formData.poster_path,
        genres: genresArray,
        release_date: formData.release_date,
        vote_average: Number(formData.vote_average),
        video_url: formData.video_url,
        imported_by: currentUser.email,
        imported_at: serverTimestamp(),
        display_options: {
          main_sections: ['Inicio'],
          home_sections: ['Recomendaciones'],
          platforms: ['DisNet']
        }
      };

      if (formData.media_type !== 'movie') {
        payload.seasons = {
          season_1: {
            season_number: 1,
            episodes: {
              episode_1: {
                episode_number: 1,
                name: "Episodio 1",
                overview: formData.overview,
                still_path: formData.backdrop_path || formData.poster_path,
                video_url: formData.video_url
              }
            }
          }
        };
      }

      const contentRef = doc(db, 'content', String(payload.id));
      await setDoc(contentRef, payload);

      setStatusMessage({
        type: 'success',
        text: editingDocId ? 'Contenido actualizado correctamente.' : '¡Nuevo contenido añadido a Firebase!'
      });

      // Reset Form
      setEditingDocId(null);
      setFormData({
        id: Date.now(),
        media_type: 'movie',
        title: '',
        original_title: '',
        overview: '',
        poster_path: '',
        backdrop_path: '',
        genres: 'Acción, Aventura',
        release_date: new Date().toISOString().substring(0, 10),
        vote_average: 8.5,
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      });
      setActiveTab('manage');

    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error al guardar en Firebase.' });
    }
  };

  // 4. Delete Content from Firebase
  const handleDeleteContent = async (docId, title) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${title}" de Firebase?`)) return;

    try {
      await deleteDoc(doc(db, 'content', String(docId)));
      setFirebaseContent(prev => prev.filter(c => String(c.id) !== String(docId) && c.docId !== docId));
      setStatusMessage({ type: 'success', text: `"${title}" ha sido eliminado de Firebase.` });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error al eliminar el contenido.' });
    }
  };

  // Edit Trigger
  const handleStartEdit = (item) => {
    setEditingDocId(item.docId || item.id);
    setFormData({
      id: item.id,
      media_type: item.media_type || 'movie',
      title: item.title || item.name || '',
      original_title: item.original_title || '',
      overview: item.overview || '',
      poster_path: item.poster_path || '',
      backdrop_path: item.backdrop_path || '',
      genres: Array.isArray(item.genres) ? item.genres.join(', ') : item.genres || '',
      release_date: item.release_date || new Date().toISOString().substring(0, 10),
      vote_average: item.vote_average || 8.0,
      video_url: item.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    });
    setActiveTab('add');
  };

  const filteredFirebaseContent = firebaseContent.filter(item => {
    const q = searchFirebaseQuery.toLowerCase();
    return (item.title || '').toLowerCase().includes(q) || (item.original_title || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

      {/* Admin Header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Panel de Administración
          </div>
          <h1 className="text-3xl font-black text-white">Gestión de Contenido DisNet</h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'import' ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Importar TMDb
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manage' ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Gestionar Firebase
          </button>

          <button
            onClick={() => {
              setEditingDocId(null);
              setFormData({
                id: Date.now(),
                media_type: 'movie',
                title: '',
                original_title: '',
                overview: '',
                poster_path: '',
                backdrop_path: '',
                genres: 'Acción, Aventura',
                release_date: new Date().toISOString().substring(0, 10),
                vote_average: 8.5,
                video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
              });
              setActiveTab('add');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'add' ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Añadir Manual
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stats' ? 'bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Estadísticas
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage.text && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 border ${
          statusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          {statusMessage.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: IMPORT FROM TMDB */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              Buscador e Importador desde TMDb
            </h3>

            <form onSubmit={handleTmdbSearch} className="flex flex-col sm:flex-row gap-3">
              <select
                value={tmdbMediaType}
                onChange={(e) => setTmdbMediaType(e.target.value)}
                className="bg-slate-900 text-white text-sm font-semibold rounded-2xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500"
              >
                <option value="movie">Película</option>
                <option value="tv">Serie</option>
                <option value="anime">Anime</option>
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  placeholder="Buscar en TMDb por título..."
                  className="w-full bg-slate-900 text-white text-sm rounded-2xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="submit"
                disabled={searchingTmdb}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {searchingTmdb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {searchingTmdb ? 'Buscando...' : 'Buscar TMDb'}
              </button>
            </form>
          </div>

          {/* Results Grid */}
          {tmdbResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tmdbResults.map((item) => (
                <div key={item.id} className="glass-panel p-4 rounded-2xl border border-white/10 flex gap-4 items-center">
                  <img
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/150'}
                    alt={item.title || item.name}
                    className="w-20 h-28 object-cover rounded-xl bg-slate-900 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{item.title || item.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.overview || 'Sin descripción.'}</p>
                    <button
                      onClick={() => handleImportContent(item)}
                      disabled={importingId === item.id}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      {importingId === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {importingId === item.id ? 'Importando...' : 'Importar a Firebase'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE FIREBASE CONTENT */}
      {activeTab === 'manage' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-cyan-400" />
              Contenido en Firebase ({firebaseContent.length})
            </h3>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchFirebaseQuery}
                onChange={(e) => setSearchFirebaseQuery(e.target.value)}
                placeholder="Filtrar en Firebase..."
                className="w-full bg-slate-900 text-white text-xs rounded-xl pl-9 pr-4 py-2 border border-white/10 focus:outline-none"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {loadingFirebase ? (
            <div className="py-12 text-center text-gray-400">Cargando base de datos...</div>
          ) : filteredFirebaseContent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-slate-900/80 text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Póster</th>
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Año</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFirebaseContent.map((item) => (
                    <tr key={item.docId || item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <img
                          src={item.poster_path}
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded bg-slate-800"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold text-white max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 border border-white/10 uppercase">
                          {item.media_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(item.release_date || '').substring(0, 4)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-lg bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(item.docId || item.id, item.title)}
                          className="p-2 rounded-lg bg-red-600/30 text-red-400 hover:bg-red-600/50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">No hay elementos registrados en Firebase.</div>
          )}
        </div>
      )}

      {/* TAB 3: ADD / EDIT MANUAL */}
      {activeTab === 'add' && (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            {editingDocId ? 'Editar Contenido' : 'Añadir Nuevo Contenido Manualmente'}
          </h3>

          <form onSubmit={handleSaveManualContent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Tipo de Contenido</label>
                <select
                  value={formData.media_type}
                  onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                >
                  <option value="movie">Película</option>
                  <option value="tv">Serie</option>
                  <option value="anime">Anime</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">ID Único (Numérico)</label>
                <input
                  type="number"
                  required
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Título Principal</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                placeholder="Ej: Star Wars: El Despertar de la Fuerza"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Descripción / Sinopsis</label>
              <textarea
                required
                rows={3}
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                placeholder="Escribe el resumen del contenido..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">URL del Póster</label>
                <input
                  type="url"
                  required
                  value={formData.poster_path}
                  onChange={(e) => setFormData({ ...formData, poster_path: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">URL del Fondo (Backdrop)</label>
                <input
                  type="url"
                  value={formData.backdrop_path}
                  onChange={(e) => setFormData({ ...formData, backdrop_path: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Géneros (Separados por coma)</label>
                <input
                  type="text"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Fecha de Estreno</label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Calificación (0 - 10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vote_average}
                  onChange={(e) => setFormData({ ...formData, vote_average: e.target.value })}
                  className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">URL del Video (Embed / YouTube / MP4)</label>
              <input
                type="text"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 border border-white/10 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-sm shadow-xl transition-all"
            >
              {editingDocId ? 'Actualizar en Firebase' : 'Guardar en Firebase'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: STATISTICS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Total en Firebase</p>
            <p className="text-3xl font-black text-white">{firebaseContent.length}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Películas</p>
            <p className="text-3xl font-black text-blue-400">
              {firebaseContent.filter(c => c.media_type === 'movie').length}
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Series</p>
            <p className="text-3xl font-black text-purple-400">
              {firebaseContent.filter(c => c.media_type === 'tv' || c.media_type === 'series').length}
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Animes</p>
            <p className="text-3xl font-black text-red-400">
              {firebaseContent.filter(c => c.media_type === 'anime').length}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
