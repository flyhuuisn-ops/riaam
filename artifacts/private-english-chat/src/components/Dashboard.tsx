import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, ChevronDown, CircleHelp, DoorOpen, LockKeyhole, MessageCircle, ShieldCheck, UserRound } from 'lucide-react';
import { PERSONAL_MESSAGE } from '../lib/constants';
import type { AppUser } from '../lib/auth';

interface DashboardProps { user: AppUser | null; onPanic: () => void; onDisguise: () => void; onOpenChat: () => void; onOpenAuth: () => void; onOpenSettings: () => void; children: ReactNode; }
export default function Dashboard({ user, onPanic, onDisguise, onOpenChat, onOpenAuth, onOpenSettings, children }: DashboardProps) {
  const [tip, setTip] = useState<'escape' | 'f3' | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (tipRef.current && !tipRef.current.contains(event.target as Node)) setTip(null); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  return <div className="grain min-h-[100dvh] bg-[#f1ede5]" dir="rtl">
    <header className="sticky top-0 z-30 border-b border-[#ddd2c4]/80 bg-[#f5f0e8]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#3b3447] text-[#f4eddf]"><LockKeyhole size={17} /></div><div><p className="text-sm font-bold text-[#3b3447]">بيننا فقط</p><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#a09288]">private / 02</p></div></div>
        <div className="flex items-center gap-2">
          <button aria-label="فتح المحادثة" data-testid="open-chat" onClick={onOpenChat} className="flex h-10 items-center gap-2 rounded-xl border border-[#b82d49]/20 bg-[#b82d49]/10 px-3 text-sm font-semibold text-[#a52540] transition hover:bg-[#b82d49]/15"><MessageCircle size={17} /><span className="hidden sm:inline">المحادثة</span></button>
          {user ? <button aria-label="فتح إعدادات الحساب" onClick={onOpenSettings} className="flex h-10 max-w-[150px] items-center gap-2 rounded-xl border border-[#ddd2c4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#514752]"><UserRound size={16} /><span className="truncate">{user.display_name}</span><ChevronDown size={14} /></button> : <button onClick={onOpenAuth} className="flex h-10 items-center gap-2 rounded-xl border border-[#ddd2c4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#514752]"><UserRound size={16} /><span>حسابي</span></button>}
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-7 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div className="animate-enter"><p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-[#b82d49]"><span className="h-1.5 w-1.5 rounded-full bg-[#b82d49] animate-pulse-soft" /> الرسالة محفوظة</p><h1 className="font-serif text-4xl leading-tight text-[#3b3447] sm:text-6xl">كلمات،<br /><em className="text-[#b82d49]">إليكِ.</em></h1></div>
        <div className="flex items-center gap-2 text-xs text-[#8e8178]"><ShieldCheck size={16} className="text-[#b82d49]" /> مساحة خاصة بين شخصين</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
        <article className="animate-rise rounded-[2rem] border border-[#dfd4c7] bg-[#faf7f1] p-6 shadow-[0_22px_60px_rgba(59,52,71,.08)] sm:p-10">
          <div className="mb-8 flex items-center justify-between border-b border-[#e7ded2] pb-6"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-[#a09288]">رسالة شخصية</p><h2 className="font-serif text-2xl text-[#3b3447]">ريام،</h2></div><div className="rounded-full border border-[#dd9645]/30 bg-[#dd9645]/10 px-3 py-1.5 font-mono text-[10px] text-[#9c6127]">read slowly</div></div>
          <div className="whitespace-pre-wrap text-[16px] leading-[2.15] text-[#514752] sm:text-[17px]">{PERSONAL_MESSAGE}</div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ded2] pt-6"><p className="text-xs text-[#9a8e84]">حين تكونين مستعدة، أرسلي كلمة واحدة.</p><button onClick={onOpenChat} className="flex items-center gap-2 rounded-xl bg-[#3b3447] px-4 py-2.5 text-xs font-semibold text-[#f9f3e8] transition hover:-translate-y-0.5 hover:bg-[#4a4157]"><MessageCircle size={15} /> افتحي المحادثة</button></div>
        </article>
        <aside className="space-y-3">
          <section className="rounded-[1.6rem] border border-[#dfd4c7] bg-[#e8e0d4] p-5"><p className="mb-4 text-xs font-semibold uppercase tracking-[.16em] text-[#82736c]">اختصارات هادئة</p><div className="space-y-2.5"><div className="flex items-center justify-between rounded-xl bg-[#f8f3eb]/70 p-3"><span className="flex items-center gap-2 text-sm text-[#514752]"><BookOpen size={16} className="text-[#56727a]" /> تمويه داخلي</span><kbd className="rounded-md border border-[#cbbcae] bg-[#f9f5ed] px-2 py-1 font-mono text-[10px] text-[#81746c]">F3</kbd></div><div className="flex items-center justify-between rounded-xl bg-[#f8f3eb]/70 p-3"><span className="flex items-center gap-2 text-sm text-[#514752]"><DoorOpen size={16} className="text-[#9c6127]" /> طوارئ وحذف</span><kbd className="rounded-md border border-[#cbbcae] bg-[#f9f5ed] px-2 py-1 font-mono text-[10px] text-[#81746c]">Esc</kbd></div></div></section>
          <section ref={tipRef} className="relative rounded-[1.6rem] border border-[#dfd4c7] bg-[#faf7f1] p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3b3447]"><CircleHelp size={16} className="text-[#b82d49]" /> تحتاجين مساعدة؟</div><p className="text-xs leading-6 text-[#81746c]">التمويه يفتح صفحة تعلم داخلية. زر الطوارئ يحذف رسائلك أولاً ثم يفتحها.</p><div className="mt-4 flex gap-2"><button onClick={onDisguise} className="flex-1 rounded-lg border border-[#d9cec1] py-2 text-xs font-semibold text-[#56727a] transition hover:bg-[#eef1ed]">تمويه</button><button onClick={onPanic} className="flex-1 rounded-lg border border-[#ddc9b1] py-2 text-xs font-semibold text-[#9c6127] transition hover:bg-[#fbf0df]">طوارئ</button></div>{tip && <div className="absolute inset-x-4 top-full z-20 mt-2 rounded-xl bg-[#3b3447] p-3 text-xs text-[#faf4e9] shadow-xl">{tip === 'f3' ? 'اضغطي F3 في أي وقت للتمويه.' : 'اضغطي Escape للحذف والتمويه.'}</div>}</section>
        </aside>
      </div>
    </main>
    {children}
  </div>;
}