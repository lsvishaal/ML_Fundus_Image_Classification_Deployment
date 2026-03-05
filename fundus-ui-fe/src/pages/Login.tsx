import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { customFetch } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Prevent React StrictMode double-invocation from firing demo twice
  const demoTriggered = useRef(false);

  const handleDemoLogin = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await customFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@fundus.ai', password: 'demopassword123' })
      });
      navigate('/dashboard');
    } catch {
      // Account doesn't exist yet — create it, then log in
      try {
        await customFetch('/registration/doctor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Dr. Demo', email: 'demo@fundus.ai', password: 'demopassword123', age: 40, gender: 'M' })
        });
        await customFetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'demo@fundus.ai', password: 'demopassword123' })
        });
        navigate('/dashboard');
      } catch (regErr: any) {
        setError(regErr.message || 'Failed to deploy demo environment.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('demo') === 'true' && !demoTriggered.current) {
      demoTriggered.current = true;
      handleDemoLogin();
    }
  }, [location.search, handleDemoLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await customFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }
  };

  return (
    <div className="min-h-screen bg-base relative flex flex-col justify-center py-12 px-6 lg:px-8 overflow-hidden">
      <div className="bg-mesh absolute inset-0 -z-20" />
      <div className="moving-mesh opacity-50">
        <div className="orb orb-2" />
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
        className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md glass-panel rounded-3xl p-8 sm:p-12 shadow-[0_0_40px_rgba(0,0,0,0.4)]"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30 shadow-inner">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
        
        <motion.h2 variants={itemVariants} className="text-center text-3xl font-black tracking-tight text-ink mb-2">
          Diagnostic Hub
        </motion.h2>
        <motion.p variants={itemVariants} className="text-center text-sm text-ink-muted mb-8 font-medium">
          Sign in to access your patient inference records.
        </motion.p>

        <form className="space-y-5" onSubmit={handleLogin}>
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-bold text-ink mb-2">
              Email address
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-bold text-ink mb-2">
              Password
            </label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-sm font-bold text-red-400 bg-red-400/10 border border-red-400/20 backdrop-blur-md p-3 rounded-xl">
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="pt-2">
            <Button type="submit" disabled={loading} className="w-full py-3 text-lg" isLoading={loading}>
              {loading ? 'Authenticating...' : 'Sign in safely'}
            </Button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
            <span className="bg-surface px-4 text-ink-muted backdrop-blur-xl rounded-full border border-border/50">Or exploring?</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
           <Button type="button" variant="secondary" onClick={handleDemoLogin} disabled={loading} className="w-full py-3 text-lg border-primary/30 text-primary-hover hover:border-primary/50 group">
              {loading ? 'Deploying...' : <><Zap className="w-5 h-5 mr-2 text-primary group-hover:text-cyan-400 transition-colors" /> Quick Login Demo</>}
           </Button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <span className="text-sm text-ink-muted font-medium">Don't have an account? </span>
          <button onClick={() => navigate('/register')} className="text-sm font-bold text-secondary hover:text-cyan-300 transition-colors">
            Register here
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
