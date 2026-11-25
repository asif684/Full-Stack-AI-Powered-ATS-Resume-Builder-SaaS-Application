import { LLMProvider, LLM_PROVIDERS, getProvider } from '../config/llmProviders';
import { buildKeywordExtractionPrompt, buildResumeGenerationPrompt, parseKeywordTable, parseResumeSections, KeywordData, ResumeContext } from '../config/prompts';
import { decrypt } from '../utils/crypto';
import { prisma } from '../utils/prisma';

export interface LlmCallOptions {
  provider: string;
  model: string;
  apiKey?: string;
  systemApiKey?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export interface KeywordExtractionResult {
  keywords: KeywordData[];
  rawResponse: string;
}

export interface ResumeGenerationResult {
  content: string;
  sections: Record<string, string>;
}

class LlmService {
  private providerCache: Map<string, LLMProvider> = new Map();

  getProvider(name: string): LLMProvider | undefined {
    if (this.providerCache.has(name)) {
      return this.providerCache.get(name);
    }
    const provider = getProvider(name);
    if (provider) {
      this.providerCache.set(name, provider);
    }
    return provider;
  }

  getAllProviders(): LLMProvider[] {
    return LLM_PROVIDERS;
  }

  async validateApiKey(providerName: string, apiKey: string): Promise<boolean> {
    const provider = this.getProvider(providerName);
    if (!provider) return false;
    if (!provider.requiresApiKey) return true;

    try {
      const request = provider.formatRequest({
        messages: [{ role: 'user', content: 'Hi' }],
        model: provider.defaultModel,
        maxTokens: 10,
        apiKey,
      });
      const response = await fetch(`${provider.baseUrl}/chat/completions`, request);
      return response.ok;
    } catch {
      return false;
    }
  }

  async callLlm(prompt: string, options: LlmCallOptions): Promise<string> {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }

    let apiKey = options.apiKey;
    if (!apiKey && options.systemApiKey) {
      apiKey = options.systemApiKey;
    }

    // If no valid API key, throw early
    if (provider.requiresApiKey) {
      if (!apiKey || apiKey === 'gsk_test_key_placeholder' || apiKey.trim() === '') {
        throw new Error(`Valid API key required for provider ${provider.displayName}`);
      }
    }

    const messages = [
      { role: 'system', content: 'You are an expert resume builder and ATS optimization specialist.' },
      { role: 'user', content: prompt },
    ];

    const request = provider.formatRequest({
      messages,
      model: options.model,
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 4096,
      stream: options.stream ?? false,
      apiKey,
      baseUrl: options.provider === 'custom' ? undefined : provider.baseUrl,
    });

    const endpoint = `${provider.baseUrl}/chat/completions`;

    if (options.stream && options.onChunk && provider.supportsStreaming) {
      return this.streamRequest(endpoint, request, provider, options.onChunk);
    }

    try {
      return await this.nonStreamRequest(endpoint, request, provider);
    } catch (error) {
      console.error(`LLM call failed for provider ${provider.name}:`, error);
      // Return fallback response instead of throwing - this ensures server doesn't crash
      return `Error: LLM API call failed (${error instanceof Error ? error.message : 'Unknown error'}). Using fallback template.`;
    }
  }

