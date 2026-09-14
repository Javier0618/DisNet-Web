import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';

export default function ContentRow({ title, items = [], icon: Icon }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4 py-4 relative group/row">
      <div className="flex items-center justify-between px-4 sm:px-8">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
          {Icon && <Icon className="w-6 h-6 text-cyan-400" />}
          <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            {title}
          </span>
        </h2>
      </div>

      <div className="relative">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all duration-200 border border-white/20 hidden md:flex"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto scrollbar-none px-4 sm:px-8 py-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div
              key={`${item.media_type || 'content'}-${item.id}`}
              className="w-[160px] sm:w-[200px] md:w-[220px] flex-shrink-0"
            >
              <ContentCard item={item} />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all duration-200 border border-white/20 hidden md:flex"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
