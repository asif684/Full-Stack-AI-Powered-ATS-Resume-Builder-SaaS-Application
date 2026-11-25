import { Link } from 'react-router-dom';
import { FileText, Plus, Clock, History, TrendingUp, Target } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: resumeHistory } = useQuery({
    queryKey: ['resumeHistory'],
    queryFn: () => api.get('/resume/history').then((res) => res.data),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((res) => res.data),
  });

  const stats = {
    totalResumes: resumeHistory?.resumes?.length || 0,
    completedProfiles: profile?.profile?.name ? 1 : 0,
    projectsCount: profile?.profile?.projects?.length || 0,
    certificatesCount: profile?.profile?.certificates?.length || 0,
  };

  const recentResumes = resumeHistory?.resumes?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || 'there'}!</h1>
            <p className="mt-1 text-gray-600">Here's what's happening with your resume building.</p>
          </div>
          <Link to="/resume-builder">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Build New Resume
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{stats.totalResumes}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{stats.completedProfiles ? 'Yes' : 'No'}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl text-green-600">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projects</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{stats.projectsCount}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Certificates</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{stats.certificatesCount}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
          <Link to="/resume-builder" className="block">
            <Card variant="outlined" className="hover:border-primary-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Build New Resume</h3>
                    <p className="mt-1 text-gray-600">Create a tailored resume for a job description</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/profile" className="block">
            <Card variant="outlined" className="hover:border-primary-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-xl text-green-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Complete Profile</h3>
                    <p className="mt-1 text-gray-600">Add your experience, projects, and skills</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/settings" className="block">
            <Card variant="outlined" className="hover:border-primary-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                    <p className="mt-1 text-gray-600">Manage API keys and preferences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Resumes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Resumes</h2>
              <Link to="/resume-builder" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentResumes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No resumes created yet</p>
                <p className="text-sm text-gray-500 mt-1">Start by building your first resume</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResumes.map((resume: any) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {resume.jobDescription.slice(0, 80)}...
                        </p>
                        <p className="text-sm text-gray-500">
                          Created {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/resume-builder?id=${resume.id}`}
                      className="text-primary-600 hover:text-primary-500 font-medium"
                    >
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Completion Progress */}
        {profile?.profile && Object.keys(profile.profile).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Profile Completion</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Profile Information</span>
                    <span className="text-gray-500">
                      {Object.values(profile.profile).filter(Boolean).length} / {Object.keys(profile.profile).length}
                    </span>
                  </div>
                  <Progress
                    current={Object.values(profile.profile).filter(Boolean).length}
                    total={Object.keys(profile.profile).length}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600">{profile.profile.education?.length || 0}</p>
                    <p className="text-sm text-gray-600">Education</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{profile.profile.experience?.length || 0}</p>
                    <p className="text-sm text-gray-600">Experience</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{profile.profile.projects?.length || 0}</p>
                    <p className="text-sm text-gray-600">Projects</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{profile.profile.certificates?.length || 0}</p>
                    <p className="text-sm text-gray-600">Certificates</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}