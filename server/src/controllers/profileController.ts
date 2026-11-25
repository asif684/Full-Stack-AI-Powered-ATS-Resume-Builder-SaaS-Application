import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { ProfileSchema, EducationSchema, ExperienceSchema, ProjectSchema, CertificateSchema, SkillSchema, ApiKeySchema } from '../validators/profile.schema';
import { encrypt } from '../utils/crypto';

type Handler = (req: Request, res: Response) => Promise<any>;

function handler(fn: Handler): Handler {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}

export const getProfile = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { education: true, experience: true, projects: true, certificates: true, skills: true },
  });
  res.json({ success: true, profile: profile || { education: [], experience: [], projects: [], certificates: [], skills: [] } });
});

export const updateProfile = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      name: data.name, email: data.email, phone: data.phone, location: data.location,
      linkedin: data.linkedin, github: data.github, website: data.website, summary: data.summary,
    },
    create: { userId, name: data.name, email: data.email, phone: data.phone, location: data.location,
      linkedin: data.linkedin, github: data.github, website: data.website, summary: data.summary },
  });
  res.json({ success: true, profile });
});

export const addEducation = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;
  const education = await prisma.education.create({ data: { profileId: userId, ...data } });
  res.json({ success: true, education });
});

export const updateEducation = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const data: any = req.body;
  const education = await prisma.education.update({ where: { id, profileId: userId }, data });
  res.json({ success: true, education });
});

export const deleteEducation = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  await prisma.education.delete({ where: { id, profileId: userId } });
  res.json({ success: true });
});

export const addExperience = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;
  const experience = await prisma.experience.create({ data: { profileId: userId, ...data } });
  res.json({ success: true, experience });
});

export const updateExperience = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const data: any = req.body;
  const experience = await prisma.experience.update({ where: { id, profileId: userId }, data });
  res.json({ success: true, experience });
});

export const deleteExperience = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  await prisma.experience.delete({ where: { id, profileId: userId } });
  res.json({ success: true });
});

export const addProject = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;

  // Get profile ID from user
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error('Profile not found');
  }

  const project = await prisma.project.create({
    data: {
      profileId: profile.id,
      ...data,
      technologies: Array.isArray(data.technologies) ? data.technologies.join(',') : data.technologies
    }
  });
  res.json({ success: true, project });
});

export const updateProject = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const data: any = req.body;
  const project = await prisma.project.update({ where: { id, profileId: userId }, data });
  res.json({ success: true, project });
});

export const deleteProject = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  await prisma.project.delete({ where: { id, profileId: userId } });
  res.json({ success: true });
});

export const reorderProjects = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { projectIds }: any = req.body;
  await prisma.$transaction(projectIds.map((id: string, i: number) =>
    prisma.project.update({ where: { id, profile: { userId } }, data: { order: i } })
  ));
  res.json({ success: true });
});

export const addCertificate = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;
  const certificate = await prisma.certificate.create({ data: { profileId: userId, ...data } });
  res.json({ success: true, certificate });
});

export const updateCertificate = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const data: any = req.body;
  const certificate = await prisma.certificate.update({ where: { id, profileId: userId }, data });
  res.json({ success: true, certificate });
});

export const deleteCertificate = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  await prisma.certificate.delete({ where: { id, profileId: userId } });
  res.json({ success: true });
});

export const addSkill = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;
  const skill = await prisma.skill.create({ data: { profileId: userId, ...data } });
  res.json({ success: true, skill });
});

export const updateSkill = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  const data: any = req.body;
  const skill = await prisma.skill.update({ where: { id, profileId: userId }, data });
  res.json({ success: true, skill });
});

export const deleteSkill = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  await prisma.skill.delete({ where: { id, profileId: userId } });
  res.json({ success: true });
});

export const saveApiKey = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const data: any = req.body;
  const encryptedKey = await encrypt(data.apiKey);
  const apiKey = await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider: data.provider } },
    update: { encryptedKey, model: data.model, isDefault: data.isDefault, baseUrl: data.baseUrl },
    create: { userId, provider: data.provider, encryptedKey, model: data.model, isDefault: data.isDefault, baseUrl: data.baseUrl },
  });
  res.json({ success: true, apiKey: { provider: apiKey.provider, model: apiKey.model, isDefault: apiKey.isDefault, baseUrl: apiKey.baseUrl } });
});

export const getApiKeys = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const apiKeys = await prisma.apiKey.findMany({ where: { userId } });
  res.json({ success: true, apiKeys });
});

export const deleteApiKey = handler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { provider } = req.params;
  await prisma.apiKey.delete({ where: { userId_provider: { userId, provider } } });
  res.json({ success: true });
});