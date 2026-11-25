import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeywordData {
  keyword: string;
  category: string;
  priority: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  frequency: number;
  exactPhrasing: string;
  preferredForm: string;
  placement: string;
  kept?: boolean;
}

export interface LlmConfig {
  provider: string;
  model: string;
  promptType: 'system' | 'custom';
  apiKeySource: 'step1' | 'new' | 'system';
  apiKey?: string;
  customPrompt?: string;
  baseUrl?: string;
}

export interface ResumeState {
  // Step 1: Job Description & LLM Config
  jobDescription: string;
  step1LlmConfig: LlmConfig;

  // Step 2: Keywords
  extractedKeywords: KeywordData[];
  keptKeywords: KeywordData[];
  discardedKeywords: KeywordData[];
  rawKeywordsResponse: string;

  // Step 3: Profile (from profile store, but we track completion)
  profileCompleted: boolean;

  // Step 4: Projects
  selectedProjectIds: string[];
  suggestedProjectIds: string[];
  projectCount: number;
  projectSuggestionReasoning: string;

  // Step 5: Resume Generation
  step5LlmConfig: LlmConfig;
  generatedContent: string;
  generatedSections: Record<string, string>;
  resumeId: string | null;
  isGenerating: boolean;

  // Actions
  setJobDescription: (desc: string) => void;
  setStep1LlmConfig: (config: Partial<LlmConfig>) => void;
  setExtractedKeywords: (keywords: KeywordData[], rawResponse: string) => void;
  toggleKeyword: (keyword: string, kept: boolean) => void;
  setProfileCompleted: (completed: boolean) => void;
  setSelectedProjects: (ids: string[]) => void;
  setProjectSuggestions: (ids: string[], reasoning: string) => void;
  setProjectCount: (count: number) => void;
  setStep5LlmConfig: (config: Partial<LlmConfig>) => void;
  setGeneratedResume: (content: string, sections: Record<string, string>, resumeId: string) => void;
  setGenerating: (generating: boolean) => void;
  updateSection: (section: string, content: string) => void;
  reset: () => void;
}

const defaultLlmConfig: LlmConfig = {
  provider: 'groq',
  model: 'llama-3.1-8b-instant',
  promptType: 'system',
  apiKeySource: 'step1',
};

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      jobDescription: '',
      step1LlmConfig: defaultLlmConfig,
      extractedKeywords: [],
      keptKeywords: [],
      discardedKeywords: [],
      rawKeywordsResponse: '',
      profileCompleted: false,
      selectedProjectIds: [],
      suggestedProjectIds: [],
      projectCount: 3,
      projectSuggestionReasoning: '',
      step5LlmConfig: defaultLlmConfig,
      generatedContent: '',
      generatedSections: {},
      resumeId: null,
      isGenerating: false,

      setJobDescription: (desc) => set({ jobDescription: desc }),

      setStep1LlmConfig: (config) =>
        set((state) => ({ step1LlmConfig: { ...state.step1LlmConfig, ...config } })),

      setExtractedKeywords: (keywords, rawResponse) =>
        set({
          extractedKeywords: keywords,
          keptKeywords: keywords,
          discardedKeywords: [],
          rawKeywordsResponse: rawResponse,
        }),

      toggleKeyword: (keyword, kept) =>
        set((state) => {
          const kw = state.extractedKeywords.find((k) => k.keyword === keyword);
          if (!kw) return state;

          const updated = { ...kw, kept };
          const newKept = kept
            ? [...state.keptKeywords.filter((k) => k.keyword !== keyword), updated]
            : state.keptKeywords.filter((k) => k.keyword !== keyword);
          const newDiscarded = !kept
            ? [...state.discardedKeywords.filter((k) => k.keyword !== keyword), updated]
            : state.discardedKeywords.filter((k) => k.keyword !== keyword);

          return {
            extractedKeywords: state.extractedKeywords.map((k) =>
              k.keyword === keyword ? updated : k
            ),
            keptKeywords: newKept,
            discardedKeywords: newDiscarded,
          };
        }),

      setProfileCompleted: (completed) => set({ profileCompleted: completed }),

      setSelectedProjects: (ids) => set({ selectedProjectIds: ids }),

      setProjectSuggestions: (ids, reasoning) =>
        set({ suggestedProjectIds: ids, projectSuggestionReasoning: reasoning }),

      setProjectCount: (count) => set({ projectCount: count }),

      setStep5LlmConfig: (config) =>
        set((state) => ({ step5LlmConfig: { ...state.step5LlmConfig, ...config } })),

      setGeneratedResume: (content, sections, resumeId) =>
        set({ generatedContent: content, generatedSections: sections, resumeId, isGenerating: false }),

      setGenerating: (generating) => set({ isGenerating: generating }),

      updateSection: (section, content) =>
        set((state) => ({
          generatedSections: { ...state.generatedSections, [section]: content },
        })),

      reset: () =>
        set({
          jobDescription: '',
          step1LlmConfig: defaultLlmConfig,
          extractedKeywords: [],
          keptKeywords: [],
          discardedKeywords: [],
          rawKeywordsResponse: '',
          profileCompleted: false,
          selectedProjectIds: [],
          suggestedProjectIds: [],
          projectCount: 3,
          projectSuggestionReasoning: '',
          step5LlmConfig: defaultLlmConfig,
          generatedContent: '',
          generatedSections: {},
          resumeId: null,
          isGenerating: false,
        }),
    }),
    {
      name: 'resume-storage',
      partialize: (state) => ({
        jobDescription: state.jobDescription,
        step1LlmConfig: state.step1LlmConfig,
        extractedKeywords: state.extractedKeywords,
        keptKeywords: state.keptKeywords,
        discardedKeywords: state.discardedKeywords,
        profileCompleted: state.profileCompleted,
        selectedProjectIds: state.selectedProjectIds,
        suggestedProjectIds: state.suggestedProjectIds,
        projectCount: state.projectCount,
        projectSuggestionReasoning: state.projectSuggestionReasoning,
        step5LlmConfig: state.step5LlmConfig,
        generatedContent: state.generatedContent,
        generatedSections: state.generatedSections,
        resumeId: state.resumeId,
      }),
    }
  )
);