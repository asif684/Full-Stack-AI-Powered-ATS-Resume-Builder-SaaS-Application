import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, AlertCircle, Sparkles, Zap, Brain, Settings, Save, Copy, Download } from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { api, resumeApi } from '@/lib/api';
import { LLM_PROVIDERS } from '@/lib/providers'; // We'll create this
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STEPS = [
  { id: 1, label: 'Job Description', description: 'Enter job details & choose LLM' },
  { id: 2, label: 'Keywords', description: 'Select relevant keywords' },
  { id: 3, label: 'Profile', description: 'Fill your information' },
  { id: 4, label: 'Projects', description: 'Choose top projects' },
  { id: 5, label: 'Generate', description: 'Create your resume' },
];

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI', free: false },
  { value: 'anthropic', label: 'Anthropic (Claude)', free: false },
  { value: 'gemini', label: 'Google Gemini', free: true },
  { value: 'grok', label: 'xAI Grok', free: false },
  { value: 'nvidia', label: 'NVIDIA', free: true },
  { value: 'openrouter', label: 'OpenRouter', free: true },
  { value: 'together', label: 'Together AI', free: true },
  { value: 'groq', label: 'Groq (Ultra-Fast)', free: true },
  { value: 'cerebras', label: 'Cerebras (Fastest)', free: true },
  { value: 'custom', label: 'Custom Endpoint', free: true },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string; free: boolean }[]> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', free: false },
    { value: 'gpt-4o', label: 'GPT-4o', free: false },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', free: false },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', free: false },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', free: false },
  ],
  gemini: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Free)', free: true },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Free)', free: true },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Free tier)', free: true },
  ],
  grok: [
    { value: 'grok-2-1212', label: 'Grok 2', free: false },
    { value: 'grok-2-mini', label: 'Grok 2 Mini', free: false },
  ],
  nvidia: [
    { value: 'nvidia/nemotron-3-ultra', label: 'Nemotron 3 Ultra (Free)', free: true },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B (Free)', free: true },
  ],
  openrouter: [
    { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)', free: true },
    { value: 'meta-llama/llama-3.1-70b-instruct:free', label: 'Llama 3.1 70B (Free)', free: true },
    { value: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 2.5 72B (Free)', free: true },
    { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)', free: true },
    { value: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (Free)', free: true },
    { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (Free)', free: true },
  ],
  together: [
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Turbo (Free)', free: true },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Turbo (Free)', free: true },
    { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Turbo (Free)', free: true },
  ],
  groq: [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Free)', free: true },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile (Free)', free: true },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Free)', free: true },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B (Free)', free: true },
  ],
  cerebras: [
    { value: 'llama3.1-8b', label: 'Llama 3.1 8B (Free)', free: true },
    { value: 'llama3.1-70b', label: 'Llama 3.1 70B (Free)', free: true },
  ],
  custom: [
    { value: 'custom', label: 'Custom Model', free: true },
  ],
};

