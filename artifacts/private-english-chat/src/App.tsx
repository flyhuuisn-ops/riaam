import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundary } from './components/error-boundary';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import AuthGate from './components/AuthGate';
import AuthModal from './components/AuthModal';
import ChatWindow from './components/ChatWindow';
import Dashboard from './components/Dashboard';
import EnglishDisguise from './components/EnglishDisguise';
import UserSettingsModal from './components/UserSettingsModal';
import { deleteUserAccount, useUserSession, type AppUser } from './lib/auth';
import { sendNotification } from './lib/notifications';
import { supabase } from './lib/supabase';

// دالة إرسال التنبيهات إلى Vercel API (التلغرام)
const sendAlert = async (type: string, data = {}) => {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        timestamp: new Date().toISOString(),
        ...data
      }),
    });
  } catch (err) {
    console.error('Failed to send alert', err);
  }
};

const queryClient = new QueryClient();

function Home() {
  const { user, loading, saveSession, clearSession } = useUserSession();
  const [gatePassed, setGatePassed] = useState(() => sessionStorage.getItem('private_gate_open') === '1');
  const [screen, setScreen] = useState<'dashboard' | 'disguise'>('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emergencyState, setEmergencyState] = useState<'idle' | 'working' | 'error'>('idle');
  const sessionStart = useRef<number | null>(null);
  const disguised = useRef(false);

  useEffect(() => {
    if (gatePassed) {
      sessionStart.current = Date.now();
      void sendAlert('entry'); // إرسال تنبيه دخول
    }
  }, [gatePassed]);

  const openGate = useCallback(() => {
    sessionStorage.setItem('private_gate_open', '1');
    setGatePassed(true);
    void sendNotification('gate_opened', {});
  }, []);

  const showDisguise = useCallback(async (emergency = false) => {
    if (disguised.current) return;
    disguised.current = true;
    setChatOpen(false);
    setAuthOpen(false);
    setSettingsOpen(false);
    if (emergency && user) {
      setEmergencyState('working');
      const result = await deleteUserAccountMessages(user.username);
      setEmergencyState(result ? 'idle' : 'error');
      void sendNotification('panic', { username: user.username, displayName: user.display_name });
      void sendAlert('panic'); // إرسال تنبيه طوارئ للتلغرام
    } else if (user) {
      void sendNotification('disguise', { username: user.username, displayName: user.display_name });
      void sendAlert('camouflage'); // إرسال تنبيه تمويه للتلغرام
    }
    setScreen('disguise');
  }, [user]);

  const handleKeyboard = useCallback((event: KeyboardEvent) => {
    if (!gatePassed || screen !== 'dashboard') return;
    if (event.key === 'F3') { event.preventDefault(); void showDisguise(false); }
    if (event.key === 'Escape') { event.preventDefault(); void showDisguise(true); }
  }, [gatePassed, screen, showDisguise]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  useEffect(() => {
    const onUnload = () => {
      if (!user || !sessionStart.current || screen !== 'dashboard') return;
      const duration = Math.floor((Date.now() - sessionStart.current) / 1000);
      void supabase.from('activity_log').insert({ event_type: 'logout', device_info: navigator.userAgent, duration_seconds: duration, username: user.username });
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [screen, user]);

  const onAuth = (next: AppUser) => {
    saveSession(next);
    setAuthOpen(false);
    sessionStart.current = Date.now();
    void sendNotification('login', { username: next.username, displayName: next.display_name });
  };

  if (loading) return <LoadingScreen />;
  if (!gatePassed) return <AuthGate onSuccess={openGate} />;
  if (screen === 'disguise') return <EnglishDisguise />;

  return <Dashboard user={user} onPanic={() => void showDisguise(true)} onDisguise={() => void showDisguise(false)} onOpenChat={() => user ? setChatOpen(true) : setAuthOpen(true)} onOpenAuth={() => setAuthOpen(true)} onOpenSettings={() => setSettingsOpen(true)}>
    {chatOpen && user && <ChatWindow user={user} onClose={() => setChatOpen(false)} onPanic={() => void showDisguise(true)} onDisguise={() => void showDisguise(false)} />}
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={onAuth} />}
    {settingsOpen && user && <UserSettingsModal user={user} onClose={() => setSettingsOpen(false)} onUpdate={(next) => { saveSession(next); setSettingsOpen(false); }} onDelete={() => { clearSession(); setSettingsOpen(false); }} onLogout={() => { clearSession(); setSettingsOpen(false); }} />}
    {emergencyState === 'error' && <div role="status" className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-xl border border-[#b82d49]/20 bg-[#fff8f0] px-4 py-3 text-xs text-[#a52540] shadow-xl">تعذر حذف الرسائل، لكن تم فتح شاشة التمويه.</div>}
  </Dashboard>;
}

async function deleteUserAccountMessages(username: string) {
  const { error } = await supabase.from('messages').delete().eq('username', username);
  return !error;
}

function LoadingScreen() {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f1ede5]"><div className="w-56 space-y-3"><div className="h-3 animate-pulse rounded-full bg-[#ded4c8]" /><div className="h-3 w-4/5 animate-pulse rounded-full bg-[#ded4c8]" /><div className="h-3 w-3/5 animate-pulse rounded-full bg-[#ded4c8]" /></div></main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route><NotFound /></Route></Switch></RoutedErrorBoundary>;
}
function NotFound() {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f1ede5] text-[#3b3447]"><div className="text-center"><p className="font-mono text-xs text-[#b82d49]">404</p><h1 className="mt-2 font-serif text-4xl">هذه الصفحة غير موجودة</h1></div></main>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

