import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateHandler, validateParamsHandler } from '../middleware/validation';
import { LLM_PROVIDERS } from '../config/llmProviders';
import { llmService } from '../services/llmService';
import { ExtractKeywordsSchema, SuggestProjectsSchema, GenerateResumeSchema, RegenerateSectionSchema } from '../validators/resume.schema';
import { extractKeywords, suggestProjects, generateResume, regenerateSection, getResumeHistory, getResumeById, deleteResume, updateKeywords } from '../controllers/resumeController';

const router = Router();

// ===== PUBLIC ROUTES (no auth required) =====
router.get('/providers', (req, res) => {
  const providers = LLM_PROVIDERS.map(p => ({
    name: p.name,
    displayName: p.displayName,
    requiresApiKey: p.requiresApiKey,
    freeTier: p.freeTier,
    avgLatencyMs: p.avgLatencyMs,
    defaultModel: p.defaultModel,
    models: p.models
  }));
  return res.json({ success: true, providers });
});

router.post('/validate-key', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider) {
    return res.status(400).json({ success: false, error: 'Provider required' });
  }
  const isValid = await llmService.validateApiKey(provider, apiKey);
  return res.json({ success: true, valid: isValid });
});

// ===== PROTECTED ROUTES (auth required) =====
router.use(authenticateToken);

// Resume generation flow
router.post('/keywords/extract', validateHandler(ExtractKeywordsSchema), extractKeywords);
router.post('/projects/suggest', validateHandler(SuggestProjectsSchema), suggestProjects);
router.post('/generate', validateHandler(GenerateResumeSchema), generateResume);
router.post('/regenerate-section', validateHandler(RegenerateSectionSchema), regenerateSection);

// Resume history
router.get('/history', getResumeHistory);
router.get('/:id', validateParamsHandler(z.object({ id: z.string() })), getResumeById);
router.delete('/:id', validateParamsHandler(z.object({ id: z.string() })), deleteResume);
router.patch('/:id/keywords', validateParamsHandler(z.object({ id: z.string() })), updateKeywords);

export default router;