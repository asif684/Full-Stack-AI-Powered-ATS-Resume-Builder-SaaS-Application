// System Prompt Templates - User Provided

export const SYSTEM_KEYWORD_EXTRACTION_PROMPT = `
ATS keyword extraction expert. Analyze the JOB DESCRIPTION.

CATEGORIZE:
- Hard skills/tools/tech
- Certs/education
- Job titles
- Jargon/acronyms
- Soft skills

PRIORITY:
- CRITICAL: multiple mentions OR in Requirements/Must-Have
- IMPORTANT: single mention OR in Preferred/Responsibilities
- OPTIONAL: generic/passing
- Both qualifiers met → CRITICAL

PER KEYWORD: frequency count, exact JD phrasing, preferred form (match JD; if JD uses both forms, use full form in Summary + acronym in Skills)

OUTPUT TABLE:
| Keyword | Category | Priority | Freq | Exact Phrasing | Preferred Form | Placement |

BELOW TABLE:
Total X | Critical X | Important X | Optional X | Recommend include X | Skills cap 20-25

RULE: genuine skills only, never fabricate.

JOB DESCRIPTION:
{{jobDescription}}
`.trim();

export const SYSTEM_RESUME_GENERATION_PROMPT = `
generate a resume in chat keep all the keywords given by you,
resume sequence : header -> summary -> skills -> exp -> proj -> cert -> educ

header:
name
(below) : exact job title
(below) phone, address, email
(below) linkedin, github

summary: 3-4 lines
skills: arrange in a sequence

experience: (see you add according to the jd and if you want content i have lot of projects in my info i gave, use their info which are not included in the project section)
company name
(below) job title
2 bullet points

project:
name:
below tech
below pipeline (for movie and aps only)
below github link
below 2 bullet points

certificate: (relevant to this job description)
2 job sim
1 cisco
2 euron

education:
same like exp
`.trim();

// Variable interpolation helpers
export interface KeywordData {
  keyword: string;
  category: string;
  priority: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  frequency: number;
  exactPhrasing: string;
  preferredForm: string;
  placement: string;
}

export interface ResumeContext {
  jobDescription: string;
  keywords: KeywordData[];
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
    education: Array<{
      institution: string;
      degree: string;
      field?: string;
      startDate: string;
      endDate?: string;
      gpa?: string;
      description?: string;
    }>;
    experience: Array<{
      company: string;
      role: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description?: string;
      technologies: string[];
      location?: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      link?: string;
      github?: string;
      pipeline?: string;
    }>;
    certificates: Array<{
      name: string;
      issuer: string;
      date: string;
      link?: string;
    }>;
    skills: Array<{
      name: string;
      category?: string;
      level?: number;
    }>;
  };
  selectedProjects: string[]; // project IDs
}

export function buildKeywordExtractionPrompt(jobDescription: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt.replace('{{jobDescription}}', jobDescription);
  }
  return SYSTEM_KEYWORD_EXTRACTION_PROMPT.replace('{{jobDescription}}', jobDescription);
}

