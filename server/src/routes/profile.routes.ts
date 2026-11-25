import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateHandler, validateParamsHandler } from '../middleware/validation';
import {
  ProfileSchema,
  EducationSchema,
  ExperienceSchema,
  ProjectSchema,
  CertificateSchema,
  SkillSchema,
  ApiKeySchema,
} from '../validators/profile.schema';
import {
  getProfile,
  updateProfile,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addProject,
  updateProject,
  deleteProject,
  reorderProjects,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  addSkill,
  updateSkill,
  deleteSkill,
  saveApiKey,
  getApiKeys,
  deleteApiKey,
} from '../controllers/profileController';

const router = Router();

router.use(authenticateToken);

router.get('/', getProfile);
router.put('/', validateHandler(ProfileSchema), updateProfile);

router.post('/education', validateHandler(EducationSchema), addEducation);
router.put('/education/:id', validateParamsHandler(EducationSchema.pick({ id: true })), validateHandler(EducationSchema), updateEducation);
router.delete('/education/:id', validateParamsHandler(EducationSchema.pick({ id: true })), deleteEducation);

router.post('/experience', validateHandler(ExperienceSchema), addExperience);
router.put('/experience/:id', validateParamsHandler(ExperienceSchema.pick({ id: true })), validateHandler(ExperienceSchema), updateExperience);
router.delete('/experience/:id', validateParamsHandler(ExperienceSchema.pick({ id: true })), deleteExperience);

router.post('/projects', validateHandler(ProjectSchema), addProject);
router.put('/projects/:id', validateParamsHandler(ProjectSchema.pick({ id: true })), validateHandler(ProjectSchema), updateProject);
router.delete('/projects/:id', validateParamsHandler(ProjectSchema.pick({ id: true })), deleteProject);
router.post('/projects/reorder', reorderProjects);

router.post('/certificates', validateHandler(CertificateSchema), addCertificate);
router.put('/certificates/:id', validateParamsHandler(CertificateSchema.pick({ id: true })), validateHandler(CertificateSchema), updateCertificate);
router.delete('/certificates/:id', validateParamsHandler(CertificateSchema.pick({ id: true })), deleteCertificate);

router.post('/skills', validateHandler(SkillSchema), addSkill);
router.put('/skills/:id', validateParamsHandler(SkillSchema.pick({ id: true })), validateHandler(SkillSchema), updateSkill);
router.delete('/skills/:id', validateParamsHandler(SkillSchema.pick({ id: true })), deleteSkill);

router.post('/api-keys', validateHandler(ApiKeySchema), saveApiKey);
router.get('/api-keys', getApiKeys);
router.delete('/api-keys/:provider', validateParamsHandler(z.object({ provider: z.string() })), deleteApiKey);

export default router;