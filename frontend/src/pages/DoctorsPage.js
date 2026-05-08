import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Stethoscope, Mail, Phone, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL || 'http://https://hospital-backend-fvr6.onrender.com';

const AVATAR_COLORS = [
  { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.replace(/^(Dr\.?\s*|Vaidya\s*)/i, '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || '?';
}

export default function DoctorsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await axios.get(`${API}/api/doctors`);
      setDoctors(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/api/doctors`, form);
      toast.success(t('doctorAdded'));
      setDialogOpen(false);
      setForm({ name: '', email: '', password: '', specialization: '', phone: '' });
      fetchDoctors();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add doctor'); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="doctors-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('doctors')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{doctors.length} {t('doctorsRegistered')}</p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white" data-testid="add-doctor-button">
                <Plus size={16} className="mr-2" /> {t('addDoctor')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>{t('addNewDoctor')}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">{t('enterDoctorDetails')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4" data-testid="add-doctor-form">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('fullName')}</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required data-testid="doctor-name-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('specialization')}</Label>
                    <Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} required data-testid="doctor-spec-input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required data-testid="doctor-email-input" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('password')}</Label>
                    <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required data-testid="doctor-password-input" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('phone')}</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} data-testid="doctor-phone-input" />
                </div>
                <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white" disabled={saving} data-testid="doctor-submit-button">
                  {saving ? t('adding') : t('addDoctor')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card className="border border-border shadow-none">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Stethoscope className="mx-auto mb-4 text-[#0EA5E9]" size={40} />
            <p className="text-base font-medium">{t('noDoctorsAdded')}</p>
            <p className="text-sm mt-1">{user?.role === 'admin' ? t('clickAddDoctor') : t('contactAdmin')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map((d, index) => {
            const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const initials = getInitials(d.name);

            return (
              <Card
                key={d.id}
                className="group border border-border shadow-none hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                data-testid={`doctor-card-${d.id}`}
              >
                {/* Top accent bar */}
                <div className={`h-1.5 ${color.bg.replace('bg-', 'bg-').replace('/30', '')}`}
                  style={{ background: index === 0 ? '#0EA5E9' : index === 1 ? '#10B981' : '#8B5CF6' }}
                />

                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-14 h-14 ${color.bg} ${color.text} rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 border-2 ${color.border}`}
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {d.name}
                      </h3>
                      <Badge
                        className="mt-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-md"
                        style={{
                          backgroundColor: index === 0 ? '#EFF6FF' : index === 1 ? '#ECFDF5' : '#F5F3FF',
                          color: index === 0 ? '#1D4ED8' : index === 1 ? '#059669' : '#7C3AED',
                          border: 'none'
                        }}
                      >
                        <Award size={10} className="mr-1" />
                        {d.specialization}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-5 pt-4 border-t border-border space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Mail size={13} className="text-muted-foreground" />
                      </div>
                      <span className="truncate text-[13px]">{d.email}</span>
                    </div>
                    {d.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Phone size={13} className="text-muted-foreground" />
                        </div>
                        <span className="text-[13px]">{d.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
