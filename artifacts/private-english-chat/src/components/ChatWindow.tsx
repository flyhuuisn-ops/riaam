import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, LoaderCircle, Maximize2, MessageCircle, Minimize2, Send, ShieldAlert, X } from 'lucide-react';
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    let active = true; 

    const loadGroupMessages = async () => { 
      setLoading(true); 
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true }); 

      if (!active) return; 

      if (fetchError) {
        setError('تعذر تحميل محادثة المجموعة. تحققي من الاتصال.');
      } else {
        setMessages((data || []) as Message[]); 
      }
      setLoading(false); 
    }; 

    loadGroupMessages(); 

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
  }, [messages]);

  const send = async () => { 
    const content = input.trim(); 
    if (!content || sending) return; 

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

  return (
    <div className="fixed inset-0 z-40 bg-[#3b3447]/45 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className={`fixed z-50 flex flex-col overflow-hidden border border-[#d8cfc2] bg-[#faf7f1] shadow-[0_30px_100px_rgba(59,52,71,.25)] ${full ? 'inset-0' : 'bottom-0 left-0 right-0 h-[min(720px,92dvh)] rounded-t-[1.8rem] sm:bottom-6 sm:left-1/2 sm:right-auto sm:top-1/2 sm:h-[680px] sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.8rem]'}`} dir="rtl">
        <header className="flex items-center justify-between border-b border-[#e5dcd0] bg-[#f4eee5] px-5 py-4">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-[#b82d49]">Group Thread</p>
            <h2 className="flex items-center gap-2 font-semibold text-[#3b3447]"><MessageCircle size={17} className="text-[#b82d49]" /> المحادثة الجماعية</h2>
          </div>
          <div className="flex items-center gap-1">
            <button aria-label="تمويه" title="تمويه F3" onClick={onDisguise} className="grid h-9 w-9 place-items-center rounded-lg text-[#56727a] hover:bg-[#e5e7df]"><BookOpen size={17} /></button>
            <button aria-label="طوارئ" title="طوارئ Escape" onClick={onPanic} className="grid h-9 w-9 place-items-center rounded-lg text-[#a06a30] hover:bg-[#f8ead7]"><ShieldAlert size={17} /></button>
            <button aria-label={full ? 'تصغير' : 'ملء الشاشة'} onClick={() => setFull(!full)} className="hidden h-9 w-9 place-items-center rounded-lg text-[#8e8178] hover:bg-[#e9e2d8] sm:grid">{full ? <Minimize2 size={16} /> : <Maximize2 size={16} strokeWidth={2} />}</button>
            <button aria-label="إغلاق" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[#8e8178] hover:bg-[#e9e2d8]"><X size={17} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="space-y-4">
              <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-[#eee7dc]" />
              <div className="mr-auto h-20 w-2/3 animate-pulse rounded-2xl bg-[#eee7dc]" />
            </div>
          ) : error && messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <AlertCircle size={24} className="mb-3 text-[#b82d49]" />
              <p className="max-w-xs text-sm leading-6 text-[#6f625d]">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-[#d7cec0] px-3 py-2 text-xs font-semibold">إعادة المحاولة</button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#b82d49]/10 text-[#b82d49]"><MessageCircle size={24} /></div>
              <p className="font-semibold text-[#514752]">المجموعة تنتظر أول كلمة</p>
              <p className="mt-2 text-xs text-[#a09288]">اكتبوا رسالة ليراها الجميع.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => { 
                const mine = message.sender_handle ? message.sender_handle === user.username : message.sender === user.username; 
                const displayName = message.sender_display_name || message.sender_handle || message.sender || 'عضو';

                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-7 ${mine ? 'rounded-br-md bg-[#b82d49]/10 text-[#514752]' : 'rounded-bl-md bg-[#3b3447] text-[#f9f3e8]'}`}>
                      
                      {/* التعديل هنا: إظهار الاسم لجميع الرسائل مع تلوين ذكي */}
                      <p className={`mb-1 text-[11px] font-semibold ${mine ? 'text-[#b82d49]' : 'text-[#dcb386]'}`}>
                        {displayName}
                      </p>
                      
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <time dir="ltr" className={`mt-1 block text-left font-mono text-[9px] ${mine ? 'text-[#a09288]' : 'text-[#c6baca]'}`}>
                        {new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </time>
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
              placeholder="اكتب رسالتك للمجموعة..." 
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
    </div>
  );
}
