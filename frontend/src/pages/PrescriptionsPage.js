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
import { Textarea } from '../components/ui/textarea';
import { Plus, Pill } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export default function PrescriptionsPage() {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', diagnosis: '', notes: '' });
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '', quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [rx, pats, docs] = await Promise.all([
        axios.get(`${API}/api/prescriptions`),
        axios.get(`${API}/api/patients`),
        axios.get(`${API}/api/doctors`),
      ]);
      setPrescriptions(rx.data); setPatients(pats.data); setDoctors(docs.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addMedicine = () => setMedicines(m => [...m, { name: '', dosage: '', duration: '', quantity: 1 }]);
  const updateMedicine = (i, field, value) => setMedicines(m => m.map((med, idx) => idx === i ? { ...med, [field]: field === 'quantity' ? parseInt(value) || 1 : value } : med));
  const removeMedicine = (i) => setMedicines(m => m.filter((_, idx) => idx !== i));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.diagnosis) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/api/prescriptions`, { ...form, medicines });
      toast.success(t('prescriptionCreated'));
      setDialogOpen(false); setForm({ patient_id: '', doctor_id: '', diagnosis: '', notes: '' }); setMedicines([{ name: '', dosage: '', duration: '', quantity: 1 }]); fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="prescriptions-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('prescriptions')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{prescriptions.length} {t('prescriptionsCount')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white" data-testid="create-prescription-button"><Plus size={16} className="mr-2" /> {t('newPrescription')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>{t('createPrescription')}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t('addDiagnosisMedicines')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="create-prescription-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('patient')}</Label>
                  <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                    <SelectTrigger data-testid="rx-patient-select"><SelectValue placeholder={t('selectPatient')} /></SelectTrigger>
                    <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('doctor')}</Label>
                  <Select value={form.doctor_id} onValueChange={v => setForm(f => ({ ...f, doctor_id: v }))}>
                    <SelectTrigger data-testid="rx-doctor-select"><SelectValue placeholder={t('selectDoctor')} /></SelectTrigger>
                    <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('diagnosis')}</Label>
                <Textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} required data-testid="rx-diagnosis-input" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{t('medicines')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMedicine} data-testid="add-medicine-button"><Plus size={14} className="mr-1" /> {t('add')}</Button>
                </div>
                {medicines.map((med, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end">
                    <div className="space-y-1"><Label className="text-xs">{t('medicineName')}</Label><Input size="sm" value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} data-testid={`med-name-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">{t('dosage')}</Label><Input size="sm" value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} data-testid={`med-dosage-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">{t('duration')}</Label><Input size="sm" value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} data-testid={`med-duration-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">{t('qty')}</Label><Input type="number" size="sm" value={med.quantity} onChange={e => updateMedicine(i, 'quantity', e.target.value)} min={1} data-testid={`med-qty-${i}`} /></div>
                    {medicines.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeMedicine(i)}>{t('remove')}</Button>}
                  </div>
                ))}
              </div>
              <div className="space-y-2"><Label>{t('notesOptional')}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="rx-notes-input" /></div>
              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white" disabled={saving} data-testid="rx-submit-button">{saving ? t('creating') : t('createPrescription')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('id')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('patient')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('doctor')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('diagnosis')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('medicines')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(3)].map((_, i) => <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>)
              : prescriptions.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Pill className="mx-auto mb-2 text-[#0EA5E9]" size={24} />{t('noPrescriptionsYet')}</TableCell></TableRow>
              : prescriptions.map(rx => (
                <TableRow key={rx.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-mono text-muted-foreground">{rx.id}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{rx.patient_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">Dr. {rx.doctor_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rx.diagnosis}</TableCell>
                  <TableCell><div className="flex gap-1 flex-wrap">{rx.medicines?.slice(0, 3).map((m, i) => <Badge key={i} variant="outline" className="text-xs">{m.name}</Badge>)}{(rx.medicines?.length || 0) > 3 && <Badge variant="outline" className="text-xs">+{rx.medicines.length - 3}</Badge>}</div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rx.created_at?.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
