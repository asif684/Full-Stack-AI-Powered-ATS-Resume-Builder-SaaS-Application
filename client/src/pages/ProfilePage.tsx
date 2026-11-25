import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution required'),
  degree: z.string().min(1, 'Degree required'),
  field: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional().or(z.literal('')),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company required'),
  role: z.string().min(1, 'Role required'),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional().or(z.literal('')),
  current: z.boolean().default(false),
  description: z.string().optional(),
  technologies: z.string().optional(),
  location: z.string().optional(),
});

const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name required'),
  description: z.string().min(1, 'Description required'),
  technologies: z.string().optional(),
  link: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  pipeline: z.string().optional(),
});

const CertificateSchema = z.object({
  name: z.string().min(1, 'Certificate name required'),
  issuer: z.string().min(1, 'Issuer required'),
  date: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  link: z.string().url().optional().or(z.literal('')),
});

const SkillSchema = z.object({
  name: z.string().min(1, 'Skill name required'),
  category: z.string().optional(),
  level: z.number().min(1).max(5).optional(),
});

const ProfileSchema = z.object({
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

type ProfileForm = z.infer<typeof ProfileSchema>;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: '',
      summary: '',
      education: [],
      experience: [],
      projects: [],
      certificates: [],
      skills: [],
    },
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation, move: moveEducation } = useFieldArray({
    control,
    name: 'education',
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience, move: moveExperience } = useFieldArray({
    control,
    name: 'experience',
  });

  const { fields: projectFields, append: appendProject, remove: removeProject, move: moveProject } = useFieldArray({
    control,
    name: 'projects',
  });

  const { fields: certificateFields, append: appendCertificate, remove: removeCertificate, move: moveCertificate } = useFieldArray({
    control,
    name: 'certificates',
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill, move: moveSkill } = useFieldArray({
    control,
    name: 'skills',
  });

  // Load profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile');
        if (response.data.profile) {
          const profile = response.data.profile;
          reset({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            website: profile.website || '',
            summary: profile.summary || '',
            education: profile.education?.map((e: any) => ({
              institution: e.institution,
              degree: e.degree,
              field: e.field || '',
              startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 7) : '',
              endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 7) : '',
              gpa: e.gpa || '',
              description: e.description || '',
            })) || [],
            experience: profile.experience?.map((e: any) => ({
              company: e.company,
              role: e.role,
              startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 7) : '',
              endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 7) : '',
              current: e.current || false,
              description: e.description || '',
              technologies: e.technologies?.join(', ') || '',
              location: e.location || '',
            })) || [],
            projects: profile.projects?.map((p: any) => ({
              name: p.name,
              description: p.description,
              technologies: p.technologies?.join(', ') || '',
              link: p.link || '',
              github: p.github || '',
              pipeline: p.pipeline || '',
            })) || [],
            certificates: profile.certificates?.map((c: any) => ({
              name: c.name,
              issuer: c.issuer,
              date: c.date ? new Date(c.date).toISOString().slice(0, 7) : '',
              link: c.link || '',
            })) || [],
            skills: profile.skills?.map((s: any) => ({
              name: s.name,
              category: s.category || '',
              level: s.level || 3,
            })) || [],
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/profile', {
        ...data,
        technologies: data.experience.map((e) => e.technologies?.split(',').map((t) => t.trim()).filter(Boolean) || []),
        projectTechnologies: data.projects.map((p) => p.technologies?.split(',').map((t) => t.trim()).filter(Boolean) || []),
      });

      setUser(response.data.profile);
      setSuccess('Profile saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certificates', label: 'Certificates', icon: '📜' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
  ];

  const renderPersonal = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone" {...register('phone')} />
        <Input label="Location" {...register('location')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="LinkedIn URL" {...register('linkedin')} placeholder="https://linkedin.com/in/..." />
        <Input label="GitHub URL" {...register('github')} placeholder="https://github.com/..." />
      </div>
      <Input label="Website / Portfolio" {...register('website')} placeholder="https://yourwebsite.com" />
      <Textarea label="Professional Summary" {...register('summary')} rows={4} placeholder="Brief overview of your experience and goals..." />
    </div>
  );

  const renderArraySection = (
    fields: any[],
    append: (value: any) => void,
    remove: (index: number) => void,
    move: (from: number, to: number) => void,
    renderItem: (field: any, index: number) => React.ReactNode
  ) => (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={field.id} variant="outlined" className="p-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                <span className="font-medium">{field._fields?.institution || field._fields?.company || field._fields?.name || `Item ${index + 1}`}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4">{renderItem(field, index)}</div>
          </CardContent>
        </Card>
      ))}
      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items added yet. Click "Add" to get started.
        </div>
      )}
      <Button variant="outline" onClick={() => append(getDefaultItem(activeTab))}>
        <Plus className="h-4 w-4 mr-1" />
        Add Item
      </Button>
    </div>
  );

  const getDefaultItem = (tab: string) => {
    switch (tab) {
      case 'education':
        return { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', description: '' };
      case 'experience':
        return { company: '', role: '', startDate: '', endDate: '', current: false, description: '', technologies: '', location: '' };
      case 'projects':
        return { name: '', description: '', technologies: '', link: '', github: '', pipeline: '' };
      case 'certificates':
        return { name: '', issuer: '', date: '', link: '' };
      case 'skills':
        return { name: '', category: '', level: 3 };
      default:
        return {};
    }
  };

  const renderEducation = () => renderArraySection(
    educationFields,
    appendEducation,
    removeEducation,
    moveEducation,
    (field, index) => (
      <Controller
        name={`education.${index}.institution`}
        control={control}
        render={({ field }) => <Input label="Institution" {...field} error={errors.education?.[index]?.institution?.message} />}
      />
      // ... more fields would go here
    )
  );

  // Simplified render for now - full implementation would be lengthy
  const renderDynamicSection = (tab: string) => {
    switch (tab) {
      case 'education':
        return (
          <div className="space-y-4">
            {educationFields.map((field, index) => (
              <Card key={field.id} variant="outlined" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Education #{index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeEducation(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name={`education.${index}.institution`}
                    control={control}
                    render={({ field }) => <Input label="Institution" {...field} />}
                  />
                  <Controller
                    name={`education.${index}.degree`}
                    control={control}
                    render={({ field }) => <Input label="Degree" {...field} />}
                  />
                  <Controller
                    name={`education.${index}.field`}
                    control={control}
                    render={({ field }) => <Input label="Field of Study" {...field} />}
                  />
                  <Controller
                    name={`education.${index}.startDate`}
                    control={control}
                    render={({ field }) => <Input label="Start Date (YYYY-MM)" {...field} />}
                  />
                  <Controller
                    name={`education.${index}.endDate`}
                    control={control}
                    render={({ field }) => <Input label="End Date (YYYY-MM)" {...field} />}
                  />
                  <Controller
                    name={`education.${index}.gpa`}
                    control={control}
                    render={({ field }) => <Input label="GPA" {...field} />}
                  />
                  <Controller
                    name={`education.${index}.description`}
                    control={control}
                    render={({ field }) => <Textarea label="Description" {...field} rows={2} />}
                  />
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={() => appendEducation(getDefaultItem('education'))}>
              <Plus className="h-4 w-4 mr-1" /> Add Education
            </Button>
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-4">
            {experienceFields.map((field, index) => (
              <Card key={field.id} variant="outlined" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Experience #{index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeExperience(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name={`experience.${index}.company`}
                    control={control}
                    render={({ field }) => <Input label="Company" {...field} />}
                  />
                  <Controller
                    name={`experience.${index}.role`}
                    control={control}
                    render={({ field }) => <Input label="Role" {...field} />}
                  />
                  <Controller
                    name={`experience.${index}.startDate`}
                    control={control}
                    render={({ field }) => <Input label="Start Date (YYYY-MM)" {...field} />}
                  />
                  <Controller
                    name={`experience.${index}.endDate`}
                    control={control}
                    render={({ field }) => <Input label="End Date (YYYY-MM)" {...field} />}
                  />
                  <Controller
                    name={`experience.${index}.current`}
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...field} value={true} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
                        <span>Current</span>
                      </label>
                    )}
                  />
                  <Controller
                    name={`experience.${index}.location`}
                    control={control}
                    render={({ field }) => <Input label="Location" {...field} />}
                  />
                  <Controller
                    name={`experience.${index}.technologies`}
                    control={control}
                    render={({ field }) => <Input label="Technologies (comma separated)" {...field} />}
                  />
                  <Controller
                    name={`experience.${index}.description`}
                    control={control}
                    render={({ field }) => <Textarea label="Description" {...field} rows={3} />}
                  />
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={() => appendExperience(getDefaultItem('experience'))}>
              <Plus className="h-4 w-4 mr-1" /> Add Experience
            </Button>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-4">
            {projectFields.map((field, index) => (
              <Card key={field.id} variant="outlined" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Project #{index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeProject(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name={`projects.${index}.name`}
                    control={control}
                    render={({ field }) => <Input label="Project Name" {...field} />}
                  />
                  <Controller
                    name={`projects.${index}.technologies`}
                    control={control}
                    render={({ field }) => <Input label="Technologies (comma separated)" {...field} />}
                  />
                  <Controller
                    name={`projects.${index}.link`}
                    control={control}
                    render={({ field }) => <Input label="Live Demo URL" {...field} placeholder="https://..." />}
                  />
                  <Controller
                    name={`projects.${index}.github`}
                    control={control}
                    render={({ field }) => <Input label="GitHub URL" {...field} placeholder="https://github.com/..." />}
                  />
                  <Controller
                    name={`projects.${index}.pipeline`}
                    control={control}
                    render={({ field }) => <Input label="Pipeline (for movie/apps)" {...field} />}
                  />
                  <Controller
                    name={`projects.${index}.description`}
                    control={control}
                    render={({ field }) => <Textarea label="Description" {...field} rows={3} />}
                  />
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={() => appendProject(getDefaultItem('projects'))}>
              <Plus className="h-4 w-4 mr-1" /> Add Project
            </Button>
          </div>
        );
      case 'certificates':
        return (
          <div className="space-y-4">
            {certificateFields.map((field, index) => (
              <Card key={field.id} variant="outlined" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Certificate #{index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeCertificate(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name={`certificates.${index}.name`}
                    control={control}
                    render={({ field }) => <Input label="Certificate Name" {...field} />}
                  />
                  <Controller
                    name={`certificates.${index}.issuer`}
                    control={control}
                    render={({ field }) => <Input label="Issuer" {...field} />}
                  />
                  <Controller
                    name={`certificates.${index}.date`}
                    control={control}
                    render={({ field }) => <Input label="Date (YYYY-MM)" {...field} />}
                  />
                  <Controller
                    name={`certificates.${index}.link`}
                    control={control}
                    render={({ field }) => <Input label="Credential URL" {...field} placeholder="https://..." />}
                  />
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={() => appendCertificate(getDefaultItem('certificates'))}>
              <Plus className="h-4 w-4 mr-1" /> Add Certificate
            </Button>
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-4">
            {skillFields.map((field, index) => (
              <Card key={field.id} variant="outlined" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Skill #{index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeSkill(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Controller
                    name={`skills.${index}.name`}
                    control={control}
                    render={({ field }) => <Input label="Skill Name" {...field} />}
                  />
                  <Controller
                    name={`skills.${index}.category`}
                    control={control}
                    render={({ field }) => <Input label="Category" {...field} placeholder="Technical, Soft, Language, etc." />}
                  />
                  <Controller
                    name={`skills.${index}.level`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Level (1-5)"
                        options={[
                          { value: '1', label: '1 - Beginner' },
                          { value: '2', label: '2 - Novice' },
                          { value: '3', label: '3 - Intermediate' },
                          { value: '4', label: '4 - Advanced' },
                          { value: '5', label: '5 - Expert' },
                        ]}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={() => appendSkill(getDefaultItem('skills'))}>
              <Plus className="h-4 w-4 mr-1" /> Add Skill
            </Button>
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-gray-600">Manage your personal and professional information</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex gap-0" aria-label="Profile sections">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              {activeTab === 'personal' ? renderPersonal() : renderDynamicSection(activeTab)}

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting || isLoading} disabled={!isDirty}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}