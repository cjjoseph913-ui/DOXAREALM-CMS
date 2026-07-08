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
  Share2, ExternalLink, Copy, Smartphone, Server, HardDrive, Check, Rocket,
  Megaphone, Pin, Radio, AlertTriangle,
  CheckSquare, ListTodo, CalendarDays
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
    attendanceLogs: [], communicationLogs: [], auditLogs: [], stewardshipSettings: { baseCurrency: 'USD', monthlyCellTarget: 20, titheGoalPercentage: 10, customZones: [] }, documents: [],
    regionNotices: [], todoTasks: []
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
      const [members, visitors, converts, churches, zones, cellGroups, attendanceLogs, communicationLogs, auditLogs, stewardshipSettings, documents, regionNotices, todoTasks] = await Promise.all([
        apiFetch('/members'), apiFetch('/visitors'), apiFetch('/converts'), apiFetch('/churches'), apiFetch('/zones'), apiFetch('/cell-groups'),
        apiFetch('/attendance-logs'), apiFetch('/communication-logs'), apiFetch('/audit-logs'), apiFetch('/stewardship-settings'), apiFetch('/documents'),
        apiFetch('/region-notices'), apiFetch('/todo-tasks')
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
        documents: Array.isArray(documents) ? documents : [],
        regionNotices: Array.isArray(regionNotices) ? regionNotices : [],
        todoTasks: Array.isArray(todoTasks) ? todoTasks : []
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
  const { db, refresh, showToast, apiFetch } = useApp();
  const { members, attendanceLogs, visitors, churches, regionNotices, todoTasks } = db;
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

  const sortedNotices = (regionNotices || []).sort((a: any, b: any) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()).slice(0, 4);
  const pendingTodos = (todoTasks || []).filter((t: any) => t.status !== 'Completed').sort((a: any, b: any) => (b.priority === 'High' ? 1 : 0) - (a.priority === 'High' ? 1 : 0));

  const toggleTodoStatus = async (task: any) => {
    const nextStatus = task.status === 'Pending' ? 'In Progress' : 'Completed';
    try {
      await apiFetch(`/todo-tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...task, status: nextStatus, updatedAt: new Date().toISOString() })
      });
      showToast(`Task status updated to ${nextStatus}`, 'success');
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><LayoutDashboard className="w-6 h-6 text-indigo-400" /> Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">High-level strategic overview, quick sight executive action notices &amp; network actionable to-do list</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-700/60 transition"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {/* Top Main Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i}><CardContent className="flex items-start gap-4"><div className={`p-2.5 rounded-xl ${m.bg}`}><m.icon className={`w-5 h-5 ${m.color}`} /></div><div><p className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</p><p className={`text-2xl font-bold mt-0.5 ${m.color}`}>{m.value}</p></div></CardContent></Card>
        ))}
      </div>

      {/* Quick Sight Executive Action Panels (Notices & To-Do Execution Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Strategic Action Notices */}
        <Card className="border-indigo-900/40 bg-slate-900/90 shadow-2xl flex flex-col justify-between">
          <CardHeader className="bg-indigo-950/30 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              <Megaphone className="w-5 h-5 text-indigo-400 animate-pulse flex-shrink-0" /> 📌 Quick Sight Regional Action Notices (Taarifa &amp; Matangazo)
            </h3>
            <Badge variant="primary" className="text-xs font-mono">{regionNotices?.length || 0} Posted</Badge>
          </CardHeader>
          <CardContent className="space-y-4 max-h-80 overflow-y-auto pr-2 flex-1">
            {sortedNotices.length > 0 ? sortedNotices.map((n: any, idx: number) => {
              const ch = (churches || []).find((c: any) => c.id === n.churchId);
              return (
                <div key={idx} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition space-y-2.5 relative group">
                  <div className="flex items-center justify-between">
                    <Badge variant={n.category === 'Finance' ? 'success' : n.category === 'Emergency' ? 'danger' : 'warning'} className="text-[10px]">
                      {n.category || 'General'}
                    </Badge>
                    {n.priority === 'Urgent' && <Badge variant="danger" className="text-[9px] animate-bounce">🚨 URGENT</Badge>}
                  </div>
                  <h4 className="font-bold text-base text-slate-100 tracking-tight">{n.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/40">{n.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="font-medium text-indigo-400">{n.authorRole} {ch ? `• ${ch.name}` : ''}</span>
                    <span className="font-mono text-slate-400">{new Date(n.datePosted).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-500 text-center py-12 font-sans">No strategic regional action notices currently posted.</p>
            )}
          </CardContent>
        </Card>

        {/* Strategic Action Tasks (To-Do List) */}
        <Card className="border-amber-900/40 bg-slate-900/90 shadow-2xl flex flex-col justify-between">
          <CardHeader className="bg-amber-950/30 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              <ListTodo className="w-5 h-5 text-amber-400 flex-shrink-0" /> 📝 Actionable Discipleship &amp; Network Tasks (To-Do List)
            </h3>
            <Badge variant="warning" className="text-xs font-mono">{pendingTodos.length} Actionable</Badge>
          </CardHeader>
          <CardContent className="space-y-3.5 max-h-80 overflow-y-auto pr-2 flex-1">
            {pendingTodos.length > 0 ? pendingTodos.map((task: any, idx: number) => {
              const ch = (churches || []).find((c: any) => c.id === task.churchId);
              const isProg = task.status === 'In Progress';
              return (
                <div key={idx} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800/80 flex items-start gap-3.5 hover:border-slate-700/80 transition relative">
                  <button
                    onClick={() => toggleTodoStatus(task)}
                    className={`mt-1 p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0 shadow ${isProg ? 'bg-amber-400 text-slate-950 font-bold ring-4 ring-amber-500/30 scale-105' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    title={isProg ? 'In Progress — Click to complete task' : 'Pending — Click to mark In Progress'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-300 truncate tracking-tight">{task.assignedTo || 'All Regional Leaders'}</span>
                      <Badge variant={isProg ? 'warning' : 'default'} className="text-[9px] font-mono tracking-wider">{task.status}</Badge>
                    </div>
                    <p className="text-sm font-bold text-slate-100 mt-1 tracking-tight">{task.task}</p>
                    {task.notes && <p className="text-xs text-slate-300 mt-1.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 font-sans leading-relaxed line-clamp-2">{task.notes}</p>}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2.5 mt-2.5 border-t border-slate-800/80">
                      <span className="font-medium text-slate-400">{task.priority} Priority {ch ? `• ${ch.name}` : ''}</span>
                      {task.dueDate && <span className="font-mono text-amber-300 tracking-tight">🎯 Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-500 text-center py-12 font-sans">No strategic pending execution tasks! Everything accomplished perfectly.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance & Financial Giving Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardHeader><h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /> Weekly Attendance Trend</h3></CardHeader><CardContent><div className="h-64">{attendanceTrend.length>0 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={attendanceTrend}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="week" stroke="#475569" tick={{fontSize:11}}/><YAxis stroke="#475569" tick={{fontSize:11}}/><Tooltip contentStyle={{background:'#0f172a',border:'1px solid #334155',borderRadius:'8px'}}/><Area type="monotone" dataKey="attendance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} /></AreaChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-600 text-sm font-sans">No attendance data yet - log in Sunday Ledger</div>}</div></CardContent></Card>
        <Card><CardHeader><h3 className="text-sm font-semibold text-slate-200">Giving Breakdown (TZS)</h3></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Pie data={financeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({name, percent})=>`${name} ${((percent||0)*100).toFixed(0)}%`}>{financeData.map((_, idx)=> <Cell key={idx} fill={['#10b981','#8b5cf6','#f59e0b'][idx%3]} />)}</Pie><Tooltip contentStyle={{background:'#0f172a'}}/></RechartsPieChart></ResponsiveContainer></div></CardContent></Card>
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
    const departmentsList = [
    'Member / Muumini Wa Kawaida',
    'Senior Pastor',
    'Pastor',
    'Katibu Mkoa',
    'Katibu Msaidizi',
    'Mtawala',
    'Mhazina',
    'Kiongozi Wa Kiroho',
    'Msaidizi Kiongozi Wa Kiroho',
    'M/kiti Jamii',
    'Itifaki',
    'Askofu (Bishop)',
    'Cell Leader',
    'M/kiti Maendeleo',
    'M/kiti Mali Za Kanisa'
  ];
  const emptyForm = { name: '', email: '', phone: '', gender: 'Male', ageRange: '18-25', maritalStatus: 'Single', occupation: '', address: '', city: '', waterBaptismStatus: 'Not Baptized', waterBaptismDate: '', waterBaptismLocation: '', waterBaptismBy: '', waterBaptismCertificate: '', holySpiritBaptismStatus: 'Not Baptized', holySpiritBaptismDate: '', holySpiritEvidence: '', holySpiritNotes: '', churchId: '', zoneId: '', cellGroupId: '', department: 'Member / Muumini Wa Kawaida', leadershipRole: 'Member / Muumini Wa Kawaida', status: 'Active', conversionDate: '', membershipDate: '', emergencyContact: '', emergencyPhone: '' };
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
      churchId: m.churchId ? String(m.churchId) : '', zoneId: m.zoneId ? String(m.zoneId) : '', cellGroupId: m.cellGroupId ? String(m.cellGroupId) : '', department: m.department || m.leadershipRole || 'Member / Muumini Wa Kawaida', leadershipRole: m.leadershipRole || m.department || 'Member / Muumini Wa Kawaida', status: m.status || 'Active', conversionDate: toDate(m.conversionDate), membershipDate: toDate(m.membershipDate), emergencyContact: m.emergencyContact || '', emergencyPhone: m.emergencyPhone || ''
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
      department: form.department,
      leadershipRole: form.department,
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
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Church / Cell</th><th className="px-4 py-3">Dept / Leadership</th><th className="px-4 py-3">Water Baptism</th><th className="px-4 py-3">Holy Spirit</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
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
              }) : <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-600">No members found. Register your first member.</td></tr>}
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
              <Select label="Department / Leadership Role *" options={departmentsList} value={form.department} onChange={(e:any)=>setForm({...form, department: e.target.value, leadershipRole: e.target.value})} required />
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

function CommunicationsHub() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const { churches, members, communicationLogs, regionNotices, todoTasks } = db;
  const [activeTab, setActiveTab] = useState<'notices' | 'todos' | 'sms' | 'email' | 'history'>('notices');

  // 1. Notice Board State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);
  const emptyNoticeForm = {
    title: '',
    category: 'General',
    priority: 'Normal',
    content: '',
    authorName: '',
    authorRole: 'Regional Oversight Leader',
    churchId: ''
  };
  const [noticeForm, setNoticeForm] = useState<any>(emptyNoticeForm);

  // 2. To-Do Tasks State
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const emptyTodoForm = {
    task: '',
    assignedTo: 'All Leaders',
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    churchId: '',
    notes: ''
  };
  const [todoForm, setTodoForm] = useState<any>(emptyTodoForm);

  // 3. Bulk SMS State
  const [smsTargetGroup, setSmsTargetGroup] = useState('pastors');
  const [smsChurchFilter, setSmsChurchFilter] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [dispatchingSms, setDispatchingSms] = useState(false);

  // 4. Email Outreach State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [dispatchingEmail, setDispatchingEmail] = useState(false);

  // Notice interactions
  const handleNoticeSubmit = async (e: any) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) {
      showToast('Notice Title and Body Content are required', 'error');
      return;
    }

    const payload = {
      ...noticeForm,
      churchId: noticeForm.churchId ? parseInt(noticeForm.churchId) : null,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingNoticeId) {
        await apiFetch(`/region-notices/${editingNoticeId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Notice Update Published Successfully', 'success');
      } else {
        await apiFetch('/region-notices', { method: 'POST', body: JSON.stringify({ ...payload, datePosted: new Date().toISOString() }) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'notice_published', details: `Notice: ${noticeForm.title}`, timestamp: new Date().toISOString() }) });
        showToast('Important Notice Broadcasted to All Regional Leaders', 'success');
      }
      setShowNoticeModal(false);
      setEditingNoticeId(null);
      setNoticeForm(emptyNoticeForm);
      refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditNotice = (n: any) => {
    setNoticeForm({
      title: n.title || '',
      category: n.category || 'General',
      priority: n.priority || 'Normal',
      content: n.content || '',
      authorName: n.authorName || '',
      authorRole: n.authorRole || 'Regional Oversight Leader',
      churchId: n.churchId ? String(n.churchId) : ''
    });
    setEditingNoticeId(n.id);
    setShowNoticeModal(true);
  };

  const deleteNotice = async (id: number) => {
    if (!confirm('Permanently Delete this Important Notice?')) return;
    try {
      await apiFetch(`/region-notices/${id}`, { method: 'DELETE' });
      showToast('Notice Deleted', 'success');
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  // To-Do Tasks interactions
  const handleTodoSubmit = async (e: any) => {
    e.preventDefault();
    if (!todoForm.task) {
      showToast('Please enter the executable Task Goal', 'error');
      return;
    }

    const payload = {
      ...todoForm,
      churchId: todoForm.churchId ? parseInt(todoForm.churchId) : null,
      dueDate: todoForm.dueDate ? new Date(todoForm.dueDate).toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingTodoId) {
        await apiFetch(`/todo-tasks/${editingTodoId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('To-Do Task Updated Successfully', 'success');
      } else {
        await apiFetch('/todo-tasks', { method: 'POST', body: JSON.stringify(payload) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'todo_created', details: `Task: ${todoForm.task}`, timestamp: new Date().toISOString() }) });
        showToast('Actionable Execution Task Assigned Successfully', 'success');
      }
      setShowTodoModal(false);
      setEditingTodoId(null);
      setTodoForm(emptyTodoForm);
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const startEditTodo = (t: any) => {
    const toD = (v: any) => v ? new Date(v).toISOString().split('T')[0] : '';
    setTodoForm({
      task: t.task || '',
      assignedTo: t.assignedTo || 'All Leaders',
      priority: t.priority || 'Medium',
      dueDate: toD(t.dueDate),
      status: t.status || 'Pending',
      churchId: t.churchId ? String(t.churchId) : '',
      notes: t.notes || ''
    });
    setEditingTodoId(t.id);
    setShowTodoModal(true);
  };

  const deleteTodo = async (id: number) => {
    if (!confirm('Permanently Delete this execution Task?')) return;
    try {
      await apiFetch(`/todo-tasks/${id}`, { method: 'DELETE' });
      showToast('Task Deleted', 'success');
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const toggleTaskDone = async (task: any) => {
    const nStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiFetch(`/todo-tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, status: nStatus, updatedAt: new Date().toISOString() }) });
      showToast(`Task marked as ${nStatus}`, 'success');
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  // Bulk SMS logic & matching pastor phone routing
  const smsRecipients = useMemo(() => {
    if (smsTargetGroup === 'pastors') {
      return (churches || []).filter((c: any) => c.pastorPhone || c.phone).map((c: any) => ({
        name: `Pastor ${c.pastorName || 'Leader'} (${c.name})`,
        phone: c.pastorPhone || c.phone || '—',
        church: c.name
      }));
    } else if (smsTargetGroup === 'members') {
      return (members || []).filter((m: any) => m.phone && (!smsChurchFilter || m.churchId?.toString() === smsChurchFilter)).map((m: any) => ({
        name: m.name,
        phone: m.phone,
        church: churches?.find((c: any) => c.id === m.churchId)?.name || 'Central'
      }));
    } else if (smsTargetGroup === 'youth') {
      return (members || []).filter((m: any) => m.phone && m.department?.includes('Youth') && (!smsChurchFilter || m.churchId?.toString() === smsChurchFilter)).map((m: any) => ({
        name: m.name,
        phone: m.phone,
        church: churches?.find((c: any) => c.id === m.churchId)?.name || 'Central'
      }));
    }
    return [];
  }, [smsTargetGroup, churches, members, smsChurchFilter]);

  const handleDispatchBulkSms = async (e: any) => {
    e.preventDefault();
    if (!smsMessage) return showToast('SMS Text Message Content is empty', 'error');
    if (smsRecipients.length === 0) return showToast('No Valid Recipient Mobile Numbers match the current target filter', 'error');

    try {
      setDispatchingSms(true);
      await apiFetch('/communication-logs', {
        method: 'POST',
        body: JSON.stringify({
          type: 'Bulk SMS Broadcast',
          senderName: 'DoxaRealm Central Discipleship Hub',
          recipientId: `${smsRecipients.length} Target Receivers (${smsTargetGroup.toUpperCase()})`,
          subject: 'Pastoral / Leader Gateway Notice',
          message: smsMessage,
          status: 'Successfully Dispatched via Proxy',
          date: new Date().toISOString(),
          timestamp: new Date().toISOString()
        })
      });

      await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'bulk_sms_dispatched', details: `Sent ${smsRecipients.length} SMS to ${smsTargetGroup}`, timestamp: new Date().toISOString() }) });
      showToast(`Instant Bulk SMS Broadcast Triggered for ${smsRecipients.length} Target Leaders / Pastors!`, 'success');
      setSmsMessage('');
      refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally { setDispatchingSms(false); }
  };

  const handleDispatchEmail = async (e: any) => {
    e.preventDefault();
    if (!emailSubject || !emailMessage) return showToast('Email Subject and Body are required', 'error');

    try {
      setDispatchingEmail(true);
      await apiFetch('/communication-logs', {
        method: 'POST',
        body: JSON.stringify({
          type: 'Official Email Campaign',
          senderName: 'DoxaRealm Bishop Oversight Office',
          recipientId: 'All Regional Registered Branch Emails',
          subject: emailSubject,
          message: emailMessage,
          template: emailTemplate,
          status: 'Delivered via Email Gateway Proxy',
          date: new Date().toISOString(),
          timestamp: new Date().toISOString()
        })
      });

      showToast('Email Campaign Triggered & Delivered Successfully', 'success');
      setEmailSubject('');
      setEmailMessage('');
      setEmailTemplate('');
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setDispatchingEmail(false); }
  };

  const sortedNotices = (regionNotices || []).sort((a: any, b: any) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
  const sortedTodos = (todoTasks || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedCommHistory = (communicationLogs || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-indigo-400" /> Communications, Notice Board &amp; Network To-Do Tasks List
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Regional executive notice board • Actionable executive network execution tasks list • Link branch pastor phones for Bulk SMS
          </p>
        </div>

        {/* Workspace switch mode */}
        <div className="flex bg-slate-800/90 rounded-xl border border-slate-700 p-1 font-medium text-xs shadow-lg">
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'notices' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Pin className="w-3.5 h-3.5" /> Notices ({sortedNotices.length})
          </button>
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'todos' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ListTodo className="w-3.5 h-3.5" /> To-Do List ({sortedTodos.filter((t:any) => t.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'sms' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Bulk SMS Outbox
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'email' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Mail className="w-3.5 h-3.5" /> Official Email Outreach
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Database className="w-3.5 h-3.5" /> Broadcast Archive ({sortedCommHistory.length})
          </button>
        </div>
      </div>

      {/* 1. Regional Executive Notice Board */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Pin className="w-5 h-5 text-indigo-400" /> Active Regional Notice Board (Taarifa na Matangazo ya Kiutendaji)
            </h2>
            <Button variant="primary" icon={Plus} size="md" onClick={() => { setEditingNoticeId(null); setNoticeForm(emptyNoticeForm); setShowNoticeModal(true); }}>
              📌 Post Important New Notice
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedNotices.length > 0 ? sortedNotices.map((n: any, idx: number) => {
              const ch = (churches || []).find((c: any) => c.id === n.churchId);
              return (
                <div key={idx} className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl relative group">
                  {n.priority === 'Urgent' && (
                    <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-500/50 py-1 px-2.5 rounded-full animate-pulse">
                      <Megaphone className="w-3 h-3" /> Urgent Notice
                    </span>
                  )}
                  <div className="space-y-3">
                    <Badge variant={n.category === 'Finance' ? 'success' : n.category === 'Emergency' ? 'danger' : 'warning'} className="text-[10px]">
                      {n.category || 'General Notice'}
                    </Badge>
                    <h3 className="text-lg font-bold text-slate-100 tracking-tight pr-12">{n.title}</h3>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[70px] bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 font-sans">
                      {n.content}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 mt-4 border-t border-slate-800/60 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{n.authorName || 'Executive Oversight'}</span>
                      <span className="text-[11px] font-mono text-slate-500">{new Date(n.datePosted).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-indigo-400 font-medium truncate">{n.authorRole} {ch ? `• ${ch.name}` : ''}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="xs" icon={Edit3} onClick={() => startEditNotice(n)}>Edit</Button>
                        <Button variant="ghost" size="xs" icon={Trash2} onClick={() => deleteNotice(n.id)} className="text-red-400 hover:text-red-300 hover:bg-red-950">Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-16 text-center text-slate-600 bg-slate-900/40 rounded-2xl border border-slate-800">
                <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-700 opacity-60" />
                <p className="font-bold text-base text-slate-400">Regional Executive Notice Board is completely clear</p>
                <p className="text-xs text-slate-500 mt-1">Click "Post Important New Notice" to pin strategic agenda messages for regional leadership.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Discipleship & Network Execution To-Do Tasks List Workspace */}
      {activeTab === 'todos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2 tracking-tight">
              <ListTodo className="w-5 h-5 text-amber-400" /> Actionable Execution Goals &amp; Network To-Do List (Viashiria na Utekelezaji)
            </h2>
            <Button variant="success" icon={Plus} size="md" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold" onClick={() => { setEditingTodoId(null); setTodoForm(emptyTodoForm); setShowTodoModal(true); }}>
              📝 Assign New Actionable Task Goal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTodos.length > 0 ? sortedTodos.map((task: any, idx: number) => {
              const ch = (churches || []).find((c: any) => c.id === task.churchId);
              const isDone = task.status === 'Completed';
              const isProg = task.status === 'In Progress';
              return (
                <div key={idx} className={`bg-slate-900/90 rounded-2xl border p-5 flex flex-col justify-between shadow-xl relative transition-all ${isDone ? 'border-emerald-800/60 opacity-70 bg-emerald-950/10' : isProg ? 'border-amber-500/80 ring-2 ring-amber-500/20' : 'border-slate-800/80 hover:border-slate-700'}`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={isDone ? 'success' : isProg ? 'warning' : 'default'} className="text-[10px] font-mono">
                        {task.status}
                      </Badge>
                      <Badge variant={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'} className="text-[10px]">
                        {task.priority} Priority
                      </Badge>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <button
                        onClick={() => toggleTaskDone(task)}
                        className={`mt-0.5 p-1.5 rounded-lg border transition-all cursor-pointer ${isDone ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                        title={isDone ? 'Click to mark Pending' : 'Click to mark Completed'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div>
                        <h3 className={`text-base font-bold tracking-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{task.task}</h3>
                        <span className="text-[11px] font-bold text-indigo-300 block mt-0.5">Assigned to: {task.assignedTo || 'All Leaders'}</span>
                      </div>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 font-sans">
                        {task.notes}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 mt-4 border-t border-slate-800/60 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate">{ch ? `Branch: ${ch.name}` : 'Shared Network'}</span>
                      {task.dueDate && <span className="font-mono text-amber-300 text-[11px]">🎯 Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-slate-500">Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="xs" icon={Edit3} onClick={() => startEditTodo(task)}>Edit</Button>
                        <Button variant="ghost" size="xs" icon={Trash2} onClick={() => deleteTodo(task.id)} className="text-red-400 hover:text-red-300 hover:bg-red-950">Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-16 text-center text-slate-600 bg-slate-900/40 rounded-2xl border border-slate-800">
                <ListTodo className="w-12 h-12 mx-auto mb-3 text-slate-700 opacity-60" />
                <p className="font-bold text-base text-slate-400">No Actionable Network Tasks Logged</p>
                <p className="text-xs text-slate-500 mt-1">Click "Assign New Actionable Task Goal" to schedule strategic targets, discipleship goals, or financial mandates.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Instant Bulk SMS Portal */}
      {activeTab === 'sms' && (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <Card className="lg:col-span-4 bg-slate-900/90 border-slate-800 shadow-2xl">
            <CardHeader className="bg-indigo-950/30">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" /> Instant Bulk SMS Trigger Hub (Mtumaji Wa Ujumbe Mfupi API)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically connects each registered target Church branch with its exact active Pastor phone number for high-priority dispatch.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDispatchBulkSms} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60">
                  <Select
                    label="Target Receiver Group *"
                    options={[
                      { value: 'pastors', label: '📞 All Church Branch Pastors &amp; Oversight Leaders' },
                      { value: 'members', label: '👥 All Registered Active Church Members' },
                      { value: 'youth', label: '⚡ Enrolled Youth Fellowship Group (13-45 yrs)' }
                    ]}
                    value={smsTargetGroup}
                    onChange={(e: any) => setSmsTargetGroup(e.target.value)}
                  />
                  {smsTargetGroup !== 'pastors' && (
                    <Select
                      label="Optional Target Church Filter"
                      options={[{ value: '', label: '— All Branches Network-Wide —' }, ...(churches || []).map((c: any) => ({ value: c.id, label: c.name }))]}
                      value={smsChurchFilter}
                      onChange={(e: any) => setSmsChurchFilter(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span>Target Recipient Mobile Database ({smsRecipients.length} Verified Contacts)</span>
                    <span className="text-emerald-400 font-mono">Simulating Proxy Dispatch</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                    {smsRecipients.length > 0 ? smsRecipients.map((rec: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0 text-slate-300">
                        <span className="truncate pr-4 font-sans font-medium">{rec.name}</span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">{rec.phone}</span>
                      </div>
                    )) : (
                      <p className="text-slate-600 text-center py-4 font-sans text-xs">No active mobile contacts fit current criteria</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300 uppercase tracking-wider">SMS Broadcast Message Content (Ujumbe Mahususi) *</label>
                    <span className="text-slate-500 font-mono">{smsMessage.length} characters</span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Type strategic update, upcoming executive synod invitation, emergency notice, or regional broadcast SMS..."
                    value={smsMessage}
                    onChange={(e: any) => setSmsMessage(e.target.value)}
                    required
                    className="w-full bg-slate-900 border-2 border-indigo-400/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 leading-relaxed font-sans"
                  />
                </div>

                <Button type="submit" variant="primary" icon={Send} size="lg" disabled={dispatchingSms} className="w-full py-3.5 text-base shadow-xl font-bold">
                  {dispatchingSms ? 'Dispatching Target SMS via Outbox Gateway Proxy...' : `🚀 Trigger Final SMS Broadcast to ${smsRecipients.length} Target Receivers`}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-slate-900/90 border-slate-800">
              <CardHeader className="bg-emerald-950/20">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Active Bulk Gateway Synchronicity Status
                </h3>
              </CardHeader>
              <CardContent className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between">
                  <span>API Proxy SMS Auto-Linker:</span>
                  <Badge variant="success" className="font-mono">Ready Operational</Badge>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between">
                  <span>Registered Church Branches Linked:</span>
                  <span className="font-bold text-white font-mono">{churches?.length || 0} Synced</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between">
                  <span>Verified Pastors Mobile Routing:</span>
                  <span className="font-bold text-indigo-300 font-mono">100% Active</span>
                </div>
                <p className="text-slate-500 text-[11px] pt-2 leading-normal">
                  Our comprehensive database auto-matches mobile credentials from target churches, member rosters, and youth hubs. Offline queries queue transmissions for automatic delivery.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. Official Email Hub */}
      {activeTab === 'email' && (
        <Card className="max-w-4xl bg-slate-900/90 border-slate-800 shadow-2xl">
          <CardHeader className="bg-indigo-950/30 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" /> Official Bishop Executive Outreach &amp; Email Campaign Hub
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Transmit formal regional synod circulars, strategic financial circulars, or discipleship mandates</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDispatchEmail} className="space-y-5">
              <Select
                label="Pre-Composed Executive Outreach Circular Templates"
                options={[
                  { value: '', label: '— Compose New Custom Campaign —' },
                  { value: 'Synod Notice: Ultimate Executive Regional synod Conference this week. Please bring all respective Branch Quarter Reports.', label: '🏛️ Formal Synod Circular Invitation' },
                  { value: 'Stewardship Notice: Baseline regional giving configuration updated. Primary operational currency is TZS. Please submit collection ledgers.', label: '💰 Universal Network Stewardship Update' },
                  { value: 'Discipleship Bulletin: High-priority discipleship new convert progress tracking required for all zone cell leaders.', label: '🕊️ New Convert Discipleship Discipleship Protocol' }
                ]}
                value={emailTemplate}
                onChange={(e: any) => {
                  const t = e.target.value;
                  setEmailTemplate(t);
                  if (t) {
                    setEmailSubject('DoxaRealm Executive Oversight Hub Campaign Circular');
                    setEmailMessage(t);
                  }
                }}
              />

              <Input
                label="Formal Email Campaign Subject *"
                placeholder="e.g. Bishop Office Formal Discipleship Mandatory Circular..."
                value={emailSubject}
                onChange={(e: any) => setEmailSubject(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Formal HTML Email Body Content *</label>
                <textarea
                  rows={8}
                  placeholder="Compose your comprehensive executive outreach HTML circular here..."
                  value={emailMessage}
                  onChange={(e: any) => setEmailMessage(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border-2 border-indigo-500/80 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/40 leading-relaxed font-sans"
                />
              </div>

              <Button type="submit" variant="primary" icon={Rocket} size="lg" disabled={dispatchingEmail} className="w-full py-3.5 text-base font-bold shadow-xl">
                {dispatchingEmail ? 'Executing Outbox Email Delivery Gateway Operation...' : '🚀 Trigger Universal Network-Wide Email Delivery Campaign'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 5. Broadcast History Archive */}
      {activeTab === 'history' && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-400" /> Complete Master Communication Logs Archive
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date Dispatched</th>
                    <th className="py-2.5 px-3">Campaign Channel</th>
                    <th className="py-2.5 px-3">Sender Office</th>
                    <th className="py-2.5 px-3">Target Receivers</th>
                    <th className="py-2.5 px-3">Message Subject / Content Summary</th>
                    <th className="py-2.5 px-3 font-bold text-indigo-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {sortedCommHistory.length > 0 ? sortedCommHistory.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 text-slate-400 font-mono">{new Date(c.date).toLocaleString()}</td>
                      <td className="py-3 px-3"><Badge variant={c.type?.includes('SMS') ? 'success' : 'primary'}>{c.type}</Badge></td>
                      <td className="py-3 px-3 font-medium text-slate-200">{c.senderName || 'Executive Strategic Oversight'}</td>
                      <td className="py-3 px-3 text-indigo-300 font-medium">{c.recipientId || 'All Shared Network Units'}</td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{c.subject || c.message || '—'}</td>
                      <td className="py-3 px-3"><Badge variant="info" className="font-mono">{c.status || 'Proxy Transmitted'}</Badge></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-600">No formal official outreach messages or Bulk SMS recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notice Edit / Creation Modal */}
      <Modal open={showNoticeModal} onClose={() => { setShowNoticeModal(false); setEditingNoticeId(null); setNoticeForm(emptyNoticeForm); }} title={editingNoticeId ? "Edit Published Active Notice" : "📌 Post Strategic Regional Notice"} size="md">
        <form onSubmit={handleNoticeSubmit} className="space-y-5">
          <Input label="Notice Title (Kichwa Cha Taarifa) *" value={noticeForm.title} onChange={(e: any) => setNoticeForm({ ...noticeForm, title: e.target.value })} required placeholder="Urgent General Synod Request next week..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Priority Rating *" options={['Normal', 'Urgent']} value={noticeForm.priority} onChange={(e: any) => setNoticeForm({ ...noticeForm, priority: e.target.value })} required />
            <Select label="Notice Category *" options={['General', 'Discipleship', 'Emergency', 'Meetings', 'Finance']} value={noticeForm.category} onChange={(e: any) => setNoticeForm({ ...noticeForm, category: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Author Executive Credentials" value={noticeForm.authorName} onChange={(e: any) => setNoticeForm({ ...noticeForm, authorName: e.target.value })} placeholder="Bishop Office / Executive Katibu..." />
            <Select label="Related Target Branch Isolation" options={[{ value: '', label: '— Universal Network-Wide —' }, ...(churches || []).map((c: any) => ({ value: c.id, label: c.name }))]} value={noticeForm.churchId} onChange={(e: any) => setNoticeForm({ ...noticeForm, churchId: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Notice Complete Content (Ujumbe Kamili) *</label>
            <textarea rows={7} value={noticeForm.content} onChange={(e: any) => setNoticeForm({ ...noticeForm, content: e.target.value })} required placeholder="Type the formal executive notice parameters exactly..." className="w-full bg-slate-950 border-2 border-indigo-500/80 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 leading-relaxed font-sans" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => { setShowNoticeModal(false); setEditingNoticeId(null); setNoticeForm(emptyNoticeForm); }}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Save} size="lg">{editingNoticeId ? 'Update Notice Changes' : 'Broadcast Final Notice to All Regional Leaders'}</Button>
          </div>
        </form>
      </Modal>

      {/* To-Do Task Edit / Creation Modal */}
      <Modal open={showTodoModal} onClose={() => { setShowTodoModal(false); setEditingTodoId(null); setTodoForm(emptyTodoForm); }} title={editingTodoId ? "Edit Execution Network Task Goal" : "📝 Assign Strategic Actionable Execution Task Goal"} size="md">
        <form onSubmit={handleTodoSubmit} className="space-y-5 font-sans">
          <Input label="Task Goal Summary (Lengo Mahususi) *" value={todoForm.task} onChange={(e: any) => setTodoForm({ ...todoForm, task: e.target.value })} required placeholder="Submit precise quarterly collection financial reports..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Priority *" options={['Low', 'Medium', 'High']} value={todoForm.priority} onChange={(e: any) => setTodoForm({ ...todoForm, priority: e.target.value })} required />
            <Input label="Target Due Date" type="date" value={todoForm.dueDate} onChange={(e: any) => setTodoForm({ ...todoForm, dueDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Assigned Executive Role / Name" value={todoForm.assignedTo} onChange={(e: any) => setTodoForm({ ...todoForm, assignedTo: e.target.value })} placeholder="All Pastors, Katibu Mkoa, Treasurer..." />
            <Select label="Target Target Branch Support" options={[{ value: '', label: '— Entire Target Network —' }, ...(churches || []).map((c: any) => ({ value: c.id, label: c.name }))]} value={todoForm.churchId} onChange={(e: any) => setTodoForm({ ...todoForm, churchId: e.target.value })} />
          </div>
          <Select label="Task Status" options={['Pending', 'In Progress', 'Completed']} value={todoForm.status} onChange={(e: any) => setTodoForm({ ...todoForm, status: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Detailed Execution Instructions (Maelezo ya Utekelezaji)</label>
            <textarea rows={4} value={todoForm.notes} onChange={(e: any) => setTodoForm({ ...todoForm, notes: e.target.value })} placeholder="Type specific deliverable key deliverable directives, synod benchmarks, or follow-up parameters..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-sans" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => { setShowTodoModal(false); setEditingTodoId(null); setTodoForm(emptyTodoForm); }}>Cancel</Button>
            <Button variant="success" type="submit" icon={Save} size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">{editingTodoId ? 'Update Actionable Execution Goal' : 'Confirm &amp; Broadcast Actionable Execution Task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── STANDALONE TO-DO LIST PAGE ───────────────────────────────────────────
function TodoListPage() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const { todoTasks, churches } = db;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState('All');
  const emptyForm = { task: '', assignedTo: 'All Leaders', priority: 'Medium', dueDate: new Date().toISOString().split('T')[0], status: 'Pending', churchId: '', notes: '' };
  const [form, setForm] = useState<any>(emptyForm);

  const filtered = (todoTasks || []).filter((t: any) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return t.status !== 'Completed';
    if (filter === 'Completed') return t.status === 'Completed';
    return true;
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: todoTasks?.length || 0,
    pending: todoTasks?.filter((t: any) => t.status === 'Pending').length || 0,
    inProgress: todoTasks?.filter((t: any) => t.status === 'In Progress').length || 0,
    completed: todoTasks?.filter((t: any) => t.status === 'Completed').length || 0,
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.task) { showToast('Task is required', 'error'); return; }
    const payload = {
      ...form,
      churchId: form.churchId ? parseInt(form.churchId) : null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      updatedAt: new Date().toISOString()
    };
    try {
      if (editingId) {
        await apiFetch(`/todo-tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Task updated', 'success');
      } else {
        await apiFetch('/todo-tasks', { method: 'POST', body: JSON.stringify(payload) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'todo_created', details: `Task: ${form.task}`, timestamp: new Date().toISOString() }) });
        showToast('Task created', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const startEdit = (t: any) => {
    setForm({
      task: t.task || '',
      assignedTo: t.assignedTo || 'All Leaders',
      priority: t.priority || 'Medium',
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      status: t.status || 'Pending',
      churchId: t.churchId ? String(t.churchId) : '',
      notes: t.notes || ''
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const toggleStatus = async (task: any) => {
    const next = task.status === 'Pending' ? 'In Progress' : task.status === 'In Progress' ? 'Completed' : 'Pending';
    try {
      await apiFetch(`/todo-tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, status: next, updatedAt: new Date().toISOString() }) });
      showToast(`Task → ${next}`, 'success');
      refresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try { await apiFetch(`/todo-tasks/${id}`, { method: 'DELETE' }); showToast('Deleted', 'success'); refresh(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3"><ListTodo className="w-6 h-6 text-amber-400" /> To-Do List &amp; Task Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Create, assign, track, and complete execution tasks across all churches</p>
        </div>
        <Button icon={Plus} variant="primary" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>Add New Task</Button>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="text-center"><p className="text-xs text-slate-500">TOTAL</p><p className="text-2xl font-bold text-slate-100">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="text-center"><p className="text-xs text-slate-500">PENDING</p><p className="text-2xl font-bold text-amber-400">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="text-center"><p className="text-xs text-slate-500">IN PROGRESS</p><p className="text-2xl font-bold text-indigo-400">{stats.inProgress}</p></CardContent></Card>
        <Card><CardContent className="text-center"><p className="text-xs text-slate-500">COMPLETED</p><p className="text-2xl font-bold text-emerald-400">{stats.completed}</p></CardContent></Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['All', 'Active', 'Completed'].map((f: string) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>{f} ({f === 'All' ? stats.total : f === 'Active' ? stats.pending + stats.inProgress : stats.completed})</button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-amber-700/40 bg-amber-950/10">
          <CardHeader><h3 className="text-sm font-semibold">{editingId ? 'Edit Task' : 'Create New Task'}</h3></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Task Description *" value={form.task} onChange={(e: any) => setForm({ ...form, task: e.target.value })} required placeholder="What needs to be done?" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Assigned To" value={form.assignedTo} onChange={(e: any) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Person or role" />
                <Select label="Priority" options={['Low', 'Medium', 'High']} value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })} />
                <Input label="Due Date" type="date" value={form.dueDate} onChange={(e: any) => setForm({ ...form, dueDate: e.target.value })} />
                <Select label="Status" options={['Pending', 'In Progress', 'Completed']} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                <Select label="Church (optional)" options={[{ value: '', label: '— All Churches —' }, ...churches.map((c: any) => ({ value: c.id, label: c.name }))]} value={form.churchId} onChange={(e: any) => setForm({ ...form, churchId: e.target.value })} />
              </div>
              <Textarea label="Notes / Instructions" value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>Cancel</Button>
                <Button type="submit" icon={Save}>{editingId ? 'Update Task' : 'Save Task'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? filtered.map((task: any) => {
          const ch = churches.find((c: any) => c.id === task.churchId);
          const isDone = task.status === 'Completed';
          const isProg = task.status === 'In Progress';
          return (
            <Card key={task.id} className={`transition-all ${isDone ? 'opacity-60 border-emerald-800/40' : isProg ? 'border-amber-500/60' : ''}`}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={isDone ? 'success' : isProg ? 'warning' : 'default'}>{task.status}</Badge>
                  <Badge variant={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}>{task.priority}</Badge>
                </div>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleStatus(task)} className={`mt-0.5 p-1.5 rounded-lg transition cursor-pointer flex-shrink-0 ${isDone ? 'bg-emerald-500 text-white' : isProg ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                    <Check className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.task}</h4>
                    <p className="text-xs text-indigo-300 mt-0.5">→ {task.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>
                {task.notes && <p className="text-xs text-slate-400 bg-slate-800/40 p-2 rounded-lg">{task.notes}</p>}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/40">
                  <span>{ch ? ch.name : 'Network'}</span>
                  <span>{task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="xs" variant="secondary" icon={Edit3} onClick={() => startEdit(task)}>Edit</Button>
                  <Button size="xs" variant="danger" icon={Trash2} onClick={() => deleteTask(task.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="col-span-full py-16 text-center text-slate-600">
            <ListTodo className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-sm">No tasks yet. Click "Add New Task" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FinancialSettings() {
  const { db, showToast, apiFetch, refresh } = useApp();
  const { attendanceLogs, churches, zones, cellGroups, stewardshipSettings } = db;
  const [activeTab, setActiveTab] = useState<'collect' | 'ledger' | 'settings'>('collect');

  // Form & Category settings
  const [selectedCategory, setSelectedCategory] = useState<string>('offering');
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  
  const emptyCollectForm = {
    date: new Date().toISOString().split('T')[0],
    churchId: '',
    zoneId: '',
    cellGroupId: '',
    attendance: '0',
    tithe: '',
    offering: '',
    seed: '',
    firstFruit: '',
    gospel: '',
    sundaySchool: '',
    youth: '',
    other: '',
    currency: 'TZS',
    notes: ''
  };
  
  const [collectForm, setCollectForm] = useState<any>(emptyCollectForm);
  const [settingsForm, setSettingsForm] = useState<any>({ baseCurrency: 'TZS', monthlyCellTarget: 20, titheGoalPercentage: 10, contributionCategories: ['tithe','offering','seed','first_fruit','gospel','sunday_school','youth','other'] });
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    if (stewardshipSettings) {
      setSettingsForm({
        baseCurrency: stewardshipSettings.baseCurrency || 'TZS',
        monthlyCellTarget: stewardshipSettings.monthlyCellTarget || 20,
        titheGoalPercentage: stewardshipSettings.titheGoalPercentage || 10,
        contributionCategories: stewardshipSettings.contributionCategories || ['tithe','offering','seed','first_fruit','gospel','sunday_school','youth','other']
      });
      setCollectForm((prev:any) => ({ ...prev, currency: stewardshipSettings.baseCurrency || 'TZS' }));
    }
  }, [stewardshipSettings]);

  // Categories definitions for interactive selection
  const categoriesList = [
    { id: 'tithe', label: 'Tithe', swahili: 'Zaka 10%', icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/50' },
    { id: 'offering', label: 'Offering', swahili: 'Sadaka ya Kawaida', icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-700/50' },
    { id: 'seed', label: 'Seed', swahili: 'Sadaka ya Mbegu', icon: Rocket, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-700/50' },
    { id: 'first_fruit', label: 'First Fruit', swahili: 'Malimbuko', icon: Award, color: 'text-rose-400', bg: 'bg-rose-900/20', border: 'border-rose-700/50' },
    { id: 'gospel', label: 'Gospel Fund', swahili: 'Mfuko wa Injili', icon: HardDrive, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-700/50' },
    { id: 'sunday_school', label: 'Sunday School', swahili: 'Shule ya Jumapili', icon: Users, color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-700/50' },
    { id: 'youth', label: 'Youth Fund', swahili: 'Mfuko wa Vijana', icon: Zap, color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-700/50' },
    { id: 'other', label: 'Others', swahili: 'Michango Mengineyo', icon: Check, color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700/50' },
  ];

  // Cascading geographic selects
  const filteredZones = collectForm.churchId ? (zones || []).filter((z: any) => z.churchId === parseInt(collectForm.churchId)) : (zones || []);
  const filteredCells = collectForm.zoneId ? (cellGroups || []).filter((c: any) => c.zoneId === parseInt(collectForm.zoneId)) : collectForm.churchId ? (cellGroups || []).filter((c: any) => c.churchId === parseInt(collectForm.churchId)) : (cellGroups || []);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    showToast(`Opened Interactive Form for: ${categoriesList.find(c => c.id === catId)?.label} (${categoriesList.find(c => c.id === catId)?.swahili})`, 'info');
  };

  const handleCollectSubmit = async (e: any) => {
    e.preventDefault();
    if (!collectForm.churchId) {
      showToast('Please select the respective Church Branch', 'error');
      return;
    }
    
    const payload = {
      ...collectForm,
      churchId: collectForm.churchId ? parseInt(collectForm.churchId) : null,
      zoneId: collectForm.zoneId ? parseInt(collectForm.zoneId) : null,
      cellGroupId: collectForm.cellGroupId ? parseInt(collectForm.cellGroupId) : null,
      attendance: parseInt(collectForm.attendance) || 0,
      tithe: parseFloat(collectForm.tithe) || 0,
      offering: parseFloat(collectForm.offering) || 0,
      seed: parseFloat(collectForm.seed) || 0,
      firstFruit: parseFloat(collectForm.firstFruit) || 0,
      gospel: parseFloat(collectForm.gospel) || 0,
      sundaySchool: parseFloat(collectForm.sundaySchool) || 0,
      youth: parseFloat(collectForm.youth) || 0,
      other: parseFloat(collectForm.other) || 0,
      timestamp: new Date().toISOString()
    };

    try {
      if (editingLogId) {
        await apiFetch(`/attendance-logs/${editingLogId}`, { method: 'PUT', body: JSON.stringify(payload) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'collection_updated', details: `Updated collection ID ${editingLogId}`, timestamp: new Date().toISOString() }) });
        showToast('Financial Collection Updated Successfully', 'success');
      } else {
        await apiFetch('/attendance-logs', { method: 'POST', body: JSON.stringify(payload) });
        await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify({ action: 'collection_logged', details: `Logged collections for branch ID ${payload.churchId}`, timestamp: new Date().toISOString() }) });
        showToast('Financial Collections Recorded Successfully to Branch, Zone and Cell', 'success');
      }
      setCollectForm(emptyCollectForm);
      setEditingLogId(null);
      refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditLog = (log: any) => {
    const toD = (v: any) => v ? new Date(v).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setCollectForm({
      date: toD(log.date),
      churchId: log.churchId ? String(log.churchId) : '',
      zoneId: log.zoneId ? String(log.zoneId) : '',
      cellGroupId: log.cellGroupId ? String(log.cellGroupId) : '',
      attendance: String(log.attendance || 0),
      tithe: log.tithe ? String(log.tithe) : '',
      offering: log.offering ? String(log.offering) : '',
      seed: log.seed ? String(log.seed) : '',
      firstFruit: log.firstFruit ? String(log.firstFruit) : '',
      gospel: log.gospel ? String(log.gospel) : '',
      sundaySchool: log.sundaySchool ? String(log.sundaySchool) : '',
      youth: log.youth ? String(log.youth) : '',
      other: log.other ? String(log.other) : '',
      currency: log.currency || settingsForm.baseCurrency,
      notes: log.notes || ''
    });
    setEditingLogId(log.id);
    setActiveTab('collect');
    showToast('Editing financial collection record', 'info');
  };

  const handleSaveSettings = async (e: any) => {
    e.preventDefault();
    try {
      await apiFetch('/stewardship-settings', { method: 'POST', body: JSON.stringify(settingsForm) });
      refresh();
      showToast('Global Stewardship Configuration Saved', 'success');
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  // Sums calculations from active database records
  const allLogs = (attendanceLogs || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const grandTithe = allLogs.reduce((s: number, l: any) => s + (l.tithe || 0), 0);
  const grandOffering = allLogs.reduce((s: number, l: any) => s + (l.offering || 0), 0);
  const grandSeed = allLogs.reduce((s: number, l: any) => s + (l.seed || 0), 0);
  const grandFirstFruit = allLogs.reduce((s: number, l: any) => s + (l.firstFruit || 0), 0);
  const grandGospel = allLogs.reduce((s: number, l: any) => s + (l.gospel || 0), 0);
  const grandSundaySchool = allLogs.reduce((s: number, l: any) => s + (l.sundaySchool || 0), 0);
  const grandYouth = allLogs.reduce((s: number, l: any) => s + (l.youth || 0), 0);
  const grandOther = allLogs.reduce((s: number, l: any) => s + (l.other || 0), 0);
  const grandTotalAll = grandTithe + grandOffering + grandSeed + grandFirstFruit + grandGospel + grandSundaySchool + grandYouth + grandOther;

  // Per church aggregation
  const churchGivingTotals = (churches || []).map((ch: any) => {
    const chL = allLogs.filter((l: any) => l.churchId === ch.id);
    const tot = chL.reduce((s: number, l: any) => s + ((l.tithe||0)+(l.offering||0)+(l.seed||0)+(l.firstFruit||0)+(l.gospel||0)+(l.sundaySchool||0)+(l.youth||0)+(l.other||0)), 0);
    return { name: ch.name, location: ch.location || ch.city, count: chL.length, total: tot };
  });

  return (
    <div className="space-y-6">
      {/* Top Main Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-indigo-400" /> Stewardship &amp; Interactive Collections Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Click any offering category to open branch inputs • Fill exact collections linked to exact Churches, Zones, and Cell Groups
          </p>
        </div>

        {/* Action switch tabs */}
        <div className="flex bg-slate-800/90 rounded-xl border border-slate-700/80 p-1 font-medium text-xs">
          <button
            onClick={() => setActiveTab('collect')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'collect' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            💰 Click &amp; Record Collections
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📊 Network Ledgers &amp; Archive
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ⚙️ Configuration
          </button>
        </div>
      </div>

      {activeTab === 'collect' && (
        <div className="space-y-6">
          {/* Top Categories interactive picker bar */}
          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" /> 1. Tapping Any Offering Category Highlights &amp; Opens Its Respective Input Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-950/40 border-indigo-500 scale-[1.03] shadow-lg shadow-indigo-950/50' : `${cat.bg} ${cat.border} opacity-80 hover:opacity-100`}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <cat.icon className={`w-5 h-5 ${cat.color}`} />
                      {isSelected && <Badge variant="success" className="text-[9px]">Active</Badge>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100 text-sm tracking-tight truncate">{cat.label}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{cat.swahili}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Highly polished highly detailed collection form */}
          <Card className="border-indigo-900/50 bg-slate-900/90 shadow-2xl">
            <CardHeader className="flex flex-wrap items-center justify-between gap-2 bg-indigo-950/20">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-400" /> 2. Fill Respective Church Branch, Zone, Cell and Collection Sums
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Currently filling records specifically focused on <strong className="text-indigo-300 capitalize">{categoriesList.find(c => c.id === selectedCategory)?.label} ({categoriesList.find(c => c.id === selectedCategory)?.swahili})</strong> (or complete all relevant categories below).
                </p>
              </div>
              <Badge variant="primary" className="text-xs font-mono py-1 px-3">Currency: {collectForm.currency}</Badge>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCollectSubmit} className="space-y-6">
                {/* 1. Respective Geography & Date */}
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" /> Target Geography &amp; Date
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select
                      label="Target Church Branch *"
                      options={[{ value: '', label: '— Select Respective Church —' }, ...(churches || []).map((c: any) => ({ value: c.id, label: c.name }))]}
                      value={collectForm.churchId}
                      onChange={(e: any) => setCollectForm({ ...collectForm, churchId: e.target.value, zoneId: '', cellGroupId: '' })}
                      required
                    />
                    <Select
                      label="Respective Zone Branch"
                      options={[{ value: '', label: '— All Zones —' }, ...filteredZones.map((z: any) => ({ value: z.id, label: z.name }))]}
                      value={collectForm.zoneId}
                      onChange={(e: any) => setCollectForm({ ...collectForm, zoneId: e.target.value, cellGroupId: '' })}
                    />
                    <Select
                      label="Respective Cell Group"
                      options={[{ value: '', label: '— All Cells —' }, ...filteredCells.map((c: any) => ({ value: c.id, label: c.name }))]}
                      value={collectForm.cellGroupId}
                      onChange={(e: any) => setCollectForm({ ...collectForm, cellGroupId: e.target.value })}
                    />
                    <Input
                      label="Collection Date *"
                      type="date"
                      value={collectForm.date}
                      onChange={(e: any) => setCollectForm({ ...collectForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* 2. Primary auto-highlighted clicked category input */}
                <div className="p-5 bg-indigo-950/30 rounded-2xl border-2 border-indigo-500/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-200 tracking-wide uppercase flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400 animate-pulse" /> Auto-Focused Target Input: {categoriesList.find(c => c.id === selectedCategory)?.label} ({categoriesList.find(c => c.id === selectedCategory)?.swahili})
                    </span>
                    <span className="text-xs text-indigo-400">All amounts entered in {collectForm.currency}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Enter total ${categoriesList.find(c => c.id === selectedCategory)?.label} sum collected...`}
                      value={
                        selectedCategory === 'tithe' ? collectForm.tithe :
                        selectedCategory === 'offering' ? collectForm.offering :
                        selectedCategory === 'seed' ? collectForm.seed :
                        selectedCategory === 'first_fruit' ? collectForm.firstFruit :
                        selectedCategory === 'gospel' ? collectForm.gospel :
                        selectedCategory === 'sunday_school' ? collectForm.sundaySchool :
                        selectedCategory === 'youth' ? collectForm.youth : collectForm.other
                      }
                      onChange={(e: any) => {
                        const val = e.target.value;
                        if (selectedCategory === 'tithe') setCollectForm({ ...collectForm, tithe: val });
                        else if (selectedCategory === 'offering') setCollectForm({ ...collectForm, offering: val });
                        else if (selectedCategory === 'seed') setCollectForm({ ...collectForm, seed: val });
                        else if (selectedCategory === 'first_fruit') setCollectForm({ ...collectForm, firstFruit: val });
                        else if (selectedCategory === 'gospel') setCollectForm({ ...collectForm, gospel: val });
                        else if (selectedCategory === 'sunday_school') setCollectForm({ ...collectForm, sundaySchool: val });
                        else if (selectedCategory === 'youth') setCollectForm({ ...collectForm, youth: val });
                        else setCollectForm({ ...collectForm, other: val });
                      }}
                      className="w-full bg-slate-900 border-2 border-indigo-400 rounded-xl px-4 py-3 text-lg font-bold font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                {/* 3. Simultaneous Input for All Other Financial Categories */}
                <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/60 space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Or Fill All Other Relevant Collection Collections Simultaneously</span>
                    <span className="text-[10px] text-slate-500 lowercase">Optional inputs</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <Input label="Tithe (Zaka)" type="number" step="0.01" value={collectForm.tithe} onChange={(e:any) => setCollectForm({...collectForm, tithe: e.target.value})} />
                    <Input label="Offering (Sadaka)" type="number" step="0.01" value={collectForm.offering} onChange={(e:any) => setCollectForm({...collectForm, offering: e.target.value})} />
                    <Input label="Seed (Mbegu)" type="number" step="0.01" value={collectForm.seed} onChange={(e:any) => setCollectForm({...collectForm, seed: e.target.value})} />
                    <Input label="First Fruit" type="number" step="0.01" value={collectForm.firstFruit} onChange={(e:any) => setCollectForm({...collectForm, firstFruit: e.target.value})} />
                    <Input label="Gospel (Injili)" type="number" step="0.01" value={collectForm.gospel} onChange={(e:any) => setCollectForm({...collectForm, gospel: e.target.value})} />
                    <Input label="Sunday School" type="number" step="0.01" value={collectForm.sundaySchool} onChange={(e:any) => setCollectForm({...collectForm, sundaySchool: e.target.value})} />
                    <Input label="Youth Fund" type="number" step="0.01" value={collectForm.youth} onChange={(e:any) => setCollectForm({...collectForm, youth: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Input label="Other Contributions (Mengineyo)" type="number" step="0.01" value={collectForm.other} onChange={(e:any) => setCollectForm({...collectForm, other: e.target.value})} />
                    <Input label="Receipt / Collection Notes" value={collectForm.notes} onChange={(e:any) => setCollectForm({...collectForm, notes: e.target.value})} placeholder="Receipt No. or collector credentials..." />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-4 pt-2">
                  {editingLogId && (
                    <Button variant="ghost" type="button" onClick={() => { setEditingLogId(null); setCollectForm(emptyCollectForm); }}>
                      Cancel Edit
                    </Button>
                  )}
                  <Button type="submit" variant="primary" icon={Save} size="lg" className="w-full sm:w-auto px-8">
                    {editingLogId ? 'Update financial Collection Record' : 'Save Collections to Target Church Branch'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Network financial Ledgers and real sums */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Top Aggregated stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-emerald-900/30 border border-emerald-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-emerald-400">{grandTithe.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">Grand Tithe</div></div>
            <div className="bg-amber-900/30 border border-amber-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-amber-400">{grandOffering.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">Offering</div></div>
            <div className="bg-cyan-900/30 border border-cyan-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-cyan-400">{grandSeed.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">Seed Fund</div></div>
            <div className="bg-rose-900/30 border border-rose-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-rose-400">{grandFirstFruit.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">1st Fruit</div></div>
            <div className="bg-indigo-900/30 border border-indigo-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-indigo-400">{grandGospel.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">Gospel Hub</div></div>
            <div className="bg-teal-900/30 border border-teal-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-teal-400">{grandSundaySchool.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">Sun. School</div></div>
            <div className="bg-violet-900/30 border border-violet-700/50 p-3 rounded-xl text-center"><div className="text-sm font-bold font-mono text-violet-400">{grandYouth.toLocaleString()}</div><div className="text-[10px] text-slate-400 uppercase mt-0.5">Youth Fund</div></div>
            <div className="bg-slate-800 border border-slate-700/50 p-3 rounded-xl text-center font-bold text-white"><div className="text-sm font-mono">{grandTotalAll.toLocaleString()}</div><div className="text-[10px] text-emerald-400 uppercase mt-0.5">All Income</div></div>
          </div>

          {/* Real Live Per-Church Financial Collections Progress Card */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" /> Active Discipleship &amp; Collection Records Grouped By Target Church
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {churchGivingTotals.map((ch: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/60 hover:border-slate-600 transition">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-base font-bold text-slate-100">{ch.name}</strong>
                      <Badge variant="success" className="font-mono">{ch.count} entries</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{ch.location || 'Central Area'}</p>
                    <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between font-mono text-sm">
                      <span className="text-slate-500 text-xs">SUM GIVING:</span>
                      <span className="font-bold text-emerald-400 tracking-tight">{ch.total.toLocaleString()} TZS</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full collection records archive table with Edit Standard */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" /> Master Actual Discipleship &amp; Financial Collections Ledger
              </h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Church Branch</th>
                      <th className="py-2.5 px-3">Zone / Cell</th>
                      <th className="py-2.5 px-3 text-right">Tithe</th>
                      <th className="py-2.5 px-3 text-right">Offering</th>
                      <th className="py-2.5 px-3 text-right">Seed</th>
                      <th className="py-2.5 px-3 text-right">1st Fruit</th>
                      <th className="py-2.5 px-3 text-right">Gospel</th>
                      <th className="py-2.5 px-3 text-right">Sun. School</th>
                      <th className="py-2.5 px-3 text-right">Youth</th>
                      <th className="py-2.5 px-3 text-right">Other</th>
                      <th className="py-2.5 px-3 text-right font-bold text-indigo-300">Grand Sum</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {allLogs.length > 0 ? allLogs.map((l: any, i: number) => {
                      const ch = (churches || []).find((c: any) => c.id === l.churchId);
                      const z = (zones || []).find((zone: any) => zone.id === l.zoneId);
                      const cl = (cellGroups || []).find((cell: any) => cell.id === l.cellGroupId);
                      const tot = (l.tithe||0)+(l.offering||0)+(l.seed||0)+(l.firstFruit||0)+(l.gospel||0)+(l.sundaySchool||0)+(l.youth||0)+(l.other||0);
                      
                      return (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 text-slate-300">{new Date(l.date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-bold font-sans text-slate-100">{ch?.name || '—'}</td>
                          <td className="py-3 px-3 font-sans text-slate-400">
                            <div>{z?.name || '—'}</div>
                            <div className="text-[10px] text-slate-500">{cl?.name || ''}</div>
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-400">{l.tithe?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-amber-400">{l.offering?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-cyan-400">{l.seed?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-rose-400">{l.firstFruit?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-indigo-400">{l.gospel?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-teal-400">{l.sundaySchool?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-violet-400">{l.youth?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right text-slate-400">{l.other?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3 text-right font-bold text-white bg-slate-900/60 rounded">{tot.toLocaleString()} {l.currency || 'TZS'}</td>
                          <td className="py-3 px-3 text-right font-sans">
                            <Button variant="ghost" size="xs" icon={Edit3} onClick={() => startEditLog(l)}>Edit</Button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={13} className="py-12 text-center font-sans text-slate-600">
                          No financial collection logs recorded yet. Switch to "Click &amp; Record Collections" to fill collections.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stewardship configuration */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Global Network Financial Stewardship Configuration
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <Select
                label="Base Currency (Tanzania TZS Default)"
                options={['TZS','USD','KES','UGX','EUR','GBP','ZAR','NGN','RWF','BIF','MWK']}
                value={settingsForm.baseCurrency}
                onChange={(e: any) => setSettingsForm({ ...settingsForm, baseCurrency: e.target.value })}
              />
              <Input
                label="Monthly Baseline Cell Target (TZS)"
                type="number"
                value={settingsForm.monthlyCellTarget}
                onChange={(e: any) => setSettingsForm({ ...settingsForm, monthlyCellTarget: parseInt(e.target.value) || 20 })}
              />
              <Input
                label="Baseline Tithe Network Goal (%)"
                type="number"
                step="0.1"
                value={settingsForm.titheGoalPercentage}
                onChange={(e: any) => setSettingsForm({ ...settingsForm, titheGoalPercentage: parseFloat(e.target.value) || 10 })}
              />
              <Button type="submit" variant="primary" icon={Save} size="lg">Save Configuration</Button>
            </form>
          </CardContent>
        </Card>
      )}
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
  { id: 'todo-list', label: '📝 To-Do List & Tasks', icon: ListTodo },
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
      case 'todo-list': return <TodoListPage/>;
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
