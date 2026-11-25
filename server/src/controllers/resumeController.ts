import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { llmService } from '../services/llmService';
import { ExtractKeywordsSchema, SuggestProjectsSchema, GenerateResumeSchema, RegenerateSectionSchema } from '../validators/resume.schema';

// Fallback resume generation function
function buildFallbackResume(context: any): string {
  const { profile, selectedProjects, keywords } = context;
  const criticalKeywords = keywords.filter((k: any) => k.priority === 'CRITICAL').map((k: any) => k.preferredForm);
  const importantKeywords = keywords.filter((k: any) => k.priority === 'IMPORTANT').map((k: any) => k.preferredForm);

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

  return resume;
}

export const extractKeywords = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    const userId = userId;
    const { jobDescription, llmConfig } = req.body;

    let apiKey = llmConfig.apiKey;
    let systemApiKey: string | undefined;

    if (llmConfig.apiKeySource === 'step1') {
      const savedKey = await llmService.getUserApiKey(userId, llmConfig.provider);
      if (savedKey) { apiKey = savedKey; }
      else { systemApiKey = llmService.getSystemApiKey(llmConfig.provider); }
    } else if (llmConfig.apiKeySource === 'system') {
      systemApiKey = llmService.getSystemApiKey(llmConfig.provider);
    }

    const result = await llmService.extractKeywords(jobDescription, {
      provider: llmConfig.provider,
      model: llmConfig.model,
      apiKey,
      systemApiKey,
      customPrompt: llmConfig.customPrompt,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resumeData = await (prisma.resumeData.create as any)({
      data: {
        userId,
        jobDescription,
        extractedKeywords: JSON.stringify({
          kept: result.keywords,
          discarded: [],
          raw: result.keywords,
        }),
        llmConfig: JSON.stringify({
          provider: llmConfig.provider,
          model: llmConfig.model,
          promptType: llmConfig.promptType,
          apiKeySource: llmConfig.apiKeySource,
        }),
        generatedContent: '',
      },
    });

    res.json({
      success: true,
      resumeId: resumeData.id,
      keywords: result.keywords,
      rawResponse: result.rawResponse,
    });
  } catch (error: any) {
    console.error('Extract keywords error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract keywords'
    });
  }
};

export const suggestProjects = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;

  const data = SuggestProjectsSchema.parse(req.body);
  const { jobDescription, keywords, projectCount, projects } = data;

  if (!projects.length) {
    return res.json({
      success: true,
      suggestedProjectIds: [],
      reasoning: 'No projects in profile',
    });
  }

  // Simple keyword matching fallback
  const keywordTerms = keywords
    .filter((k) => k.priority === 'CRITICAL' || k.priority === 'IMPORTANT')
    .map((k) => k.preferredForm.toLowerCase());

  const scoredProjects = projects.map((project) => {
    const projectText = `${project.name} ${project.description} ${project.technologies.join(' ')}`.toLowerCase();
    const matches = keywordTerms.filter((term) => projectText.includes(term)).length;
    return { project, score: matches };
  });

  scoredProjects.sort((a, b) => b.score - a.score);
  const topProjects = scoredProjects.slice(0, projectCount);

  res.json({
    success: true,
    suggestedProjectIds: topProjects.map((p) => p.project.id),
    reasoning: topProjects.map((p) => `${p.project.name} (${p.score} keyword matches)`).join('; '),
  });
};

