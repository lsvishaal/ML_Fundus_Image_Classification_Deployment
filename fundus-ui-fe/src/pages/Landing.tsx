import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Button } from '../components/Button';
import { Activity, ArrowRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      gsap.fromTo('.bg-mesh', { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'none' });
      tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, delay: 0.2 })
        .from('.hero-title-line', { y: 35, opacity: 0, duration: 0.65, stagger: 0.1 }, '-=0.35')
        .from('.hero-subtitle', { y: 18, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-cta', { y: 14, opacity: 0, scale: 0.98, duration: 0.5 }, '-=0.45')
        .from('.hero-card', { y: 30, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.5');
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden px-4 md:px-8">
      <div className="bg-mesh absolute inset-0 -z-20" />
      <div className="moving-mesh">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-16">

        {/* Left: Text block */}
        <div className="max-w-2xl flex flex-col items-start">
          <div className="hero-badge flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/25 text-sm font-semibold text-violet-300 mb-7 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <Activity className="w-4 h-4" />
            ResNet + DINOv2 Hybrid — Grad-CAM Enabled
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight text-white mb-6 leading-[1.05]">
            <div className="hero-title-line">Retinal Disease</div>
            <div className="hero-title-line bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Classification.
            </div>
          </h1>

          <p className="hero-subtitle text-lg md:text-xl text-slate-400 max-w-lg mb-10 leading-relaxed">
            Upload fundus scans and receive instant classification across Diabetic Retinopathy, Glaucoma, Myopia, and Healthy states — with interpretable Grad-CAM overlays.
          </p>

          <div className="hero-cta">
            <Button
              onClick={() => navigate('/login')}
              className="px-10 py-4 text-lg shadow-[0_0_30px_rgba(139,92,246,0.35)] hover:shadow-[0_0_45px_rgba(139,92,246,0.5)] transition-shadow"
            >
              Access System <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Right: Visual cards — no infinite animation, clean static elegance */}
        <div className="hidden lg:flex relative w-full max-w-sm h-[420px] shrink-0">

          {/* Top card — classification result mock */}
          <div className="hero-card absolute top-0 right-0 w-72 bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-2 z-10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model Output</span>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">Live</span>
            </div>
            <p className="text-2xl font-black text-white mb-1">Diabetic Retinopathy</p>
            <p className="text-sm text-slate-400 mb-4">Confidence score</p>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
              />
            </div>
            <p className="text-right text-xs text-slate-500 mt-1.5 font-mono">85.2%</p>
          </div>

          {/* Bottom card — Grad-CAM mock */}
          <div className="hero-card absolute bottom-0 left-0 w-60 bg-slate-900/90 border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] -rotate-3 z-20 backdrop-blur-xl">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-4">Grad-CAM Heatmap</p>
            <div className="flex gap-2.5">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 via-purple-500 to-violet-600 opacity-90" />
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 opacity-90" />
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 border border-white/5" />
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">Activation regions highlight areas of high diagnostic significance.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
