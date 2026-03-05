import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, UploadCloud, Users, Activity, Plus, Eye,
  Crosshair, ChevronDown, ScanEye, X, ZoomIn, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { customFetch } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }
interface Transaction {
  transaction_id: string;
  disease_detected: string;
  created_at: string;
}
interface Patient {
  patient_id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  transactions?: Transaction[];
}
interface PatientFormData { name: string; email: string; age: number; gender: string; }

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toasts({ items, onRemove }: { items: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold min-w-[280px] max-w-sm ${
              t.type === 'success' ? 'bg-emerald-950/95 border-emerald-700/40 text-emerald-200' :
              t.type === 'error'   ? 'bg-rose-950/95 border-rose-700/40 text-rose-200' :
                                     'bg-slate-900/95 border-slate-700/40 text-slate-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
              t.type === 'success' ? 'bg-emerald-400' :
              t.type === 'error'   ? 'bg-rose-400' : 'bg-sky-400'
            }`} />
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        src={src}
        alt="Fundus scan full preview"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Patient Dropdown ─────────────────────────────────────────────────────────
function PatientSelect({
  value, onChange, patients,
}: {
  value: string;
  onChange: (id: string) => void;
  patients: Patient[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = patients.find(p => p.patient_id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/80 px-5 py-4 text-sm text-left font-semibold cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60"
      >
        <span className={`flex-1 ${selected ? 'text-white' : 'text-slate-500'}`}>
          {selected ? selected.name : '— Select a patient —'}
        </span>
        {selected && (
          <span className="text-xs font-mono text-slate-500">{selected.patient_id}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden max-h-64 overflow-y-auto"
          >
            {patients.length === 0 ? (
              <div className="px-5 py-4 text-sm text-slate-500 italic">
                No patients registered yet. Use "New Patient" to add one.
              </div>
            ) : (
              patients.map(p => (
                <button
                  key={p.patient_id}
                  type="button"
                  onClick={() => { onChange(p.patient_id); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-sm text-left transition-colors ${
                    p.patient_id === value ? 'bg-primary/20 text-white' : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-slate-500 font-mono">{p.patient_id}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Patient Registration Form (reused in both tabs) ──────────────────────────
function PatientForm({
  data, onChange, onSubmit, onClose, loading, error,
}: {
  data: PatientFormData;
  onChange: (d: PatientFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="mb-7"
    >
      <div className="bg-indigo-950/60 border border-indigo-800/40 p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-4 right-5 text-primary/8 pointer-events-none">
          <Activity className="w-20 h-20" />
        </div>
        <h3 className="font-bold text-lg text-indigo-200 mb-5">Register New Patient</h3>

        {error && (
          <div className="flex items-start gap-2.5 mb-5 bg-rose-950/60 border border-rose-700/40 rounded-xl px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              required
              placeholder="Full Name"
              value={data.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, name: e.target.value })}
            />
            <Input
              required
              type="email"
              placeholder="Email address"
              value={data.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, email: e.target.value })}
            />
            <Input
              required
              type="number"
              min={1}
              max={130}
              placeholder="Age"
              value={data.age}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, age: Number(e.target.value) })}
            />
            <select
              className="flex w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
              value={data.gender}
              onChange={(e) => onChange({ ...data, gender: e.target.value })}
            >
              <option value="M" className="bg-slate-900">Male</option>
              <option value="F" className="bg-slate-900">Female</option>
              <option value="O" className="bg-slate-900">Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" className="text-slate-400" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              {loading ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // ── Single source of truth: all registered patients (for dropdown + index) ──
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  // Records tab shows the subset that have transactions (returned with .transactions populated)
  const [patientsWithHistory, setPatientsWithHistory] = useState<Patient[]>([]);
  // Separate error states so a dropdown failure doesn't pollute the Records tab
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [dropdownError, setDropdownError] = useState<string | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<'records' | 'infer'>('records');

  // Inference state
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [inferResult, setInferResult] = useState<any>(null);
  const [inferError, setInferError] = useState<string | null>(null);
  const [inferTimestamp, setInferTimestamp] = useState<string | null>(null);

  // Patient form
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patientData, setPatientData] = useState<PatientFormData>({ name: '', email: '', age: 40, gender: 'M' });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [patientFormError, setPatientFormError] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Object URL cleanup
  const prevPreviewRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current);
    prevPreviewRef.current = imagePreview;
  }, [imagePreview]);
  useEffect(() => {
    return () => { if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current); };
  }, []);

  // Close form when switching tabs
  useEffect(() => {
    setShowNewPatient(false);
    setPatientFormError(null);
  }, [activeTab]);

  // Clear uploaded image + results whenever the target patient changes
  useEffect(() => {
    setFile(null);
    setImagePreview(null);
    setFileError(null);
    setLightboxOpen(false);
    setInferResult(null);
    setInferError(null);
    setInferTimestamp(null);
  }, [selectedPatientId]);

  // ── Data fetching ────────────────────────────────────────────────────────────
  // Fetch transaction-enriched patient list (records tab)
  const fetchPatientsWithHistory = useCallback(async () => {
    try {
      const data = await customFetch('/records/patients');
      setPatientsWithHistory(Array.isArray(data.Payload) ? data.Payload : []);
      setHistoryError(null);
    } catch (e: any) {
      setHistoryError(e.message || 'Failed to load diagnostic history.');
    }
  }, []);

  // Fetch ALL registered patients (dropdown source)
  const fetchAllPatients = useCallback(async () => {
    try {
      const data = await customFetch('/records/allpatients');
      const list = Array.isArray(data.Payload) ? data.Payload : [];
      setAllPatients(list);
      setDropdownError(null);
      return list;
    } catch (e: any) {
      setDropdownError(e.message || 'Failed to load patient list.');
      return null;
    }
  }, []);

  // Refresh both in parallel
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPatientsWithHistory(), fetchAllPatients()]);
  }, [fetchPatientsWithHistory, fetchAllPatients]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await customFetch('/auth/logout', { method: 'POST' }); } catch {}
    navigate('/login');
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPatient(true);
    setPatientFormError(null);

    try {
      // Step 1: Send registration request
      const res = await customFetch('/registration/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patientData, age: Number(patientData.age) }),
      });

      const newPatientId: string = res.patient_id;
      if (!newPatientId) {
        throw new Error('Server returned success but no patient_id. Contact support.');
      }

      // Step 2: Verify the patient actually exists in the DB by refetching the list
      const updatedList = await fetchAllPatients();
      await fetchPatientsWithHistory();

      if (!updatedList || !updatedList.find((p: Patient) => p.patient_id === newPatientId)) {
        throw new Error('Patient was registered but could not be verified. Try refreshing the page.');
      }

      // Step 3: Only NOW show success — patient confirmed in DB
      setShowNewPatient(false);
      setPatientData({ name: '', email: '', age: 40, gender: 'M' });
      setSelectedPatientId(newPatientId);
      addToast(`Patient verified — ${newPatientId}`, 'success');
    } catch (err: any) {
      setPatientFormError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setCreatingPatient(false);
    }
  };

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_SIZE_MB = 20;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('Invalid file type. Please upload a JPEG or PNG image.');
      setFile(null);
      setImagePreview(null);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      setFile(null);
      setImagePreview(null);
      return;
    }

    setFileError(null);
    setFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const clearUpload = useCallback(() => {
    setFile(null);
    setImagePreview(null);
    setFileError(null);
    setLightboxOpen(false);
  }, []);

  const handleInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { addToast('Please upload a fundus scan first.', 'error'); return; }
    if (!selectedPatientId) { addToast('Please select a patient from the dropdown.', 'error'); return; }

    setLoading(true);
    setInferResult(null);
    setInferError(null);
    setInferTimestamp(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', selectedPatientId);

    try {
      const res = await customFetch('/model/', { method: 'POST', body: formData });

      if (!res.Payload?.predicted_class) {
        throw new Error('Model returned an incomplete response. Try again.');
      }

      setInferResult({ ...res.Payload, patientId: selectedPatientId });
      setInferTimestamp(new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      addToast(`Classification: ${res.Payload.predicted_class}`, 'success');
      // Refresh records to show the new transaction
      await fetchPatientsWithHistory();
    } catch (err: any) {
      const msg = err.message || 'Inference failed. Ensure the image is a clear fundus scan.';
      setInferError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Animation variants ────────────────────────────────────────────────────────
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVars = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 32 } },
  };

  const navItems = [
    { id: 'records', label: 'Patient Index', icon: Users },
    { id: 'infer', label: 'Run Diagnostics', icon: Crosshair },
  ] as const;

  const uploadState = fileError ? 'error' : file ? 'success' : 'idle';

  return (
    <div className="flex h-screen bg-base relative overflow-hidden font-sans text-ink">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-60" />

      {/* Global toasts */}
      <Toasts items={toasts} onRemove={removeToast} />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && imagePreview && (
          <Lightbox src={imagePreview} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-72 glass-panel border-r border-white/10 m-4 rounded-3xl p-6 flex flex-col z-20 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 rounded-full blur-3xl -z-10" />

        {/* Brand */}
        <div className="flex flex-col mb-12">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.25)]">
              <ScanEye className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">FundusNet</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em] ml-12">
            Final Year Project — 2026
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2 relative z-10">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold relative transition-colors z-10 ${
                activeTab === id ? 'text-white' : 'text-ink-muted hover:text-white'
              }`}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/25 shadow-[0_0_18px_rgba(139,92,246,0.25)] border border-primary/35 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="justify-start gap-3 w-full text-ink-muted hover:text-red-400 font-bold px-4 py-3 z-10 group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          Logout
        </Button>
      </motion.aside>

      {/* ── Main panel ── */}
      <main className="flex-1 overflow-y-auto p-4 z-10 relative">
        <div className="bg-slate-900/55 backdrop-blur-2xl border border-slate-800/60 shadow-2xl rounded-[2rem] w-full min-h-full p-8 md:p-12 relative overflow-hidden">

          <AnimatePresence mode="wait">

            {/* ────── RECORDS TAB ────── */}
            {activeTab === 'records' ? (
              <motion.div
                key="records"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-5xl mx-auto"
              >
                <header className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">Patient Index</h2>
                    <p className="text-slate-400 font-medium text-lg">
                      Patients with completed diagnostic history.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowNewPatient(v => !v)}
                    className="rounded-full px-5 border-slate-700 text-slate-200 flex-shrink-0 mt-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showNewPatient ? 'Cancel' : 'Add Patient'}
                  </Button>
                </header>

                <AnimatePresence>
                  {showNewPatient && (
                    <PatientForm
                      data={patientData}
                      onChange={setPatientData}
                      onSubmit={handleCreatePatient}
                      onClose={() => setShowNewPatient(false)}
                      loading={creatingPatient}
                      error={patientFormError}
                    />
                  )}
                </AnimatePresence>

                {historyError && (
                  <div className="flex items-start gap-2.5 mb-6 bg-rose-950/60 border border-rose-700/40 rounded-xl px-4 py-3 text-sm text-rose-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                    <span className="flex-1">{historyError}</span>
                    <button
                      className="underline text-rose-400 hover:text-rose-200 font-semibold ml-2"
                      onClick={refreshAll}
                    >
                      Retry
                    </button>
                  </div>
                )}

                <motion.div
                  variants={containerVars}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                >
                  {patientsWithHistory.length === 0 && !historyError ? (
                    <div className="col-span-full py-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-700/60">
                      <Eye className="w-10 h-10 mx-auto mb-4 text-slate-600" />
                      {allPatients.length > 0 ? (
                        <>
                          <p className="text-base text-slate-300 font-semibold">
                            {allPatients.length} patient{allPatients.length > 1 ? 's' : ''} registered
                          </p>
                          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                            No diagnostic runs yet. Switch to Run Diagnostics to upload a scan.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base text-slate-400 font-semibold">No patients registered yet.</p>
                          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
                            Add a patient using the button above, then run a diagnostic.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    patientsWithHistory.map(p => (
                      <motion.div
                        variants={itemVars}
                        key={p.patient_id}
                        className="bg-slate-900/80 border border-slate-700/60 border-l-4 border-l-primary/40 rounded-3xl p-6 shadow-lg hover:border-slate-600/80 hover:shadow-primary/10 transition-all"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                            <p className="text-sm text-slate-400">{p.email}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {p.age} yrs · {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-1.5 font-mono">{p.patient_id}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {p.transactions?.length ?? 0}
                          </div>
                        </div>

                        {p.transactions && p.transactions.length > 0 && (
                          <div className="space-y-2 pt-4 border-t border-slate-800">
                            {p.transactions.map(t => (
                              <div
                                key={t.transaction_id}
                                className="bg-slate-800/70 rounded-xl p-3.5 flex items-center gap-3 border border-slate-700/40"
                              >
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_6px_currentColor] ${
                                  t.disease_detected.toLowerCase().includes('healthy')
                                    ? 'bg-emerald-400 text-emerald-400'
                                    : 'bg-rose-500 text-rose-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{t.disease_detected}</p>
                                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    {new Date(t.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </motion.div>

            ) : (

              /* ────── INFERENCE TAB ────── */
              <motion.div
                key="infer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto"
              >
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">Run Diagnostics</h2>
                    <p className="text-slate-400 font-medium text-lg">Submit a fundus scan for hybrid model classification.</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowNewPatient(v => !v)}
                    className="rounded-full px-5 hidden sm:flex border-slate-700 text-slate-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showNewPatient ? 'Cancel' : 'New Patient'}
                  </Button>
                </header>

                <AnimatePresence>
                  {showNewPatient && (
                    <PatientForm
                      data={patientData}
                      onChange={setPatientData}
                      onSubmit={handleCreatePatient}
                      onClose={() => setShowNewPatient(false)}
                      loading={creatingPatient}
                      error={patientFormError}
                    />
                  )}
                </AnimatePresence>

                <motion.div layout="position" className="bg-slate-900/80 rounded-3xl p-8 shadow-xl border border-slate-700/50 mb-8">
                  <form onSubmit={handleInference} className="space-y-8">

                    {/* Patient selector */}
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">Target Patient</label>
                      <PatientSelect
                        value={selectedPatientId}
                        onChange={setSelectedPatientId}
                        patients={allPatients}
                      />
                      {dropdownError ? (
                        <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {dropdownError} —{' '}
                          <button className="underline hover:text-rose-200" onClick={fetchAllPatients}>Retry</button>
                        </p>
                      ) : allPatients.length === 0 ? (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No patients registered yet — click “New Patient” above to add one.
                        </p>
                      ) : null}
                    </div>

                    {/* Upload zone */}
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">Fundus Scan</label>
                      <div className={`border-2 border-dashed rounded-2xl relative overflow-hidden group transition-all duration-300 ${
                        uploadState === 'success' ? 'border-emerald-600/50 bg-emerald-950/20' :
                        uploadState === 'error'   ? 'border-rose-600/50 bg-rose-950/15' :
                                                    'border-slate-700 bg-slate-800/30 hover:bg-slate-800/55 hover:border-slate-600'
                      }`}>
                        {/* Invisible file input always on top */}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleFileChange}
                          className={`absolute inset-0 w-full h-full opacity-0 z-10 ${
                            uploadState === 'success' ? 'cursor-default' : 'cursor-pointer'
                          }`}
                          // Block clicks on the input when preview is shown — lightbox handles it
                          style={uploadState === 'success' ? { pointerEvents: 'none' } : {}}
                        />

                        {uploadState === 'success' && imagePreview ? (
                          <div className="p-5 flex items-center gap-5">
                            {/* Thumbnail — click to open lightbox */}
                            <button
                              type="button"
                              onClick={() => setLightboxOpen(true)}
                              className="relative flex-shrink-0 group/thumb cursor-zoom-in"
                            >
                              <img
                                src={imagePreview}
                                alt="Uploaded scan thumbnail"
                                className="w-24 h-24 object-cover rounded-xl border-2 border-emerald-600/40 shadow-lg"
                              />
                              <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/45 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                              </div>
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-emerald-300 mb-0.5">Upload successful</p>
                              <p className="text-sm text-white font-semibold truncate">{file!.name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {(file!.size / 1024 / 1024).toFixed(2)} MB · Click thumbnail to preview
                              </p>
                              {/* Allow re-upload or clear */}
                              <div className="flex items-center gap-3 mt-2">
                                <label className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors underline">
                                  Replace image
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                  />
                                </label>
                                <span className="text-slate-700">·</span>
                                <button
                                  type="button"
                                  onClick={clearUpload}
                                  className="text-xs text-rose-500/70 hover:text-rose-400 transition-colors underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                              <span className="text-emerald-400 font-black">✓</span>
                            </div>
                          </div>

                        ) : uploadState === 'error' ? (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
                              <AlertCircle className="w-6 h-6 text-rose-400" />
                            </div>
                            <p className="text-sm font-bold text-rose-300 mb-1">Upload rejected</p>
                            <p className="text-sm text-rose-400/80">{fileError}</p>
                            <p className="text-xs text-slate-500 mt-3">Click here to choose a valid file</p>
                            {/* Re-enable the file input for error state */}
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={handleFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                          </div>

                        ) : (
                          <div className="p-10 flex flex-col items-center gap-3">
                            <UploadCloud className="w-12 h-12 text-slate-600 mb-2 group-hover:text-slate-400 transition-colors" />
                            <p className="text-base font-bold text-white">Drop scan or click to upload</p>
                            <p className="text-sm text-slate-500">JPEG or PNG · max {MAX_SIZE_MB}MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !!fileError || !file}
                      className="w-full py-4 text-base rounded-2xl"
                      isLoading={loading}
                    >
                      {loading ? 'Processing Pipeline...' : 'Run Hybrid Diagnostics'}
                    </Button>
                  </form>
                </motion.div>

                {/* Inference error */}
                <AnimatePresence>
                  {inferError && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      className="bg-rose-950/70 border border-rose-700/40 rounded-3xl p-6 mb-6 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-rose-200 mb-1">Inference Failed</p>
                        <p className="text-sm text-rose-300/80">{inferError}</p>
                      </div>
                      <button onClick={() => setInferError(null)} className="text-rose-400/60 hover:text-rose-300 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result card */}
                <AnimatePresence>
                  {inferResult && (() => {
                    const isHealthy =
                      inferResult.predicted_class.toLowerCase().includes('healthy') ||
                      inferResult.predicted_class.toLowerCase().includes('normal');
                    const confidence = inferResult.confidence * 100;
                    const patientForResult = allPatients.find(p => p.patient_id === inferResult.patientId);
                    return (
                      <motion.div
                        key="result-card"
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-gradient-to-br from-slate-950 to-[#080e20]"
                      >
                        {/* Mood orbs */}
                        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-[0.12] pointer-events-none ${
                          isHealthy ? 'bg-emerald-400' : 'bg-rose-500'
                        }`} />
                        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-5 border-b border-slate-800/70 flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                            <h3 className="font-black text-lg text-white tracking-tight">Analysis Results</h3>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {patientForResult && (
                              <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/40 rounded-full px-3 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-xs font-bold text-slate-200">{patientForResult.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">{inferResult.patientId}</span>
                              </div>
                            )}
                            {inferTimestamp && (
                              <span className="text-[10px] font-mono text-slate-600 hidden sm:block">{inferTimestamp}</span>
                            )}
                          </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="p-8 grid md:grid-cols-[1fr_256px] gap-8 items-start">

                          {/* Left: classification + confidence + note */}
                          <div className="space-y-5">

                            {/* Classification */}
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Classification</p>
                              <div className="mb-2">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                  isHealthy
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${ isHealthy ? 'bg-emerald-400' : 'bg-rose-400' }`} />
                                  {isHealthy ? 'Normal Finding' : 'Pathological'}
                                </span>
                              </div>
                              <p className={`text-3xl font-black leading-tight ${ isHealthy ? 'text-emerald-300' : 'text-rose-300' }`}>
                                {inferResult.predicted_class}
                              </p>
                            </div>

                            {/* Confidence */}
                            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30 space-y-3">
                              <div className="flex items-end justify-between">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Model Confidence</p>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-3xl font-black text-white">{confidence.toFixed(1)}</span>
                                  <span className="text-sm text-slate-500 font-bold mb-0.5">%</span>
                                </div>
                              </div>
                              <div>
                                <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/30">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence}%` }}
                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                    className={`h-full rounded-full ${
                                      confidence >= 75
                                        ? 'bg-gradient-to-r from-cyan-500 to-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.35)]'
                                        : confidence >= 50
                                          ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                          : 'bg-gradient-to-r from-rose-600 to-rose-400'
                                    }`}
                                  />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                  <span className="text-[10px] font-mono text-slate-700">0%</span>
                                  <span className="text-[10px] font-mono text-slate-700">50%</span>
                                  <span className="text-[10px] font-mono text-slate-700">100%</span>
                                </div>
                              </div>
                              <p className={`text-xs font-semibold ${
                                confidence >= 75 ? 'text-violet-400' : confidence >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {confidence >= 75
                                  ? '↑ High-confidence classification'
                                  : confidence >= 50
                                    ? '~ Moderate confidence — consider re-evaluation'
                                    : '↓ Low confidence — re-scan recommended'}
                              </p>
                            </div>

                            {/* Clinical note + model tag */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                              <p className={`text-xs leading-relaxed ${ isHealthy ? 'text-emerald-500/80' : 'text-rose-400/70' }`}>
                                {isHealthy
                                  ? 'No significant pathological markers detected. Routine follow-up advised.'
                                  : 'Pathological markers detected. Ophthalmological consultation recommended.'}
                              </p>
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-800/60 border border-slate-700/30 rounded-full px-3 py-1 whitespace-nowrap self-start sm:self-auto flex-shrink-0">
                                ResNet/DINOv2 Hybrid v1
                              </span>
                            </div>
                          </div>

                          {/* Right: Grad-CAM */}
                          <div className="w-full flex-shrink-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3">Grad-CAM Overlay</p>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.93 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                              className="rounded-2xl overflow-hidden border border-slate-700/40 shadow-[0_0_30px_rgba(0,0,0,0.4)] relative group"
                            >
                              <img
                                src={`data:image/png;base64,${inferResult.gradcam_img_base64}`}
                                alt="Grad-CAM activation overlay"
                                className="w-full h-auto object-cover block"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-4">
                                <p className="text-xs font-bold text-white">Activation Map</p>
                                <p className="text-[10px] text-slate-300 text-center leading-snug">Highlights regions that most influenced the classification decision</p>
                              </div>
                            </motion.div>
                            {/* Heat scale legend */}
                            <div className="flex items-center gap-2 mt-2.5">
                              <span className="text-[10px] font-mono text-slate-600">Low</span>
                              <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 via-green-400 via-yellow-400 to-red-500" />
                              <span className="text-[10px] font-mono text-slate-600">High</span>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
