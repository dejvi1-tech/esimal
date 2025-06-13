import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useMotionValue, useSpring, useTransform, useAnimation } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const kudosimLogo = "/kudosim1-logo.png";

// Helper for sparkle particles
const Sparkle = ({ x, y, delay }: { x: number; y: number; delay: number }) => (
  <motion.div
    className="absolute w-3 h-3 rounded-full pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      background: 'radial-gradient(circle, #fffbe6 60%, #ffe066 100%)',
      boxShadow: '0 0 12px 2px #ffe06699',
      opacity: 0.85,
    }}
    initial={{ scale: 0, opacity: 0.7 }}
    animate={{ scale: [0, 1.2, 0.8, 0], opacity: [0.7, 1, 0.7, 0] }}
    transition={{ duration: 1.2, delay, ease: 'easeInOut' }}
  />
);

// Custom 5G chip SVG
const FiveGChipIcon = () => (
  <span aria-label="5G Network" className="inline-block">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="10" width="40" height="28" rx="8" fill="url(#chipGradient)" />
      <rect x="10" y="16" width="28" height="16" rx="4" fill="#fff" fillOpacity="0.15" />
      <text x="50%" y="62%" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="Inter, sans-serif">5G</text>
      <defs>
        <linearGradient id="chipGradient" x1="4" y1="10" x2="44" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B2FF2" />
          <stop offset="1" stopColor="#00C6FF" />
        </linearGradient>
      </defs>
    </svg>
  </span>
);

// Custom World Globe Icon
const GlobeNetworkIcon = () => (
  <span aria-label="Global World" className="inline-block">
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main globe circle with ocean gradient */}
      <circle cx="22" cy="22" r="20" fill="url(#oceanGradient)" />
      
      {/* World map continents (simplified) */}
      <g fill="url(#landGradient)">
        {/* North America */}
        <path d="M12 14c2-1 4-1 6 0 1 1 2 3 2 4 0 2-1 3-2 4-1 1-3 1-4 0-2-1-3-3-2-8z" />
        
        {/* South America */}
        <path d="M16 26c1-2 3-3 5-2 1 1 2 2 2 4 0 1-1 2-2 3-2 1-4 1-5-1-1-2-1-4 0-4z" />
        
        {/* Europe */}
        <path d="M24 12c1 0 2 1 2 2 0 1-1 2-2 2-1 0-2-1-2-2 0-1 1-2 2-2z" />
        
        {/* Africa */}
        <path d="M26 18c1-1 3-1 4 0 1 1 1 3 0 4-1 1-3 1-4 0-1-1-1-3 0-4z" />
        
        {/* Asia */}
        <path d="M28 14c2 0 4 1 4 3 0 2-2 3-4 3-2 0-4-1-4-3 0-2 2-3 4-3z" />
        
        {/* Australia */}
        <path d="M32 24c1 0 2 1 2 2 0 1-1 2-2 2-1 0-2-1-2-2 0-1 1-2 2-2z" />
      </g>
      
      {/* Grid lines */}
      <g stroke="#fff" strokeWidth="0.5" strokeOpacity="0.2">
        {/* Latitude lines */}
        <path d="M8 22h28" />
        <path d="M12 16h20" />
        <path d="M14 28h16" />
        
        {/* Longitude lines */}
        <path d="M22 8v28" />
        <path d="M16 12v20" />
        <path d="M28 12v20" />
      </g>
      
      {/* Globe highlights */}
      <ellipse cx="22" cy="22" rx="14" ry="7" fill="#fff" fillOpacity="0.1" />
      <ellipse cx="22" cy="22" rx="10" ry="18" fill="#fff" fillOpacity="0.05" />
      
      {/* Animated shine effect */}
      <path d="M22 2a20 20 0 0 1 0 40 20 20 0 0 1 0-40" fill="url(#shineGradient)">
        <animate
          attributeName="opacity"
          values="0.1;0.2;0.1"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>
      
      <defs>
        {/* Ocean gradient - deep blue to lighter blue */}
        <linearGradient id="oceanGradient" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1B4B8C" />
          <stop offset="0.5" stopColor="#2B6CB0" />
          <stop offset="1" stopColor="#4299E1" />
        </linearGradient>
        
        {/* Land gradient - forest green to lighter green */}
        <linearGradient id="landGradient" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F855A" />
          <stop offset="0.5" stopColor="#38A169" />
          <stop offset="1" stopColor="#48BB78" />
        </linearGradient>
        
        {/* Shine effect gradient */}
        <linearGradient id="shineGradient" x1="22" y1="2" x2="22" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </span>
);

