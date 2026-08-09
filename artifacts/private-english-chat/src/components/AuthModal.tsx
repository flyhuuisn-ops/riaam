import { useState } from 'react';
import { AlertCircle, ArrowLeft, LoaderCircle, LogIn, UserPlus, X } from 'lucide-react';
import { createUser, loginUser, type AppUser } from '../lib/auth';

interface AuthModalProps { onClose: () => void; onSuccess: (user: AppUser) => void; }
export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError('');
    const name = displayName.trim(); const handle = username.trim().toLowerCase();
    if (!name || !handle) return setError('اكتبي الاسم واليوزر أولاً.');
    if (!/^[a-z0-9._]+$/.test(handle)) return setError('اليوزر يقبل أحرفاً إنجليزية وأرقاماً ونقاطاً وشرطة سفلية فقط.');
    setLoading(true);
    const result = mode === 'signup' ? await createUser(name, handle) : await loginUser(name, handle);
    setLoading(false);
    if (result.error || !result.user) setError(result.error || 'تعذر إكمال العملية.');
    else onSuccess(result.user);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b3447]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div className="w-full max-w-md animate-rise rounded-[1.8rem] border border-[#ded3c5] bg-[#faf7f1] p-6 shadow-[0_28px_100px_rgba(59,52,71,.25)] sm:p-8" dir="rtl">
      <div className="mb-7 flex items-start justify-between"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#b82d49]">private identity</p><h2 id="auth-title" className="font-serif text-3xl text-[#3b3447]">{mode === 'signup' ? 'اصنعي حضورك' : 'عودي إلى المساحة'}</h2></div><button aria-label="إغلاق" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-[#8e8178] transition hover:bg-[#eee7dc] hover:text-[#3b3447]"><X size={18} /></button></div>
      <div className="mb-6 flex rounded-xl bg-[#eee7dc] p-1">{([['signup', UserPlus, 'حساب جديد'], ['login', LogIn, 'تسجيل دخول']] as const).map(([key, Icon, label]) => <button key={key} onClick={() => { setMode(key); setError(''); }} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${mode === key ? 'bg-[#faf7f1] text-[#b82d49] shadow-sm' : 'text-[#8e8178]'}`}><Icon size={15} />{label}</button>)}</div>
      <div className="space-y-4">
        <div><label htmlFor="display-name" className="mb-2 block text-xs font-semibold text-[#6f625d]">الاسم الظاهر</label><input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="الاسم الذي سيظهر في المحادثة" className="h-12 w-full rounded-xl border border-[#d7cec0] bg-[#fffdf9] px-4 text-sm text-[#3b3447] outline-none transition focus:border-[#b82d49] focus:ring-4 focus:ring-[#b82d49]/10" /></div>
        <div><label htmlFor="username" className="mb-2 block text-xs font-semibold text-[#6f625d]">اليوزر</label><input id="username" dir="ltr" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="your_private_name" className="h-12 w-full rounded-xl border border-[#d7cec0] bg-[#fffdf9] px-4 font-mono text-sm text-[#3b3447] outline-none transition focus:border-[#b82d49] focus:ring-4 focus:ring-[#b82d49]/10" /><p className="mt-2 text-[11px] text-[#a09288]">بدون مسافات، لسهولة التعرف عليك.</p></div>
      </div>
      {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-[#b82d49]/20 bg-[#b82d49]/8 p-3 text-xs leading-5 text-[#a52540]"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</div>}
      <button disabled={loading} onClick={submit} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#b82d49] font-semibold text-[#fffaf2] transition hover:bg-[#a92440] disabled:opacity-60">{loading ? <><LoaderCircle size={18} className="animate-spin" /> لحظة واحدة...</> : <>{mode === 'signup' ? 'إنشاء الحساب' : 'دخول'} <ArrowLeft size={17} /></>}</button>
    </div>
  </div>;
}