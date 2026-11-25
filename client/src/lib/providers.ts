export const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', free: false },
  { value: 'anthropic', label: 'Anthropic (Claude)', free: false },
  { value: 'gemini', label: 'Google Gemini', free: true },
  { value: 'grok', label: 'xAI Grok', free: false },
  { value: 'nvidia', label: 'NVIDIA', free: true },
  { value: 'openrouter', label: 'OpenRouter', free: true },
  { value: 'together', label: 'Together AI', free: true },
  { value: 'groq', label: 'Groq (Ultra-Fast)', free: true },
  { value: 'cerebras', label: 'Cerebras (Fastest)', free: true },
  { value: 'custom', label: 'Custom Endpoint', free: true },
];

export const MODEL_OPTIONS: Record<string, { value: string; label: string; free: boolean }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', free: false },
    { value: 'gpt-4o', label: 'GPT-4o', free: false },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', free: false },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', free: false },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', free: false },
  ],
  gemini: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Free)', free: true },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Free)', free: true },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Free tier)', free: true },
  ],
  grok: [
    { value: 'grok-2-1212', label: 'Grok 2', free: false },
    { value: 'grok-2-mini', label: 'Grok 2 Mini', free: false },
  ],
  nvidia: [
    { value: 'nvidia/nemotron-3-ultra', label: 'Nemotron 3 Ultra (Free)', free: true },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B (Free)', free: true },
  ],
  openrouter: [
    { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)', free: true },
    { value: 'meta-llama/llama-3.1-70b-instruct:free', label: 'Llama 3.1 70B (Free)', free: true },
    { value: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 2.5 72B (Free)', free: true },
    { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)', free: true },
    { value: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (Free)', free: true },
    { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (Free)', free: true },
  ],
  together: [
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Turbo (Free)', free: true },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Turbo (Free)', free: true },
    { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Turbo (Free)', free: true },
  ],
  groq: [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Free)', free: true },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile (Free)', free: true },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Free)', free: true },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B (Free)', free: true },
  ],
  cerebras: [
    { value: 'llama3.1-8b', label: 'Llama 3.1 8B (Free)', free: true },
    { value: 'llama3.1-70b', label: 'Llama 3.1 70B (Free)', free: true },
  ],
  custom: [
    { value: 'custom', label: 'Custom Model', free: true }
  ]
};