const HeroSection = () => {
  // 3D tilt and floating logic
  const ref = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [18, -18]), { stiffness: 140, damping: 16 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-24, 24]), { stiffness: 140, damping: 16 });
  const floatY = useSpring(isHover ? 0 : 24, { stiffness: 50, damping: 10, mass: 0.5 });
  const controls = useAnimation();
  // Animated glow hue
  const [hue, setHue] = useState(48);
  const navigate = useNavigate();

  // Floating animation
  React.useEffect(() => {
    let glowFrame: number;
    let running = true;
    const animateGlow = () => {
      setHue((h) => (h + 0.25) % 360);
      if (running) glowFrame = requestAnimationFrame(animateGlow);
    };
    animateGlow();
    return () => { running = false; cancelAnimationFrame(glowFrame); };
  }, []);

  React.useEffect(() => {
    if (!isHover) {
      controls.start({ y: [0, -24, 0], transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" } });
    } else {
      controls.stop();
      controls.set({ y: 0 });
      // Trigger sparkles
      setSparkleKey((k) => k + 1);
    }
  }, [isHover, controls]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    setIsHover(false);
  };

  const handleMouseEnter = () => {
    setIsHover(true);
  };

  // Sparkle positions (randomized on each hover)
  const sparkles = isHover
    ? Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const r = 38 + Math.random() * 10;
        return (
          <Sparkle
            key={sparkleKey + '-' + i}
            x={50 + Math.cos(angle) * r}
            y={50 + Math.sin(angle) * r}
            delay={i * 0.08}
          />
        );
      })
    : null;

  return (
    <section className="min-h-screen relative overflow-hidden flex flex-col md:flex-row items-stretch justify-center px-0 md:px-0 bg-gradient-to-br from-yellow-50 to-purple-50">
      {/* Playful Parallax Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Circles */}
        <div className="absolute bg-pink-300 opacity-20 rounded-full" style={{ width: 120, height: 120, top: 40, left: 60 }} />
        <div className="absolute bg-yellow-200 opacity-25 rounded-full" style={{ width: 60, height: 60, top: 180, right: 100 }} />
        <div className="absolute bg-blue-300 opacity-15 rounded-full" style={{ width: 90, height: 90, bottom: 120, left: 120 }} />
        {/* Squares */}
        <div className="absolute bg-purple-300 opacity-16 rounded-lg" style={{ width: 64, height: 64, top: 260, right: 60 }} />
        <div className="absolute bg-green-200 opacity-20 rounded-lg" style={{ width: 40, height: 40, bottom: 60, right: 180 }} />
        {/* Triangles */}
        <div className="absolute bg-orange-200 opacity-18" style={{ width: 70, height: 70, top: 100, left: 240, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute bg-cyan-200 opacity-15" style={{ width: 48, height: 48, bottom: 180, right: 80, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>
      {/* Left: Empty for future use */}
      <div className="hidden md:flex flex-col w-1/12" />
      {/* Center: Heading + Button, with phone image to the right */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full md:w-10/12 px-4 py-12 md:py-0 gap-8">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FiveGChipIcon />
            <GlobeNetworkIcon />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-center leading-tight tracking-tight text-purple-700 drop-shadow-lg md:drop-shadow-2xl mb-8" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', textShadow: '0 4px 24px #a78bfa55' }}>
            Internet i Shpejtë<br />4G/5G Kudo<br />dhe kurdo-her<br />me e-SimFly
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-2">
            <Link
              to="/packages"
              onClick={(e) => {
                e.preventDefault();
                navigate('/packages');
                setTimeout(() => {
                  const element = document.getElementById('packages');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-200 tracking-wide uppercase border-2 border-purple-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ letterSpacing: '0.04em' }}
            >
              SHIKO OFERTAT
            </Link>
            <Link
              to="/packages#country-packages"
              onClick={e => {
                e.preventDefault();
                navigate('/packages#country-packages');
                setTimeout(() => {
                  const element = document.getElementById('country-packages');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-lg hover:from-purple-700 hover:to-blue-600 transition-all duration-200 tracking-wide uppercase border-2 border-purple-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ letterSpacing: '0.04em' }}
            >
              DESTINACIONI JUAJ?
            </Link>
          </div>
        </div>
        {/* Phone/Logo image, right of text on desktop, below on mobile */}
        <div className="relative flex flex-col items-center justify-center flex-1 sm:mt-0 mt-20">
          {/* Animated Glow */}
          <motion.div
            className="absolute w-72 h-72 rounded-full z-0"
            style={{
              filter: 'blur(32px)',
              background: `radial-gradient(circle, hsl(${hue}, 98%, 70%) 0%, hsl(${(hue+40)%360}, 98%, 85%) 80%, transparent 100%)`,
              opacity: 0.55,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -54%)',
            }}
            aria-hidden
          />
          {/* 3D Logo + Sparkles */}
          <motion.div
            ref={ref}
            className="w-56 h-56 flex items-center justify-center cursor-pointer select-none relative z-10"
            style={{ perspective: 1200 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
          >
            <motion.video
              src="/Vacationcalling.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto rounded-2xl shadow-2xl"
              style={{
                rotateX: isHover ? rotateX : 0,
                rotateY: isHover ? rotateY : 0,
                y: floatY,
                scale: isHover ? 1.09 : 1,
                boxShadow: isHover
                  ? "0 24px 64px 0 rgba(80,80,120,0.22), 0 2px 12px 0 rgba(0,0,0,0.12)"
                  : "0 8px 32px 0 rgba(80,80,120,0.10)",
                transition: 'scale 0.22s, box-shadow 0.22s',
              }}
              animate={controls}
              draggable={false}
            />
            {/* Sparkles */}
            {sparkles}
          </motion.div>
          {/* Reflection */}
          <motion.div
            className="absolute left-1/2 top-[98%] w-40 h-8 z-0"
            style={{
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, #fff8 0%, #fff2 60%, transparent 100%)',
              filter: 'blur(6px)',
              opacity: isHover ? 0.22 : 0.13,
            }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;