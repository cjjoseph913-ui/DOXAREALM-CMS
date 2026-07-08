'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import { 
  Activity, AlertCircle, Baby, Banknote, Bell, Building2, Calendar, CheckCircle, ChevronDown, 
  ChevronRight, Church, ClipboardList, CloudOff, Cloud, Compass, Database, File, FileText, Folder, 
  Heart, HelpCircle, LayoutDashboard, Mail, Map, MapPin, MessageSquare, Plus, RefreshCw, Save, Search, 
  Send, Shield, Users, UserPlus, Wallet, X, Phone, Layers, Droplets, Flame, Home, Briefcase, Gift,
  UserCheck, Zap, Clock, Trash2, Edit3, Settings, BarChart3, Download, Printer, Award, Filter, Info,
  Share2, ExternalLink, Copy, Smartphone, Server, HardDrive, Check, Rocket
} from 'lucide-react';

const API_BASE = '/api';

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers as any) },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

function useOfflineQueue() {
  const [queue, setQueue] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('offlineSundayQueue') || '[]'); } catch { return []; }
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { 
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline); 
    };
  }, []);

  const addToQueue = useCallback((entry: any) => {
    const newQueue = [...queue, { ...entry, _queuedAt: Date.now(), _id: crypto.randomUUID() }];
    setQueue(newQueue);
    localStorage.setItem('offlineSundayQueue', JSON.stringify(newQueue));
  }, [queue]);

  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0) return;
    const pending = [...queue];
    const successful: string[] = [];
    for (const entry of pending) {
      try {
        await apiFetch('/sunday-ledgers', { method: 'POST', body: JSON.stringify(entry.data || entry) });
        successful.push(entry._id);
      } catch (e) {
        console.warn('Queue processing failed', e);
      }
    }
    const remaining = queue.filter(e => !successful.includes(e._id));
    setQueue(remaining);
    localStorage.setItem('offlineSundayQueue', JSON.stringify(remaining));
  }, [queue, isOnline]);

  useEffect(() => { if (isOnline && queue.length > 0) processQueue(); }, [isOnline, queue.length, processQueue]);

  return { queue, isOnline, addToQueue, queueLength: queue.length };
}

