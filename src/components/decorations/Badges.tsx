'use client';

import { motion } from 'framer-motion';

// Haven accent colors
const BADGE_COLORS = {
  rose: { bg: '#FF6B8A', text: '#FFFFFF' },
  violet: { bg: '#7C5CFC', text: '#FFFFFF' },
  teal: { bg: '#00C9A7', text: '#FFFFFF' },
  amber: { bg: '#FFB84D', text: '#1A1625' },
  sky: { bg: '#4DA6FF', text: '#FFFFFF' },
  peach: { bg: '#FFAA85', text: '#1A1625' },
  mint: { bg: '#38D9A9', text: '#1A1625' },
  lavender: { bg: '#B4A7FF', text: '#FFFFFF' },
  rainbow: { bg: 'linear-gradient(90deg, #FF6B8A, #FFB84D, #00C9A7, #4DA6FF, #7C5CFC)', text: '#FFFFFF' },
};

interface BadgeProps {
  children: React.ReactNode;
  color?: keyof typeof BADGE_COLORS;
  variant?: 'solid' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  animated?: boolean;
  onClick?: () => void;
}

export function Badge({
  children,
  color = 'violet',
  variant = 'solid',
  size = 'md',
  icon,
  animated = false,
  onClick,
}: BadgeProps) {
  const colorConfig = BADGE_COLORS[color];
  const isRainbow = color === 'rainbow';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const getStyles = () => {
    if (isRainbow) {
      return {
        background: colorConfig.bg,
        color: colorConfig.text,
        backgroundSize: animated ? '200% 100%' : '100% 100%',
      };
    }

    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `1.5px solid ${colorConfig.bg}`,
          color: colorConfig.bg,
        };
      case 'soft':
        return {
          backgroundColor: `${colorConfig.bg}20`,
          color: colorConfig.bg,
        };
      default:
        return {
          backgroundColor: colorConfig.bg,
          color: colorConfig.text,
        };
    }
  };

  return (
    <motion.span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''}`}
      style={getStyles()}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      animate={
        animated && isRainbow
          ? { backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }
          : {}
      }
      transition={
        animated && isRainbow
          ? { duration: 3, repeat: Infinity, ease: 'linear' }
          : {}
      }
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.span>
  );
}

// Verified badge with sparkle effect
interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerifiedBadge({ size = 'md', showLabel = false }: VerifiedBadgeProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.span
      className="inline-flex items-center gap-1"
      whileHover={{ scale: 1.1 }}
    >
      <motion.svg
        className={`${sizeMap[size]} text-violet-500`}
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </motion.svg>
      {showLabel && (
        <span className="text-xs font-medium text-violet-500">Verified</span>
      )}
    </motion.span>
  );
}

// Status indicator with pulse
interface StatusIndicatorProps {
  status: 'online' | 'away' | 'busy' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusIndicator({ status, size = 'md', showLabel = false }: StatusIndicatorProps) {
  const statusConfig = {
    online: { color: '#00C9A7', label: 'Available' },
    away: { color: '#FFB84D', label: 'Away' },
    busy: { color: '#FF6B8A', label: 'Busy' },
    offline: { color: '#A09AB2', label: 'Offline' },
  };

  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative">
        <motion.span
          className={`block rounded-full ${sizeMap[size]}`}
          style={{ backgroundColor: config.color }}
          animate={
            status === 'online'
              ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        />
        {status === 'online' && (
          <motion.span
            className={`absolute inset-0 rounded-full ${sizeMap[size]}`}
            style={{ backgroundColor: config.color }}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {config.label}
        </span>
      )}
    </span>
  );
}

// Pride flag badge
interface PrideFlagBadgeProps {
  flag: 'rainbow' | 'trans' | 'bi' | 'pan' | 'lesbian' | 'nb' | 'ace' | 'aro' | 'genderqueer' | 'intersex';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const FLAG_GRADIENTS = {
  rainbow: ['#FF0000', '#FF8C00', '#FFFF00', '#008000', '#0000FF', '#4B0082'],
  trans: ['#55CDFC', '#F7A8B8', '#FFFFFF', '#F7A8B8', '#55CDFC'],
  bi: ['#D60270', '#D60270', '#9B4F96', '#0038A8', '#0038A8'],
  pan: ['#FF1B8D', '#FFD800', '#00D8FF'],
  lesbian: ['#D52D00', '#EF7627', '#FF9A56', '#FFFFFF', '#D162A4', '#B55690', '#A30262'],
  nb: ['#FFF430', '#FFFFFF', '#9C59D1', '#000000'],
  ace: ['#000000', '#A4A4A4', '#FFFFFF', '#810081'],
  aro: ['#3DA542', '#A7D379', '#FFFFFF', '#A9A9A9', '#000000'],
  genderqueer: ['#B57EDC', '#FFFFFF', '#4A8123'],
  intersex: ['#FFD800', '#FFD800'],
};

const FLAG_LABELS = {
  rainbow: 'Pride',
  trans: 'Trans',
  bi: 'Bisexual',
  pan: 'Pansexual',
  lesbian: 'Lesbian',
  nb: 'Non-binary',
  ace: 'Asexual',
  aro: 'Aromantic',
  genderqueer: 'Genderqueer',
  intersex: 'Intersex',
};

export function PrideFlagBadge({ flag, size = 'md', showLabel = false }: PrideFlagBadgeProps) {
  const colors = FLAG_GRADIENTS[flag];
  const label = FLAG_LABELS[flag];

  const sizeMap = {
    sm: { width: 20, height: 12 },
    md: { width: 28, height: 16 },
    lg: { width: 36, height: 20 },
  };

  const dimensions = sizeMap[size];
  const stripeHeight = dimensions.height / colors.length;

  return (
    <motion.span
      className="inline-flex items-center gap-1.5"
      whileHover={{ scale: 1.05 }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-sm overflow-hidden"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
      >
        {flag === 'intersex' ? (
          <>
            <rect width="100%" height="100%" fill="#FFD800" />
            <circle
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r={dimensions.height / 3}
              fill="none"
              stroke="#7902AA"
              strokeWidth={dimensions.height / 8}
            />
          </>
        ) : (
          colors.map((color, i) => (
            <rect
              key={i}
              y={i * stripeHeight}
              width="100%"
              height={stripeHeight + 0.5}
              fill={color}
            />
          ))
        )}
      </svg>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </motion.span>
  );
}

// Skill pill badge
interface SkillBadgeProps {
  skill: string;
  color?: keyof typeof BADGE_COLORS;
  onRemove?: () => void;
}

export function SkillBadge({ skill, color = 'teal', onRemove }: SkillBadgeProps) {
  const colorConfig = BADGE_COLORS[color];

  return (
    <motion.span
      className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full"
      style={{
        backgroundColor: `${colorConfig.bg}15`,
        color: colorConfig.bg,
      }}
      whileHover={{ scale: 1.02 }}
    >
      <span>{skill}</span>
      {onRemove && (
        <motion.button
          onClick={onRemove}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.button>
      )}
    </motion.span>
  );
}