const PROMPT_TYPES = [
  { value: 'system', label: 'System Prompt (Pre-configured)', description: 'Use built-in optimized prompts with provider selection' },
  { value: 'custom', label: 'Custom Prompt', description: 'Write your own prompt template' },
];

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('id');

  const {
    currentStep,
    setCurrentStep,
    jobDescription,
    setJobDescription,
    step1LlmConfig,
    setStep1LlmConfig,
    extractedKeywords,
    keptKeywords,
    discardedKeywords,
    rawKeywordsResponse,
    setExtractedKeywords,
    toggleKeyword,
    profileCompleted,
    setProfileCompleted,
    selectedProjectIds,
    setSelectedProjects,
    suggestedProjectIds,
    projectCount,
    setProjectCount,
    projectSuggestionReasoning,
    setProjectSuggestions,
    step5LlmConfig,
    setStep5LlmConfig,
    generatedContent,
    generatedSections,
    resumeId: storedResumeId,
    setGeneratedResume,
    setGenerating,
    updateSection,
    reset,
  } = useResumeStore();

  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeywordDetail, setShowKeywordDetail] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  // Load providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await resumeApi.getProviders();
        setProviders(response.data.providers);
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };
    fetchProviders();
  }, []);

  // Load user projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/profile');
        if (response.data.profile?.projects) {
          setAvailableProjects(response.data.profile.projects);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Load resume if editing
  useEffect(() => {
    if (resumeId) {
      const fetchResume = async () => {
        try {
          const response = await resumeApi.getById(resumeId);
          const resume = response.data.resume;
          // Populate store with resume data
        } catch (err) {
          console.error('Failed to load resume:', err);
        }
      };
      fetchResume();
    }
  }, [resumeId]);

  const handleExtractKeywords = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await resumeApi.extractKeywords({
        jobDescription,
        llmConfig: step1LlmConfig,
      });

      setExtractedKeywords(response.data.keywords, response.data.rawResponse);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract keywords');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await resumeApi.suggestProjects({
        jobDescription,
        keywords: keptKeywords,
        projectCount,
        projects: availableProjects,
      });

      setProjectSuggestions(response.data.suggestedProjectIds, response.data.reasoning);
      setSelectedProjects(response.data.suggestedProjectIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suggest projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (selectedProjectIds.length === 0) {
      setError('Please select at least one project');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Get full profile
      const profileResponse = await api.get('/profile');
      const profile = profileResponse.data.profile;

      const response = await resumeApi.generateResume({
        jobDescription,
        keywords: keptKeywords,
        profile,
        selectedProjects: selectedProjectIds,
        llmConfig: step5LlmConfig,
      });

      setGeneratedResume(response.data.content, response.data.sections, response.data.resumeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateSection = async (sectionName: string) => {
    setIsLoading(true);
    try {
      const profileResponse = await api.get('/profile');
      const profile = profileResponse.data.profile;

      const context = {
        jobDescription,
        keywords: keptKeywords,
        profile,
        selectedProjects: selectedProjectIds,
      };

      const response = await resumeApi.regenerateSection({
        sectionName,
        context,
        currentContent: generatedSections[sectionName] || '',
        llmConfig: step5LlmConfig,
      });

      updateSection(sectionName, response.data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate section');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    alert('Resume copied to clipboard!');
  };

  const goToStep = (step: number) => {
    if (step < currentStep || [1, 2, 3, 4].includes(step)) {
      setCurrentStep(step);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return jobDescription.trim().length >= 50;
      case 2:
        return keptKeywords.length > 0;
      case 3:
        return profileCompleted;
      case 4:
        return selectedProjectIds.length > 0;
      case 5:
        return generatedContent.length > 0;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <Textarea
        label="Job Description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the full job description here..."
        rows={15}
        helperText="Include requirements, responsibilities, and preferred qualifications for best results"
      />

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">LLM Configuration</h3>
          <p className="text-sm text-gray-500">Choose how to extract keywords</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="label">Prompt Type</label>
            <div className="space-y-2">
              {PROMPT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    step1LlmConfig.promptType === type.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="promptType"
                    value={type.value}
                    checked={step1LlmConfig.promptType === type.value}
                    onChange={() => setStep1LlmConfig({ promptType: type.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {step1LlmConfig.promptType === 'custom' && (
            <Textarea
              label="Custom Prompt"
              value={step1LlmConfig.customPrompt || ''}
              onChange={(e) => setStep1LlmConfig({ customPrompt: e.target.value })}
              placeholder="Enter your custom prompt. Use {{jobDescription}} as placeholder."
              rows={6}
            />
          )}

          {step1LlmConfig.promptType === 'system' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>System Prompt:</strong> ATS keyword extraction expert with categorization, priority levels,
                frequency counts, and structured table output.
              </p>
            </div>
          )}

          {step1LlmConfig.promptType !== 'system' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Provider"
                  options={PROVIDER_OPTIONS.map(p => ({ value: p.value, label: p.label + (p.free ? ' (Free)' : '') }))}
                  value={step1LlmConfig.provider}
                  onChange={(e) => setStep1LlmConfig({ provider: e.target.value, model: MODEL_OPTIONS[e.target.value]?.[0]?.value })}
                />
                <Select
                  label="Model"
                  options={MODEL_OPTIONS[step1LlmConfig.provider]?.map(m => ({ value: m.value, label: m.label + (m.free ? ' (Free)' : '') })) || []}
                  value={step1LlmConfig.model}
                  onChange={(e) => setStep1LlmConfig({ model: e.target.value })}
                />
              </div>

              <Input
                label="API Key"
                type="password"
                value={step1LlmConfig.apiKey || ''}
                onChange={(e) => setStep1LlmConfig({ apiKey: e.target.value })}
                placeholder="Enter your API key"
                helperText="Your API key will be used for this session only"
              />

              {step1LlmConfig.provider === 'custom' && (
                <Input
                  label="Custom Base URL"
                  value={step1LlmConfig.baseUrl || ''}
                  onChange={(e) => setStep1LlmConfig({ baseUrl: e.target.value })}
                  placeholder="https://your-endpoint.com/v1"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleExtractKeywords} loading={isLoading} disabled={!canProceed()}>
          <Sparkles className="h-5 w-5 mr-2" />
          Extract Keywords
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Extracted Keywords</h3>
            <p className="text-sm text-gray-500">
              {keptKeywords.length} kept • {discardedKeywords.length} discarded • {extractedKeywords.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowKeywordDetail(rawKeywordsResponse)}>
              <Settings className="h-4 w-4 mr-1" />
              View Raw Response
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {extractedKeywords.map((kw) => (
              <Chip
                key={kw.keyword}
                label={`${kw.preferredForm} (${kw.priority})`}
                selected={keptKeywords.some(k => k.keyword === kw.keyword)}
                variant="option"
                onClick={() => toggleKeyword(kw.keyword, !keptKeywords.some(k => k.keyword === kw.keyword))}
                className={cn(
                  keptKeywords.some(k => k.keyword === kw.keyword) && 'ring-2 ring-primary-500',
                  kw.priority === 'CRITICAL' && 'ring-1 ring-red-500',
                  kw.priority === 'IMPORTANT' && 'ring-1 ring-yellow-500',
                  kw.priority === 'OPTIONAL' && 'ring-1 ring-gray-300'
                )}
              />
            ))}
          </div>

          {keptKeywords.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Selected Keywords ({keptKeywords.length})</h4>
              <div className="flex flex-wrap gap-2">
                {keptKeywords.map((kw) => (
                  <Chip
                    key={kw.keyword}
                    label={kw.preferredForm}
                    variant="selected"
                    removable
                    onRemove={() => toggleKeyword(kw.keyword, false)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="label">Add Custom Keyword</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter keyword"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newKw = {
                      keyword: e.currentTarget.value.trim(),
                      category: 'custom',
                      priority: 'IMPORTANT' as const,
                      frequency: 1,
                      exactPhrasing: e.currentTarget.value.trim(),
                      preferredForm: e.currentTarget.value.trim(),
                      placement: 'skills',
                    };
                    setExtractedKeywords([...extractedKeywords, newKw], rawKeywordsResponse);
                    toggleKeyword(newKw.keyword, true);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => goToStep(1)}>Back</Button>
        <Button size="lg" onClick={() => goToStep(3)} disabled={!canProceed()}>
          Continue <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Profile Information</h3>
          <p className="text-sm text-gray-500">Complete your profile to generate a tailored resume</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium">{profileCompleted ? 'Profile Complete' : 'Profile Incomplete'}</p>
              <p className="text-sm text-gray-600">
                {profileCompleted
                  ? 'Your profile is ready for resume generation'
                  : 'Please complete your profile in the Profile page'}
              </p>
            </div>
            <Button
              variant={profileCompleted ? 'secondary' : 'primary'}
              onClick={() => navigate('/profile')}
            >
              {profileCompleted ? 'Edit Profile' : 'Complete Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => goToStep(2)}>Back</Button>
        <Button size="lg" onClick={() => goToStep(4)} disabled={!profileCompleted}>
          Continue <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Select Projects</h3>
              <p className="text-sm text-gray-500">
                Choose up to {projectCount} projects for your resume
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Count:</label>
              <select
                value={projectCount}
                onChange={(e) => setProjectCount(parseInt(e.target.value))}
                className="input w-auto px-3"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedProjectIds.length === 0 && (
            <Button variant="outline" onClick={handleSuggestProjects} loading={isLoading}>
              <Brain className="h-4 w-4 mr-2" />
              Get AI Suggestions
            </Button>
          )}

          {suggestedProjectIds.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Suggested Projects
              </p>
              <p className="text-sm text-green-700 mb-3">{projectSuggestionReasoning}</p>
              <Button variant="secondary" size="sm" onClick={() => setSelectedProjects(suggestedProjectIds)}>
                Use Suggestions
              </Button>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3">Your Projects ({selectedProjectIds.length}/{projectCount} selected)</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableProjects.map((project) => {
                const isSelected = selectedProjectIds.includes(project.id);
                const isSuggested = suggestedProjectIds.includes(project.id);
                return (
                  <label
                    key={project.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedProjects(selectedProjectIds.filter((id) => id !== project.id));
                        } else if (selectedProjectIds.length < projectCount) {
                          setSelectedProjects([...selectedProjectIds, project.id]);
                        }
                      }}
                      disabled={!isSelected && selectedProjectIds.length >= projectCount}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{project.name}</p>
                        {isSuggested && <span className="badge-primary text-xs">Suggested</span>}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{project.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.technologies?.slice(0, 5).map((tech: string) => (
                          <span key={tech} className="badge-gray text-xs">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {availableProjects.length === 0 && (
              <p className="text-center text-gray-500 py-8">No projects found. Add projects in your Profile.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => goToStep(3)}>Back</Button>
        <Button size="lg" onClick={() => goToStep(5)} disabled={!canProceed()}>
          Continue <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold">Generation Settings</h3>
          <p className="text-sm text-gray-500">Choose how to generate your resume</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="label">Prompt Type</label>
            <div className="space-y-2">
              {[
                { value: 'custom', label: 'Custom LLM + API Key', description: 'Use any provider with your own API key' },
                { value: 'system', label: 'Pre-existing System Prompt', description: 'Use built-in optimized prompt (no API key needed)' },
                { value: 'custom-prompt', label: 'Custom Prompt', description: 'Write your own generation prompt template' },
              ].map((type) => (
                <label
                  key={type.value}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    step5LlmConfig.promptType === (type.value === 'custom-prompt' ? 'custom' : type.value)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="genPromptType"
                    value={type.value}
                    checked={step5LlmConfig.promptType === (type.value === 'custom-prompt' ? 'custom' : type.value)}
                    onChange={() => setStep5LlmConfig({
                      promptType: type.value === 'custom-prompt' ? 'custom' : type.value,
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {['custom', 'system'].includes(step5LlmConfig.promptType) && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step5LlmConfig.apiKeySource === 'step1'}
                    onChange={() => setStep5LlmConfig({ apiKeySource: 'step1' })}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="font-medium">Use same API key as Step 1</span>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={step5LlmConfig.apiKeySource === 'new'}
                  onChange={() => setStep5LlmConfig({ apiKeySource: 'new' })}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="font-medium">Use different API key</span>
              </label>

              {step5LlmConfig.apiKeySource === 'new' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Provider"
                      options={PROVIDER_OPTIONS.map(p => ({ value: p.value, label: p.label + (p.free ? ' (Free)' : '') }))}
                      value={step5LlmConfig.provider}
                      onChange={(e) => setStep5LlmConfig({ provider: e.target.value, model: MODEL_OPTIONS[e.target.value]?.[0]?.value })}
                    />
                    <Select
                      label="Model"
                      options={MODEL_OPTIONS[step5LlmConfig.provider]?.map(m => ({ value: m.value, label: m.label + (m.free ? ' (Free)' : '') })) || []}
                      value={step5LlmConfig.model}
                      onChange={(e) => setStep5LlmConfig({ model: e.target.value })}
                    />
                  </div>

                  <Input
                    label="API Key"
                    type="password"
                    value={step5LlmConfig.apiKey || ''}
                    onChange={(e) => setStep5LlmConfig({ apiKey: e.target.value })}
                    placeholder="Enter your API key"
                  />

                  {step5LlmConfig.provider === 'custom' && (
                    <Input
                      label="Custom Base URL"
                      value={step5LlmConfig.baseUrl || ''}
                      onChange={(e) => setStep5LlmConfig({ baseUrl: e.target.value })}
                      placeholder="https://your-endpoint.com/v1"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {step5LlmConfig.promptType === 'custom' && (
            <Textarea
              label="Custom Prompt"
              value={step5LlmConfig.customPrompt || ''}
              onChange={(e) => setStep5LlmConfig({ customPrompt: e.target.value })}
              placeholder="Enter your custom prompt. Use {{jobDescription}}, {{keywords}}, {{profile}}, {{projects}}, {{selectedProjects}} as placeholders."
              rows={8}
            />
          )}

          {step5LlmConfig.promptType === 'system' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>System Prompt:</strong> Generates resume with header (name, job title, contacts, links), summary (3-4 lines),
                skills (prioritized), experience (2 bullets per role), projects (name, tech, pipeline, GitHub, 2 bullets),
                certificates (relevant only), education.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!generatedContent ? (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleGenerateResume} loading={isLoading} disabled={!canProceed()}>
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Resume
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button variant="secondary">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" onClick={() => setGeneratedResume('', {}, '')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>

          <div className="prose max-w-none bg-white p-6 rounded-xl border border-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
          </div>

          {/* Section editing */}
          {Object.keys(generatedSections).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Edit Sections</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(generatedSections).map(([sectionName, content]) => (
                  <div key={sectionName} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{sectionName}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleRegenerateSection(sectionName)}>
                        Regenerate
                      </Button>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => updateSection(sectionName, e.target.value)}
                      className="w-full min-h-[100px] p-2 border border-gray-200 rounded text-sm font-mono resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => goToStep(4)}>Back</Button>
        {!generatedContent && canProceed() && (
          <Button size="lg" onClick={handleGenerateResume} loading={isLoading}>
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Resume
          </Button>
        )}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <Progress current={currentStep} total={STEPS.length} className="mb-4" />
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all',
                      index + 1 < currentStep
                        ? 'bg-green-500 text-white'
                        : index + 1 === currentStep
                        ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {index + 1 < currentStep ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <span className={cn('text-xs mt-1 text-center', index + 1 === currentStep ? 'font-medium text-gray-900' : 'text-gray-500')}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
        </Card>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
}