  // Test method for debugging
  async testProvider(providerName: string): Promise<{ success: boolean; error?: string }> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    const testPrompt = 'Say "test successful"';
    try {
      const result = await this.callLlm(testPrompt, {
        provider: providerName,
        model: provider.defaultModel,
        temperature: 0.1,
        maxTokens: 10,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async nonStreamRequest(endpoint: string, request: RequestInit, provider: LLMProvider): Promise<string> {
    const response = await fetch(endpoint, request);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    return provider.parseResponse(data);
  }

  private async streamRequest(
    endpoint: string,
    request: RequestInit,
    provider: LLMProvider,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const response = await fetch(endpoint, request);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const chunk = provider.parseStreamChunk(line);
          if (chunk !== null && chunk !== undefined) {
            if (chunk) {
              fullContent += chunk;
              onChunk(chunk);
            }
          }
        }
      }

      if (buffer) {
        const chunk = provider.parseStreamChunk(buffer);
        if (chunk) {
          fullContent += chunk;
          onChunk(chunk);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  async extractKeywords(
    jobDescription: string,
    options: LlmCallOptions & { customPrompt?: string }
  ): Promise<KeywordExtractionResult> {
    try {
      const prompt = buildKeywordExtractionPrompt(jobDescription, options.customPrompt);
      const response = await this.callLlm(prompt, options);
      const keywords = parseKeywordTable(response);
      return { keywords, rawResponse: response };
    } catch (error) {
      // Fallback: basic keyword extraction when LLM fails
      console.warn('LLM keyword extraction failed, using fallback:', error);
      return this.fallbackKeywordExtraction(jobDescription);
    }
  }

  private fallbackKeywordExtraction(jobDescription: string): KeywordExtractionResult {
    // Basic keyword extraction without LLM
    const commonKeywords = [
      'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'GCP', 'CI/CD',
      'Microservices', 'Problem Solving', 'Software Engineer', 'JavaScript',
      'HTML', 'CSS', 'REST API', 'GraphQL', 'Docker', 'Kubernetes',
      'Git', 'Agile', 'Testing', 'Debugging', 'Performance Optimization'
    ];

    const priorityLevels: ('CRITICAL' | 'IMPORTANT' | 'OPTIONAL')[] = [
      'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL',
      'IMPORTANT', 'IMPORTANT', 'IMPORTANT', 'IMPORTANT', 'IMPORTANT',
      'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL', 'OPTIONAL'
    ];

    const keywords: KeywordData[] = commonKeywords
      .filter(kw => jobDescription.toLowerCase().includes(kw.toLowerCase()))
      .map((keyword, index) => ({
        keyword,
        category: 'Hard skills/tools/tech',
        priority: priorityLevels[index] || 'OPTIONAL',
        frequency: (jobDescription.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length,
        exactPhrasing: keyword,
        preferredForm: keyword,
        placement: 'skills'
      }));

    const rawResponse = `| Keyword | Category | Priority | Freq | Exact Phrasing | Preferred Form | Placement |
${keywords.map(k => `| ${k.keyword} | ${k.category} | ${k.priority} | ${k.frequency} | ${k.exactPhrasing} | ${k.preferredForm} | ${k.placement} |`).join('\n')}

Total ${keywords.length} | Critical ${keywords.filter(k => k.priority === 'CRITICAL').length} | Important ${keywords.filter(k => k.priority === 'IMPORTANT').length} | Optional ${keywords.filter(k => k.priority === 'OPTIONAL').length} | Recommend include ${keywords.length} | Skills cap 20-25`;

    return { keywords, rawResponse };
  }

  async generateResume(
    context: ResumeContext,
    options: LlmCallOptions & { customPrompt?: string }
  ): Promise<ResumeGenerationResult> {
    try {
      const prompt = buildResumeGenerationPrompt(context, options.customPrompt);
      const response = await this.callLlm(prompt, options);
      const sections = parseResumeSections(response);
      return { content: response, sections };
    } catch (error) {
      console.warn('LLM resume generation failed, using fallback:', error);
      return this.fallbackResumeGeneration(context);
    }
  }

  private fallbackResumeGeneration(context: ResumeContext): ResumeGenerationResult {
    const { profile, selectedProjects, keywords, jobDescription } = context;
    const criticalKeywords = keywords.filter((k) => k.priority === 'CRITICAL').map((k) => k.preferredForm);
    const importantKeywords = keywords.filter((k) => k.priority === 'IMPORTANT').map((k) => k.preferredForm);

    let resume = '';

    // Header
    resume += `${profile.name}\n`;
    resume += `Senior Software Engineer\n`;
    resume += `${profile.phone || ''}, ${profile.location || ''}, ${profile.email}\n`;
    resume += `${profile.linkedin || ''}, ${profile.github || ''}\n\n`;

    // Summary
    resume += `SUMMARY\n`;
    resume += `${profile.summary || `Experienced Software Engineer with expertise in ${criticalKeywords.slice(0, 3).join(', ')} and ${importantKeywords.slice(0, 2).join(', ')}.`}\n\n`;

    // Skills
    resume += `SKILLS\n`;
    const allKeywords = [...criticalKeywords, ...importantKeywords];
    resume += `${allKeywords.join(', ')}\n\n`;

    // Experience
    resume += `EXPERIENCE\n`;
    if (profile.experience && profile.experience.length > 0) {
      profile.experience.forEach((exp: any) => {
        resume += `${exp.company}\n`;
        resume += `${exp.role}\n`;
        resume += `- Developed and maintained applications using ${exp.technologies?.join(', ') || 'modern technologies'}\n`;
        resume += `- Collaborated with cross-functional teams to deliver high-quality software solutions\n\n`;
      });
    } else {
      resume += `No experience data available\n\n`;
    }

    // Projects
    resume += `PROJECTS\n`;
    const selectedProjectObjs = profile.projects.filter((p: any) => selectedProjects.includes(p.id));
    if (selectedProjectObjs.length > 0) {
      selectedProjectObjs.forEach((proj: any) => {
        resume += `${proj.name}\n`;
        resume += `Technologies: ${proj.technologies?.join(', ') || 'N/A'}\n`;
        if (proj.pipeline) resume += `Pipeline: ${proj.pipeline}\n`;
        if (proj.github) resume += `GitHub: ${proj.github}\n`;
        resume += `- Built ${proj.name} with ${proj.technologies?.join(', ') || 'modern stack'}\n`;
        resume += `- Implemented key features and optimized performance\n\n`;
      });
    } else {
      resume += `No selected projects\n\n`;
    }

    // Certificates
    resume += `CERTIFICATES\n`;
    if (profile.certificates && profile.certificates.length > 0) {
      profile.certificates.forEach((cert: any) => {
        resume += `${cert.name} (${cert.issuer}), ${cert.date}\n`;
      });
      resume += '\n';
    } else {
      resume += 'No certificates listed\n\n';
    }

    // Education
    resume += `EDUCATION\n`;
    if (profile.education && profile.education.length > 0) {
      profile.education.forEach((edu: any) => {
        resume += `${edu.institution}\n`;
        resume += `${edu.degree}${edu.field ? ` (${edu.field})` : ''}\n`;
        resume += `${edu.startDate} - ${edu.endDate || 'Present'}\n\n`;
      });
    } else {
      resume += 'No education data available\n\n';
    }

    return { content: resume, sections: {} };
  }

  async getUserApiKey(userId: string, provider: string): Promise<string | null> {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (!apiKeyRecord) return null;
    return decrypt(apiKeyRecord.encryptedKey);
  }

  getSystemApiKey(provider: string): string | undefined {
    const env = require('../config/env').env;
    const keyMap: Record<string, string> = {
      openai: 'systemOpenAiKey',
      anthropic: 'systemAnthropicKey',
      gemini: 'systemGeminiKey',
      groq: 'systemGroqKey',
      cerebras: 'systemCerebrasKey',
      together: 'systemTogetherKey',
      openrouter: 'systemOpenRouterKey',
      nvidia: 'systemNvidiaKey',
      grok: 'systemGrokKey',
    };
    return env[keyMap[provider]];
  }
}

export const llmService = new LlmService();