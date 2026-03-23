'use client'

import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Toggle switch component with smooth animation.
 * Styled to match Haven's Living Garden aesthetic.
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
}: ToggleProps) {
  const sizes = {
    sm: { track: 'w-8 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-8', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  }

  const { track, thumb, translate } = sizes[size]

  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex flex-shrink-0 ${track}
          rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)] focus-visible:ring-offset-2
          ${checked
            ? 'bg-gradient-to-r from-[var(--violet)] to-[var(--teal)]'
            : 'bg-[var(--bg-input)] border border-[var(--border-color)]'
          }
        `}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            ${thumb} rounded-full bg-white shadow-md
            flex items-center justify-center
            ${checked ? translate : 'translate-x-0.5'}
          `}
        >
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 text-[var(--violet)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </motion.span>
      </button>

      {(label || description) && (
        <div className="flex-1 pt-0.5">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  )
}

/**
 * Controlled toggle for use with react-hook-form.
 */
interface ControlledToggleProps extends Omit<ToggleProps, 'checked' | 'onChange'> {
  value?: boolean
  onChange?: (value: boolean) => void
}

export function ControlledToggle({ value = false, onChange, ...props }: ControlledToggleProps) {
  return (
    <Toggle
      checked={value}
      onChange={(checked) => onChange?.(checked)}
      {...props}
    />
  )
}
