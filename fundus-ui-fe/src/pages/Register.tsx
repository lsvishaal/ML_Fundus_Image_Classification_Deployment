import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { customFetch } from '../lib/api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: 30, gender: 'M'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await customFetch('/registration/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, age: Number(formData.age) })
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }
  };

  return (
    <div className="min-h-screen bg-base relative flex flex-col justify-center py-12 px-6 lg:px-8 overflow-hidden">
      <div className="bg-mesh absolute inset-0 -z-20" />
      <div className="moving-mesh opacity-50">
        <div className="orb orb-1" />
        <div className="orb orb-3" />
      </div>

      <motion.button 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{ x: -4 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-ink-muted hover:text-primary font-bold transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </motion.button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg mx-auto glass-panel rounded-3xl p-8 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-4">
          <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30 shadow-inner">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
        
        <motion.h2 variants={itemVariants} className="text-center text-3xl font-black tracking-tight text-ink mb-8">
          Create Account
        </motion.h2>

        <form className="space-y-5" onSubmit={handleRegister}>
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-bold text-ink mb-1.5">Full Name</label>
            <Input required value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="Dr. Jane Doe" />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-bold text-ink mb-1.5">Email address</label>
            <Input type="email" required value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} placeholder="doctor@clinic.com" />
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-ink mb-1.5">Age</label>
              <Input type="number" min="20" required value={formData.age} onChange={(e: any) => setFormData({...formData, age: e.target.value})} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-ink mb-1.5">Gender</label>
              <div className="relative">
                <select 
                  className="flex w-full rounded-xl border border-border bg-surface backdrop-blur-sm px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-surface-hover transition-all duration-300 shadow-inner font-medium appearance-none"
                  value={formData.gender} 
                  onChange={(e: any) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="M" className="text-slate-900">Male</option>
                  <option value="F" className="text-slate-900">Female</option>
                  <option value="O" className="text-slate-900">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-bold text-ink mb-1.5">Password</label>
            <Input type="password" required minLength={6} value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-sm font-bold text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="pt-4">
            <Button type="submit" disabled={loading} className="w-full py-3 text-lg" isLoading={loading}>
              {loading ? 'Creating...' : 'Register Space'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
