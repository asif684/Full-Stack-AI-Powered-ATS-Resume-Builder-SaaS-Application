import { z } from 'zod';

export const EducationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, 'Institution required'),
  degree: z.string().min(1, 'Degree required'),
  field: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}$/)).optional().nullable(),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

export const ExperienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company required'),
  role: z.string().min(1, 'Role required'),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}$/)).optional().nullable(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  location: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name required'),
  description: z.string().min(1, 'Description required'),
  technologies: z.array(z.string()).default([]),
  link: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  pipeline: z.string().optional(),
});

export const CertificateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Certificate name required'),
  issuer: z.string().min(1, 'Issuer required'),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}$/)),
  link: z.string().url().optional().or(z.literal('')),
});

export const SkillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Skill name required'),
  category: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
});

export const ProfileSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  summary: z.string().optional(),
  education: z.array(EducationSchema).default([]),
  experience: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certificates: z.array(CertificateSchema).default([]),
  skills: z.array(SkillSchema).default([]),
});

export const ApiKeySchema = z.object({
  provider: z.enum([
    'openai', 'anthropic', 'gemini', 'grok', 'nvidia',
    'openrouter', 'together', 'groq', 'cerebras', 'custom'
  ]),
  apiKey: z.string().min(1, 'API key required'),
  model: z.string().optional(),
  isDefault: z.boolean().default(false),
  baseUrl: z.string().optional(),
});