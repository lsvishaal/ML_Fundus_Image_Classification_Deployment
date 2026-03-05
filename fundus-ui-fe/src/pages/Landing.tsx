import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Button } from '../components/Button';
import { Activity, ArrowRight, Eye, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      
      gsap.fromTo('.bg-mesh', { opacity: 0 }, { opacity: 1, duration: 1.5 });

      tl.from('.hero-badge', { y: 25, duration: 0.7, delay: 0.1 })
        .from('.hero-title-line', { y: 30, duration: 0.7, stagger: 0.12 }, '-=0.4')
        .from('.hero-subtitle', { y: 20, duration: 0.7 }, '-=0.4')
        .from('.hero-actions', { y: 15, scale: 0.97, duration: 0.6 }, '-=0.5')
        .from('.glass-card', { y: 40, duration: 0.9, stagger: 0.15, scale: 0.97 }, '-=0.4');

      gsap.to('.glass-card-float', {
        y: -12,
        duration: 2.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: 0.6
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden px-4 md:px-8 z-0">
      {/* Background Mesh */}
      <div className="bg-mesh absolute inset-0 -z-20" />
      <div className="moving-mesh">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 mt-4">
        
        {/* Left Column: Text */}
        <div className="max-w-2xl text-left flex flex-col items-start perspective-1000">
          <div className="hero-badge flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 text-sm font-semibold text-primary mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-primary-hover">Next-Generation Diagnostic AI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight text-ink mb-5 leading-[1.05]">
            <div className="hero-title-line overflow-hidden">Precision Retinal</div>
            <div className="hero-title-line overflow-hidden bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent drop-shadow-sm">
              Classification.
            </div>
          </h1>
          
          <p className="hero-subtitle text-lg md:text-xl text-ink-muted max-w-xl mb-8 leading-relaxed font-medium">
            Instantly classify fundus images across Diabetic Retinopathy, Glaucoma, Myopia, and Healthy states. Powered by an advanced ResNet + DINOv2 Hybrid with interpretable Grad-CAM overlays.
          </p>

          <div className="hero-actions flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button onClick={() => navigate('/login')} className="px-8 py-4 text-lg w-full sm:w-auto shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              Doctor Login <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/login?demo=true')} className="px-8 py-4 text-lg w-full sm:w-auto group">
              <PlayCircle className="w-5 h-5 mr-2 text-secondary group-hover:text-cyan-300 transition-colors" /> Try Interactive Demo
            </Button>
          </div>
        </div>

        {/* Right Column: Visual abstract cards */}
        <div className="hidden lg:flex relative w-full max-w-md h-[450px]">
          <div className="absolute top-8 right-8 glass-card glass-card-float glass-panel rounded-2xl p-6 w-72 rotate-3 z-10 border-white/10 bg-[#0f172a]/60">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="text-primary w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">98.4% Acc</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ delay: 1, duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-primary to-secondary" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Diabetic Retinopathy</p>
              <div className="w-full h-32 rounded-lg mt-4 bg-gradient-to-tr from-slate-800 to-slate-900 relative overflow-hidden border border-white/5 shadow-inner">
                 {/* Fake heatmap scan line */}
                 <motion.div 
                   animate={{ y: ['0%', '200%', '0%'] }} 
                   transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                   className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" 
                 />
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-4 glass-card glass-card-float glass-panel rounded-2xl p-5 w-64 -rotate-6 z-20 border-white/10 bg-[#0f172a]/80 shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ animationDelay: '-1s' }}>
             <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-3">Grad-CAM Activation</p>
             <div className="flex gap-3">
               <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-rose-500 via-purple-500 to-primary shadow-lg" />
               <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-lg" />
               <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 shadow-inner border border-white/5" />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
