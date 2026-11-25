export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  isFree: boolean;
  latencyTier: 'ultra-fast' | 'fast' | 'standard';
}

export interface LLMProvider {
  name: string;
  displayName: string;
  baseUrl: string;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  avgLatencyMs: number;
  freeTier: boolean;
  models: ModelInfo[];
  defaultModel: string;
  formatRequest: (params: {
    messages: Array<{ role: string; content: string }>;
    model: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    apiKey?: string;
    baseUrl?: string;
  }) => RequestInit;
  parseResponse: (data: any) => string;
  parseStreamChunk: (chunk: string) => string | null;
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 1500,
    freeTier: false,
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxOutputTokens: 16384, isFree: false, latencyTier: 'fast' },
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutputTokens: 16384, isFree: false, latencyTier: 'standard' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, maxOutputTokens: 4096, isFree: false, latencyTier: 'fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 2000,
    freeTier: false,
    defaultModel: 'claude-3-5-haiku-20241022',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxOutputTokens: 8192, isFree: false, latencyTier: 'standard' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, maxOutputTokens: 8192, isFree: false, latencyTier: 'fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => {
      // Convert OpenAI format to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemMessage?.content || '',
          messages: conversationMessages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      };
    },
    parseResponse: (data) => data.content?.[0]?.text || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        try {
          const parsed = JSON.parse(json);
          if (parsed.type === 'content_block_delta') {
            return parsed.delta?.text || '';
          }
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'gemini',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 1200,
    freeTier: true,
    defaultModel: 'gemini-1.5-flash',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Free)', contextWindow: 1000000, maxOutputTokens: 8192, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Free)', contextWindow: 1000000, maxOutputTokens: 8192, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Free tier)', contextWindow: 2000000, maxOutputTokens: 8192, isFree: true, latencyTier: 'fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey, baseUrl }) => {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const url = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      };
    },
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    parseStreamChunk: (chunk) => {
      try {
        const parsed = JSON.parse(chunk);
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch {
        return '';
      }
    },
  },
  {
    name: 'grok',
    displayName: 'xAI Grok',
    baseUrl: 'https://api.x.ai/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 2500,
    freeTier: false,
    defaultModel: 'grok-2-mini',
    models: [
      { id: 'grok-2-1212', name: 'Grok 2', contextWindow: 128000, maxOutputTokens: 8192, isFree: false, latencyTier: 'standard' },
      { id: 'grok-2-mini', name: 'Grok 2 Mini', contextWindow: 128000, maxOutputTokens: 8192, isFree: false, latencyTier: 'fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'nvidia',
    displayName: 'NVIDIA',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 1000,
    freeTier: true,
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    models: [
      { id: 'nvidia/nemotron-3-ultra', name: 'Nemotron 3 Ultra', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'fast' },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 800,
    freeTier: true,
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    models: [
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'fast' },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'fast' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', contextWindow: 32768, maxOutputTokens: 4096, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', contextWindow: 8192, maxOutputTokens: 4096, isFree: true, latencyTier: 'ultra-fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://resume-builder.app',
        'X-Title': 'Resume Builder',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'together',
    displayName: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 600,
    freeTier: true,
    defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B Turbo (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B Turbo (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'fast' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo (Free)', contextWindow: 128000, maxOutputTokens: 4096, isFree: true, latencyTier: 'fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'groq',
    displayName: 'Groq (Ultra-Fast)',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 300,
    freeTier: true,
    defaultModel: 'llama-3.1-8b-instant',
    models: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Free)', contextWindow: 128000, maxOutputTokens: 8192, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile (Free)', contextWindow: 128000, maxOutputTokens: 8192, isFree: true, latencyTier: 'fast' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B (Free)', contextWindow: 8192, maxOutputTokens: 8192, isFree: true, latencyTier: 'ultra-fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'cerebras',
    displayName: 'Cerebras (Fastest)',
    baseUrl: 'https://api.cerebras.ai/v1',
    requiresApiKey: true,
    supportsStreaming: true,
    avgLatencyMs: 200,
    freeTier: true,
    defaultModel: 'llama3.1-8b',
    models: [
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B (Free)', contextWindow: 8192, maxOutputTokens: 8192, isFree: true, latencyTier: 'ultra-fast' },
      { id: 'llama3.1-70b', name: 'Llama 3.1 70B (Free)', contextWindow: 8192, maxOutputTokens: 8192, isFree: true, latencyTier: 'ultra-fast' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey }) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
  {
    name: 'custom',
    displayName: 'Custom OpenAI-Compatible Endpoint',
    baseUrl: '',
    requiresApiKey: false,
    supportsStreaming: true,
    avgLatencyMs: 1000,
    freeTier: true,
    defaultModel: 'custom',
    models: [
      { id: 'custom', name: 'Custom Model', contextWindow: 128000, maxOutputTokens: 8192, isFree: true, latencyTier: 'standard' },
    ],
    formatRequest: ({ messages, model, temperature = 0.3, maxTokens = 4096, stream = false, apiKey, baseUrl }) => {
      const url = baseUrl || 'http://localhost:4000/v1';
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: model === 'custom' ? '' : model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
      };
    },
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseStreamChunk: (chunk) => {
      if (chunk.startsWith('data: ')) {
        const json = chunk.slice(6).trim();
        if (json === '[DONE]') return null;
        try {
          const parsed = JSON.parse(json);
          return parsed.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      }
      return '';
    },
  },
];

export function getProvider(name: string): LLMProvider | undefined {
  return LLM_PROVIDERS.find(p => p.name === name);
}

export function getFreeProviders(): LLMProvider[] {
  return LLM_PROVIDERS.filter(p => p.freeTier);
}

export function getUltraFastProviders(): LLMProvider[] {
  return LLM_PROVIDERS.filter(p => p.models.some(m => m.latencyTier === 'ultra-fast'));
}