export const generateResume = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;

  const data: any = req.body;
  const { jobDescription, keywords, selectedProjects, llmConfig } = data;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      education: true,
      experience: true,
      projects: true,
      certificates: true,
      skills: true,
    },
  });

  if (!profile) {
    return res.status(400).json({ success: false, error: 'Profile not found' });
  }

  let apiKey = llmConfig.apiKey;
  let systemApiKey: string | undefined;

  if (llmConfig.apiKeySource === 'step1') {
    const savedKey = await llmService.getUserApiKey(userId, llmConfig.provider);
    if (savedKey) { apiKey = savedKey; }
    else { systemApiKey = llmService.getSystemApiKey(llmConfig.provider); }
  } else if (llmConfig.apiKeySource === 'system') {
    systemApiKey = llmService.getSystemApiKey(llmConfig.provider);
  }

  const context = {
    jobDescription,
    keywords,
    profile: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone || undefined,
      location: profile.location || undefined,
      linkedin: profile.linkedin || undefined,
      github: profile.github || undefined,
      website: profile.website || undefined,
      summary: profile.summary || undefined,
      education: profile.education.map((e: any) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field || undefined,
        startDate: e.startDate.toISOString().split('T')[0],
        endDate: e.endDate?.toISOString().split('T')[0],
        gpa: e.gpa || undefined,
        description: e.description || undefined,
      })),
      experience: profile.experience.map((e: any) => ({
        company: e.company,
        role: e.role,
        startDate: e.startDate.toISOString().split('T')[0],
        endDate: e.endDate?.toISOString().split('T')[0],
        current: e.current,
        description: e.description || undefined,
        technologies: e.technologies,
        location: e.location || undefined,
      })),
      projects: profile.projects.map((p: any) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        link: p.link || undefined,
        github: p.github || undefined,
        pipeline: p.pipeline || undefined,
      })),
      certificates: profile.certificates.map((c: any) => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date.toISOString().split('T')[0],
        link: c.link || undefined,
      })),
      skills: profile.skills.map((s: any) => ({
        name: s.name,
        category: s.category || undefined,
        level: s.level || undefined,
      })),
    },
    selectedProjects,
  };

  let result;
  try {
    result = await llmService.generateResume(context, {
        provider: llmConfig.provider,
        model: llmConfig.model,
        apiKey,
        systemApiKey,
        customPrompt: llmConfig.customPrompt,
        temperature: 0.3,
        maxTokens: 8192,
      });
    } catch (llmError) {
      console.error('LLM generation failed, using fallback:', llmError);
      // Fallback: generate resume from template without LLM
      result = {
        content: buildFallbackResume(context),
        sections: {}
      };
    }

  const resumeData = await prisma.resumeData.upsert({
    where: { id: req.body.resumeId || '' },
    update: {
      jobDescription,
      extractedKeywords: {
        kept: keywords,
        discarded: [],
        raw: keywords,
      } as any,
      llmConfig: {
        provider: llmConfig.provider,
        model: llmConfig.model,
        promptType: llmConfig.promptType,
        apiKeySource: llmConfig.apiKeySource,
      } as any,
      selectedProjects,
      generatedContent: result.content,
      generatedSections: result.sections as any,
    },
    create: {
      userId,
      jobDescription,
      extractedKeywords: {
        kept: keywords,
        discarded: [],
        raw: keywords,
      } as any,
      llmConfig: {
        provider: llmConfig.provider,
        model: llmConfig.model,
        promptType: llmConfig.promptType,
        apiKeySource: llmConfig.apiKeySource,
      } as any,
      selectedProjects,
      generatedContent: result.content,
      generatedSections: result.sections as any,
    },
  });

  res.json({
    success: true,
    resumeId: resumeData.id,
    content: result.content,
    sections: result.sections,
  });
};

export const regenerateSection = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;

  const data: any = req.body;
  const { sectionName, context, currentContent, llmConfig } = data;

  const prompt = `Regenerate the ${sectionName} section.\n\nCurrent content:\n${currentContent}\n\nContext:\n- Job: ${context.jobDescription}\n- Keywords: ${context.keywords.filter((k: any) => k.priority !== 'OPTIONAL').map((k: any) => k.preferredForm).join(', ')}`;

  const newContent = await llmService.callLlm(prompt, {
    provider: llmConfig.provider,
    model: llmConfig.model,
    temperature: 0.3,
    maxTokens: 2048,
  });

  res.json({ success: true, sectionName, content: newContent });
};

export const getResumeHistory = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;

  const resumes = await prisma.resumeData.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      jobDescription: true,
      createdAt: true,
      updatedAt: true,
      llmConfig: true,
      selectedProjects: true,
    },
  });

  res.json({ success: true, resumes });
};

export const getResumeById = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;
  const { id } = req.params;

  const resume = await prisma.resumeData.findFirst({
    where: { id, userId },
  });

  if (!resume) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  res.json({ success: true, resume });
};

export const deleteResume = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;
  const { id } = req.params;

  await prisma.resumeData.delete({ where: { id, userId } });

  res.json({ success: true });
};

export const updateKeywords = async (req: Request, res: Response) => {
  const { user } = req as any;
  const userId = user.id;
  const { id } = req.params;

  const { kept, discarded } = req.body;

  const resume = await prisma.resumeData.update({
    where: { id, userId },
    data: {
      extractedKeywords: {
        kept,
        discarded,
        raw: [...kept, ...discarded],
      } as any,
    },
  });

  res.json({ success: true, resume });
};