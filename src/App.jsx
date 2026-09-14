import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import SearchPage from './pages/SearchPage';
import DetailsPage from './pages/DetailsPage';
import VideoPlayer from './pages/VideoPlayer';
import FavoritesPage from './pages/FavoritesPage';
import ContinueWatchingPage from './pages/ContinueWatchingPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanel from './pages/AdminPanel';
import { Film, Tv, Play } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser || !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0b0e14] text-gray-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route
                path="/movies"
                element={<Catalog mediaType="movie" pageTitle="Películas" icon={Film} />}
              />
              <Route
                path="/series"
                element={<Catalog mediaType="tv" pageTitle="Series" icon={Tv} />}
              />
              <Route
                path="/animes"
                element={<Catalog mediaType="anime" pageTitle="Animes" icon={Play} />}
              />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/content/:type/:id" element={<DetailsPage />} />
              <Route path="/watch/:type/:id" element={<VideoPlayer />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Routes */}
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/continue-watching"
                element={
                  <ProtectedRoute>
                    <ContinueWatchingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />

              {/* Fallback Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
