import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Film,
  Tv,
  Sparkles,
  Heart,
  Clock,
  User,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Play,
  TrendingUp
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { path: '/', label: 'Inicio', icon: Sparkles },
    { path: '/movies', label: 'Películas', icon: Film },
    { path: '/series', label: 'Series', icon: Tv },
    { path: '/animes', label: 'Animes', icon: Play },
    { path: '/favorites', label: 'Favoritos', icon: Heart },
    { path: '/continue-watching', label: 'Continuar viendo', icon: Clock },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0b0e14]/90 backdrop-blur-md shadow-2xl border-b border-white/5 py-3'
          : 'bg-gradient-to-b from-[#0b0e14]/90 via-[#0b0e14]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-red-600 p-[2px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0b0e14] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-xl tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-500 to-red-500 bg-clip-text text-transparent">
                  D
                </span>
              </div>
            </div>
            <span className="text-2xl font-black tracking-wider text-white">
              DIS<span className="text-red-500 font-extrabold">NET</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-red-600/30 text-white border border-blue-500/40 shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Search Bar & User Profile */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Buscar película, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 bg-slate-900/80 text-white placeholder-gray-400 text-sm rounded-full pl-10 pr-4 py-2 border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 border border-white/10 bg-slate-900/60 p-1.5 rounded-full hover:border-blue-500/50 transition-all"
                >
                  <img
                    src={userData?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                    alt="Perfil"
                    className="w-8 h-8 rounded-full object-cover bg-blue-900/30 border border-blue-500/30"
                  />
                  <span className="text-sm font-medium max-w-[100px] truncate hidden xl:inline">
                    {userData?.displayName || currentUser.email.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl py-2 shadow-2xl border border-white/10 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-xs text-gray-400">Conectado como</p>
                      <p className="text-sm font-semibold truncate text-cyan-300">{currentUser.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      Mi Perfil
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Panel Admin
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-gray-200 hover:text-white transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-4 pb-6 mt-2 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Buscar película, anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-white placeholder-gray-400 text-sm rounded-full pl-10 pr-4 py-2 border border-white/10 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium text-gray-200 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="w-5 h-5 text-cyan-400" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5"
                >
                  <User className="w-5 h-5 text-blue-400" />
                  Mi Perfil ({currentUser.email.split('@')[0]})
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    <ShieldAlert className="w-5 h-5" />
                    Panel de Administración
                  </Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full text-sm font-semibold border border-white/10 text-white"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-lg"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
