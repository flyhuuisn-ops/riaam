import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Bot, LoaderCircle, Maximize2, MessageCircle, Minimize2, Send, ShieldAlert, X } from 'lucide-react';
import type { AppUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';

export interface Message { 
  id: string; 
  content: string; 
  sender: string; 
  created_at: string; 
  username: string; 
  sender_handle?: string; 
  sender_display_name?: string; 
}

// قائمة الرسائل التمويهية تماماً كما طلبْتَها بالعربي
const FAKE_AI_MESSAGES: Message[] = [
  { 
    id: 'f1', 
    content: 'أهلاً بك! أنا مساعدك الذكي Reem AI، كيف يمكنني مساعدتك اليوم؟', 
    sender: 'ai', 
    username: 'reem_ai', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'Reem AI' 
  },
  { 
    id: 'f2', 
    content: 'ما هي مرادفات كلمة "beautiful" في اللغة الإنجليزية؟', 
    sender: 'user', 
    username: 'user', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'أنت' 
  },
  { 
    id: 'f3', 
    content: 'تضم اللغة الإنجليزية قائمة واسعة من مرادفات كلمة Beautiful (جميل)، وتختلف هذه المرادفات بناءً على السياق ونوع الشيء الموصوف:\n\nمرادفات عامة للجمال الشديد 🌟\n• Gorgeous: فائق الجمال أو رائع جداً.\n• Stunning: مذهل أو يخطف الأنظار لشدة جماله.\n• Breathtaking: خلّاب أو يسلب الأنفاس (تُستخدم غالباً للمناظر الطبيعية).\n• Wonderful: رائع أو بديع.\n\nوصف الأشخاص والأزياء 👗\n• Pretty: جميلة أو جذابة (تُستخدم عادةً للفتيات والنساء أو الأشياء اللطيفة).\n• Handsome: وسيم (تُستخدم غالباً للرجال، وأحياناً للنساء ذوات الملامح القوية المتناسقة).\n• Attractive: جذاب أو فاتن.\n• Elegant: أنيق أو راقٍ.\n• Cute: لطيف أو جذاب بشكل محبب.\n\nجمال الصنع والدقة الفنية ✨\n• Exquisite: متقن الصنع، دقيق، وبارع الجمال.\n• Magnificent: فخم، عظيم، أو مهيب الجمال.\n• Splendid: فاخر أو باهر.\n\nالجمال الساحر والمضيء ☀️\n• Radiant: متألق، مشرق، أو يشع جمالاً.\n• Charming: ساحر أو فتان.\n• Dazzling: مبهر أو يخطف الأبصار بشدته.\n\nإذا كنت ترغب في توظيف إحدى هذه الكلمات في سياق معين، هل تود معرفة الفروق الدقيقة بينها أو الاطلاع على أمثلة داخل جمل كاملة؟', 
    sender: 'ai', 
    username: 'reem_ai', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'Reem AI' 
  },
  { 
    id: 'f4', 
    content: 'ما عكس كلمة (close)', 
    sender: 'user', 
    username: 'user', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'أنت' 
  },
  { 
    id: 'f5', 
    content: 'عكس كلمة (close) إذا كان معناها "قريب" هو:\n• Far (بعيد) - الأكثر استخداماً للمسافات.\n• Distant (بعيد/منعزل) - للمسافات والعلاقات الرسمية.\n• Remote (نائٍ/بعيد جداً) - للأماكن المعزولة.\n\nهل تبحث عن عكسها في جملة معينة لتحديد الكلمة الأكثر دقة؟', 
    sender: 'ai', 
    username: 'reem_ai', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'Reem AI' 
  },
  { 
    id: 'f6', 
    content: 'ما مرادفات كلمة (professional)', 
    sender: 'user', 
    username: 'user', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'أنت' 
  },
  { 
    id: 'f7', 
    content: 'مرادفات كلمة (professional) تعتمد على السياق الذي تُستخدم فيه:\n\n1. سياق العمل والخبرة (محترف / خبير)\n• Expert: خبير ومتمكن جداً في مجاله.\n• Experienced: ذو خبرة وتجربة طويلة.\n• Skilled: ماهر ويمتلك مهارات عالية.\n• Proficient: بارع ومتقن لعمله.\n\n2. سياق السلوك والأداء (مهني / رصين)\n• Businesslike: جاد ومنظم ويتبع أسلوب العمل.\n• Competent: كفء وقادر على إنجاز المهام بنجاح.\n• Ethical: أخلاقي وملتزم بمعايير المهنة.\n\n3. سياق نوع العمل (وظيفة مدفوعة / غير هاوٍ)\n• Paid: يتقاضى أجراً مقابل عمله (عكس هاوٍ).\n• Career: متخصص يتخذ هذا العمل كمهنة دائمة.\n\nهل تريد استخدامها لوصف شخص، سلوك في العمل، أم تصميم ومظهر لكي أقترح لك الكلمة الأنسب؟', 
    sender: 'ai', 
    username: 'reem_ai', 
    created_at: new Date().toISOString(), 
    sender_display_name: 'Reem AI' 
  }
];

interface ChatWindowProps { 
  user: AppUser; 
  onClose: () => void; 
  onPanic: () => void; 
  onDisguise: () => void; 
}

export default function ChatWindow({ user, onClose, onPanic, onDisguise }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]); 
  const [input, setInput] = useState(''); 
  const [full, setFull] = useState(false); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 
  const [sending, setSending] = useState(false); 
  
  const [isAiMode, setIsAiMode] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    let active = true; 

    const loadMessages = async () => { 
      setLoading(true); 
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true }); 

      if (!active) return; 

      if (fetchError) {
        setError('تعذر تحميل المحادثة. تحققي من الاتصال.');
      } else {
        setMessages((data || []) as Message[]); 
      }
      setLoading(false); 
    }; 

    loadMessages(); 

    const channel = supabase
      .channel('group-chat-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
        }
      )
      .subscribe(); 

    return () => { 
      active = false; 
      supabase.removeChannel(channel); 
    }; 
  }, []);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isAiMode]);

  const send = async () => { 
    const content = input.trim(); 
    if (!content || sending) return; 

    if (isAiMode) {
      setInput('');
      return;
    }

    setInput(''); 
    setSending(true); 

    const newMsgObj = { 
      content, 
      sender: user.username, 
      username: user.username, 
      sender_handle: user.username, 
      sender_display_name: user.display_name || user.username
    };

    const { data, error: sendError } = await supabase
      .from('messages')
      .insert(newMsgObj)
      .select()
      .single(); 

    setSending(false); 

    if (sendError) { 
      setInput(content); 
      setError('لم تُرسل الرسالة. حاولي مرة أخرى.'); 
    } else if (data) { 
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message])); 
      sendNotification('message', { username: user.username, messagePreview: content }); 
    } 
  };

  const displayedMessages = isAiMode ? FAKE_AI_MESSAGES : messages;

  return (
    <section className={`fixed z-50 flex flex-col overflow-hidden border border-[#d8cfc2] bg-[#faf7f1] shadow-[0_30px_100px_rgba(59,52,71,.25)] ${full ? 'inset-0' : 'bottom-0 left-0 right-0 h-[min(720px,92dvh)] rounded-t-[1.8rem] sm:bottom-6 sm:left-1/2 sm:right-auto sm:top-1/2 sm:h-[680px] sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.8rem]'}`} dir="rtl">
      <header className="flex items-center justify-between border-b border-[#e5dcd0] bg-[#f4eee5] px-5 py-4">
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-[#b82d49]">
            {isAiMode ? "AI Mode" : "Live Chat"}
          </p>
          <h2 className="flex items-center gap-2 font-semibold text-[#3b3447]">
            {isAiMode ? <Bot size={17} className="text-purple-600" /> : <MessageCircle size={17} className="text-[#b82d49]" />}
            {isAiMode ? "محادثة مع Reem AI" : "المحادثة"}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button 
            aria-label="محادثة الذكاء الاصطناعي" 
            title="تبديل إلى محادثة Reem AI" 
            onClick={() => setIsAiMode((prev) => !prev)} 
            className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${isAiMode ? 'bg-purple-200 text-purple-700' : 'text-purple-600 hover:bg-purple-50'}`}
          >
            <Bot size={18} />
          </button>

          <button aria-label="تمويه" title="تمويه F3" onClick={onDisguise} className="grid h-9 w-9 place-items-center rounded-lg text-[#56727a] hover:bg-[#e5e7df]"><BookOpen size={17} /></button>
          <button aria-label="طوارئ" title="طوارئ Escape" onClick={onPanic} className="grid h-9 w-9 place-items-center rounded-lg text-[#a06a30] hover:bg-[#f8ead7]"><ShieldAlert size={17} /></button>
          <button aria-label={full ? 'تصغير' : 'ملء الشاشة'} onClick={() => setFull(!full)} className="hidden h-9 w-9 place-items-center rounded-lg text-[#8e8178] hover:bg-[#e9e2d8] sm:grid">{full ? <Minimize2 size={16} /> : <Maximize2 size={16} strokeWidth={2} />}</button>
          
          <button 
            aria-label="إغلاق" 
            onClick={() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onClose();
            }} 
            className="grid h-9 w-9 place-items-center rounded-lg text-[#8e8178] hover:bg-[#e9e2d8]"
          >
            <X size={17} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {!isAiMode && loading ? (
          <div className="space-y-4">
            <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-[#eee7dc]" />
            <div className="mr-auto h-20 w-2/3 animate-pulse rounded-2xl bg-[#eee7dc]" />
          </div>
        ) : !isAiMode && error && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <AlertCircle size={24} className="mb-3 text-[#b82d49]" />
            <p className="max-w-xs text-sm leading-6 text-[#6f625d]">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-[#d7cec0] px-3 py-2 text-xs font-semibold">إعادة المحاولة</button>
          </div>
        ) : !isAiMode && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#b82d49]/10 text-[#b82d49]"><MessageCircle size={24} /></div>
            <p className="font-semibold text-[#514752]">لا توجد رسائل حالياً</p>
            <p className="mt-2 text-xs text-[#a09288]">اكتب رسالة للبدء.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedMessages.map((message) => { 
              const mine = isAiMode 
                ? message.sender === 'user' 
                : (message.sender_handle ? message.sender_handle === user.username : message.sender === user.username); 
              
              const displayName = isAiMode
                ? (message.sender === 'user' ? 'أنت' : 'Reem AI')
                : (message.sender_display_name || message.sender_handle || message.sender || 'عضو');

              return (
                <div key={message.id} className={`flex w-full ${mine ? 'justify-start' : 'justify-end'}`}>
                  <div className={`relative w-fit max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                    isAiMode 
                      ? (mine ? 'rounded-tr-sm bg-purple-100 text-[#3b3447]' : 'rounded-tl-sm bg-[#3b3447] text-[#f9f3e8]')
                      : (mine ? 'rounded-tr-sm bg-[#b82d49]/10 text-[#3b3447]' : 'rounded-tl-sm bg-[#3b3447] text-[#f9f3e8]')
                  }`}>
                    
                    <p className={`mb-0.5 text-[11px] font-bold ${isAiMode ? (mine ? 'text-purple-700' : 'text-[#dcb386]') : (mine ? 'text-[#b82d49]' : 'text-[#dcb386]')}`}>
                      {displayName}
                    </p>
                    
                    <p className="text-[14px] leading-snug whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {!isAiMode && (
                      <time dir="ltr" className={`mt-1 block text-left font-mono text-[9px] ${mine ? 'text-[#a09288]' : 'text-[#a398a8]'}`}>
                        {new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    )}
                  </div>
                </div>
              ); 
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <footer className="border-t border-[#e5dcd0] bg-[#f4eee5] p-4">
        <div className="flex items-end gap-2">
          <textarea 
            aria-label="نص الرسالة" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} 
            rows={1} 
            placeholder={isAiMode ? "اسأل Reem AI..." : "اكتب رسالتك..."} 
            className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-[#d7cec0] bg-[#fffdf9] px-4 py-3 text-sm text-[#3b3447] outline-none focus:border-[#b82d49]" 
          />
          <button 
            aria-label="إرسال" 
            disabled={!input.trim() || sending} 
            onClick={send} 
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#b82d49] text-[#fffaf2] transition hover:bg-[#a92440] disabled:opacity-40"
          >
            {sending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </footer>
    </section>
  );
}
