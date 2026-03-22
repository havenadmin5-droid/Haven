'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pride-themed confetti colors
const CONFETTI_COLORS = [
  '#FF6B8A', // Rose
  '#FFB84D', // Amber
  '#00C9A7', // Teal
  '#4DA6FF', // Sky
  '#7C5CFC', // Violet
  '#B4A7FF', // Lavender
  '#FFAA85', // Peach
  '#38D9A9', // Mint
];

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  type: 'square' | 'circle' | 'heart' | 'star';
  delay: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  origin?: { x: number; y: number };
}

function generateConfetti(count: number, origin: { x: number; y: number }): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  const types: ConfettiPiece['type'][] = ['square', 'circle', 'heart', 'star'];

  for (let i = 0; i < count; i++) {
    pieces.push({
      id: i,
      x: origin.x + (Math.random() - 0.5) * 400,
      y: origin.y - Math.random() * 300 - 100,
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.5 + 0.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
      type: types[Math.floor(Math.random() * types.length)]!,
      delay: Math.random() * 0.3,
    });
  }

  return pieces;
}

function ConfettiShape({ type, color }: { type: ConfettiPiece['type']; color: string }) {
  switch (type) {
    case 'heart':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'star':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'circle':
      return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />;
    default:
      return <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />;
  }
}

export function Confetti({
  isActive,
  duration = 3000,
  particleCount = 30, // Reduced from 50 for better performance
  origin,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [activeOrigin, setActiveOrigin] = useState({ x: 500, y: 300 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) return;

    if (isActive) {
      // Calculate origin inside useEffect where window is available
      const effectOrigin = origin ?? {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      };
      setActiveOrigin(effectOrigin);
      setPieces(generateConfetti(particleCount, effectOrigin));
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, particleCount, origin, duration, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: activeOrigin.x,
                y: activeOrigin.y,
                scale: 0,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: piece.x,
                y: [activeOrigin.y, piece.y, piece.y + 500],
                scale: piece.scale,
                rotate: piece.rotation,
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.5,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute"
            >
              <ConfettiShape type={piece.type} color={piece.color} />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for triggering confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = (_origin?: { x: number; y: number }) => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 100);
  };

  return { isActive, trigger };
}

// Celebration wrapper component
interface CelebrationProps {
  children: React.ReactNode;
  onCelebrate?: () => void;
  celebrationType?: 'confetti' | 'sparkle' | 'rainbow';
}

export function Celebration({ children, onCelebrate, celebrationType: _celebrationType = 'confetti' }: CelebrationProps) {
  const { isActive, trigger } = useConfetti();

  const handleClick = (e: React.MouseEvent) => {
    trigger({ x: e.clientX, y: e.clientY });
    onCelebrate?.();
  };

  return (
    <>
      <div onClick={handleClick}>{children}</div>
      <Confetti isActive={isActive} />
    </>
  );
}