export function buildResumeGenerationPrompt(context: ResumeContext, customPrompt?: string): string {
  const keywordsText = context.keywords
    .filter(k => k.priority === 'CRITICAL' || k.priority === 'IMPORTANT')
    .map(k => k.preferredForm)
    .join(', ');

  const selectedProjects = context.profile.projects.filter(p =>
    context.selectedProjects.includes(p.name)
  );

  const otherProjects = context.profile.projects.filter(p =>
    !context.selectedProjects.includes(p.name)
  );

  const profile = context.profile;

  if (customPrompt) {
    return customPrompt
      .replace('{{jobDescription}}', context.jobDescription)
      .replace('{{keywords}}', keywordsText)
      .replace('{{profile}}', JSON.stringify(profile, null, 2))
      .replace('{{projects}}', JSON.stringify(selectedProjects, null, 2))
      .replace('{{allProjects}}', JSON.stringify(context.profile.projects, null, 2))
      .replace('{{selectedProjects}}', JSON.stringify(selectedProjects, null, 2))
      .replace('{{otherProjects}}', JSON.stringify(otherProjects, null, 2));
  }

  // Build structured prompt using system template
  let prompt = SYSTEM_RESUME_GENERATION_PROMPT;

  prompt += '\n\n--- CONTEXT ---\n';
  prompt += `JOB DESCRIPTION:\n${context.jobDescription}\n\n`;
  prompt += `KEYWORDS TO INCLUDE:\n${keywordsText}\n\n`;
  prompt += `PROFILE:\n`;
  prompt += `Name: ${profile.name}\n`;
  prompt += `Email: ${profile.email}\n`;
  if (profile.phone) prompt += `Phone: ${profile.phone}\n`;
  if (profile.location) prompt += `Location: ${profile.location}\n`;
  if (profile.linkedin) prompt += `LinkedIn: ${profile.linkedin}\n`;
  if (profile.github) prompt += `GitHub: ${profile.github}\n`;
  if (profile.website) prompt += `Website: ${profile.website}\n`;
  if (profile.summary) prompt += `Summary: ${profile.summary}\n`;

  prompt += `\nEDUCATION:\n`;
  profile.education.forEach(edu => {
    prompt += `- ${edu.institution}, ${edu.degree}${edu.field ? ` (${edu.field})` : ''}, ${edu.startDate} - ${edu.endDate || 'Present'}\n`;
  });

  prompt += `\nEXPERIENCE:\n`;
  profile.experience.forEach(exp => {
    prompt += `- ${exp.company}, ${exp.role}, ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
    if (exp.description) prompt += `  ${exp.description}\n`;
    if (exp.technologies.length) prompt += `  Tech: ${exp.technologies.join(', ')}\n`;
  });

  prompt += `\nSELECTED PROJECTS:\n`;
  selectedProjects.forEach(proj => {
    prompt += `- ${proj.name}: ${proj.description}\n`;
    if (proj.technologies.length) prompt += `  Tech: ${proj.technologies.join(', ')}\n`;
    if (proj.pipeline) prompt += `  Pipeline: ${proj.pipeline}\n`;
    if (proj.github) prompt += `  GitHub: ${proj.github}\n`;
  });

  prompt += `\nOTHER PROJECTS (use for experience section if relevant):\n`;
  otherProjects.forEach(proj => {
    prompt += `- ${proj.name}: ${proj.description}\n`;
    if (proj.technologies.length) prompt += `  Tech: ${proj.technologies.join(', ')}\n`;
  });

  prompt += `\nCERTIFICATES:\n`;
  profile.certificates.forEach(cert => {
    prompt += `- ${cert.name} (${cert.issuer}), ${cert.date}\n`;
  });

  prompt += `\nSKILLS:\n`;
  profile.skills.forEach(skill => {
    prompt += `- ${skill.name}${skill.category ? ` (${skill.category})` : ''}${skill.level ? ` [Level ${skill.level}]` : ''}\n`;
  });

  return prompt;
}

export function parseKeywordTable(response: string): KeywordData[] {
  const keywords: KeywordData[] = [];

  // Parse markdown table
  const lines = response.split('\n');
  let inTable = false;

  for (const line of lines) {
    if (line.includes('| Keyword | Category | Priority |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && !line.startsWith('|---')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 7) {
        keywords.push({
          keyword: cells[0],
          category: cells[1],
          priority: cells[2] as 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL',
          frequency: parseInt(cells[3]) || 0,
          exactPhrasing: cells[4],
          preferredForm: cells[5],
          placement: cells[6],
        });
      }
    }
    if (inTable && line.startsWith('| Total')) {
      break;
    }
  }

  return keywords;
}

export function parseResumeSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionOrder = ['header', 'summary', 'skills', 'experience', 'projects', 'certificates', 'education'];

  let currentSection = '';
  let currentContent: string[] = [];

  const lines = content.split('\n');

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Check if line starts a new section
    let foundSection = false;
    for (const section of sectionOrder) {
      if (lowerLine.startsWith(section + ':') || lowerLine === section) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = section;
        currentContent = [line];
        foundSection = true;
        break;
      }
    }

    if (!foundSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}