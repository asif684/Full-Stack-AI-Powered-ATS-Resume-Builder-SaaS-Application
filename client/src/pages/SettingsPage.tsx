import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertCircle, CheckCircle2, Shield, Key, Trash2, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { LLM_PROVIDERS } from '@/lib/providers';
import { cn } from '@/lib/utils';

const ApiKeySchema = z.object({
  provider: z.string(),
  apiKey: z.string().min(1, 'API key required'),
  model: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type ApiKeyForm = z.infer<typeof ApiKeySchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'api-keys' | 'preferences'>('api-keys');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApiKeyForm>({
    resolver: zodResolver(ApiKeySchema),
    defaultValues: {
      provider: '',
      apiKey: '',
      model: '',
      isDefault: false,
    },
  });

  const selectedProvider = watch('provider');
  const providerModels = LLM_PROVIDERS.find(p => p.value === selectedProvider);

  // Load API keys on mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await api.get('/profile/api-keys');
        setApiKeys(response.data.apiKeys || []);
      } catch (err) {
        console.error('Failed to load API keys:', err);
      }
    };
    fetchApiKeys();
  }, []);

  const onSubmitApiKey = async (data: ApiKeyForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/profile/api-keys', data);
      setSuccess('API key saved successfully!');
      reset();
      setValue('isDefault', false);

      // Reload keys
      const response = await api.get('/profile/api-keys');
      setApiKeys(response.data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    if (!confirm(`Delete API key for ${provider}?`)) return;

    setIsLoading(true);
    try {
      await api.delete(`/profile/api-keys/${provider}`);
      setApiKeys(apiKeys.filter(k => k.provider !== provider));
      setSuccess('API key deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••' + key.slice(-4);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-600">Manage your API keys and preferences</p>
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-0" aria-label="Settings sections">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'api-keys'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Key className="h-4 w-4 mr-2 inline" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'preferences'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Shield className="h-4 w-4 mr-2 inline" />
              Preferences
            </button>
          </nav>
        </div>

        {activeTab === 'api-keys' && (
          <>
            {/* Add API Key Form */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold">Add API Key</h2>
                <p className="text-sm text-gray-500">Save API keys for LLM providers to use in resume generation</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmitApiKey)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      label="Provider"
                      options={LLM_PROVIDERS.map(p => ({ value: p.value, label: p.label + (p.free ? ' (Free)' : '') }))}
                      {...register('provider')}
                      error={errors.provider?.message}
                    />
                    <Input
                      label="Model (optional)"
                      {...register('model')}
                      placeholder="e.g., llama-3.1-8b-instant"
                    />
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" {...register('isDefault')} className="h-4 w-4 rounded" />
                        <span className="text-sm">Set as default</span>
                      </label>
                    </div>
                  </div>

                  <Input
                    label="API Key"
                    type={showKey === 'new' ? 'text' : 'password'}
                    {...register('apiKey')}
                    error={errors.apiKey?.message}
                    placeholder="Enter your API key"
                  />

                  <div className="flex items-center gap-2">
                    <Button type="submit" loading={isSubmitting} disabled={!selectedProvider}>
                      <Save className="h-4 w-4 mr-1" />
                      Save API Key
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKey(showKey === 'new' ? null : 'new')}
                    >
                      {showKey === 'new' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Saved API Keys */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Saved API Keys</h2>
                <p className="text-sm text-gray-500">Keys are encrypted and only used for LLM calls</p>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No API keys saved</p>
                    <p className="text-sm text-gray-500 mt-1">Add keys above to use custom LLMs</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.provider}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <Key className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{key.provider}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              {key.model && <span className="badge-gray text-xs">{key.model}</span>}
                              {key.isDefault && <span className="badge-primary text-xs">Default</span>}
                              <span className="font-mono text-xs">{maskKey(key.encryptedKey || '••••')}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteApiKey(key.provider)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Providers Reference */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-lg font-semibold">Available Providers</h2>
                <p className="text-sm text-gray-500">Free models with low latency are recommended</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {LLM_PROVIDERS.map((provider) => (
                    <div
                      key={provider.value}
                      className={cn(
                        'p-3 rounded-lg border transition-colors',
                        provider.free ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{provider.label}</span>
                        {provider.free && <span className="badge-success text-xs">Free</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Preferences</h2>
              <p className="text-sm text-gray-500">Configure your default settings</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Default LLM Provider</h3>
                <p className="text-sm text-gray-500 mb-3">Used when selecting "System Prompt" option</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LLM_PROVIDERS.filter(p => p.free).map((provider) => (
                    <label
                      key={provider.value}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-colors',
                        'border-gray-200 hover:border-primary-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="defaultProvider"
                        value={provider.value}
                        className="h-4 w-4 text-primary-600"
                      />
                      <span className="ml-2 font-medium">{provider.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-medium mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    <span className="text-sm">Encrypt API keys in database (recommended)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    <span className="text-sm">Auto-delete resume history after 90 days</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    <span className="text-sm">Share anonymous usage analytics</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}