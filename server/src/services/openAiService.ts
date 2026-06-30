const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_TIMEOUT_MS = 35_000;

type JsonSchema = Record<string, unknown>;

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

export class OpenAIProviderError extends Error {
  statusCode?: number;
  requestId?: string | null;

  constructor(message: string, statusCode?: number, requestId?: string | null) {
    super(message);
    this.name = 'OpenAIProviderError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function extractOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.refusal) {
        throw new OpenAIProviderError(`OpenAI từ chối yêu cầu: ${content.refusal}`);
      }
      if (content.type === 'output_text' && content.text?.trim()) {
        return content.text.trim();
      }
    }
  }

  throw new OpenAIProviderError('OpenAI không trả về nội dung hợp lệ');
}

export async function requestStructuredJson<T>(params: {
  schemaName: string;
  schema: JsonSchema;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
}): Promise<{ data: T; model: string; requestId: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new OpenAIProviderError('Chưa cấu hình OPENAI_API_KEY');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const model = getOpenAIModel();

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: params.maxOutputTokens || 1200,
        input: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: params.schemaName,
            strict: true,
            schema: params.schema,
          },
        },
      }),
    });

    const requestId = response.headers.get('x-request-id');
    const payload = await response.json().catch(() => ({})) as OpenAIResponsePayload;

    if (!response.ok) {
      throw new OpenAIProviderError(
        payload.error?.message || `OpenAI API trả về lỗi ${response.status}`,
        response.status,
        requestId
      );
    }

    const outputText = extractOutputText(payload);
    try {
      return {
        data: JSON.parse(outputText) as T,
        model,
        requestId,
      };
    } catch {
      throw new OpenAIProviderError('Không thể đọc dữ liệu JSON từ OpenAI', response.status, requestId);
    }
  } catch (error) {
    if (error instanceof OpenAIProviderError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpenAIProviderError('OpenAI phản hồi quá lâu');
    }
    throw new OpenAIProviderError(error instanceof Error ? error.message : 'Không thể kết nối OpenAI');
  } finally {
    clearTimeout(timeout);
  }
}
