import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, UploadCloud, Users, Activity, Plus, Hexagon, Crosshair } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { customFetch } from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'infer'>('records');
  const [loading, setLoading] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inferResult, setInferResult] = useState<any>(null);

  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patientData, setPatientData] = useState({ name: '', email: '', age: 40, gender: 'M' });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await customFetch('/records/patients');
      setPatients(data.Payload);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await customFetch('/auth/logout', { method: 'POST' });
    } catch (e) {}
    navigate('/login');
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await customFetch('/registration/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patientData, age: Number(patientData.age) })
      });
      setSelectedPatientId(res.patient_id);
      setShowNewPatient(false);
      fetchPatients();
    } catch (e) {
      alert('Failed to create patient');
    }
  };

  const handleInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedPatientId) return alert('Select file & patient');
    
    setLoading(true);
    setInferResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', selectedPatientId);

    try {
      const res = await customFetch('/model/', {
        method: 'POST',
        body: formData,
      });
      setInferResult({
        ...res.Payload,
        patientId: selectedPatientId,
        imageName: file.name
      });
      fetchPatients(); 
    } catch (err: any) {
      alert(err.message || 'Inference failed');
    } finally {
      setLoading(false);
    }
  };
  
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } }
  };

  return (
    <div className="flex h-screen bg-base relative overflow-hidden font-sans text-ink">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-80" />
      
      {/* Sidebar Focus */}
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-72 glass-panel border-r border-white/10 m-4 rounded-3xl p-6 flex flex-col z-20 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-3 mb-12 text-primary font-black text-2xl tracking-tight drop-shadow-sm">
          <Hexagon className="w-8 h-8 fill-primary/30" />
          <span className="text-white">Fundus.AI</span>
        </div>

        <nav className="flex-1 space-y-3 relative z-10">
          {['records', 'infer'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold relative transition-colors z-10 ${
                activeTab === tab ? 'text-white' : 'text-ink-muted hover:text-white'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-primary/40 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
              {tab === 'records' ? <Users className="w-5 h-5" /> : <Crosshair className="w-5 h-5" />}
              {tab === 'records' ? 'Patient Index' : 'Run Diagnostics'}
            </button>
          ))}
        </nav>

        <Button variant="ghost" onClick={handleLogout} className="justify-start gap-3 w-full text-ink-muted hover:text-red-400 font-bold px-4 py-3 z-10 group">
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Logout
        </Button>
      </motion.aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 z-10 relative">
        <motion.div layout className="bg-surface backdrop-blur-3xl border border-white/5 shadow-2xl rounded-[2rem] w-full min-h-full p-8 md:p-12 relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {activeTab === 'records' ? (
              <motion.div
                key="records"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-5xl mx-auto"
              >
                <header className="mb-10">
                  <h2 className="text-4xl font-black text-white mb-2">Patient Index</h2>
                  <p className="text-ink-muted font-medium text-lg">Manage your diagnostic history.</p>
                </header>
                
                <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {patients.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-ink-muted font-medium bg-white/5 rounded-3xl border border-dashed border-white/20">
                      No patients recorded yet. Run a diagnostic to establish history.
                    </div>
                  ) : (
                    patients.map((p) => (
                      <motion.div variants={itemVars} key={p.patient_id} className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-primary/20 transition-all relative overflow-hidden group backdrop-blur-md hover:bg-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full -z-10" />
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                            <p className="text-sm font-medium text-slate-400">{p.email} • {p.age} yrs • {p.gender}</p>
                            <p className="text-xs text-slate-500 mt-1 font-mono">{p.patient_id}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-hover font-bold shadow-inner">
                            {p.transactions?.length || 0}
                          </div>
                        </div>
                        
                        {p.transactions?.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-white/10">
                            {p.transactions.map((t: any) => (
                              <div key={t.transaction_id} className="bg-slate-900/50 rounded-2xl p-4 flex items-center gap-4 group-hover:bg-slate-800/80 transition-colors border border-white/5">
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${t.disease_detected.includes('Healthy') ? 'bg-green-400 text-green-400' : 'bg-rose-500 text-rose-500'}`} />
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-200">{t.disease_detected}</p>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">{new Date(t.created_at).toLocaleString()}</p>
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

              <motion.div
                key="infer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-3xl mx-auto"
              >
                <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">Run Diagnostics</h2>
                    <p className="text-ink-muted font-medium text-lg">Upload scan for hybrid model classification.</p>
                  </div>
                  <Button variant="secondary" onClick={() => setShowNewPatient(!showNewPatient)} className="rounded-full px-5 hidden sm:flex border-primary/30 text-white">
                    <Plus className="w-4 h-4 mr-2" /> New Patient Form
                  </Button>
                </header>

                <AnimatePresence>
                  {showNewPatient && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, scale: 0.95 }}
                      animate={{ height: 'auto', opacity: 1, scale: 1 }}
                      exit={{ height: 0, opacity: 0, scale: 0.95 }}
                      className="overflow-hidden mb-8 origin-top"
                    >
                      <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900/50 border border-indigo-500/20 p-6 rounded-3xl shadow-lg relative backdrop-blur-md">
                        <div className="absolute top-4 right-4"><Activity className="w-24 h-24 text-primary/10 -z-10"/></div>
                        <h3 className="font-bold text-xl mb-6 text-indigo-200">Onboard Patient</h3>
                        <form onSubmit={handleCreatePatient} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Input required placeholder="Full Name" value={patientData.name} onChange={(e: any) => setPatientData({...patientData, name: e.target.value})} className="border-indigo-500/30 bg-slate-900/60" />
                            <Input required type="email" placeholder="Email" value={patientData.email} onChange={(e: any) => setPatientData({...patientData, email: e.target.value})} className="border-indigo-500/30 bg-slate-900/60" />
                            <Input required type="number" placeholder="Age" value={patientData.age} onChange={(e: any) => setPatientData({...patientData, age: Number(e.target.value)})} className="border-indigo-500/30 bg-slate-900/60" />
                            <select className="flex w-full rounded-xl border border-indigo-500/30 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-medium appearance-none" value={patientData.gender} onChange={(e: any) => setPatientData({...patientData, gender: e.target.value})}>
                              <option value="M" className="bg-slate-800 text-white">Male</option>
                              <option value="F" className="bg-slate-800 text-white">Female</option>
                              <option value="O" className="bg-slate-800 text-white">Other</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-3 pt-2">
                             <Button type="button" variant="ghost" className="text-slate-300" onClick={() => setShowNewPatient(false)}>Cancel</Button>
                             <Button type="submit">Save Record</Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div className="bg-white/5 rounded-3xl p-8 shadow-xl border border-white/10 mb-8 relative backdrop-blur-md">
                  <form onSubmit={handleInference} className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">Target Patient</label>
                      <select 
                        required
                        className="w-full rounded-xl border border-border bg-slate-900/50 px-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary font-bold appearance-none cursor-pointer shadow-sm hover:border-primary/50 transition-colors"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                      >
                        <option value="" disabled className="bg-slate-800">-- Select a patient --</option>
                        {patients.map(p => (
                           <option key={p.patient_id} value={p.patient_id} className="bg-slate-800 text-white">{p.name} ({p.patient_id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-200 mb-3">Fundus Scan Upload</label>
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center relative cursor-pointer overflow-hidden group transition-all duration-300 ${file ? 'border-primary bg-primary/10' : 'border-white/20 bg-slate-800/40 hover:bg-slate-800/70 hover:border-white/40'}`}
                      >
                        <input 
                          type="file" 
                          accept="image/jpeg, image/png"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required
                        />
                        {file ? (
                          <div className="flex flex-col items-center gap-3">
                             <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 text-primary-hover flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                               <Crosshair className="w-8 h-8" />
                             </div>
                             <p className="text-lg font-bold text-white">{file.name}</p>
                             <p className="text-sm text-primary-hover font-semibold">Ready for analysis</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <UploadCloud className="w-12 h-12 text-slate-500 mb-2 group-hover:text-primary-hover transition-colors" />
                            <p className="text-base font-bold text-white">Drag & drop your scan</p>
                            <p className="text-sm text-slate-400">High resolution JPEG or PNG</p>
                          </div>
                        )}
                      </motion.div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full py-4 text-lg rounded-2xl shadow-[0_0_25px_rgba(139,92,246,0.3)]" isLoading={loading}>
                      {loading ? 'Processing Model Pipeline...' : 'Run Hybrid Diagnostics'}
                    </Button>
                  </form>
                </motion.div>

                {/* Highly aesthetic result card */}
                <AnimatePresence>
                  {inferResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="bg-slate-900 border border-white/10 text-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-10" />

                      <div className="flex items-center gap-3 mb-8">
                         <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_currentColor] animate-pulse" />
                         <h3 className="font-black text-2xl tracking-tight">Diagnostic Payload</h3>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-6 w-full">
                          <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Classification</p>
                            <p className={`text-4xl font-black drop-shadow-md ${inferResult.predicted_class.includes('Healthy') ? 'text-green-400' : 'text-rose-400'}`}>
                              {inferResult.predicted_class}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Model Confidence</p>
                            <div className="flex items-end gap-3">
                               <p className="text-4xl font-black text-white">{(inferResult.confidence * 100).toFixed(1)}<span className="text-2xl text-slate-500">%</span></p>
                            </div>
                            <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden border border-white/5">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${inferResult.confidence * 100}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-72 shrink-0">
                           <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Grad-CAM Overlay Response</p>
                           <motion.div 
                             initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                             animate={{ opacity: 1, scale: 1, rotate: 0 }}
                             transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                             className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative group bg-black"
                           >
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                             <img 
                               src={`data:image/png;base64,${inferResult.gradcam_img_base64}`} 
                               alt="Grad-CAM"
                               className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                             />
                           </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
