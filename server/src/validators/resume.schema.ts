import { z } from 'zod';

export const KeywordDataSchema = z.object({
  keyword: z.string(),
  category: z.string(),
  priority: z.enum(['CRITICAL', 'IMPORTANT', 'OPTIONAL']),
  frequency: z.number().int().nonnegative(),
  exactPhrasing: z.string(),
  preferredForm: z.string(),
  placement: z.string(),
});

export const LlmConfigSchema = z.object({
  provider: z.string().min(1, 'Provider required'),
  model: z.string().min(1, 'Model required'),
  promptType: z.enum(['system', 'custom']),
  apiKeySource: z.enum(['step1', 'new', 'system']).default('step1'),
  apiKey: z.string().optional(),
  customPrompt: z.string().optional(),
  baseUrl: z.string().optional(), // For custom provider
});

export const ExtractKeywordsSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  llmConfig: LlmConfigSchema,
});

export const SuggestProjectsSchema = z.object({
  jobDescription: z.string().min(50, 'Job description required'),
  keywords: z.array(KeywordDataSchema),
  projectCount: z.number().int().positive().max(20),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
  })),
});

const ProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  summary: z.string().optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean(),
    description: z.string().optional(),
    technologies: z.array(z.string()),
    location: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    link: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    pipeline: z.string().optional(),
  })).optional(),
  certificates: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    link: z.string().url().optional().or(z.literal('')),
  })).optional(),
  skills: z.array(z.object({
    name: z.string(),
    category: z.string().optional(),
    level: z.number().int().min(1).max(5).optional(),
  })).optional(),
}).optional();

export const GenerateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description required'),
  keywords: z.array(KeywordDataSchema),
  profile: ProfileSchema,
  selectedProjects: z.array(z.string()),
  llmConfig: LlmConfigSchema,
});

export const RegenerateSectionSchema = z.object({
  sectionName: z.enum(['header', 'summary', 'skills', 'experience', 'projects', 'certificates', 'education']),
  context: z.object({
    jobDescription: z.string(),
    keywords: z.array(KeywordDataSchema),
    profile: ProfileSchema,
    selectedProjects: z.array(z.string()),
  }),
  currentContent: z.string(),
  llmConfig: LlmConfigSchema,
});