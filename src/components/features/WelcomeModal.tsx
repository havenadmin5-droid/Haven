'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, User, Eye, EyeOff, Loader2, Camera } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { Bloom } from '@/components/mascot'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { realName: string; showRealName: boolean; showPhoto: boolean }) => Promise<void>
  onPhotoUpload?: (file: File) => Promise<string | null>
  username: string
}

/**
 * Welcome modal shown after registration.
 * Asks for real name and photo with privacy controls.
 */
export function WelcomeModal({
  isOpen,
  onClose,
  onSave,
  onPhotoUpload,
  username,
}: WelcomeModalProps) {
  const [realName, setRealName] = useState('')
  const [showRealName, setShowRealName] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [step, setStep] = useState<'name' | 'photo' | 'done'>('name')

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onPhotoUpload) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setIsUploading(true)
    try {
      await onPhotoUpload(file)
    } catch (error) {
      console.error('Photo upload error:', error)
    }
    setIsUploading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ realName, showRealName, showPhoto })
      setStep('done')
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Save error:', error)
    }
    setIsSaving(false)
  }

  const handleSkip = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleSkip()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--bg-card)] rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-xl font-bold">Welcome to Haven!</h2>
            <button
              onClick={handleSkip}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'done' ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <Bloom mood="love" size="lg" className="mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">You&apos;re all set!</h3>
                <p className="text-[var(--text-secondary)]">
                  Redirecting you to your feed...
                </p>
              </motion.div>
            ) : step === 'name' ? (
              <>
                <div className="text-center mb-6">
                  <Bloom mood="happy" size="lg" className="mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">
                    Hi <span className="font-medium text-[var(--text-primary)]">{username}</span>! Let&apos;s personalize your profile.
                  </p>
                </div>

                {/* Real Name Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Your Real Name (Optional)
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      type="text"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="Enter your real name"
                      className="w-full !pl-10"
                      style={{ paddingLeft: '2.5rem' }}
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Show Real Name Toggle */}
                <div className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                  <Toggle
                    checked={showRealName}
                    onChange={setShowRealName}
                    label="Show real name on profile"
                    description="When off, only your username is visible to others"
                  />
                </div>

                {/* Privacy Note */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--violet)]/10 mb-6">
                  <EyeOff size={18} className="text-[var(--violet)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Your privacy matters. By default, your real name is <strong>hidden</strong>. You can change this anytime in your profile settings.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleSkip} className="btn btn-ghost flex-1">
                    Skip for now
                  </button>
                  <button onClick={() => setStep('photo')} className="btn btn-brand flex-1">
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-2">Add a Profile Photo</h3>
                  <p className="text-[var(--text-secondary)]">
                    A photo helps others recognize you in the community.
                  </p>
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block cursor-pointer">
                    <div className="w-32 h-32 mx-auto rounded-2xl bg-[var(--bg-input)] border-2 border-dashed border-[var(--border-color)] hover:border-[var(--violet)] transition-colors flex items-center justify-center overflow-hidden">
                      {isUploading ? (
                        <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
                      ) : photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Camera size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
                          <span className="text-xs text-[var(--text-muted)]">Click to upload</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Show Photo Toggle */}
                <div className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                  <Toggle
                    checked={showPhoto}
                    onChange={setShowPhoto}
                    label="Show photo on profile"
                    description="When off, your emoji avatar is shown instead"
                  />
                </div>

                {/* Privacy Note */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--violet)]/10 mb-6">
                  <Eye size={18} className="text-[var(--violet)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Photos are <strong>hidden by default</strong>. Only show when you&apos;re comfortable.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('name')} className="btn btn-ghost flex-1">
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-brand flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Saving...
                      </>
                    ) : (
                      'Save & Continue'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
