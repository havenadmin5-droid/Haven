'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-[#7C5CFC] to-[#FF6B8A] text-white shadow-lg shadow-[#7C5CFC]/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
  secondary: 'bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] active:scale-[0.98]',
  outline: 'bg-transparent border-2 border-[#7C5CFC] text-[#7C5CFC] hover:bg-[#7C5CFC]/10 active:scale-[0.98]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 active:scale-[0.98]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          relative inline-flex items-center justify-center font-semibold
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/50 focus:ring-offset-2
          disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {/* Button text */}
        <span className={isLoading ? 'ml-0' : ''}>
          {isLoading ? (loadingText || children) : children}
        </span>

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon-only button variant
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', isLoading, disabled, ...props }, ref) => {
    const iconSizeStyles = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center rounded-xl
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/50
          disabled:opacity-60 disabled:cursor-not-allowed
          hover:bg-[var(--bg-hover)]
          active:scale-[0.95]
          ${iconSizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
        ) : (
          icon
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
