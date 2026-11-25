import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://resume_builder:resume_builder_dev@localhost:5432/resume_builder?schema=public',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Encryption for API keys
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here!!',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // LLM Provider defaults (can be overridden per-request)
  defaultLlmProvider: process.env.DEFAULT_LLM_PROVIDER || 'groq',
  defaultLlmModel: process.env.DEFAULT_LLM_MODEL || 'llama-3.1-8b-instant',

  // System API keys (for "System Prompt" option - no user key needed)
  systemOpenAiKey: process.env.SYSTEM_OPENAI_KEY,
  systemAnthropicKey: process.env.SYSTEM_ANTHROPIC_KEY,
  systemGeminiKey: process.env.SYSTEM_GEMINI_KEY,
  systemGroqKey: process.env.SYSTEM_GROQ_KEY,
  systemCerebrasKey: process.env.SYSTEM_CEREBRAS_KEY,
  systemTogetherKey: process.env.SYSTEM_TOGETHER_KEY,
  systemOpenRouterKey: process.env.SYSTEM_OPENROUTER_KEY,
  systemNvidiaKey: process.env.SYSTEM_NVIDIA_KEY,
  systemGrokKey: process.env.SYSTEM_GROK_KEY,
} as const;

export type Env = typeof env;