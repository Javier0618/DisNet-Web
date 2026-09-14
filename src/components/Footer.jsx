import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#07090d] border-t border-white/5 pt-12 pb-8 mt-20 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/5">

          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-red-600 p-[1.5px]">
                <div className="w-full h-full bg-[#0b0e14] rounded-[6px] flex items-center justify-center">
                  <span className="font-extrabold text-lg bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
                    D
                  </span>
                </div>
              </div>
              <span className="text-xl font-black text-white">
                DIS<span className="text-red-500">NET</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Plataforma premium para explorar y disfrutar de lo mejor del cine, series y animes con una experiencia cinematográfica.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Explorar</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/movies" className="hover:text-cyan-400 transition-colors">Películas</Link></li>
              <li><Link to="/series" className="hover:text-cyan-400 transition-colors">Series</Link></li>
              <li><Link to="/animes" className="hover:text-cyan-400 transition-colors">Animes</Link></li>
              <li><Link to="/favorites" className="hover:text-cyan-400 transition-colors">Mis Favoritos</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Cuenta</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/profile" className="hover:text-cyan-400 transition-colors">Mi Perfil</Link></li>
              <li><Link to="/continue-watching" className="hover:text-cyan-400 transition-colors">Continuar Viendo</Link></li>
              <li><Link to="/login" className="hover:text-cyan-400 transition-colors">Iniciar Sesión</Link></li>
              <li><Link to="/register" className="hover:text-cyan-400 transition-colors">Crear Cuenta</Link></li>
            </ul>
          </div>

          {/* Legal / Features */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Plataforma</h4>
            <p className="text-xs text-gray-400">
              Integrado con la API oficial de TMDb y respaldo en la nube con Firebase backend.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-cyan-400 font-medium">
              <Sparkles className="w-4 h-4" />
              Experiencia Cinematográfica
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} DisNet Streaming. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Privacidad</span>
            <span>•</span>
            <span>Términos de servicio</span>
            <span>•</span>
            <span>Ayuda</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
