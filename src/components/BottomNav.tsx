import React from 'react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingRequestsCount: number;
  unreadAlertsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingRequestsCount,
  unreadAlertsCount
}) => {
  const tabUpper = currentTab.toUpperCase();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0A14]/95 backdrop-blur-md border-t border-white/[0.08] px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Explore */}
        <button
          onClick={() => onSelectTab('HOME')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            tabUpper === 'HOME' ? 'text-[#E5A93C]' : 'text-[#9E96B0]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">explore</span>
          <span className="text-[10px] font-medium mt-0.5">Explore</span>
        </button>

        {/* Requests */}
        <button
          onClick={() => onSelectTab('REQUESTS')}
          className={`relative flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            tabUpper === 'REQUESTS' ? 'text-[#E5A93C]' : 'text-[#9E96B0]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">move_to_inbox</span>
          <span className="text-[10px] font-medium mt-0.5">Exchanges</span>
          {pendingRequestsCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-[#E5A93C] text-[#0C0A14] text-[9px] font-bold flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        {/* Post Pass */}
        <button
          onClick={() => onSelectTab('POST')}
          className="flex flex-col items-center justify-center -mt-4 group"
        >
          <div className="w-11 h-11 rounded-full bg-[#E5A93C] hover:bg-[#F3B94E] flex items-center justify-center text-[#0C0A14] shadow-md shadow-[#E5A93C]/20 transition-all">
            <span className="material-symbols-outlined text-[24px] font-bold">add</span>
          </div>
          <span className="text-[10px] font-semibold text-[#E5A93C] mt-1">Post</span>
        </button>

        {/* Radar */}
        <button
          onClick={() => onSelectTab('ALERTS')}
          className={`relative flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            tabUpper === 'ALERTS' ? 'text-[#E5A93C]' : 'text-[#9E96B0]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">radar</span>
          <span className="text-[10px] font-medium mt-0.5">Radar</span>
          {unreadAlertsCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#E5A93C]" />
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => onSelectTab('PROFILE')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
            tabUpper === 'PROFILE' ? 'text-[#E5A93C]' : 'text-[#9E96B0]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">person</span>
          <span className="text-[10px] font-medium mt-0.5">Profile</span>
        </button>
      </div>
    </nav>
  );
};
