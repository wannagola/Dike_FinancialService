import { useState, useCallback } from 'react';
import StatusBar from './components/StatusBar';
import TabIndicator from './components/TabIndicator';
import VoiceToast from './components/VoiceToast';
import HomeTab from './screens/HomeTab';
import UploadTab from './screens/UploadTab';
import InboxTab from './screens/InboxTab';
import HistoryTab from './screens/HistoryTab';
import SendTab from './screens/SendTab';
import MyPageTab from './screens/MyPageTab';
import NotificationsPanel from './screens/NotificationsPanel';
import { TABS, TAB_ANNOUNCE } from './constants/tabs';
import { useAnnounce } from './hooks/useAnnounce';
import { useSwipe } from './hooks/useSwipe';

export default function App() {
  const [idx, setIdx] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const { voiceState, announce } = useAnnounce();

  const goTo = useCallback((i: number) => {
    setIdx(i);
    announce(TAB_ANNOUNCE[TABS[i].key]);
  }, [announce]);

  const { dragHandlers } = useSwipe(idx, goTo, TABS.length - 1);

  const renderTab = () => {
    switch (TABS[idx].key) {
      case 'home':    return (
        <HomeTab
          onAnnounce={announce}
          onShowNotif={() => setShowNotif(true)}
          onGoMyPage={() => goTo(TABS.findIndex(t => t.key === 'my'))}
          onGoSend={() => goTo(TABS.findIndex(t => t.key === 'send'))}
        />
      );
      case 'upload':  return <UploadTab onAnnounce={announce} />;
      case 'inbox':   return <InboxTab />;
      case 'history': return <HistoryTab />;
      case 'send':    return <SendTab onAnnounce={announce} />;
      case 'my':      return <MyPageTab />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center">
      <div
        className="relative flex flex-col overflow-hidden bg-navy w-full"
        style={{ maxWidth: 390, height: '100svh', maxHeight: 844 }}
      >
        <StatusBar />
        <TabIndicator tabs={TABS} activeIdx={idx} onSelect={goTo} />

        <div className="flex-1 overflow-hidden relative" {...dragHandlers}>
          {renderTab()}
        </div>

        <VoiceToast text={voiceState.text} visible={voiceState.visible} />
        {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}
      </div>
    </div>
  );
}