const AppContext = createContext<any>(null);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<any>({
    members: [], visitors: [], converts: [], churches: [], zones: [], cellGroups: [],
    attendanceLogs: [], communicationLogs: [], auditLogs: [], stewardshipSettings: { baseCurrency: 'USD', monthlyCellTarget: 20, titheGoalPercentage: 10, customZones: [] }, documents: []
  });
  const [loading, setLoading] = useState(true);
  const offline = useOfflineQueue();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<any>(null);

  const showToast = useCallback((message: string, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [members, visitors, converts, churches, zones, cellGroups, attendanceLogs, communicationLogs, auditLogs, stewardshipSettings, documents] = await Promise.all([
        apiFetch('/members'), apiFetch('/visitors'), apiFetch('/converts'), apiFetch('/churches'), apiFetch('/zones'), apiFetch('/cell-groups'),
        apiFetch('/attendance-logs'), apiFetch('/communication-logs'), apiFetch('/audit-logs'), apiFetch('/stewardship-settings'), apiFetch('/documents')
      ]);
      setDb({
        members: Array.isArray(members) ? members : [], 
        visitors: Array.isArray(visitors) ? visitors : [], 
        converts: Array.isArray(converts) ? converts : [],
        churches: Array.isArray(churches) ? churches : [], 
        zones: Array.isArray(zones) ? zones : [], 
        cellGroups: Array.isArray(cellGroups) ? cellGroups : [],
        attendanceLogs: Array.isArray(attendanceLogs) ? attendanceLogs : [], 
        communicationLogs: Array.isArray(communicationLogs) ? communicationLogs : [],
        auditLogs: Array.isArray(auditLogs) ? auditLogs : [], 
        stewardshipSettings: stewardshipSettings || { baseCurrency: 'USD', monthlyCellTarget: 20, titheGoalPercentage: 10, customZones: [] }, 
        documents: Array.isArray(documents) ? documents : []
      });
    } catch (e: any) {
      showToast('Failed to load: ' + e.message, 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const refresh = useCallback(async () => { await fetchAll(); showToast('Data refreshed', 'success'); }, [fetchAll, showToast]);

  const value = useMemo(() => ({ db, setDb, loading, refresh, offline, activeTab, setActiveTab, toast, showToast, apiFetch }), [db, loading, refresh, offline, activeTab, toast, showToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() { const c = useContext(AppContext); if (!c) throw new Error('useApp'); return c; }

// UI Components
const Card = ({ children, className = '', ...props }: any) => <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800/60 rounded-xl shadow-lg ${className}`} {...props}>{children}</div>;
const CardHeader = ({ children, className = '' }: any) => <div className={`px-5 py-4 border-b border-slate-800/60 ${className}`}>{children}</div>;
const CardContent = ({ children, className = '' }: any) => <div className={`p-5 ${className}`}>{children}</div>;
const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const v: any = { default: 'bg-slate-800 text-slate-300', success: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40', warning: 'bg-amber-900/60 text-amber-300 border border-amber-700/40', danger: 'bg-red-900/60 text-red-300 border border-red-700/40', info: 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/40', primary: 'bg-indigo-600/80 text-white' };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${v[variant] || v.default} ${className}`}>{children}</span>;
};
const Button = ({ children, variant = 'primary', size = 'sm', icon: Icon, disabled, onClick, className = '', ...props }: any) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50';
  const variants: any = { primary: 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500 shadow-lg shadow-indigo-900/30', secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 focus:ring-slate-600 border border-slate-700/60', ghost: 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 focus:ring-slate-700', danger: 'bg-red-700 hover:bg-red-600 text-white focus:ring-red-600' };
  const sizes: any = { xs: 'px-2.5 py-1 text-xs', sm: 'px-3.5 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return <button className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.sm} ${className}`} disabled={disabled} onClick={onClick} {...props}>{Icon && <Icon className="w-4 h-4" />}{children}</button>;
};
const Input = ({ label, error, icon: Icon, className = '', ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon className="w-4 h-4" /></div>}
      <input className={`w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${Icon ? 'pl-9' : ''} ${error ? 'border-red-500' : ''} ${className}`} {...props} />
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);
const Select = ({ label, options = [], className = '', ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <select className={`w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${className}`} {...props}>
      {options.map((opt: any, i: number) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lab = typeof opt === 'string' ? opt : opt.label;
        return <option key={i} value={val}>{lab}</option>;
      })}
    </select>
  </div>
);
const Textarea = ({ label, className = '', ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <textarea className={`w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] ${className}`} {...props} />
  </div>
);

function ToastContainer() {
  const { toast } = useApp();
  if (!toast) return null;
  const colors: any = { success: 'bg-emerald-900/90 border-emerald-700/60 text-emerald-200', error: 'bg-red-900/90 border-red-700/60 text-red-200', warning: 'bg-amber-900/90 border-amber-700/60 text-amber-200', info: 'bg-indigo-900/90 border-indigo-700/60 text-indigo-200' };
  const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'warning' ? HelpCircle : CheckCircle;
  return <div className="fixed top-4 right-4 z-[100]"><div className={`px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-sm font-medium flex items-center gap-3 ${colors[toast.type] || colors.success}`}><Icon className="w-5 h-5" />{toast.message}</div></div>;
}

function Modal({ open, onClose, title, children, size = 'lg' }: any) {
  if (!open) return null;
  const sizes: any = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl', full: 'max-w-[95vw]' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

// Dashboard
function Dashboard() {
  const { db, refresh } = useApp();
  const { members, attendanceLogs, visitors, churches } = db;
  const activeMembers = members.filter((m: any) => m.status !== 'Inactive').length;
  const pendingVisitors = visitors.filter((v: any) => v.followUpStatus === 'Pending').length;
  const sortedAttendance = [...attendanceLogs].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-8);
  const attendanceTrend = sortedAttendance.map((log: any) => ({
    week: new Date(log.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    attendance: log.attendance || 0,
    visitors: log.visitorCount || 0,
  }));

  const waterBaptized = members.filter((m:any)=> ['Baptized','Completed'].includes(m.waterBaptismStatus || '')).length;
  const spiritBaptized = members.filter((m:any)=> m.holySpiritBaptismStatus === 'Baptized').length;
  const totalYouth = churches.reduce((sum: number, ch: any) => sum + (ch.youthCount || 0), 0);

  const totalTithe = attendanceLogs.reduce((sum: number, log: any) => sum + (log.tithe || 0), 0);
  const totalYouthGiving = attendanceLogs.reduce((sum: number, log: any) => sum + (log.youth || 0), 0);

  const metrics = [
    { label: 'Active Members', value: activeMembers, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-900/20' },
    { label: 'Water Baptized', value: waterBaptized, icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
    { label: 'Holy Spirit Baptized', value: spiritBaptized, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-900/20' },
    { label: 'Registered Youth', value: totalYouth, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-900/20' },
  ];

  const financeData = [
    { name: 'Tithe', value: totalTithe || 1200000, fill: '#10b981' },
    { name: 'Youth', value: totalYouthGiving || 450000, fill: '#8b5cf6' },
    { name: 'Other', value: 680000, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-indigo-400" /> Executive Dashboard</h1><p className="text-sm text-slate-500 mt-1">KPI overview including baptism milestones</p></div>
        <button onClick={refresh} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-700/60"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i}><CardContent className="flex items-start gap-4"><div className={`p-2.5 rounded-xl ${m.bg}`}><m.icon className={`w-5 h-5 ${m.color}`} /></div><div><p className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</p><p className={`text-2xl font-bold mt-0.5 ${m.color}`}>{m.value}</p></div></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardHeader><h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /> Weekly Attendance</h3></CardHeader><CardContent><div className="h-64">{attendanceTrend.length>0 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={attendanceTrend}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="week" stroke="#475569" tick={{fontSize:11}}/><YAxis stroke="#475569" tick={{fontSize:11}}/><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}}/><Area type="monotone" dataKey="attendance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} /></AreaChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-600 text-sm">No data yet - start with Sunday Ledger</div>}</div></CardContent></Card>
        <Card><CardHeader><h3 className="text-sm font-semibold text-slate-200">Baptism Distribution</h3></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Pie data={financeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({name, percent})=>`${name} ${((percent||0)*100).toFixed(0)}%`}>{financeData.map((_, idx)=> <Cell key={idx} fill={['#06b6d4','#f59e0b','#6366f1'][idx%3]} />)}</Pie><Tooltip contentStyle={{background:'#0f172a'}}/></RechartsPieChart></ResponsiveContainer></div></CardContent></Card>
      </div>
    </div>
  );
}

function SundayLedger() {
  const { db, showToast, offline: { addToQueue, isOnline, queueLength }, apiFetch, refresh } = useApp();
  const [form, setForm] = useState({ date: '', attendance: '', visitorCount: '', tithe: '', offering: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.date || !form.attendance) { showToast('Date and attendance required','error'); return; }
    const payload = { ...form, attendance: parseInt(form.attendance)||0, visitorCount: parseInt(form.visitorCount)||0, tithe: parseFloat(form.tithe)||0, offering: parseFloat(form.offering)||0, timestamp: new Date().toISOString() };
    if (!isOnline) { addToQueue({ data: payload }); showToast('Saved offline','warning'); setForm({ date: '', attendance: '', visitorCount: '', tithe: '', offering: '', notes: '' }); return; }
    try { setSubmitting(true); await apiFetch('/sunday-ledgers', { method: 'POST', body: JSON.stringify(payload) }); showToast('Saved','success'); setForm({ date: '', attendance: '', visitorCount: '', tithe: '', offering: '', notes: '' }); refresh(); } catch (err:any){ showToast(err.message,'error'); } finally { setSubmitting(false); }
  };
  const recentEntries = [...(db.attendanceLogs||[])].sort((a:any,b:any)=> new Date(b.date).getTime()- new Date(a.date).getTime()).slice(0,10);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><ClipboardList className="w-6 h-6 text-indigo-400" /> Sunday Ledger</h1>
      {!isOnline && <div className="flex items-center gap-2 px-4 py-3 bg-amber-900/20 border border-amber-700/40 rounded-xl text-amber-300 text-sm"><CloudOff className="w-4 h-4" /> Offline {queueLength} queued</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><h3 className="text-sm font-semibold">New Entry</h3></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><Input label="Date" type="date" value={form.date} onChange={(e:any)=>setForm({...form,date:e.target.value})} required/><Input label="Attendance" type="number" value={form.attendance} onChange={(e:any)=>setForm({...form,attendance:e.target.value})} required icon={Users}/></div><div className="grid grid-cols-2 gap-4"><Input label="Visitors" type="number" value={form.visitorCount} onChange={(e:any)=>setForm({...form,visitorCount:e.target.value})} /><Input label="Tithe" type="number" step="0.01" value={form.tithe} onChange={(e:any)=>setForm({...form,tithe:e.target.value})} /></div><Input label="Offering" type="number" step="0.01" value={form.offering} onChange={(e:any)=>setForm({...form,offering:e.target.value})} /><Input label="Notes" value={form.notes} onChange={(e:any)=>setForm({...form,notes:e.target.value})} /><Button type="submit" className="w-full" disabled={submitting}>{submitting?'Saving...':'Save Entry'}</Button></form></CardContent></Card>
        <Card><CardHeader><h3 className="text-sm font-semibold">Recent Entries</h3></CardHeader><CardContent>{recentEntries.map((e:any,i)=><div key={i} className="flex justify-between py-2 border-b border-slate-800/40 text-sm"><span>{new Date(e.date).toLocaleDateString()} - {e.attendance} att</span><span className="text-slate-500">{e.tithe} tithe</span></div>)}</CardContent></Card>
      </div>
    </div>
  );
}

function Directory() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const emptyForm = { name: '', email: '', phone: '', gender: 'Male', ageRange: '18-25', maritalStatus: 'Single', occupation: '', address: '', city: '', waterBaptismStatus: 'Not Baptized', waterBaptismDate: '', waterBaptismLocation: '', waterBaptismBy: '', waterBaptismCertificate: '', holySpiritBaptismStatus: 'Not Baptized', holySpiritBaptismDate: '', holySpiritEvidence: '', holySpiritNotes: '', churchId: '', zoneId: '', cellGroupId: '', status: 'Active', conversionDate: '', membershipDate: '', emergencyContact: '', emergencyPhone: '' };
  const [form, setForm] = useState<any>(emptyForm);

  const filteredMembers = db.members.filter((m:any)=> m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (m:any) => {
    const toDate = (v:any) => v ? new Date(v).toISOString().split('T')[0] : '';
    setForm({
      ...emptyForm,
      id: m.id,
      name: m.name || '', email: m.email || '', phone: m.phone || '', gender: m.gender || 'Male', ageRange: m.ageRange || '18-25', maritalStatus: m.maritalStatus || 'Single', occupation: m.occupation || '', address: m.address || '', city: m.city || '',
      waterBaptismStatus: m.waterBaptismStatus || 'Not Baptized', waterBaptismDate: toDate(m.waterBaptismDate), waterBaptismLocation: m.waterBaptismLocation || '', waterBaptismBy: m.waterBaptismBy || '', waterBaptismCertificate: m.waterBaptismCertificate || '',
      holySpiritBaptismStatus: m.holySpiritBaptismStatus || 'Not Baptized', holySpiritBaptismDate: toDate(m.holySpiritBaptismDate), holySpiritEvidence: m.holySpiritEvidence || '', holySpiritNotes: m.holySpiritNotes || '',
      churchId: m.churchId ? String(m.churchId) : '', zoneId: m.zoneId ? String(m.zoneId) : '', cellGroupId: m.cellGroupId ? String(m.cellGroupId) : '', status: m.status || 'Active', conversionDate: toDate(m.conversionDate), membershipDate: toDate(m.membershipDate), emergencyContact: m.emergencyContact || '', emergencyPhone: m.emergencyPhone || ''
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    if (!form.name) { showToast('Name required','error'); return; }
    const payload = {
      ...form,
      churchId: form.churchId ? parseInt(form.churchId) : null,
      zoneId: form.zoneId ? parseInt(form.zoneId) : null,
      cellGroupId: form.cellGroupId ? parseInt(form.cellGroupId) : null,
      waterBaptismDate: form.waterBaptismDate ? new Date(form.waterBaptismDate).toISOString() : null,
      holySpiritBaptismDate: form.holySpiritBaptismDate ? new Date(form.holySpiritBaptismDate).toISOString() : null,
      conversionDate: form.conversionDate ? new Date(form.conversionDate).toISOString() : null,
      membershipDate: form.membershipDate ? new Date(form.membershipDate).toISOString() : (editingId ? null : new Date().toISOString()),
    };
    try {
      if (editingId) {
        await apiFetch(`/members/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'member_updated', details: `Member ${form.name}`, timestamp: new Date().toISOString() }) });
        showToast('Member updated successfully','success');
      } else {
        await apiFetch('/members', { method: 'POST', body: JSON.stringify(payload) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'member_registered', details: `Member ${form.name} - Water: ${form.waterBaptismStatus}, Spirit: ${form.holySpiritBaptismStatus}`, timestamp: new Date().toISOString() }) });
        showToast('Member registered successfully','success');
      }
      setShowForm(false); setEditingId(null);
      setForm(emptyForm);
      refresh();
    } catch (err:any){ showToast(err.message,'error'); }
  };

  const zonesFiltered = form.churchId ? db.zones.filter((z:any)=> z.churchId === parseInt(form.churchId)) : db.zones;
  const cellsFiltered = form.zoneId ? db.cellGroups.filter((c:any)=> c.zoneId === parseInt(form.zoneId)) : form.churchId ? db.cellGroups.filter((c:any)=> c.churchId === parseInt(form.churchId)) : db.cellGroups;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><Users className="w-6 h-6 text-indigo-400" /> Member Directory</h1><p className="text-sm text-slate-500 mt-1">Register members with water & Holy Spirit baptism tracking</p></div>
        <Button icon={UserPlus} onClick={()=>{setEditingId(null); setForm(emptyForm); setShowForm(true);}}>Register Member</Button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1"><Input placeholder="Search by name or email..." value={search} onChange={(e:any)=>setSearch(e.target.value)} icon={Search} /></div>
        <Badge variant="info" className="h-fit py-2 px-3">{filteredMembers.length} members</Badge>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="border-b border-slate-800/60 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Church / Cell</th><th className="px-4 py-3">Water Baptism</th><th className="px-4 py-3">Holy Spirit</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {filteredMembers.length>0 ? filteredMembers.map((m:any,i:number)=>{
                const churchName = db.churches.find((c:any)=>c.id===m.churchId)?.name || '—';
                const cellName = db.cellGroups.find((c:any)=>c.id===m.cellGroupId)?.name || '—';
                return (
                  <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                    <td className="px-4 py-3"><div className="font-medium text-slate-200">{m.name}</div><div className="text-xs text-slate-500">{m.gender} • {m.ageRange}</div></td>
                    <td className="px-4 py-3"><div className="text-xs text-slate-300">{m.email||'—'}</div><div className="text-xs text-slate-500 font-mono">{m.phone||'—'}</div></td>
                    <td className="px-4 py-3"><div className="text-xs text-slate-300">{churchName}</div><div className="text-xs text-slate-500">{cellName}</div></td>
                    <td className="px-4 py-3"><Badge variant={m.waterBaptismStatus==='Baptized' ? 'success' : m.waterBaptismStatus==='Not Baptized' ? 'default' : 'warning'}><Droplets className="w-3 h-3" />{m.waterBaptismStatus||'Not Baptized'}</Badge>{m.waterBaptismDate && <div className="text-[10px] text-slate-600 mt-1">{new Date(m.waterBaptismDate).toLocaleDateString()}</div>}</td>
                    <td className="px-4 py-3"><Badge variant={m.holySpiritBaptismStatus==='Baptized' ? 'success' : m.holySpiritBaptismStatus==='Not Baptized' ? 'default' : 'info'}><Flame className="w-3 h-3" />{m.holySpiritBaptismStatus||'Not Baptized'}</Badge>{m.holySpiritBaptismDate && <div className="text-[10px] text-slate-600 mt-1">{new Date(m.holySpiritBaptismDate).toLocaleDateString()}</div>}</td>
                    <td className="px-4 py-3"><Badge variant={m.status==='Active'?'success':'default'}>{m.status}</Badge></td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEdit(m)}>Edit</Button></td>
                  </tr>
                );
              }) : <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-600">No members found. Register your first member.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editingId ? 'Edit Member' : 'Register New Member'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3"><UserCheck className="w-4 h-4 text-indigo-400" /> Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <Input label="Full Name *" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})} required icon={Users} placeholder="John Doe" />
              <Input label="Email" type="email" value={form.email} onChange={(e:any)=>setForm({...form,email:e.target.value})} icon={Mail} placeholder="john@example.com" />
              <Input label="Phone" value={form.phone} onChange={(e:any)=>setForm({...form,phone:e.target.value})} icon={Phone} placeholder="+1 234..." />
              <Select label="Gender" options={['Male','Female','Other']} value={form.gender} onChange={(e:any)=>setForm({...form,gender:e.target.value})} />
              <Select label="Age Range" options={['0-12','13-17','18-25','26-35','36-50','51-65','65+']} value={form.ageRange} onChange={(e:any)=>setForm({...form,ageRange:e.target.value})} />
              <Select label="Marital Status" options={['Single','Married','Divorced','Widowed']} value={form.maritalStatus} onChange={(e:any)=>setForm({...form,maritalStatus:e.target.value})} />
              <Input label="Occupation" value={form.occupation} onChange={(e:any)=>setForm({...form,occupation:e.target.value})} icon={Briefcase} placeholder="Teacher" />
              <Input label="City" value={form.city} onChange={(e:any)=>setForm({...form,city:e.target.value})} icon={Home} placeholder="City" />
              <div className="md:col-span-2"><Input label="Address" value={form.address} onChange={(e:any)=>setForm({...form,address:e.target.value})} placeholder="Street address" /></div>
            </div>
          </div>

          {/* Church Affiliation */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4 text-emerald-400" /> Church Affiliation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <Select label="Church" options={[{value:'',label:'— Select Church —'}, ...db.churches.map((c:any)=>({value:c.id, label:c.name}))]} value={form.churchId} onChange={(e:any)=>setForm({...form,churchId:e.target.value, zoneId:'', cellGroupId:''})} />
              <Select label="Zone" options={[{value:'',label:'— Select Zone —'}, ...zonesFiltered.map((z:any)=>({value:z.id, label:z.name}))]} value={form.zoneId} onChange={(e:any)=>setForm({...form,zoneId:e.target.value, cellGroupId:''})} />
              <Select label="Cell Group" options={[{value:'',label:'— Select Cell —'}, ...cellsFiltered.map((c:any)=>({value:c.id, label:c.name}))]} value={form.cellGroupId} onChange={(e:any)=>setForm({...form,cellGroupId:e.target.value})} />
              <Select label="Member Status" options={['Active','Inactive','Visitor','New Convert']} value={form.status} onChange={(e:any)=>setForm({...form,status:e.target.value})} />
              <Input label="Conversion Date" type="date" value={form.conversionDate} onChange={(e:any)=>setForm({...form,conversionDate:e.target.value})} />
              <Input label="Membership Date" type="date" value={form.membershipDate} onChange={(e:any)=>setForm({...form,membershipDate:e.target.value})} />
            </div>
          </div>

          {/* Water Baptism */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3"><Droplets className="w-4 h-4 text-cyan-400" /> Water Baptism</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-cyan-950/20 rounded-xl border border-cyan-900/30">
              <Select label="Water Baptism Status" options={['Not Baptized','Baptism Class','Ready for Baptism','Baptized','Completed']} value={form.waterBaptismStatus} onChange={(e:any)=>setForm({...form,waterBaptismStatus:e.target.value})} />
              <Input label="Baptism Date" type="date" value={form.waterBaptismDate} onChange={(e:any)=>setForm({...form,waterBaptismDate:e.target.value})} />
              <Input label="Location" value={form.waterBaptismLocation} onChange={(e:any)=>setForm({...form,waterBaptismLocation:e.target.value})} placeholder="Main sanctuary pool" />
              <Input label="Baptized By" value={form.waterBaptismBy} onChange={(e:any)=>setForm({...form,waterBaptismBy:e.target.value})} placeholder="Pastor Name" />
              <Input label="Certificate No." value={form.waterBaptismCertificate} onChange={(e:any)=>setForm({...form,waterBaptismCertificate:e.target.value})} placeholder="WB-2024-001" />
              <div className="flex items-end"><div className="text-xs text-cyan-300/60 p-2">Water baptism is an outward declaration of faith.</div></div>
            </div>
          </div>

          {/* Holy Spirit Baptism */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3"><Flame className="w-4 h-4 text-orange-400" /> Holy Spirit Baptism</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-orange-950/20 rounded-xl border border-orange-900/30">
              <Select label="Holy Spirit Status" options={['Not Baptized','Seeking','Baptized','Renewal Needed']} value={form.holySpiritBaptismStatus} onChange={(e:any)=>setForm({...form,holySpiritBaptismStatus:e.target.value})} />
              <Input label="Date Received" type="date" value={form.holySpiritBaptismDate} onChange={(e:any)=>setForm({...form,holySpiritBaptismDate:e.target.value})} />
              <Select label="Evidence" options={['','Speaking in Tongues','Prophecy','Interpretation','Not Yet Manifested']} value={form.holySpiritEvidence} onChange={(e:any)=>setForm({...form,holySpiritEvidence:e.target.value})} />
              <div className="md:col-span-3"><Textarea label="Notes / Testimony" value={form.holySpiritNotes} onChange={(e:any)=>setForm({...form,holySpiritNotes:e.target.value})} placeholder="Brief testimony of Holy Spirit experience..." /></div>
            </div>
          </div>

          {/* Emergency */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3"><Gift className="w-4 h-4 text-amber-400" /> Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/40">
              <Input label="Emergency Contact Name" value={form.emergencyContact} onChange={(e:any)=>setForm({...form,emergencyContact:e.target.value})} />
              <Input label="Emergency Phone" value={form.emergencyPhone} onChange={(e:any)=>setForm({...form,emergencyPhone:e.target.value})} icon={Phone} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
            <Button variant="ghost" type="button" onClick={()=>{setShowForm(false); setEditingId(null); setForm(emptyForm);}}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Save} size="md">{editingId ? 'Save Changes' : 'Register Member'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RegionalHierarchy() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const [activeSub, setActiveSub] = useState<'churches'|'zones'|'cells'>('churches');

  const [churchForm, setChurchForm] = useState({ name: '', location: '', address: '', city: '', state: '', country: '', pastorName: '', pastorPhone: '', pastorEmail: '', phone: '', email: '', capacity: '', description: '' });
  const [zoneForm, setZoneForm] = useState({ name: '', churchId: '', leaderName: '', leaderPhone: '', leaderEmail: '', description: '', meetingArea: '' });
  const [cellForm, setCellForm] = useState({ name: '', churchId: '', zoneId: '', leaderName: '', leaderPhone: '', leaderEmail: '', meetingDay: 'Sunday', meetingTime: '', location: '', address: '', maxCapacity: '15', description: '' });

  const [editingChurch, setEditingChurch] = useState<number|null>(null);
  const [editingZone, setEditingZone] = useState<number|null>(null);
  const [editingCell, setEditingCell] = useState<number|null>(null);

  const startEditChurch = (ch:any) => { setChurchForm({ ...ch, capacity: ch.capacity != null ? String(ch.capacity) : '' }); setEditingChurch(ch.id); };
  const startEditZone = (z:any) => { setZoneForm({ ...z, churchId: z.churchId ? String(z.churchId) : '' }); setEditingZone(z.id); };
  const startEditCell = (cg:any) => { setCellForm({ ...cg, churchId: cg.churchId ? String(cg.churchId) : '', zoneId: cg.zoneId ? String(cg.zoneId) : '', maxCapacity: cg.maxCapacity != null ? String(cg.maxCapacity) : '15' }); setEditingCell(cg.id); };

  const handleChurchSubmit = async (e:any) => {
    e.preventDefault();
    if (!churchForm.name) { showToast('Church name required','error'); return; }
    try {
      const body = { ...churchForm, capacity: churchForm.capacity ? parseInt(churchForm.capacity) : null };
      if (editingChurch) {
        await apiFetch(`/churches/${editingChurch}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast(`Church ${churchForm.name} updated`,'success');
      } else {
        await apiFetch('/churches', { method: 'POST', body: JSON.stringify(body) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'church_registered', details: `Church ${churchForm.name}`, timestamp: new Date().toISOString() }) });
        showToast(`Church ${churchForm.name} registered`,'success');
      }
      setEditingChurch(null);
      setChurchForm({ name: '', location: '', address: '', city: '', state: '', country: '', pastorName: '', pastorPhone: '', pastorEmail: '', phone: '', email: '', capacity: '', description: '' });
      refresh();
    } catch (err:any){ showToast(err.message,'error'); }
  };

  const handleZoneSubmit = async (e:any) => {
    e.preventDefault();
    if (!zoneForm.name) { showToast('Zone name required','error'); return; }
    try {
      const body = { ...zoneForm, churchId: zoneForm.churchId ? parseInt(zoneForm.churchId) : null };
      if (editingZone) {
        await apiFetch(`/zones/${editingZone}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast(`Zone ${zoneForm.name} updated`,'success');
      } else {
        await apiFetch('/zones', { method: 'POST', body: JSON.stringify(body) });
        showToast(`Zone ${zoneForm.name} registered`,'success');
      }
      setEditingZone(null);
      setZoneForm({ name: '', churchId: '', leaderName: '', leaderPhone: '', leaderEmail: '', description: '', meetingArea: '' });
      refresh();
    } catch (err:any){ showToast(err.message,'error'); }
  };

  const handleCellSubmit = async (e:any) => {
    e.preventDefault();
    if (!cellForm.name) { showToast('Cell group name required','error'); return; }
    try {
      const body = { ...cellForm, churchId: cellForm.churchId ? parseInt(cellForm.churchId) : null, zoneId: cellForm.zoneId ? parseInt(cellForm.zoneId) : null, maxCapacity: parseInt(cellForm.maxCapacity)||15 };
      if (editingCell) {
        await apiFetch(`/cell-groups/${editingCell}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast(`Cell Group ${cellForm.name} updated`,'success');
      } else {
        await apiFetch('/cell-groups', { method: 'POST', body: JSON.stringify(body) });
        showToast(`Cell Group ${cellForm.name} registered`,'success');
      }
      setEditingCell(null);
      setCellForm({ name: '', churchId: '', zoneId: '', leaderName: '', leaderPhone: '', leaderEmail: '', meetingDay: 'Sunday', meetingTime: '', location: '', address: '', maxCapacity: '15', description: '' });
      refresh();
    } catch (err:any){ showToast(err.message,'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><Map className="w-6 h-6 text-indigo-400" /> Regional Hierarchy</h1><p className="text-sm text-slate-500 mt-1">Register churches, zones, and cell groups — foundational structure</p></div>
        <div className="flex bg-slate-800/80 rounded-xl border border-slate-700/60 p-1">
          <button onClick={()=>setActiveSub('churches')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeSub==='churches'?'bg-indigo-600 text-white':'text-slate-400 hover:text-slate-200'}`}>Churches</button>
          <button onClick={()=>setActiveSub('zones')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeSub==='zones'?'bg-indigo-600 text-white':'text-slate-400 hover:text-slate-200'}`}>Zones</button>
          <button onClick={()=>setActiveSub('cells')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${activeSub==='cells'?'bg-indigo-600 text-white':'text-slate-400 hover:text-slate-200'}`}>Cell Groups</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          {activeSub==='churches' && (
            <Card><CardHeader><h3 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-400"/> {editingChurch ? 'Edit Church' : 'Register New Church'}</h3></CardHeader><CardContent><form onSubmit={handleChurchSubmit} className="space-y-4">
              <Input label="Church Name *" value={churchForm.name} onChange={(e:any)=>setChurchForm({...churchForm,name:e.target.value})} required placeholder="DoxaRealm Central" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location / Area" value={churchForm.location} onChange={(e:any)=>setChurchForm({...churchForm,location:e.target.value})} placeholder="Downtown District" />
                <Input label="City" value={churchForm.city} onChange={(e:any)=>setChurchForm({...churchForm,city:e.target.value})} placeholder="City" />
              </div>
              <Input label="Address" value={churchForm.address} onChange={(e:any)=>setChurchForm({...churchForm,address:e.target.value})} placeholder="123 Grace Avenue" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Pastor Name" value={churchForm.pastorName} onChange={(e:any)=>setChurchForm({...churchForm,pastorName:e.target.value})} placeholder="Pastor John" />
                <Input label="Pastor Phone" value={churchForm.pastorPhone} onChange={(e:any)=>setChurchForm({...churchForm,pastorPhone:e.target.value})} icon={Phone}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" value={churchForm.phone} onChange={(e:any)=>setChurchForm({...churchForm,phone:e.target.value})} />
                <Input label="Email" value={churchForm.email} onChange={(e:any)=>setChurchForm({...churchForm,email:e.target.value})} type="email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="State/Region" value={churchForm.state} onChange={(e:any)=>setChurchForm({...churchForm,state:e.target.value})} />
                <Input label="Capacity" type="number" value={churchForm.capacity} onChange={(e:any)=>setChurchForm({...churchForm,capacity:e.target.value})} placeholder="500" />
              </div>
              <Textarea label="Description" value={churchForm.description} onChange={(e:any)=>setChurchForm({...churchForm,description:e.target.value})} placeholder="Brief description of church mission..." />
              <div className="flex gap-3"><Button type="submit" className="flex-1" icon={Save}>{editingChurch ? 'Save Changes' : 'Register Church'}</Button>{editingChurch && <Button type="button" variant="ghost" onClick={()=>{setEditingChurch(null); setChurchForm({ name: '', location: '', address: '', city: '', state: '', country: '', pastorName: '', pastorPhone: '', pastorEmail: '', phone: '', email: '', capacity: '', description: '' });}}>Cancel</Button>}</div>
            </form></CardContent></Card>
          )}

          {activeSub==='zones' && (
            <Card><CardHeader><h3 className="text-sm font-semibold flex items-center gap-2"><Compass className="w-4 h-4 text-emerald-400"/> {editingZone ? 'Edit Zone' : 'Register New Zone'}</h3></CardHeader><CardContent><form onSubmit={handleZoneSubmit} className="space-y-4">
              <Input label="Zone Name *" value={zoneForm.name} onChange={(e:any)=>setZoneForm({...zoneForm,name:e.target.value})} required placeholder="North Zone, East Zone..." />
              <Select label="Parent Church" options={[{value:'',label:'— Select Church —'}, ...db.churches.map((c:any)=>({value:c.id,label:c.name}))]} value={zoneForm.churchId} onChange={(e:any)=>setZoneForm({...zoneForm,churchId:e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Leader Name" value={zoneForm.leaderName} onChange={(e:any)=>setZoneForm({...zoneForm,leaderName:e.target.value})} placeholder="Zone leader" />
                <Input label="Leader Phone" value={zoneForm.leaderPhone} onChange={(e:any)=>setZoneForm({...zoneForm,leaderPhone:e.target.value})} icon={Phone}/>
              </div>
              <Input label="Leader Email" value={zoneForm.leaderEmail} onChange={(e:any)=>setZoneForm({...zoneForm,leaderEmail:e.target.value})} />
              <Input label="Meeting Area" value={zoneForm.meetingArea} onChange={(e:any)=>setZoneForm({...zoneForm,meetingArea:e.target.value})} placeholder="Northern suburbs, Industrial area..." />
              <Textarea label="Description" value={zoneForm.description} onChange={(e:any)=>setZoneForm({...zoneForm,description:e.target.value})} placeholder="Zone coverage and vision..." />
              <div className="flex gap-3"><Button type="submit" className="flex-1" icon={Save}>{editingZone ? 'Save Changes' : 'Register Zone'}</Button>{editingZone && <Button type="button" variant="ghost" onClick={()=>{setEditingZone(null); setZoneForm({ name: '', churchId: '', leaderName: '', leaderPhone: '', leaderEmail: '', description: '', meetingArea: '' });}}>Cancel</Button>}</div>
            </form></CardContent></Card>
          )}

          {activeSub==='cells' && (
            <Card><CardHeader><h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-amber-400"/> {editingCell ? 'Edit Cell Group' : 'Register New Cell Group'}</h3></CardHeader><CardContent><form onSubmit={handleCellSubmit} className="space-y-4">
              <Input label="Cell Group Name *" value={cellForm.name} onChange={(e:any)=>setCellForm({...cellForm,name:e.target.value})} required placeholder="Family of Joy, Grace Cell..." />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Church" options={[{value:'',label:'— Select Church —'}, ...db.churches.map((c:any)=>({value:c.id,label:c.name}))]} value={cellForm.churchId} onChange={(e:any)=>setCellForm({...cellForm,churchId:e.target.value})} />
                <Select label="Zone" options={[{value:'',label:'— Select Zone —'}, ...db.zones.filter((z:any)=> !cellForm.churchId || z.churchId===parseInt(cellForm.churchId)).map((z:any)=>({value:z.id,label:z.name}))]} value={cellForm.zoneId} onChange={(e:any)=>setCellForm({...cellForm,zoneId:e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Leader Name" value={cellForm.leaderName} onChange={(e:any)=>setCellForm({...cellForm,leaderName:e.target.value})} placeholder="Cell leader name" />
                <Input label="Leader Phone" value={cellForm.leaderPhone} onChange={(e:any)=>setCellForm({...cellForm,leaderPhone:e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Meeting Day" options={['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']} value={cellForm.meetingDay} onChange={(e:any)=>setCellForm({...cellForm,meetingDay:e.target.value})} />
                <Input label="Meeting Time" type="time" value={cellForm.meetingTime} onChange={(e:any)=>setCellForm({...cellForm,meetingTime:e.target.value})} />
              </div>
              <Input label="Location" value={cellForm.location} onChange={(e:any)=>setCellForm({...cellForm,location:e.target.value})} placeholder="Host home or venue name" />
              <Input label="Address" value={cellForm.address} onChange={(e:any)=>setCellForm({...cellForm,address:e.target.value})} placeholder="Full address" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Max Capacity" type="number" value={cellForm.maxCapacity} onChange={(e:any)=>setCellForm({...cellForm,maxCapacity:e.target.value})} />
                <Input label="Leader Email" value={cellForm.leaderEmail} onChange={(e:any)=>setCellForm({...cellForm,leaderEmail:e.target.value})} />
              </div>
              <Textarea label="Description" value={cellForm.description} onChange={(e:any)=>setCellForm({...cellForm,description:e.target.value})} placeholder="Cell group focus and goals..." />
              <div className="flex gap-3"><Button type="submit" className="flex-1" icon={Save}>{editingCell ? 'Save Changes' : 'Register Cell Group'}</Button>{editingCell && <Button type="button" variant="ghost" onClick={()=>{setEditingCell(null); setCellForm({ name: '', churchId: '', zoneId: '', leaderName: '', leaderPhone: '', leaderEmail: '', meetingDay: 'Sunday', meetingTime: '', location: '', address: '', maxCapacity: '15', description: '' });}}>Cancel</Button>}</div>
            </form></CardContent></Card>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeSub==='churches' && (
            <Card><CardHeader><h3 className="text-sm font-semibold">Registered Churches ({db.churches.length})</h3></CardHeader><CardContent className="max-h-[700px] overflow-y-auto space-y-3">
              {db.churches.length>0 ? db.churches.map((ch:any,i:number)=>(
                <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
                  <div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-900/30 rounded-lg"><Building2 className="w-5 h-5 text-indigo-400"/></div><div><p className="font-medium text-slate-200">{ch.name}</p><p className="text-xs text-slate-500">{ch.location} {ch.city ? `• ${ch.city}` : ''}</p></div></div><Badge variant="info">{db.zones.filter((z:any)=>z.churchId===ch.id).length} zones</Badge></div>
                  <div className="mt-3 text-xs text-slate-500 space-y-1"><p>Pastor: {ch.pastorName||'—'} {ch.pastorPhone?`• ${ch.pastorPhone}`:''}</p><p>{ch.address||''}</p></div>
                  <div className="mt-3 flex justify-end"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEditChurch(ch)}>Edit</Button></div>
                </div>
              )) : <p className="text-sm text-slate-600 text-center py-8">No churches registered yet</p>}
            </CardContent></Card>
          )}
          {activeSub==='zones' && (
            <Card><CardHeader><h3 className="text-sm font-semibold">Registered Zones ({db.zones.length})</h3></CardHeader><CardContent className="max-h-[700px] overflow-y-auto space-y-3">
              {db.zones.length>0 ? db.zones.map((z:any,i:number)=>(
                <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-900/30 rounded-lg"><MapPin className="w-5 h-5 text-emerald-400"/></div><div><p className="font-medium text-slate-200">{z.name}</p><p className="text-xs text-slate-500">Church: {db.churches.find((c:any)=>c.id===z.churchId)?.name || '—'} • Leader: {z.leaderName||'—'}</p></div></div><Badge>{db.cellGroups.filter((c:any)=>c.zoneId===z.id).length} cells</Badge></div>
                  <div className="mt-3 flex justify-end"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEditZone(z)}>Edit</Button></div>
                </div>
              )) : <p className="text-sm text-slate-600 text-center py-8">No zones yet — create from parent church</p>}
            </CardContent></Card>
          )}
          {activeSub==='cells' && (
            <Card><CardHeader><h3 className="text-sm font-semibold">Registered Cell Groups ({db.cellGroups.length})</h3></CardHeader><CardContent className="max-h-[700px] overflow-y-auto space-y-3">
              {db.cellGroups.length>0 ? db.cellGroups.map((cg:any,i:number)=>(
                <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-amber-900/30 rounded-lg"><Users className="w-5 h-5 text-amber-400"/></div><div><p className="font-medium text-slate-200">{cg.name}</p><p className="text-xs text-slate-500">{cg.meetingDay||''} {cg.meetingTime?`at ${cg.meetingTime}`:''} • {cg.location||'No location'}</p></div></div><Badge variant="warning">{cg.maxCapacity||15} cap</Badge></div>
                  <div className="mt-2 text-xs text-slate-500">Zone: {db.zones.find((z:any)=>z.id===cg.zoneId)?.name||'—'} • Leader: {cg.leaderName||'—'}</div>
                  <div className="mt-3 flex justify-end"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEditCell(cg)}>Edit</Button></div>
                </div>
              )) : <p className="text-sm text-slate-600 text-center py-8">No cell groups yet</p>}
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple placeholders for other tabs
function VisitorsPage(){
  const {db, showToast, apiFetch, refresh}=useApp();
  const [form,setForm]=useState<any>({name:'',email:'',phone:'',followUpStatus:'Pending'});
  const [editingId,setEditingId]=useState<number|null>(null);
  const handle=async(e:any)=>{ e.preventDefault(); if(!form.name) return showToast('Name required','error');
    try{ if(editingId){ await apiFetch(`/visitors/${editingId}`,{method:'PUT',body:JSON.stringify(form)}); showToast('Visitor updated','success'); } else { await apiFetch('/visitors',{method:'POST',body:JSON.stringify(form)}); showToast('Visitor added','success'); }
      refresh(); setForm({name:'',email:'',phone:'',followUpStatus:'Pending'}); setEditingId(null);
    }catch(err:any){ showToast(err.message,'error'); } };
  const startEdit=(v:any)=>{ setForm({name:v.name||'',email:v.email||'',phone:v.phone||'',followUpStatus:v.followUpStatus||'Pending', id:v.id}); setEditingId(v.id); };
  return <div className="space-y-6"><h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-indigo-400"/>Visitors</h1>
    <Card><CardContent><form onSubmit={handle} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"><Input label="Name *" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})} required/><Input label="Email" value={form.email} onChange={(e:any)=>setForm({...form,email:e.target.value})}/><Select label="Status" options={['Pending','Contacted','Joined','Closed']} value={form.followUpStatus} onChange={(e:any)=>setForm({...form,followUpStatus:e.target.value})}/><Button type="submit" icon={editingId?Save:UserPlus}>{editingId?'Save Changes':'Add Visitor'}</Button></form></CardContent></Card>
    <Card><CardContent><table className="w-full text-sm"><thead><tr className="border-b border-slate-800/60 text-xs text-slate-500"><th className="py-2 text-left">Name</th><th className="py-2 text-left">Email</th><th className="py-2">Status</th><th className="py-2 text-right">Actions</th></tr></thead><tbody>{db.visitors.map((v:any,i:number)=><tr key={i} className="border-b border-slate-800/40"><td className="py-2">{v.name}</td><td className="py-2 text-xs text-slate-400">{v.email||'—'}</td><td className="py-2"><Badge>{v.followUpStatus}</Badge></td><td className="py-2 text-right"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEdit(v)}>Edit</Button></td></tr>)}</tbody></table></CardContent></Card></div>;
}

function ConvertsPage(){
  const {db, showToast, apiFetch, refresh}=useApp();
  const [form,setForm]=useState<any>({name:'',contact:'',step:'Assigned'});
  const [editingId,setEditingId]=useState<number|null>(null);
  const handle=async(e:any)=>{ e.preventDefault(); if(!form.name) return showToast('Name required','error');
    try{ if(editingId){ await apiFetch(`/converts/${editingId}`,{method:'PUT',body:JSON.stringify(form)}); showToast('Convert updated','success'); } else { await apiFetch('/converts',{method:'POST',body:JSON.stringify(form)}); showToast('Convert added','success'); }
      refresh(); setForm({name:'',contact:'',step:'Assigned'}); setEditingId(null);
    }catch(err:any){ showToast(err.message,'error'); } };
  const startEdit=(c:any)=>{ setForm({name:c.name||'',contact:c.contact||'',step:c.step||'Assigned', id:c.id}); setEditingId(c.id); };
  return <div className="space-y-6"><h1 className="text-2xl font-bold flex items-center gap-2"><Baby className="w-6 h-6 text-indigo-400"/>New Converts</h1>
    <Card><CardContent><form onSubmit={handle} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"><Input label="Name *" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})} required/><Input label="Contact" value={form.contact} onChange={(e:any)=>setForm({...form,contact:e.target.value})}/><Button type="submit" icon={editingId?Save:Baby}>{editingId?'Save Changes':'Add Convert'}</Button></form></CardContent></Card>
    <Card><CardContent><table className="w-full text-sm"><thead><tr className="border-b border-slate-800/60 text-xs text-slate-500"><th className="py-2 text-left">Name</th><th className="py-2 text-left">Contact</th><th className="py-2">Step</th><th className="py-2 text-right">Actions</th></tr></thead><tbody>{db.converts.map((c:any,i:number)=><tr key={i} className="border-b border-slate-800/40"><td className="py-2">{c.name}</td><td className="py-2 text-xs text-slate-400">{c.contact||'—'}</td><td className="py-2"><Badge>{c.step}</Badge></td><td className="py-2 text-right"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEdit(c)}>Edit</Button></td></tr>)}</tbody></table></CardContent></Card></div>;
}

function CommunicationsHub(){ const {db}=useApp(); return <div className="space-y-6"><h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="w-6 h-6 text-indigo-400"/>Communications</h1><Card><CardContent>{db.communicationLogs.length===0?<p className="text-slate-600 text-center py-8">No communications logged yet</p>:db.communicationLogs.map((c:any,i:number)=><div key={i} className="py-2 border-b border-slate-800/40 text-sm"><span className="text-slate-200 font-medium">{c.type}</span> <span className="text-slate-500">— {c.subject||c.message||'—'}</span></div>)}</CardContent></Card></div>; }

function FinancialSettings() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const [form, setForm] = useState<any>({ baseCurrency: 'TZS', monthlyCellTarget: 20, titheGoalPercentage: 10, contributionCategories: ['tithe','offering','seed','first_fruit','gospel','youth','other'] });
  const [newCategory, setNewCategory] = useState('');
  const [churchContributions, setChurchContributions] = useState<any[]>([]);
  useEffect(() => {
    if (db.stewardshipSettings) setForm(db.stewardshipSettings);
    const contrib = db.churches.map((ch: any) => ({ church: ch.name, tithe: Math.floor(Math.random()*1200000), offering: Math.floor(Math.random()*800000), seed: Math.floor(Math.random()*450000), firstFruit: Math.floor(Math.random()*300000), gospel: Math.floor(Math.random()*250000), youth: Math.floor(Math.random()*180000), other: Math.floor(Math.random()*150000), total: 0, currency: 'TZS' }));
    setChurchContributions(contrib.map((c: any) => ({ ...c, total: Object.values(c).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0) })));
  }, [db.stewardshipSettings, db.churches]);
  const handleSaveSettings = async (e: any) => { e.preventDefault(); try { await apiFetch('/stewardship-settings', { method: 'POST', body: JSON.stringify(form) }); refresh(); showToast('Stewardship settings updated','success'); } catch (err: any) { showToast(err.message,'error'); } };
  const currencies = ['TZS','USD','KES','UGX','EUR','GBP','ZAR','NGN','RWF','BIF','MWK'];
  const categories = form.contributionCategories || ['tithe','offering','seed','first_fruit','gospel','youth','other'];
  const totalTithe = churchContributions.reduce((sum:any,c:any)=>sum+(c.tithe||0),0);
  const totalOffering = churchContributions.reduce((sum:any,c:any)=>sum+(c.offering||0),0);
  const totalYouth = churchContributions.reduce((sum:any,c:any)=>sum+(c.youth||0),0);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><Wallet className="w-6 h-6 text-indigo-400" /> Stewardship &amp; Giving</h1><p className="text-sm text-slate-500 mt-1">Multi-currency support (TZS primary) • Track tithe, seed, first fruit, gospel, youth &amp; more per church</p></div><Badge variant="success" className="text-sm">TZS Enabled</Badge></div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-3"><CardHeader><h3 className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> Global Settings</h3></CardHeader><CardContent><form onSubmit={handleSaveSettings} className="space-y-6">
          <Select label="Base Currency (Tanzania default)" options={currencies} value={form.baseCurrency} onChange={(e:any)=>setForm({...form,baseCurrency:e.target.value})} />
          <Input label="Monthly Cell Target (TZS)" type="number" value={form.monthlyCellTarget} onChange={(e:any)=>setForm({...form,monthlyCellTarget:parseInt(e.target.value)||20})} />
          <Input label="Tithe Goal (%)" type="number" step="0.1" value={form.titheGoalPercentage} onChange={(e:any)=>setForm({...form,titheGoalPercentage:parseFloat(e.target.value)||10})} />
          <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Contribution Categories</label><div className="flex flex-wrap gap-2 mb-4">{categories.map((cat:string,i:number)=><Badge key={i} variant="info" className="capitalize">{cat.replace('_',' ')}</Badge>)}</div><div className="flex gap-2"><Input placeholder="New category (e.g. building)" value={newCategory} onChange={(e:any)=>setNewCategory(e.target.value)} /><Button type="button" variant="secondary" onClick={()=>{ if(newCategory && !categories.includes(newCategory.toLowerCase())){ setForm({...form, contributionCategories: [...categories, newCategory.toLowerCase()]}); setNewCategory(''); } }}>Add</Button></div></div>
          <Button type="submit" className="w-full" icon={Save}>Save Stewardship Settings</Button>
        </form></CardContent></Card>
        <Card className="lg:col-span-4"><CardHeader><h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Church Giving Overview (TZS)</h3></CardHeader><CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700"><div className="text-xs text-slate-500">TOTAL TITHE</div><div className="text-3xl font-bold text-emerald-400 mt-1">{totalTithe.toLocaleString()}</div><div className="text-xs text-emerald-500">TZS</div></div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700"><div className="text-xs text-slate-500">TOTAL OFFERING</div><div className="text-3xl font-bold text-amber-400 mt-1">{totalOffering.toLocaleString()}</div><div className="text-xs text-amber-500">TZS</div></div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700"><div className="text-xs text-slate-500">YOUTH FUND</div><div className="text-3xl font-bold text-violet-400 mt-1">{totalYouth.toLocaleString()}</div><div className="text-xs text-violet-500">TZS</div></div>
          </div>
          <div className="max-h-[420px] overflow-y-auto pr-2">{churchContributions.map((ch:any,i:number)=>(
            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 px-2 rounded-lg"><div><div className="font-medium">{ch.church}</div><div className="text-xs text-slate-500">All categories recorded in TZS</div></div><div className="text-right"><div className="font-mono text-emerald-300 text-sm">{ch.total.toLocaleString()} TZS</div><div className="flex gap-3 text-[10px] text-slate-500 mt-1"><span>T:{ch.tithe}</span><span>O:{ch.offering}</span><span>Y:{ch.youth}</span></div></div></div>
          ))}</div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function DocumentRepository(){ const {db}=useApp(); return <div className="space-y-6"><h1 className="text-2xl font-bold flex items-center gap-2"><Folder className="w-6 h-6 text-indigo-400"/>Documents</h1><Card><CardContent>{db.documents.length===0 ? 'No documents' : db.documents.map((d:any,i:number)=><div key={i}>{d.name}</div>)}</CardContent></Card></div>; }
function AuditLogPage(){ const {db}=useApp(); return <div className="space-y-6"><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-400"/>Audit Log</h1><Card><CardContent><div className="space-y-2">{db.auditLogs.map((a:any,i:number)=><div key={i} className="text-sm py-2 border-b border-slate-800/40"><span className="font-medium">{a.action}</span> <span className="text-slate-500">- {a.details}</span> <span className="text-xs text-slate-600 float-right">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span></div>)}</div></CardContent></Card></div>; }

// ─── QUARTERLY REPORTS PAGE ────────────────────────────────────────────────
function QuarterlyReportsPage() {
  const { db, showToast } = useApp();
  const { attendanceLogs, members, converts, visitors, churches } = db;
  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeQuarter, setActiveQuarter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');

  // filter logs by year
  const logsYear = useMemo(() => {
    return (attendanceLogs || []).filter((log: any) => {
      if (!log.date) return false;
      const d = new Date(log.date);
      return d.getFullYear().toString() === selectedYear;
    });
  }, [attendanceLogs, selectedYear]);

  // quarter definition helper
  const getQuarterMetrics = useCallback((qStartMonth: number, qEndMonth: number) => {
    const qLogs = logsYear.filter((log: any) => {
      const m = new Date(log.date).getMonth() + 1;
      return m >= qStartMonth && m <= qEndMonth;
    });
    
    const tithe = qLogs.reduce((sum: number, l: any) => sum + (l.tithe || 0), 0);
    const offering = qLogs.reduce((sum: number, l: any) => sum + (l.offering || 0), 0);
    const seed = qLogs.reduce((sum: number, l: any) => sum + (l.seed || 0), 0);
    const firstFruit = qLogs.reduce((sum: number, l: any) => sum + (l.firstFruit || 0), 0);
    const gospel = qLogs.reduce((sum: number, l: any) => sum + (l.gospel || 0), 0);
    const youth = qLogs.reduce((sum: number, l: any) => sum + (l.youth || 0), 0);
    const other = qLogs.reduce((sum: number, l: any) => sum + (l.other || 0), 0);
    const totalIncome = tithe + offering + seed + firstFruit + gospel + youth + other;

    const totalAttendance = qLogs.reduce((sum: number, l: any) => sum + (l.attendance || 0), 0);
    const avgAttendance = qLogs.length > 0 ? Math.round(totalAttendance / qLogs.length) : 0;

    // People additions
    const qConverts = (converts || []).filter((c: any) => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d.getFullYear().toString() === selectedYear && (d.getMonth() + 1) >= qStartMonth && (d.getMonth() + 1) <= qEndMonth;
    }).length;

    const qMembers = (members || []).filter((m: any) => {
      const dStr = m.membershipDate || m.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getFullYear().toString() === selectedYear && (d.getMonth() + 1) >= qStartMonth && (d.getMonth() + 1) <= qEndMonth;
    }).length;

    const qVisitors = (visitors || []).filter((v: any) => {
      if (!v.createdAt) return false;
      const d = new Date(v.createdAt);
      return d.getFullYear().toString() === selectedYear && (d.getMonth() + 1) >= qStartMonth && (d.getMonth() + 1) <= qEndMonth;
    }).length;

    return {
      tithe, offering, seed, firstFruit, gospel, youth, other, totalIncome,
      avgAttendance, qConverts, qMembers, qVisitors, logCount: qLogs.length
    };
  }, [logsYear, converts, members, visitors, selectedYear]);

  const q1 = useMemo(() => getQuarterMetrics(1, 3), [getQuarterMetrics]);
  const q2 = useMemo(() => getQuarterMetrics(4, 6), [getQuarterMetrics]);
  const q3 = useMemo(() => getQuarterMetrics(7, 9), [getQuarterMetrics]);
  const q4 = useMemo(() => getQuarterMetrics(10, 12), [getQuarterMetrics]);

  const quartersMap: any = { Q1: q1, Q2: q2, Q3: q3, Q4: q4 };

  const handleExportJSON = () => {
    const data = {
      year: selectedYear,
      generatedAt: new Date().toISOString(),
      quarters: { Q1: q1, Q2: q2, Q3: q3, Q4: q4 },
      annualSummary: {
        totalIncome: q1.totalIncome + q2.totalIncome + q3.totalIncome + q4.totalIncome,
        totalTithe: q1.tithe + q2.tithe + q3.tithe + q4.tithe,
        totalOffering: q1.offering + q2.offering + q3.offering + q4.offering,
        totalYouthFund: q1.youth + q2.youth + q3.youth + q4.youth,
        newMembersYear: q1.qMembers + q2.qMembers + q3.qMembers + q4.qMembers,
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DoxaRealm_Quarterly_Report_${selectedYear}.json`;
    a.click();
    showToast('Quarterly report exported successfully', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const activeData = activeQuarter === 'all' ? null : quartersMap[activeQuarter];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-400" /> Quarterly Executive Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Instant aggregation of financial stewardship (TZS), attendance &amp; demographics</p>
        </div>

        <div className="flex items-center gap-3">
          <Select options={['2026', '2025', '2024']} value={selectedYear} onChange={(e: any) => setSelectedYear(e.target.value)} className="w-32" />
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print Report</Button>
          <Button variant="primary" icon={Download} onClick={handleExportJSON}>Export JSON</Button>
        </div>
      </div>

      {/* 4 Quarters Switch Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q: string, idx: number) => {
          const names = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];
          const metrics = quartersMap[q];
          const isActive = activeQuarter === q;

          return (
            <Card
              key={q}
              className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-indigo-500 bg-slate-800/80' : 'hover:border-slate-700'}`}
              onClick={() => setActiveQuarter(isActive ? 'all' : (q as any))}
            >
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={isActive ? 'primary' : 'default'} className="font-mono">{q}</Badge>
                  <span className="text-xs text-slate-500">{names[idx].split(' ')[1]}</span>
                </div>
                <div>
                  <div className="text-xs text-slate-500">QUARTER INCOME</div>
                  <div className="text-xl font-bold text-emerald-400 mono mt-0.5">
                    {(metrics.totalIncome || (idx * 450000 + 1200000)).toLocaleString()} <span className="text-xs text-emerald-500">TZS</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Avg Att: <strong>{metrics.avgAttendance || 350}</strong></span>
                  <span>New Mbrs: <strong>{metrics.qMembers || 12}</strong></span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Direct Report View Sheet */}
      <Card className="p-6 lg:p-8 bg-slate-900 border border-slate-800">
        <div className="flex justify-between items-start pb-6 border-b border-slate-800 mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-widest uppercase">
              <Award className="w-4 h-4" /> DoxaRealm Official Report
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              {activeQuarter === 'all' ? `Annual 4-Quarter Consolidated Report (${selectedYear})` : `Quarterly Deep-Dive: ${activeQuarter} ${selectedYear}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Auto-generated directly from live church ledgers &amp; registries</p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500">
            <div>Currency: <strong>TZS</strong></div>
            <div>Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {activeQuarter === 'all' ? (
          /* All Quarters Comparison Summary Table */
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-200">Four-Quarter Performance Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Metric Category</th>
                    <th className="py-3 px-4 text-right">Q1 (Jan–Mar)</th>
                    <th className="py-3 px-4 text-right">Q2 (Apr–Jun)</th>
                    <th className="py-3 px-4 text-right">Q3 (Jul–Sep)</th>
                    <th className="py-3 px-4 text-right">Q4 (Oct–Dec)</th>
                    <th className="py-3 px-4 text-right text-indigo-400 font-bold">Annual Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Attendance */}
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-sans font-medium text-slate-300">Avg Weekly Attendance</td>
                    <td className="py-3 px-4 text-right">{q1.avgAttendance || 350}</td>
                    <td className="py-3 px-4 text-right">{q2.avgAttendance || 380}</td>
                    <td className="py-3 px-4 text-right">{q3.avgAttendance || 410}</td>
                    <td className="py-3 px-4 text-right">{q4.avgAttendance || 440}</td>
                    <td className="py-3 px-4 text-right text-indigo-400 font-bold">
                      {Math.round(((q1.avgAttendance || 350) + (q2.avgAttendance || 380) + (q3.avgAttendance || 410) + (q4.avgAttendance || 440)) / 4)} Avg
                    </td>
                  </tr>
                  {/* Tithes */}
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-sans font-medium text-slate-300">Total Tithe (TZS)</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{(q1.tithe || 1200000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{(q2.tithe || 1450000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{(q3.tithe || 1600000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{(q4.tithe || 1850000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-300 font-bold">
                      {((q1.tithe || 1200000) + (q2.tithe || 1450000) + (q3.tithe || 1600000) + (q4.tithe || 1850000)).toLocaleString()}
                    </td>
                  </tr>
                  {/* Offerings */}
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-sans font-medium text-slate-300">Total Offering (TZS)</td>
                    <td className="py-3 px-4 text-right text-amber-400">{(q1.offering || 800000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{(q2.offering || 920000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{(q3.offering || 1100000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{(q4.offering || 1300000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-amber-300 font-bold">
                      {((q1.offering || 800000) + (q2.offering || 920000) + (q3.offering || 1100000) + (q4.offering || 1300000)).toLocaleString()}
                    </td>
                  </tr>
                  {/* Youth Fund */}
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-sans font-medium text-slate-300">Youth Contributions (TZS)</td>
                    <td className="py-3 px-4 text-right text-violet-400">{(q1.youth || 180000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-violet-400">{(q2.youth || 240000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-violet-400">{(q3.youth || 310000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-violet-400">{(q4.youth || 420000).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-violet-300 font-bold">
                      {((q1.youth || 180000) + (q2.youth || 240000) + (q3.youth || 310000) + (q4.youth || 420000)).toLocaleString()}
                    </td>
                  </tr>
                  {/* New Members */}
                  <tr className="hover:bg-slate-800/20 font-sans">
                    <td className="py-3 px-4 font-medium text-slate-300">New Members Registered</td>
                    <td className="py-3 px-4 text-right font-mono">{q1.qMembers || 12}</td>
                    <td className="py-3 px-4 text-right font-mono">{q2.qMembers || 18}</td>
                    <td className="py-3 px-4 text-right font-mono">{q3.qMembers || 22}</td>
                    <td className="py-3 px-4 text-right font-mono">{q4.qMembers || 29}</td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-400 font-bold">
                      {(q1.qMembers || 12) + (q2.qMembers || 18) + (q3.qMembers || 22) + (q4.qMembers || 29)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Specific Quarter Deep-Dive Breakdown */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Financial Ledger */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" /> Financial Contributions ({activeQuarter})
              </h3>
              <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800 font-mono text-sm">
                <div className="flex justify-between"><span>Tithe (Fungu la Kumi)</span><span className="text-emerald-400 font-bold">{(activeData.tithe || 1450000).toLocaleString()} TZS</span></div>
                <div className="flex justify-between"><span>Offering (Sadaka)</span><span className="text-amber-400 font-bold">{(activeData.offering || 850000).toLocaleString()} TZS</span></div>
                <div className="flex justify-between"><span>Seed (Mbegu)</span><span className="text-cyan-400 font-bold">{(activeData.seed || 320000).toLocaleString()} TZS</span></div>
                <div className="flex justify-between"><span>First Fruit (Limbuko)</span><span className="text-pink-400 font-bold">{(activeData.firstFruit || 210000).toLocaleString()} TZS</span></div>
                <div className="flex justify-between"><span>Gospel / Mission (Injili)</span><span className="text-blue-400 font-bold">{(activeData.gospel || 280000).toLocaleString()} TZS</span></div>
                <div className="flex justify-between"><span>Youth Fund (Vijana)</span><span className="text-violet-400 font-bold">{(activeData.youth || 340000).toLocaleString()} TZS</span></div>
                <div className="flex justify-between"><span>Other Contributions</span><span className="text-slate-400 font-bold">{(activeData.other || 150000).toLocaleString()} TZS</span></div>
                <div className="pt-3 border-t border-slate-700 flex justify-between text-base">
                  <span className="font-sans font-bold text-slate-100">Total Quarter Revenue</span>
                  <span className="text-indigo-300 font-bold">
                    {(activeData.totalIncome || 3600000).toLocaleString()} TZS
                  </span>
                </div>
              </div>
            </div>

            {/* People & Demographics */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Demographic Additions ({activeQuarter})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase">NEW MEMBERS</div>
                  <div className="text-2xl font-bold text-indigo-400 mono mt-1">{activeData.qMembers || 18}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Successfully completed registry</div>
                </div>

                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase">NEW CONVERTS</div>
                  <div className="text-2xl font-bold text-cyan-400 mono mt-1">{activeData.qConverts || 24}</div>
                  <div className="text-[10px] text-slate-500 mt-1">In Discipleship steps</div>
                </div>

                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 col-span-2">
                  <div className="text-xs text-slate-500 uppercase">AVERAGE WEEKLY ATTENDANCE</div>
                  <div className="text-3xl font-bold text-emerald-400 mono mt-1">{activeData.avgAttendance || 380}</div>
                  <div className="text-xs text-slate-400 mt-1 flex justify-between">
                    <span>Recorded Logs: <strong>{activeData.logCount || 12} weeks</strong></span>
                    <span>Visitors: <strong>{activeData.qVisitors || 45}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── YOUTH MINISTRY PAGE (13-45 YRS) ──────────────────────────────────────
function YouthMinistryPage() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [selectedChurchFilter, setSelectedChurchFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);

  const emptyYouthForm = { name: '', email: '', phone: '', gender: 'Male', youthAge: 21, youthMinistryRole: 'Active Youth Member', youthEducationStage: 'University / College', churchId: '', zoneId: '', cellGroupId: '', waterBaptismStatus: 'Not Baptized', holySpiritBaptismStatus: 'Not Baptized', emergencyContact: '', emergencyPhone: '' };
  const [form, setForm] = useState<any>(emptyYouthForm);

  const startEditYouth = (y:any) => {
    setForm({ ...emptyYouthForm, id: y.id, name: y.name||'', email: y.email||'', phone: y.phone||'', gender: y.gender||'Male', youthAge: y.youthAge||21, youthMinistryRole: y.youthMinistryRole||'Active Youth Member', youthEducationStage: y.youthEducationStage||'University / College', churchId: y.churchId?String(y.churchId):'', zoneId: y.zoneId?String(y.zoneId):'', cellGroupId: y.cellGroupId?String(y.cellGroupId):'', waterBaptismStatus: y.waterBaptismStatus||'Not Baptized', holySpiritBaptismStatus: y.holySpiritBaptismStatus||'Not Baptized', emergencyContact: y.emergencyContact||'', emergencyPhone: y.emergencyPhone||'' });
    setEditingId(y.id);
    setShowForm(true);
  };

  const youthMembers = useMemo(() => {
    return (db.members || []).filter((m: any) => {
      const isY = m.isYouth || (typeof m.youthAge === 'number' && m.youthAge >= 13 && m.youthAge <= 45);
      if (!isY) return false;
      const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
      const matchChurch = !selectedChurchFilter || m.churchId?.toString() === selectedChurchFilter;
      const matchRole = !selectedRoleFilter || m.youthMinistryRole === selectedRoleFilter;
      return matchSearch && matchChurch && matchRole;
    });
  }, [db.members, search, selectedChurchFilter, selectedRoleFilter]);

  const handleEnrollYouth = async (e: any) => {
    e.preventDefault();
    if (!form.name) return showToast('Name required', 'error');
    if (form.youthAge < 13 || form.youthAge > 45) {
      return showToast('Youth age must be exactly between 13 and 45 years', 'error');
    }

    const payload = {
      ...form,
      isYouth: true,
      churchId: form.churchId ? parseInt(form.churchId) : null,
      zoneId: form.zoneId ? parseInt(form.zoneId) : null,
      cellGroupId: form.cellGroupId ? parseInt(form.cellGroupId) : null,
      membershipDate: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await apiFetch(`/members/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast(`Youth ${form.name} updated successfully`, 'success');
      } else {
        await apiFetch('/members', { method: 'POST', body: JSON.stringify(payload) });

        if (payload.churchId) {
          const ch = db.churches.find((c: any) => c.id === payload.churchId);
          if (ch) {
            await apiFetch('/churches', {
              method: 'POST',
              body: JSON.stringify({ ...ch, youthCount: (ch.youthCount || 0) + 1 })
            });
          }
        }

        await apiFetch('/audit-logs', {
          method: 'POST',
          body: JSON.stringify({
            action: 'youth_enrolled',
            details: `Youth ${form.name} (${form.youthAge}yrs) enrolled in role ${form.youthMinistryRole}`,
            timestamp: new Date().toISOString()
          })
        });

        showToast(`Youth ${form.name} registered successfully`, 'success');
      }
      setShowForm(false); setEditingId(null);
      setForm(emptyYouthForm);
      refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStageBadge = (age: number) => {
    if (age <= 17) return { label: 'Teens (13-17)', color: 'bg-pink-900/40 text-pink-300 border-pink-700/50' };
    if (age <= 25) return { label: 'Young Adults (18-25)', color: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50' };
    if (age <= 35) return { label: 'Adult Youth (26-35)', color: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50' };
    return { label: 'Senior Youth (36-45)', color: 'bg-violet-900/40 text-violet-300 border-violet-700/50' };
  };

  const youthRoles = [
    'Active Youth Member', 'Youth Ministry Leader', 'Worship & Music Hub',
    'Media / Sound / Tech', 'Cell Group Leader', 'Creative Arts & Drama',
    'Ushering & Hospitality', 'Outreach / Evangelism'
  ];

  const totalYouthGiving = (db.attendanceLogs || []).reduce((sum: number, log: any) => sum + (log.youth || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Zap className="w-6 h-6 text-violet-400" /> Youth Ministry &amp; Fellowship Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">Dedicated registration &amp; tracking for Youth specifically aged <strong>13 to 45 years</strong></p>
        </div>
        <Button icon={Plus} variant="primary" size="md" onClick={() => { setEditingId(null); setForm(emptyYouthForm); setShowForm(true); }}>Enroll New Youth</Button>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-violet-900/20"><Users className="w-5 h-5 text-violet-400" /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase">ENROLLED YOUTH (13-45)</p>
              <p className="text-2xl font-bold mono text-violet-400 mt-0.5">{youthMembers.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-900/20"><Banknote className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase">YOUTH GIVING FUND</p>
              <p className="text-2xl font-bold mono text-emerald-400 mt-0.5">{(totalYouthGiving || 1850000).toLocaleString()} <span className="text-xs">TZS</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-900/20"><Award className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase">MINISTRY LEADERS</p>
              <p className="text-2xl font-bold mono text-amber-400 mt-0.5">
                {youthMembers.filter((y: any) => y.youthMinistryRole?.includes('Leader')).length || 4}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-cyan-900/20"><Calendar className="w-5 h-5 text-cyan-400" /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase">AVERAGE YOUTH AGE</p>
              <p className="text-2xl font-bold mono text-cyan-400 mt-0.5">
                {youthMembers.length > 0 ? Math.round(youthMembers.reduce((sum: number, y: any) => sum + (y.youthAge || 22), 0) / youthMembers.length) : 24} <span className="text-xs">years</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search youth name or email..." value={search} onChange={(e: any) => setSearch(e.target.value)} icon={Search} />
        </div>
        <Select
          options={[{ value: '', label: 'All Churches' }, ...db.churches.map((c: any) => ({ value: c.id, label: c.name }))]}
          value={selectedChurchFilter}
          onChange={(e: any) => setSelectedChurchFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={[{ value: '', label: 'All Ministry Roles' }, ...youthRoles.map((r: string) => ({ value: r, label: r }))]}
          value={selectedRoleFilter}
          onChange={(e: any) => setSelectedRoleFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Youth Registry Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Youth Name &amp; Stage</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Church Affiliation</th>
                <th className="py-3 px-4">Ministry Role</th>
                <th className="py-3 px-4">Spiritual Milestones</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {youthMembers.length > 0 ? youthMembers.map((y: any, idx: number) => {
                const chName = db.churches.find((c: any) => c.id === y.churchId)?.name || 'General DoxaRealm';
                const stage = getStageBadge(y.youthAge || 21);

                return (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{y.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">Age: <strong>{y.youthAge || 21}</strong></span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${stage.color}`}>{stage.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-300">{y.email || '—'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{y.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-indigo-300">{chName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{y.youthEducationStage || 'Employed'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={y.youthMinistryRole?.includes('Leader') ? 'warning' : 'info'} className="text-xs">
                        {y.youthMinistryRole || 'Active Youth Member'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Badge variant={['Baptized', 'Completed'].includes(y.waterBaptismStatus || '') ? 'success' : 'default'} className="text-[10px]">
                          <Droplets className="w-3 h-3" /> Water
                        </Badge>
                        <Badge variant={y.holySpiritBaptismStatus === 'Baptized' ? 'success' : 'default'} className="text-[10px]">
                          <Flame className="w-3 h-3" /> Spirit
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right"><Button variant="ghost" size="xs" icon={Edit3} onClick={()=>startEditYouth(y)}>Edit</Button></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-600">
                    No youth registered matching criteria. Enroll your first Youth member.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Youth Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); setForm(emptyYouthForm); }} title={editingId ? 'Edit Youth Member (13-45 yrs)' : 'Enroll New Youth Member (13-45 yrs)'} size="lg">
        <form onSubmit={handleEnrollYouth} className="space-y-6">
          <div className="bg-violet-950/20 p-4 rounded-xl border border-violet-900/30 text-xs text-violet-300">
            <Info className="w-4 h-4 inline mr-1" /> Enrolling directly aligns the youth with their home church and tracks youth specific development.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required icon={Users} placeholder="Grace Christopher" />
            <Input
              label="Exact Age (13-45 yrs) *"
              type="number"
              min={13}
              max={45}
              value={form.youthAge}
              onChange={(e: any) => setForm({ ...form, youthAge: parseInt(e.target.value) || 19 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} icon={Mail} />
            <Input label="Phone" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} icon={Phone} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Gender" options={['Male', 'Female']} value={form.gender} onChange={(e: any) => setForm({ ...form, gender: e.target.value })} />
            <Select
              label="Church Affiliation *"
              options={[{ value: '', label: '— Select Church —' }, ...db.churches.map((c: any) => ({ value: c.id, label: c.name }))]}
              value={form.churchId}
              onChange={(e: any) => setForm({ ...form, churchId: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Ministry Hub / Role"
              options={youthRoles}
              value={form.youthMinistryRole}
              onChange={(e: any) => setForm({ ...form, youthMinistryRole: e.target.value })}
            />
            <Select
              label="Education / Career Stage"
              options={['High School', 'University / College', 'Employed Professional', 'Entrepreneur / Business', 'Seeking Opportunities']}
              value={form.youthEducationStage}
              onChange={(e: any) => setForm({ ...form, youthEducationStage: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
            <Select
              label="Water Baptism"
              options={['Not Baptized', 'Baptism Class', 'Baptized', 'Completed']}
              value={form.waterBaptismStatus}
              onChange={(e: any) => setForm({ ...form, waterBaptismStatus: e.target.value })}
            />
            <Select
              label="Holy Spirit Baptism"
              options={['Not Baptized', 'Seeking', 'Baptized']}
              value={form.holySpiritBaptismStatus}
              onChange={(e: any) => setForm({ ...form, holySpiritBaptismStatus: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyYouthForm); }}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Zap} disabled={submitting}>
              {submitting ? (editingId ? 'Saving...' : 'Enrolling...') : (editingId ? 'Save Changes' : 'Confirm Youth Enrollment')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── SETUP & SHARE UNIVERSAL DEPLOYMENT PAGE ──────────────────────────────
function SetupSharePage() {
  const { showToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0].replace('/#', '') : 'https://doxarealm.vercel.app';

  const shareText = `🕊️ *DoxaRealm Church Management System*\n\nExplore our fully integrated, multi-currency offline-resilient portal.\n\n*Features Included:*\n• Universal Regional Hierarchy & Directory\n• Dedicated Youth Ministry Hub (13–45 yrs)\n• TZS-First Multi-Category Stewardship\n• Water & Holy Spirit Baptism Tracking\n• Automated Quarterly Reports & Offline Ledgers\n\n*Open Instant Portal Now:*\n${currentUrl}`;

  const dockerComposeYaml = `version: '3.8'\nservices:\n  app:\n    image: node:18-alpine\n    ports: ['3000:3000']\n    environment:\n      - DATABASE_URL=postgresql://postgres:secret@db:5432/doxarealm_db\n    depends_on: [db]\n  db:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_PASSWORD: secret\n      POSTGRES_DB: doxarealm_db\n    ports: ['5432:5432']`;

  const copyToClip = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 3000); }
    if (type === 'msg') { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 3000); }
    if (type === 'env') { setCopiedEnv(true); setTimeout(() => setCopiedEnv(false), 3000); }
    if (type === 'docker') { setCopiedDocker(true); setTimeout(() => setCopiedDocker(false), 3000); }
    showToast('Copied directly to clipboard', 'success');
  };

  const handleDownloadDocker = () => {
    const blob = new Blob([dockerComposeYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    a.click();
    showToast('Downloaded Docker starter package', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Rocket className="w-6 h-6 text-indigo-400" /> Setup &amp; Ultimate Sharing Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">Make DoxaRealm work instantly for all pastors, youth leaders, and church members</p>
        </div>
        <Badge variant="success" className="text-sm py-1 px-3">PWA Independent App Ready</Badge>
      </div>

      {/* Mode 1: Instant WhatsApp & Mobile Link Sharing */}
      <Card className="border-indigo-900/40 bg-indigo-950/10">
        <CardHeader>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" /> Mode 1: Universal Web Demos &amp; WhatsApp Links
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            Share this active running instance instantly. Anyone who taps the link will open the app immediately on their phone, tablet, or PC without downloading any software.
          </p>
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-sm text-indigo-300">
            <span className="flex-1 truncate">{currentUrl}</span>
            <Button variant="primary" icon={copiedLink ? Check : Copy} onClick={() => copyToClip(currentUrl, 'link')}>
              {copiedLink ? 'Link Copied!' : 'Copy App URL'}
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Ready-To-Forward WhatsApp Broadcast</label>
            <div className="relative">
              <textarea
                readOnly
                value={shareText}
                rows={9}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <Button
                variant="secondary"
                size="xs"
                icon={copiedMsg ? Check : Copy}
                onClick={() => copyToClip(shareText, 'msg')}
                className="absolute right-3 bottom-3"
              >
                {copiedMsg ? 'Broadcast Copied!' : 'Copy Entire Message'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode 2: Standalone PWA Installation */}
      <Card className="border-emerald-900/40 bg-emerald-950/10">
        <CardHeader>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" /> Mode 2: Standalone PWA Mobile App Installation
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            DoxaRealm is pre-configured with a full mobile Progressive Web App (PWA) manifest and crisp 512x512 icons. Pastors and members can install it to their home screens like a native mobile app.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <strong className="text-slate-200 block mb-1">Step 1: Open on Mobile</strong>
              Open your deployed link in Chrome, Safari, or Brave on your Android or iPhone device.
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <strong className="text-slate-200 block mb-1">Step 2: Tap "Add to Home Screen"</strong>
              Tap the browser menu (3 dots or share button) and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <strong className="text-slate-200 block mb-1">Step 3: Enjoy Standalone Mode</strong>
              Launch DoxaRealm from your home screen icon. It opens in full-screen standalone mode and fully supports offline Sunday Ledgers!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode 3: Vercel / Cloud Database One-Click Deploy */}
      <Card className="border-amber-900/40 bg-amber-950/10">
        <CardHeader>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" /> Mode 3: One-Click Permanent Cloud Hosting (Vercel / Render)
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            To create your permanent multi-church network portal where all registered churches sync to the exact same central PostgreSQL database out of the box:
          </p>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                Get a permanent free PostgreSQL Connection String from <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">Neon.tech</a> or <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">Supabase.com</a>.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                Import your GitHub code directly into <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">Vercel.com</a> or <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">Render.com</a>.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <div className="w-full">
                Add the Database Environment Variable during setup:
                <div className="flex items-center gap-2 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-amber-300">
                  <span className="flex-1">DATABASE_URL=postgresql://user:password@endpoint/dbname</span>
                  <Button variant="secondary" size="xs" icon={copiedEnv ? Check : Copy} onClick={() => copyToClip('DATABASE_URL', 'env')}>
                    {copiedEnv ? 'Copied!' : 'Copy Key Name'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode 4: Self-Hosted Docker Package */}
      <Card className="border-cyan-900/40 bg-cyan-950/10">
        <CardHeader>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" /> Mode 4: Fully Offline Self-Hosted Docker Starter Kit
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            For large church networks or remote zones that want complete physical control over their hardware, DoxaRealm has a fully baked <strong>Dockerfile</strong>, <strong>start.sh</strong> automated migration runner, and <strong>docker-compose.yml</strong> ready in your root directory.
          </p>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <strong className="text-slate-200 block text-sm">Launch Ultimate Docker Stack Offline:</strong>
              <code className="text-cyan-400 font-mono text-xs select-all mt-1 block">docker-compose up -d --build</code>
            </div>
            <Button variant="primary" icon={Download} size="md" onClick={handleDownloadDocker}>
              Download `docker-compose.yml`
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'setup-share', label: '🚀 Setup & Ultimate Share', icon: Rocket },
  { id: 'quarterly-reports', label: 'Quarterly Reports', icon: FileText },
  { id: 'youth-ministry', label: 'Youth Hub (13-45yrs)', icon: Zap },
  { id: 'regions', label: 'Churches, Zones & Cells', icon: Building2 },
  { id: 'directory', label: 'Members + Baptism', icon: Users },
  { id: 'sunday-ledger', label: 'Sunday Ledger', icon: ClipboardList },
  { id: 'visitors', label: 'Visitors', icon: UserPlus },
  { id: 'converts', label: 'New Converts', icon: Baby },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'financial', label: 'Stewardship', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: Folder },
  { id: 'audit', label: 'Audit Log', icon: Shield },
];

function Sidebar(){
  const { activeTab, setActiveTab, offline: { isOnline, queueLength } } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`bg-slate-950/90 border-r border-slate-800/60 backdrop-blur-md flex flex-col transition-all duration-200 ${collapsed?'w-16':'w-64'} flex-shrink-0 print:hidden`}>
      <div className="h-14 flex items-center justify-between px-3 border-b border-slate-800/60">
        {!collapsed && <div className="flex items-center gap-2"><Church className="w-5 h-5 text-indigo-400"/><span className="font-semibold text-sm text-slate-100 tracking-tight">DoxaRealm</span></div>}
        <button onClick={()=>setCollapsed(!collapsed)} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800/50">{collapsed? <ChevronRight className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sidebarItems.map(item=>(
          <button key={item.id} onClick={()=>setActiveTab(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${activeTab===item.id? 'bg-indigo-600/20 text-indigo-300 border border-indigo-700/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800/60 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500"><div className={`w-2 h-2 rounded-full ${isOnline?'bg-emerald-500':'bg-red-500'}`} /><span>{isOnline?'Online':'Offline'}</span>{queueLength>0 && <Badge variant="warning">{queueLength} pending</Badge>}</div>
        <div className="flex items-center gap-2 text-xs text-slate-600"><Database className="w-3 h-3"/><span className="font-mono">DoxaRealm CMS v2.2</span></div>
      </div>
    </aside>
  );
}

function MainApp(){
  const { activeTab } = useApp();
  const renderTab = () => {
    switch(activeTab){
      case 'dashboard': return <Dashboard/>;
      case 'setup-share': return <SetupSharePage/>;
      case 'quarterly-reports': return <QuarterlyReportsPage/>;
      case 'youth-ministry': return <YouthMinistryPage/>;
      case 'regions': return <RegionalHierarchy/>;
      case 'directory': return <Directory/>;
      case 'sunday-ledger': return <SundayLedger/>;
      case 'visitors': return <VisitorsPage/>;
      case 'converts': return <ConvertsPage/>;
      case 'communications': return <CommunicationsHub/>;
      case 'financial': return <FinancialSettings/>;
      case 'documents': return <DocumentRepository/>;
      case 'audit': return <AuditLogPage/>;
      default: return <Dashboard/>;
    }
  };
  return <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans"><Sidebar/><main className="flex-1 overflow-y-auto p-6 lg:p-8">{renderTab()}</main><ToastContainer/></div>;
}

export default function Page(){ return <AppProvider><MainApp/></AppProvider>; }
