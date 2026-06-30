import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  Check,
  ExternalLink,
  Gauge,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  analyzeChat,
  draftChatReply,
  getStoredChatAnalysis,
} from '@/services/adminAiService';
import type { AdminAiAnalysis, AdminAiRequirements } from '@/types/adminAi';

const LEAD_META = {
  HIGH: { label: 'Tiềm năng cao', className: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  MEDIUM: { label: 'Tiềm năng trung bình', className: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  LOW: { label: 'Tiềm năng thấp', className: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400' },
} as const;

const CHANNEL_LABELS: Record<string, string> = {
  ZALO: 'Zalo',
  PHONE: 'Điện thoại',
  EMAIL: 'Email',
  UNKNOWN: 'Chưa xác định',
};

interface AdminAiPanelProps {
  sessionId: string;
  lastMessageAt: string;
  onUseDraft: (draft: string) => void;
}

export function AdminAiPanel({ sessionId, lastMessageAt, onUseDraft }: AdminAiPanelProps) {
  const [analysis, setAnalysis] = useState<AdminAiAnalysis | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [tone, setTone] = useState<'FRIENDLY' | 'CONCISE' | 'PROFESSIONAL'>('FRIENDLY');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAnalysis(null);
    setSelectedProductIds([]);

    getStoredChatAnalysis(sessionId)
      .then((response) => {
        if (!active) return;
        setAiConfigured(response.data.aiConfigured);
        setAnalysis(response.data.analysis);
        setSelectedProductIds(
          response.data.analysis?.suggestedProducts.slice(0, 3).map((product) => product.id) ?? []
        );
      })
      .catch(() => {
        if (active) setAnalysis(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [sessionId, lastMessageAt]);

  const leadMeta = analysis ? LEAD_META[analysis.leadLevel] : LEAD_META.LOW;
  const requirementRows = useMemo(
    () => analysis ? buildRequirementRows(analysis.requirements) : [],
    [analysis]
  );

  async function runAnalysis(force = false) {
    if (analyzing) return;
    setAnalyzing(true);

    try {
      const response = await analyzeChat(sessionId, force);
      setAnalysis(response.data);
      setAiConfigured(response.data.aiConfigured);
      setSelectedProductIds(response.data.suggestedProducts.slice(0, 3).map((product) => product.id));
      if (response.data.warning) toast(response.data.warning);
      else toast.success(force ? 'Đã phân tích lại hội thoại' : 'Đã phân tích nhu cầu khách hàng');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể phân tích hội thoại');
    } finally {
      setAnalyzing(false);
    }
  }

  async function createDraft() {
    if (drafting) return;
    setDrafting(true);

    try {
      const response = await draftChatReply(sessionId, {
        tone,
        selectedProductIds,
      });
      onUseDraft(response.data.draft);
      setAiConfigured(response.data.aiConfigured);
      if (response.data.warning) toast(response.data.warning);
      else toast.success('Bản nháp đã được đưa vào ô phản hồi');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể soạn phản hồi');
    } finally {
      setDrafting(false);
    }
  }

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : current.length >= 6
          ? current
          : [...current, productId]
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/80 to-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-violet-100 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-gray-900">AI hỗ trợ Admin</h3>
          <p className="text-[11px] text-gray-500">
            {aiConfigured ? 'OpenAI + dữ liệu sản phẩm thật' : 'Bộ phân tích dự phòng đang hoạt động'}
          </p>
        </div>
        {analysis && (
          <button
            type="button"
            disabled={analyzing}
            onClick={() => runAnalysis(true)}
            className="rounded-lg p-2 text-violet-600 hover:bg-violet-100 disabled:opacity-50"
            title="Phân tích lại"
          >
            <RefreshCw size={16} className={analyzing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {loading ? (
          <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin" /> Đang tải dữ liệu AI...
          </div>
        ) : !analysis ? (
          <div className="py-3 text-center">
            <Bot size={34} className="mx-auto text-violet-300" />
            <p className="mt-3 text-sm font-bold text-gray-800">Chưa phân tích hội thoại này</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-500">
              Hệ thống sẽ tóm tắt nhu cầu, trích xuất thông tin, chấm điểm khách hàng và tìm sản phẩm phù hợp.
            </p>
            {!aiConfigured && (
              <div className="mx-auto mt-3 flex max-w-xs items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-left text-[11px] leading-4 text-amber-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                Chưa có khóa OpenAI trên Render. Bạn vẫn có thể dùng bộ phân tích quy tắc dự phòng.
              </div>
            )}
            <button
              type="button"
              disabled={analyzing}
              onClick={() => runAnalysis(false)}
              className="btn-primary mx-auto mt-4 justify-center text-xs"
            >
              {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Phân tích ngay
            </button>
          </div>
        ) : (
          <>
            {analysis.stale && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-[11px] leading-4 text-amber-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                Khách vừa gửi thêm tin nhắn. Hãy phân tích lại để cập nhật kết quả.
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">Tóm tắt</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-violet-600 shadow-sm">
                  {analysis.provider === 'openai' ? analysis.model || 'OpenAI' : 'Phân tích quy tắc'}
                </span>
              </div>
              <p className="rounded-xl border border-violet-100 bg-white p-3 text-xs leading-5 text-gray-700">
                {analysis.summary}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                  <Gauge size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', leadMeta.className)}>
                      {leadMeta.label}
                    </span>
                    <strong className="text-lg text-gray-900">{analysis.leadScore}/100</strong>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={clsx('h-full rounded-full transition-all', leadMeta.bar)} style={{ width: `${analysis.leadScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-500">Nhu cầu trích xuất</p>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3">
                {requirementRows.length ? requirementRows.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 py-2 text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="max-w-[58%] text-right font-semibold capitalize text-gray-700">{value}</span>
                  </div>
                )) : (
                  <p className="py-3 text-xs text-gray-400">Chưa trích xuất được thông tin cụ thể.</p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">Sản phẩm gợi ý</p>
                <span className="text-[10px] text-gray-400">Chọn để AI đưa vào bản nháp</span>
              </div>
              {analysis.suggestedProducts.length ? (
                <div className="space-y-2">
                  {analysis.suggestedProducts.map((product) => {
                    const selected = selectedProductIds.includes(product.id);
                    return (
                      <div key={product.id} className={clsx('flex gap-2 rounded-xl border bg-white p-2 transition', selected ? 'border-violet-300 ring-1 ring-violet-100' : 'border-gray-100')}>
                        <button
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border', selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-300 text-transparent')}
                          aria-label={selected ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm'}
                        >
                          <Check size={13} />
                        </button>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                          ) : <Package size={18} className="text-gray-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold leading-4 text-gray-800">{product.name}</p>
                          <p className="mt-1 truncate text-[10px] text-gray-400">
                            {[product.size?.replace('x', ' x '), product.brand].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <Link to={`/san-pham/${product.slug}`} target="_blank" className="p-1 text-gray-300 hover:text-violet-600" title="Mở sản phẩm">
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-3 text-center text-xs text-gray-400">
                  Chưa có sản phẩm đủ phù hợp trong database.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-violet-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <WandSparkles size={16} className="text-violet-600" />
                <p className="text-xs font-black text-gray-800">Soạn phản hồi cho Admin</p>
              </div>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value as typeof tone)}
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-violet-400"
              >
                <option value="FRIENDLY">Thân thiện</option>
                <option value="CONCISE">Ngắn gọn</option>
                <option value="PROFESSIONAL">Chuyên nghiệp</option>
              </select>
              <button
                type="button"
                disabled={drafting}
                onClick={createDraft}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {drafting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                AI soạn phản hồi
              </button>
              <p className="mt-2 text-[10px] leading-4 text-gray-400">
                Bản nháp chỉ được đưa vào ô nhập. Admin phải kiểm tra và tự nhấn gửi.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function buildRequirementRows(requirements: AdminAiRequirements): Array<[string, string]> {
  const rows: Array<[string, string | null]> = [
    ['Kích thước', requirements.size ? requirements.size.replace('x', ' x ') : null],
    ['Nhu cầu', requirements.application],
    ['Không gian', requirements.space?.replaceAll('-', ' ') || null],
    ['Thương hiệu', requirements.brand],
    ['Màu sắc', requirements.color],
    ['Diện tích', requirements.areaM2 ? `${requirements.areaM2} m²` : null],
    ['Khu vực', requirements.location],
    ['Ngân sách', requirements.budget],
    ['Thời gian mua', requirements.purchaseTimeline],
    ['Kênh liên hệ', CHANNEL_LABELS[requirements.contactChannel]],
    ['Yêu cầu báo giá', requirements.wantsQuote ? 'Có' : null],
  ];

  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}
