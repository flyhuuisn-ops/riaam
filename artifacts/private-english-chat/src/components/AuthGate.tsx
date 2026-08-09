import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, CalendarDays, Check, KeyRound, Mail, Heart, LockKeyhole, RotateCcw, ShieldAlert } from 'lucide-react';
import { SECURITY_QUESTIONS } from '../lib/constants';

type QuestionKey = 'date' | 'email' | 'nickname';
interface AuthGateProps { onSuccess: () => void; }

export default function AuthGate({ onSuccess }: AuthGateProps) {
  const [backup, setBackup] = useState(false);
  const [question, setQuestion] = useState<QuestionKey>('date');
  const [answer, setAnswer] = useState('');
  const [date, setDate] = useState({ year: '', month: '', day: '' });
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const answerRef = useRef<HTMLInputElement>(null);

  useEffect(() => { answerRef.current?.focus(); }, [backup, question]);
  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');
  const verify = () => {
    const value = question === 'date'
      ? `${date.year}/${Number(date.month)}/${Number(date.day)}`
      : answer;
    const valid = SECURITY_QUESTIONS[question].answers.some((entry) => normalize(entry) === normalize(value));
    if (valid) onSuccess();
    else { setAttempts((count) => count + 1); setError('الإجابة لا تطابق المفتاح الخاص. حاولي مرة أخرى.'); window.setTimeout(() => setError(''), 3200); }
  };
  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); verify(); } };
  const Icon = question === 'date' ? CalendarDays : question === 'email' ? Mail : Heart;
  return (
    <main className="grain relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f1ede5] px-4 py-8" dir="rtl">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#b82d49]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#dd9645]/15 blur-3xl" />
      <div className="relative w-full max-w-[430px] animate-rise">
        <div className="mb-8 flex items-center justify-center gap-3 text-[#3b3447]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#3b3447] text-[#f4eddf] shadow-lg"><LockKeyhole size={18} /></span>
          <span className="text-sm font-semibold tracking-[.2em]">بيننا فقط</span>
        </div>
        <section className="overflow-hidden rounded-[2rem] border border-[#d7cec0] bg-[#f9f6f0]/90 p-7 shadow-[0_24px_80px_rgba(59,52,71,.14)] backdrop-blur sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[1.4rem] bg-[#b82d49]/10 text-[#b82d49]"><KeyRound size={27} strokeWidth={1.8} /></div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[.24em] text-[#8e8178]">مساحة خاصة</p>
            <h1 className="font-serif text-3xl text-[#3b3447]">أهلاً بكِ من جديد</h1>
            <p className="mt-3 text-sm leading-7 text-[#786d68]">أجيبي عن السؤال الصغير حتى تبقى هذه الرسالة بيننا.</p>
          </div>
          {!backup ? (
            <div className="animate-enter">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#e5dcd0] bg-[#f2ede5] p-4 text-[#b82d49]">
                <CalendarDays size={20} />
                <div><p className="text-sm font-semibold text-[#3b3447]">{SECURITY_QUESTIONS.date.title}</p><p className="mt-0.5 text-xs text-[#8e8178]">{SECURITY_QUESTIONS.date.hint}</p></div>
              </div>
              <div className="mb-6 flex items-end justify-center gap-2" dir="ltr">
                {(['year', 'month', 'day'] as const).map((part, index) => (
                  <div key={part} className="flex items-center gap-2">
                    <input aria-label={part} ref={index === 0 ? answerRef : undefined} inputMode="numeric" maxLength={index === 0 ? 4 : 2} value={date[part]} onChange={(event) => setDate({ ...date, [part]: event.target.value.replace(/\D/g, '') })} onKeyDown={onEnter} placeholder={index === 0 ? 'YYYY' : index === 1 ? 'MM' : 'DD'} className="h-14 w-[72px] rounded-xl border border-[#d7cec0] bg-[#fffdf9] text-center font-mono text-base text-[#3b3447] outline-none transition focus:border-[#b82d49] focus:ring-4 focus:ring-[#b82d49]/10" />
                    {index < 2 && <span className="mb-3 text-[#b4a79b]">/</span>}
                  </div>
                ))}
              </div>
              {error && <p role="alert" className="mb-4 flex items-center justify-center gap-2 text-center text-xs text-[#b82d49]"><ShieldAlert size={14} />{error}</p>}
              <button data-testid="verify-gate" onClick={verify} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#b82d49] font-semibold text-[#fffaf2] shadow-lg shadow-[#b82d49]/20 transition hover:-translate-y-0.5 hover:bg-[#a92440] active:translate-y-0">دخول هادئ <ArrowLeft size={17} /></button>
              <button onClick={() => { setBackup(true); setQuestion('email'); setError(''); }} className="mt-5 flex w-full items-center justify-center gap-2 text-xs text-[#8e8178] transition hover:text-[#b82d49]">نسيتِ التاريخ؟ استخدمي سؤالاً احتياطياً <RotateCcw size={13} /></button>
            </div>
          ) : (
            <div className="animate-enter">
              <div className="mb-5 flex gap-2">
                {(['email', 'nickname'] as QuestionKey[]).map((key) => {
                  const QIcon = key === 'email' ? Mail : Heart;
                  return <button key={key} onClick={() => { setQuestion(key); setAnswer(''); setError(''); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition ${question === key ? 'border-[#b82d49]/30 bg-[#b82d49]/10 text-[#b82d49]' : 'border-[#e1d8cc] bg-[#fffdf9] text-[#8e8178] hover:border-[#b82d49]/30'}`}><QIcon size={15} />{SECURITY_QUESTIONS[key].title}</button>;
                })}
              </div>
              <label className="mb-2 block text-xs font-semibold text-[#6f625d]">{SECURITY_QUESTIONS[question].hint}</label>
              <div className="relative mb-5"><Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b82d49]" size={18} /><input ref={answerRef} value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={onEnter} dir="rtl" className="h-14 w-full rounded-xl border border-[#d7cec0] bg-[#fffdf9] pr-12 text-sm text-[#3b3447] outline-none transition focus:border-[#b82d49] focus:ring-4 focus:ring-[#b82d49]/10" /></div>
              {error && <p role="alert" className="mb-4 flex items-center justify-center gap-2 text-center text-xs text-[#b82d49]"><ShieldAlert size={14} />{error}</p>}
              <button onClick={verify} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#b82d49] font-semibold text-[#fffaf2] shadow-lg shadow-[#b82d49]/20 transition hover:-translate-y-0.5 hover:bg-[#a92440]"><Check size={17} />تحقق</button>
              <button onClick={() => { setBackup(false); setQuestion('date'); setError(''); }} className="mt-5 flex w-full items-center justify-center gap-2 text-xs text-[#8e8178] transition hover:text-[#b82d49]"><ArrowLeft size={13} />العودة إلى التاريخ</button>
            </div>
          )}
          <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#e7ded2] pt-5 text-[11px] text-[#a99c91]"><LockKeyhole size={12} /> لا نحفظ إجابتك في المتصفح</div>
        </section>
        <p className="mt-6 text-center font-mono text-[10px] tracking-wider text-[#a99c91]">PRIVATE NOTE · {String(attempts).padStart(2, '0')}</p>
      </div>
    </main>
  );
}