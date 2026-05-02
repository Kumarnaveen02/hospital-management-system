import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', date: '', time_slot: '', notes: '' });
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [appts, pats, docs] = await Promise.all([
        axios.get(`${API}/api/appointments`),
        axios.get(`${API}/api/patients`),
        axios.get(`${API}/api/doctors`),
      ]);
      setAppointments(appts.data); setPatients(pats.data); setDoctors(docs.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    try {
      const { data } = await axios.get(`${API}/api/appointments/slots?doctor_id=${doctorId}&date=${date}`);
      setSlots(data.slots || []);
    } catch { setSlots([]); }
  };

  const handleDoctorOrDateChange = (field, value) => {
    const newForm = { ...form, [field]: value, time_slot: '' };
    setForm(newForm);
    if (field === 'doctor_id') fetchSlots(value, newForm.date);
    if (field === 'date') fetchSlots(newForm.doctor_id, value);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.date || !form.time_slot) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/api/appointments`, form);
      toast.success(t('appointmentBooked'));
      setDialogOpen(false); setForm({ patient_id: '', doctor_id: '', date: '', time_slot: '', notes: '' }); setSlots([]); fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to book appointment'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/api/appointments/${id}/status`, { status });
      toast.success(`${t('appointments')} ${status}`); fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to update'); }
  };

  const filteredAppointments = filterStatus ? appointments.filter(a => a.status === filterStatus) : appointments;

  return (
    <div data-testid="appointments-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('appointments')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{appointments.length} {t('totalAppointments')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white" data-testid="book-appointment-button"><Plus size={16} className="mr-2" /> {t('bookAppointment')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>{t('bookNewAppointment')}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t('selectPatientDoctorDate')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="book-appointment-form">
              <div className="space-y-2">
                <Label>{t('patient')}</Label>
                <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                  <SelectTrigger data-testid="appt-patient-select"><SelectValue placeholder={t('selectPatient')} /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('doctor')}</Label>
                <Select value={form.doctor_id} onValueChange={v => handleDoctorOrDateChange('doctor_id', v)}>
                  <SelectTrigger data-testid="appt-doctor-select"><SelectValue placeholder={t('selectDoctor')} /></SelectTrigger>
                  <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.name} ({d.specialization})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('date')}</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="appt-date-picker">
                      <CalendarDays size={16} className="mr-2 text-muted-foreground" />{form.date || t('pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (date) { setSelectedDate(date); handleDoctorOrDateChange('date', format(date, 'yyyy-MM-dd')); setCalendarOpen(false); }}} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
                  </PopoverContent>
                </Popover>
              </div>
              {slots.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('timeSlot')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <Button key={slot} type="button" variant={form.time_slot === slot ? 'default' : 'outline'} size="sm"
                        className={form.time_slot === slot ? 'bg-[#0EA5E9] text-white' : 'text-muted-foreground'}
                        onClick={() => setForm(f => ({ ...f, time_slot: slot }))} data-testid={`slot-${slot}`}>{slot}</Button>
                    ))}
                  </div>
                </div>
              )}
              {form.doctor_id && form.date && slots.length === 0 && <p className="text-sm text-destructive">{t('noSlotsAvailable')}</p>}
              <div className="space-y-2">
                <Label>{t('notesOptional')}</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="appt-notes-input" />
              </div>
              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white" disabled={saving} data-testid="appt-submit-button">{saving ? t('booking') : t('bookAppointment')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {[{ key: '', label: t('all') }, { key: 'scheduled', label: t('scheduled') }, { key: 'completed', label: t('completed') }, { key: 'cancelled', label: t('cancelled') }].map(f => (
          <Button key={f.key} variant={filterStatus === f.key ? 'default' : 'outline'} size="sm"
            className={filterStatus === f.key ? 'bg-[#0EA5E9] text-white' : 'text-muted-foreground'}
            onClick={() => setFilterStatus(f.key)} data-testid={`filter-${f.key || 'all'}`}>{f.label}</Button>
        ))}
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('id')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('patient')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('doctor')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('date')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('time')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('status')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(3)].map((_, i) => <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>)
              : filteredAppointments.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">{t('noAppointmentsFound')}</TableCell></TableRow>
              : filteredAppointments.map(a => (
                <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-mono text-muted-foreground">{a.id}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{a.patient_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">Dr. {a.doctor_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.time_slot}</TableCell>
                  <TableCell>
                    <Badge className={a.status === 'scheduled' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100' : a.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100'}>{a.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {a.status === 'scheduled' && <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669]" onClick={() => updateStatus(a.id, 'completed')} data-testid={`complete-${a.id}`}><CheckCircle size={14} /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => updateStatus(a.id, 'cancelled')} data-testid={`cancel-${a.id}`}><XCircle size={14} /></Button>
                    </div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
