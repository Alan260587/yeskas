import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { SocialNetwork } from '../types/catalog';

interface NetworkFilterProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: Record<string, number>;
}

export const NetworkFilter: React.FC<NetworkFilterProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const categories: Array<{ id: string; label: string; icon: string; countKey: string }> = [
    { id: 'all', label: 'Todo el Catálogo', icon: '✨', countKey: 'all' },
    { id: 'spotify', label: 'Spotify Music', icon: '🎧', countKey: 'spotify' },
    { id: 'instagram', label: 'Instagram', icon: '📸', countKey: 'instagram' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', countKey: 'tiktok' },
    { id: 'youtube', label: 'YouTube', icon: '▶️', countKey: 'youtube' },
    { id: 'facebook', label: 'Facebook', icon: '📘', countKey: 'facebook' },
    { id: 'kick', label: 'Kick Streaming', icon: '🎮', countKey: 'kick' },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Search & Counter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por servicio (ej. seguidores, likes, views, kick)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-300 hover:text-white"
            >
              Borrar
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-300 self-end sm:self-auto font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Mostrando {counts[activeCategory] || 0} opciones disponibles</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-lg shadow-purple-950/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {counts[cat.countKey] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
