import React from 'react';
import { User, AppNotification } from '../types/index.ts';
import { translations, Language } from '../lib/i18n.ts';

export interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  notifications: AppNotification[];
  onOpenAuth?: () => void;
  onOpenLogin?: () => void;
  onOpenNotifications?: () => void;
  lang?: Language;
  language?: Language;
  onToggleLang?: () => void;
  onToggleLanguage?: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
  onOpenInspector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  notifications,
  onOpenAuth,
  onOpenLogin,
  onOpenNotifications,
  lang = 'en',
  language,
  onToggleLang,
  onToggleLanguage
}) => {
  const effectiveLang = language || lang;
  const t = translations[effectiveLang] || translations.en;
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const handleAuth = onOpenLogin || onOpenAuth || (() => {});
  const handleToggle = onToggleLanguage || onToggleLang || (() => {});
  const tabUpper = currentTab.toUpperCase();

  const navItems = [
    { id: 'HOME', label: t.homeExplore || 'Explore' },
    { id: 'REQUESTS', label: t.liveRequests || 'Exchanges' },
    { id: 'POST', label: t.postPasses || 'Post Pass' },
    { id: 'ALERTS', label: t.alertsRadar || 'Radar' },
    { id: 'INSPECTOR', label: 'Inspector' },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0C0A14]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="h-16 max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single Wordmark Brand */}
        <button
          onClick={() => onSelectTab('HOME')}
          className="flex items-center gap-2 group text-left shrink-0"
        >
          <span className="font-heading font-extrabold text-xl text-[#FAF8F5] tracking-tight">
            Pass<span className="text-[#E5A93C]">Mitra</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C] group-hover:scale-125 transition-transform" />
        </button>

        {/* Zone 2: Clean Typography Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = tabUpper === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap py-1 relative ${
                  isActive
                    ? 'text-[#FAF8F5] font-semibold'
                    : 'text-[#9E96B0] hover:text-[#FAF8F5]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A93C] rounded-full" />
                )}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => onSelectTab('ADMIN')}
              className={`transition-colors whitespace-nowrap py-1 relative ${
                tabUpper === 'ADMIN'
                  ? 'text-[#E5A93C] font-semibold'
                  : 'text-[#9E96B0] hover:text-[#FAF8F5]'
              }`}
            >
              Trust Desk
              {tabUpper === 'ADMIN' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5A93C] rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <button
            onClick={handleToggle}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9E96B0] hover:text-[#FAF8F5] hover:bg-white/[0.04] transition-colors"
            title="Toggle Language"
          >
            {effectiveLang === 'en' ? 'ગુજરાતી' : 'EN'}
          </button>

          {/* Notifications Icon Button */}
          <button
            onClick={onOpenNotifications || (() => onSelectTab('ALERTS'))}
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-[#9E96B0] hover:text-[#FAF8F5] hover:bg-white/[0.04] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E5A93C]" />
            )}
          </button>

          {/* User Profile or Primary Action */}
          {user ? (
            <button
              onClick={() => onSelectTab('PROFILE')}
              className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
                tabUpper === 'PROFILE'
                  ? 'border-[#E5A93C] bg-[#E5A93C]/10 text-[#FAF8F5]'
                  : 'border-white/[0.08] hover:border-white/[0.2] bg-white/[0.02] text-[#FAF8F5]'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 flex items-center justify-center text-xs font-bold text-[#E5A93C]">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-medium hidden sm:inline max-w-[100px] truncate">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={handleAuth}
              className="px-4 py-2 rounded-lg bg-[#E5A93C] hover:bg-[#F3B94E] text-[#0C0A14] font-semibold text-xs transition-colors shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
