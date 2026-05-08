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
import { Search, Plus, ArrowUp, ArrowDown, Package, AlertTriangle } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'http://https://hospital-backend-fvr6.onrender.com';

export default function InventoryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ medicine_name: '', category: '', quantity: '', unit_price: '', threshold: '10', supplier: '' });
  const [stockForm, setStockForm] = useState({ change_type: 'in', quantity: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async (q = '') => {
    try { const { data } = await axios.get(`${API}/api/inventory?search=${q}`); setItems(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { setSearch(e.target.value); fetchItems(e.target.value); };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await axios.post(`${API}/api/inventory`, { ...form, quantity: parseInt(form.quantity), unit_price: parseFloat(form.unit_price), threshold: parseInt(form.threshold) });
      toast.success(t('itemAdded')); setDialogOpen(false); setForm({ medicine_name: '', category: '', quantity: '', unit_price: '', threshold: '10', supplier: '' }); fetchItems(search);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault(); if (!selectedItem) return; setSaving(true);
    try {
      await axios.post(`${API}/api/inventory/${selectedItem.id}/stock`, { ...stockForm, quantity: parseInt(stockForm.quantity) });
      toast.success(t('stockUpdated')); setStockDialogOpen(false); setStockForm({ change_type: 'in', quantity: '', reason: '' }); setSelectedItem(null); fetchItems(search);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  const lowStockCount = items.filter(i => i.quantity <= i.threshold).length;

  return (
    <div data-testid="inventory-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>{t('inventory')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} {t('items')} {lowStockCount > 0 && <span className="text-destructive">({lowStockCount} {t('lowStock')})</span>}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white" data-testid="add-inventory-button"><Plus size={16} className="mr-2" /> {t('addItem')}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>{t('addInventoryItem')}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t('addNewMedicine')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="add-inventory-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t('medicineName2')}</Label><Input value={form.medicine_name} onChange={e => setForm(f => ({ ...f, medicine_name: e.target.value }))} required data-testid="inv-name-input" /></div>
                <div className="space-y-2"><Label>{t('category')}</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Tablet, Syrup" data-testid="inv-category-input" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>{t('quantity')}</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required data-testid="inv-quantity-input" /></div>
                <div className="space-y-2"><Label>{t('unitPrice')} (₹)</Label><Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} required data-testid="inv-price-input" /></div>
                <div className="space-y-2"><Label>{t('lowStockThreshold')}</Label><Input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} data-testid="inv-threshold-input" /></div>
              </div>
              <div className="space-y-2"><Label>{t('supplier')}</Label><Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} data-testid="inv-supplier-input" /></div>
              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white" disabled={saving} data-testid="inv-submit-button">{saving ? t('addingToInventory') : t('addToInventory')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input placeholder={t('searchMedicines')} value={search} onChange={handleSearch} className="pl-10" data-testid="inventory-search-input" />
      </div>

      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>{t('updateStock')} - {selectedItem?.medicine_name}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">{t('adjustStockLevels')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('type')}</Label>
              <Select value={stockForm.change_type} onValueChange={v => setStockForm(f => ({ ...f, change_type: v }))}>
                <SelectTrigger data-testid="stock-type-select"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="in">{t('stockIn')}</SelectItem><SelectItem value="out">{t('stockOut')}</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('quantity')}</Label><Input type="number" value={stockForm.quantity} onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))} required min={1} data-testid="stock-quantity-input" /></div>
            <div className="space-y-2"><Label>{t('reason')}</Label><Input value={stockForm.reason} onChange={e => setStockForm(f => ({ ...f, reason: e.target.value }))} data-testid="stock-reason-input" /></div>
            <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white" disabled={saving} data-testid="stock-submit-button">{saving ? t('updating') : t('updateStock')}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('id')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('medicine')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('category')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('stock')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('price')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('status')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(3)].map((_, i) => <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>)
              : items.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground"><Package className="mx-auto mb-2 text-[#0EA5E9]" size={24} />{t('noData')}</TableCell></TableRow>
              : items.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-mono text-muted-foreground">{item.id}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{item.medicine_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.category || '-'}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{item.quantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">₹{item.unit_price}</TableCell>
                  <TableCell>
                    {item.quantity <= item.threshold ? (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100"><AlertTriangle size={12} className="mr-1" /> {t('lowStockBadge')}</Badge>
                    ) : <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">{t('inStock')}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-[#10B981] hover:text-[#059669]" onClick={() => { setSelectedItem(item); setStockForm({ change_type: 'in', quantity: '', reason: '' }); setStockDialogOpen(true); }} data-testid={`stock-in-${item.id}`}><ArrowUp size={14} /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelectedItem(item); setStockForm({ change_type: 'out', quantity: '', reason: '' }); setStockDialogOpen(true); }} data-testid={`stock-out-${item.id}`}><ArrowDown size={14} /></Button>
                    </div>
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
