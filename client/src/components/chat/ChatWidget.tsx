import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  ExternalLink,
  Headphones,
  Loader2,
  Package,
  PhoneCall,
  RotateCcw,
  Send,
  UserRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  clearChatCredentials,
  createChatSession,
  getChatSession,
  loadChatCredentials,
  requestHumanHandoff,
  saveChatCredentials,
  sendChatMessage,
  type ChatCredentials,
} from '@/services/chatService';
import type {
  ChatMessage,
  ChatProductRecommendation,
  ChatSession,
} from '@/types';

const INITIAL_HANDOFF = { name: '', phone: '', email: '', note: '' };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [credentials, setCredentials] = useState<ChatCredentials | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showHandoff, setShowHandoff] = useState(false);
  const [handoff, setHandoff] = useState(INITIAL_HANDOFF);
  const [handoffSending, setHandoffSending] = useState(false);
  const initializingRef = useRef(false);
  const pollingRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const humanMode = session?.status === 'WAITING_ADMIN' || session?.status === 'ADMIN_ACTIVE';
  const closed = session?.status === 'CLOSED';

  const quickReplies = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const quick = messages[index]?.metadata?.quickReplies;
      if (quick?.length) return quick;
    }
    return [];
  }, [messages]);

  useEffect(() => {
    if (!open || session || initializingRef.current) return;
    void initializeChat();
  }, [open, session]);

  useEffect(() => {
    if (!open || !credentials || !session) return;

    const interval = window.setInterval(
      () => void syncChat(),
      humanMode ? 4000 : 12_000
    );

    return () => window.clearInterval(interval);
  }, [open, credentials, session?.id, humanMode]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, showHandoff]);

  async function initializeChat(forceNew = false) {
    initializingRef.current = true;
    setLoading(true);

    try {
      if (!forceNew) {
        const saved = loadChatCredentials();
        if (saved) {
          try {
            const response = await getChatSession(saved);
            setCredentials(saved);
            setSession(response.data.session);
            setMessages(response.data.messages ?? []);
            return;
          } catch {
            clearChatCredentials();
          }
        }
      }

      const response = await createChatSession(window.location.href);
      const nextCredentials = {
        sessionId: response.data.session.id,
        accessToken: response.data.accessToken,
      };
      saveChatCredentials(nextCredentials);
      setCredentials(nextCredentials);
      setSession(response.data.session);
      setMessages(response.data.messages ?? []);
    } catch (error) {
      toast.error((error as Error).message || 'Không thể mở trợ lý tư vấn');
    } finally {
      initializingRef.current = false;
      setLoading(false);
    }
  }

  async function syncChat() {
    if (!credentials || pollingRef.current || document.visibilityState === 'hidden') return;

    pollingRef.current = true;
    try {
      const response = await getChatSession(credentials);
      setSession(response.data.session);
      setMessages(response.data.messages ?? []);
    } catch {
      // Đồng bộ nền không làm gián đoạn nội dung khách đang xem.
    } finally {
      pollingRef.current = false;
    }
  }

  async function resetChat() {
    clearChatCredentials();
    setCredentials(null);
    setSession(null);
    setMessages([]);
    setInput('');
    setShowHandoff(false);
    setHandoff(INITIAL_HANDOFF);
    await initializeChat(true);
  }

  async function handleSend(rawMessage?: string) {
    const content = (rawMessage ?? input).trim();
    if (!content || !credentials || sending || closed) return;

    const temporaryId = `temp-${Date.now()}`;
    const temporaryMessage: ChatMessage = {
      id: temporaryId,
      sessionId: credentials.sessionId,
      sender: 'CUSTOMER',
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setInput('');
    setSending(true);
    setMessages((current) => [...current, temporaryMessage]);

    try {
      const response = await sendChatMessage(credentials, content);
      setSession(response.data.session);
      setMessages((current) => [
        ...current.filter((message) => message.id !== temporaryId),
        response.data.customerMessage,
        ...(response.data.assistantMessage ? [response.data.assistantMessage] : []),
      ]);
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== temporaryId));
      setInput(content);
      toast.error((error as Error).message || 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  }

  function handleQuickReply(label: string) {
    if (label === 'Gặp nhân viên tư vấn') {
      setShowHandoff(true);
      return;
    }

    if (label === 'Xem thêm sản phẩm') {
      window.location.href = buildProductListUrl(session);
      return;
    }

    void handleSend(label);
  }

  async function handleHandoff(event: React.FormEvent) {
    event.preventDefault();
    if (!credentials || handoffSending) return;

    if (!handoff.name.trim() || !handoff.phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    setHandoffSending(true);
    try {
      const response = await requestHumanHandoff(credentials, {
        name: handoff.name.trim(),
        phone: handoff.phone.trim(),
        email: handoff.email.trim() || undefined,
        note: handoff.note.trim() || undefined,
      });

      setSession(response.data.session);
      if (response.data.assistantMessage) {
        setMessages((current) => [...current, response.data.assistantMessage as ChatMessage]);
      }
      setShowHandoff(false);
      toast.success('Đã chuyển yêu cầu đến nhân viên Tiến Phát');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể chuyển yêu cầu');
    } finally {
      setHandoffSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[9.5rem] right-5 z-[60] flex items-center gap-2 rounded-full bg-dark-900 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-brand-700"
        aria-label="Mở trợ lý tư vấn sản phẩm"
      >
        <Bot size={20} className="text-brand-300" />
        <span className="hidden sm:inline">Trợ lý tư vấn</span>
      </button>
    );
  }

  return (
    <section className="fixed inset-x-3 bottom-3 z-[70] flex max-h-[82vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[650px] sm:w-[390px]">
      <header className="flex items-center gap-3 bg-dark-900 px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
          {humanMode ? <Headphones size={21} /> : <Bot size={21} />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-black">Tư vấn Tiến Phát</h2>
          <p className="text-xs text-gray-400">
            {session?.status === 'ADMIN_ACTIVE'
              ? 'Nhân viên đang trực tiếp hỗ trợ'
              : session?.status === 'WAITING_ADMIN'
                ? 'Đang chờ nhân viên tiếp nhận'
                : closed
                  ? 'Cuộc trò chuyện đã kết thúc'
                  : 'Trợ lý tư vấn theo dữ liệu sản phẩm'}
          </p>
        </div>
        <button type="button" onClick={resetChat} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" title="Cuộc trò chuyện mới">
          <RotateCcw size={17} />
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Đóng trợ lý">
          <X size={19} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4">
        {loading ? (
          <div className="flex h-full min-h-64 items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={19} className="animate-spin" /> Đang kết nối tư vấn...
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}

        {!loading && !humanMode && !closed && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-9">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                disabled={sending}
                onClick={() => handleQuickReply(reply)}
                className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {showHandoff && !humanMode && !closed && (
          <form onSubmit={handleHandoff} className="ml-9 space-y-3 rounded-xl border border-brand-100 bg-white p-3 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-900">Gặp nhân viên tư vấn</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-400">Thông tin và nội dung trò chuyện sẽ được gửi vào Admin và email của Tiến Phát.</p>
            </div>
            <input className="field-input py-2 text-sm" placeholder="Họ và tên *" value={handoff.name} onChange={(event) => setHandoff((current) => ({ ...current, name: event.target.value }))} />
            <input type="tel" className="field-input py-2 text-sm" placeholder="Số điện thoại *" value={handoff.phone} onChange={(event) => setHandoff((current) => ({ ...current, phone: event.target.value }))} />
            <input type="email" className="field-input py-2 text-sm" placeholder="Email (không bắt buộc)" value={handoff.email} onChange={(event) => setHandoff((current) => ({ ...current, email: event.target.value }))} />
            <textarea className="field-input resize-none py-2 text-sm" rows={2} placeholder="Ghi chú thêm..." value={handoff.note} onChange={(event) => setHandoff((current) => ({ ...current, note: event.target.value }))} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowHandoff(false)} className="btn-outline flex-1 justify-center py-2 text-xs">Hủy</button>
              <button type="submit" disabled={handoffSending} className="btn-primary flex-[1.4] justify-center py-2 text-xs disabled:opacity-60">
                {handoffSending ? <Loader2 size={15} className="animate-spin" /> : <PhoneCall size={15} />}
                Gửi yêu cầu
              </button>
            </div>
          </form>
        )}

        {humanMode && (
          <div className={`mx-2 rounded-xl border p-3 text-xs leading-5 ${session?.status === 'ADMIN_ACTIVE' ? 'border-blue-100 bg-blue-50 text-blue-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
            {session?.status === 'ADMIN_ACTIVE'
              ? 'Nhân viên Tiến Phát đang trực tiếp hỗ trợ. Anh/chị có thể tiếp tục trao đổi trong ô chat bên dưới.'
              : 'Yêu cầu đã được gửi đến Tiến Phát. Anh/chị vẫn có thể nhắn thêm thông tin trong khi chờ nhân viên tiếp nhận.'}
          </div>
        )}

        {closed && (
          <div className="mx-2 rounded-xl border border-gray-200 bg-white p-3 text-xs leading-5 text-gray-600">
            Cuộc trò chuyện đã kết thúc. Nhấn biểu tượng làm mới ở phía trên để bắt đầu yêu cầu mới.
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="border-t border-gray-100 bg-white p-3">
        <form
          onSubmit={(event) => { event.preventDefault(); void handleSend(); }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            disabled={loading || sending || closed}
            rows={1}
            maxLength={1000}
            placeholder={closed ? 'Cuộc trò chuyện đã kết thúc' : humanMode ? 'Nhắn trực tiếp cho nhân viên...' : 'Ví dụ: Tôi cần gạch 3060 lát sàn...'}
            className="min-h-11 max-h-24 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-400 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || sending || closed}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
        {!humanMode && !closed && (
          <button type="button" onClick={() => setShowHandoff(true)} className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-600">
            <UserRound size={14} /> Gặp nhân viên tư vấn
          </button>
        )}
      </footer>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.sender === 'SYSTEM') {
    return (
      <div className="flex justify-center px-8">
        <span className="rounded-full bg-gray-200 px-3 py-1 text-center text-[11px] text-gray-500">
          {message.content}
        </span>
      </div>
    );
  }

  const fromCustomer = message.sender === 'CUSTOMER';
  const fromAdmin = message.sender === 'ADMIN';
  const recommendations = message.metadata?.recommendations ?? [];

  return (
    <div className={`flex items-start gap-2 ${fromCustomer ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${fromCustomer ? 'bg-brand-100 text-brand-700' : fromAdmin ? 'bg-blue-600 text-white' : 'bg-dark-900 text-white'}`}>
        {fromCustomer ? <UserRound size={14} /> : fromAdmin ? <Headphones size={14} /> : <Bot size={14} />}
      </div>
      <div className={`flex min-w-0 max-w-[82%] flex-col gap-1.5 ${fromCustomer ? 'items-end' : 'items-start'}`}>
        {fromAdmin && <span className="px-1 text-[10px] font-semibold text-blue-600">Nhân viên Tiến Phát</span>}
        <div className={`whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-5 ${fromCustomer ? 'rounded-tr-md bg-brand-600 text-white' : fromAdmin ? 'rounded-tl-md border border-blue-100 bg-blue-50 text-gray-800' : 'rounded-tl-md border border-gray-100 bg-white text-gray-700 shadow-sm'}`}>
          {message.content}
        </div>
        {recommendations.length > 0 && (
          <div className="w-full space-y-2">
            {recommendations.map((product) => (
              <RecommendationCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ product }: { product: ChatProductRecommendation }) {
  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="flex overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-gray-100">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <Package size={24} className="text-gray-300" />
        )}
      </div>
      <div className="min-w-0 flex-1 p-2.5">
        <p className="line-clamp-2 text-xs font-bold leading-4 text-gray-900">{product.name}</p>
        <p className="mt-1 truncate text-[11px] text-gray-400">
          {[product.size?.replace('x', ' x '), product.brand].filter(Boolean).join(' · ')}
        </p>
        {product.reasons[0] && <p className="mt-1 line-clamp-1 text-[10px] font-medium text-brand-600">{product.reasons[0]}</p>}
      </div>
      <ExternalLink size={14} className="mr-2 mt-3 shrink-0 text-gray-300" />
    </Link>
  );
}

function buildProductListUrl(session: ChatSession | null) {
  const params = new URLSearchParams();
  if (session?.detectedCategory) params.set('category', session.detectedCategory);
  if (session?.detectedSize) params.set('size', session.detectedSize);
  const query = params.toString();
  return `/san-pham${query ? `?${query}` : ''}`;
}
