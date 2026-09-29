import React, { useState, useEffect } from 'react';
import { User, AppNotification } from './types/index.ts';
import { fetchCurrentUser, fetchNotifications, switchDemoUser } from './lib/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { HomeFeed } from './pages/HomeFeed.tsx';
import { ListingDetail } from './pages/ListingDetail.tsx';
import { PostPasses } from './pages/PostPasses.tsx';
import { RequestsHub } from './pages/RequestsHub.tsx';
import { ConnectedRendezvous } from './pages/ConnectedRendezvous.tsx';
import { AlertsRadar } from './pages/AlertsRadar.tsx';
import { TrustProfile } from './pages/TrustProfile.tsx';
import { InspectorTerminal } from './pages/InspectorTerminal.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { Language } from './lib/i18n.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('HOME');
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Initial fetch user
    loadUser();
    loadNotifications();
  }, []);

  const loadUser = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const list = await fetchNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await switchDemoUser(userId);
      setCurrentUser(res.user);
      loadNotifications();
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  const handleOpenListing = (id: string) => {
    setActiveListingId(id);
    setCurrentTab('DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenConnection = (connId: string) => {
    setActiveConnectionId(connId);
    setCurrentTab('CONNECTED');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleListingCreated = (newId: string) => {
    setActiveListingId(newId);
    setCurrentTab('DETAIL');
  };

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadAlertsCount = notifications.filter((n) => !n.readAt).length;
  const pendingRequestsCount = currentUser
    ? notifications.filter((n) => n.type === 'REQUEST_RECEIVED' && !n.readAt).length
    : 0;

  return (
    <div className="min-h-screen bg-[#0C0A14] text-[#FAF8F5] flex flex-col font-sans selection:bg-[#E5A93C] selection:text-[#0C0A14]">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        user={currentUser}
        notifications={notifications}
        language={language}
        onToggleLanguage={() => setLanguage(l => (l === 'en' ? 'gu' : 'en'))}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenProfile={() => handleSelectTab('PROFILE')}
        onOpenAdmin={() => handleSelectTab('ADMIN')}
        onOpenInspector={() => handleSelectTab('INSPECTOR')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'HOME' && (
          <HomeFeed
            currentUser={currentUser}
            onOpenListing={handleOpenListing}
            onNavigatePost={() => handleSelectTab('POST')}
            onNavigateRequests={() => handleSelectTab('REQUESTS')}
            onNavigateRadar={() => handleSelectTab('ALERTS')}
            onOpenInspector={() => handleSelectTab('INSPECTOR')}
          />
        )}

        {currentTab === 'DETAIL' && activeListingId && (
          <ListingDetail
            listingId={activeListingId}
            currentUser={currentUser}
            onBack={() => handleSelectTab('HOME')}
            onOpenConnection={handleOpenConnection}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        )}

        {currentTab === 'POST' && (
          <PostPasses
            currentUser={currentUser}
            onSuccess={handleListingCreated}
            onCancel={() => handleSelectTab('HOME')}
          />
        )}

        {currentTab === 'REQUESTS' && (
          <RequestsHub
            currentUser={currentUser}
            onOpenConnection={handleOpenConnection}
            onNavigateHome={() => handleSelectTab('HOME')}
          />
        )}

        {currentTab === 'CONNECTED' && activeConnectionId && (
          <ConnectedRendezvous
            connectionId={activeConnectionId}
            currentUser={currentUser}
            onBack={() => handleSelectTab('REQUESTS')}
          />
        )}

        {currentTab === 'ALERTS' && (
          <AlertsRadar
            currentUser={currentUser}
            onOpenListing={handleOpenListing}
            onNavigatePost={() => handleSelectTab('POST')}
          />
        )}

        {currentTab === 'PROFILE' && (
          <TrustProfile
            currentUser={currentUser}
            onUpdateUser={setCurrentUser}
            onSwitchUser={handleSwitchUser}
            onOpenAdmin={() => handleSelectTab('ADMIN')}
          />
        )}

        {currentTab === 'INSPECTOR' && (
          <InspectorTerminal onBack={() => handleSelectTab('HOME')} />
        )}

        {currentTab === 'ADMIN' && (
          <AdminDashboard
            currentUser={currentUser}
            onBack={() => handleSelectTab('HOME')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        pendingRequestsCount={pendingRequestsCount}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={user => {
          setCurrentUser(user);
          loadNotifications();
        }}
      />
    </div>
  );
}
