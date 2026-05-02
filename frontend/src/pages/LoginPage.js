import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, Mail } from 'lucide-react';

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map(e => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
        style={{
          backgroundImage: 'url(https://customer-assets.emergentagent.com/job_health-inventory-hub-1/artifacts/1gr0ha6a_403889048_670648715155502_7494479213043444718_n.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f0ece4'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#f0ece4]/30 via-transparent to-[#f0ece4]/30" />
        <div className="relative z-10 mt-auto mb-8 text-center px-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2 drop-shadow-lg" style={{ fontFamily: 'Manrope, sans-serif', color: '#1a3a6b' }}>
            {t('hospitalName1')} {t('hospitalName2')}
          </h1>
          <p className="text-[#1a3a6b]/70 text-base max-w-md mx-auto font-medium">
            {t('hospitalLoginDesc')}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border border-border shadow-none">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-12 h-12 bg-[#0EA5E9] rounded-xl flex items-center justify-center">
              <Lock className="text-white" size={22} />
            </div>
            <CardTitle className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('signIn')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('enterCredentials')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" data-testid="login-error">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">{t('password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="login-password-input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium h-11"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? t('signingIn') : t('signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
