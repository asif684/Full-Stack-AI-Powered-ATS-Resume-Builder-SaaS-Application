import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const watchPassword = watch('password', '');

  const passwordStrengths = [
    { label: 'At least 8 characters', met: watchPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(watchPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(watchPassword) },
    { label: 'One number', met: /[0-9]/.test(watchPassword) },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setAuth(result.user, result.accessToken, result.refreshToken);
      setSuccess('Account created! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">Join Resume Builder AI</p>
        </div>

        <Card variant="outlined">
          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={<User size={18} />}
                {...register('name')}
                error={errors.name?.message}
              />

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
              />

              <div>
                <label className="label">Password</label>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    {...register('password')}
                    error={errors.password?.message}
                    autoComplete="new-password"
                  />
                  <div className="flex flex-wrap gap-2">
                    {passwordStrengths.map((item) => (
                      <span
                        key={item.label}
                        className={`text-xs px-2 py-0.5 rounded ${
                          item.met ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.met ? '✓' : '○'} {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Create Account
              </Button>
            </form>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Shield size={14} />
              <span>Your information will be kept secure</span>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}