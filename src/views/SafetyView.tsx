'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Lock, Phone, Download, Trash2,
  UserX, AlertTriangle, Check, X, ChevronRight, ExternalLink,
} from 'lucide-react'
import { Bloom } from '@/components/mascot'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import {
  toggleAnonymousMode,
  updatePrivacySettings,
  unblockUser,
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '@/app/(main)/safety/actions'
import type { BlockWithUser } from '@/lib/types'

const EMERGENCY_CONTACTS = [
  { name: 'iCall', description: 'Psychosocial helpline by TISS', phone: '9152987821', hours: 'Mon-Sat, 8am-10pm' },
  { name: 'Vandrevala Foundation', description: '24/7 mental health support', phone: '1860-2662-345', hours: '24/7' },
  { name: 'LGBTQ+ Helpline', description: 'Swabhava - Bangalore based support', phone: '080-22237029', hours: 'Mon-Fri, 2pm-8pm' },
  { name: 'Sangath', description: 'Mental health helpline', phone: '011-41198666', hours: 'Mon-Fri, 10am-6pm' },
]

/**
 * SafetyView - Safety Center page for the SPA.
 */
export function SafetyView() {
  const { user, profile, refreshProfile } = useAuthStore()
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showRealName, setShowRealName] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [blocks, setBlocks] = useState<BlockWithUser[]>([])
  const [trustScore, setTrustScore] = useState(0)
  const [anonymousAlias, setAnonymousAlias] = useState<string | null>(null)
  const [anonSuspended, setAnonSuspended] = useState(false)
  const [deletedAt, setDeletedAt] = useState<string | null>(null)
  const [accountAgeDays, setAccountAgeDays] = useState(0)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportData, setExportData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load safety data
  useEffect(() => {
    const loadSafetyData = async () => {
      if (!user) return

      const supabase = createClient()

      // Get profile with safety-relevant fields
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_anonymous, anonymous_alias, anon_suspended, show_real_name, show_photo, trust_score, deleted_at, created_at')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setIsAnonymous(profileData.is_anonymous ?? false)
        setAnonymousAlias(profileData.anonymous_alias)
        setAnonSuspended(profileData.anon_suspended ?? false)
        setShowRealName(profileData.show_real_name ?? false)
        setShowPhoto(profileData.show_photo ?? false)
        setTrustScore(profileData.trust_score ?? 0)
        setDeletedAt(profileData.deleted_at)
        const createdDate = new Date(profileData.created_at)
        setAccountAgeDays(Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
      }

      // Get blocks
      const { data: blocksData } = await supabase
        .from('blocks')
        .select(`
          blocked_id,
          created_at,
          blocked_user:profiles!blocks_blocked_id_fkey (
            id, username, avatar_emoji
          )
        `)
        .eq('blocker_id', user.id)

      if (blocksData) {
        setBlocks(blocksData.map(b => ({
          blocked_id: b.blocked_id,
          created_at: b.created_at,
          blocked_user: Array.isArray(b.blocked_user) ? b.blocked_user[0] : b.blocked_user
        })) as BlockWithUser[])
      }

      setIsLoading(false)
    }

    loadSafetyData()
  }, [user])

  // Eligibility check
  const eligible = accountAgeDays >= 14 && trustScore >= 20 && !anonSuspended

  const handleToggleAnonymous = async () => {
    setIsUpdating('anonymous')
    setError(null)
    const result = await toggleAnonymousMode(!isAnonymous)
    if (result.success) {
      setIsAnonymous(!isAnonymous)
      await refreshProfile()
    } else {
      setError(result.error || 'Failed to update')
    }
    setIsUpdating(null)
  }

  const handleToggleRealName = async () => {
    setIsUpdating('realname')
    const result = await updatePrivacySettings({ show_real_name: !showRealName })
    if (result.success) setShowRealName(!showRealName)
    setIsUpdating(null)
  }

  const handleTogglePhoto = async () => {
    setIsUpdating('photo')
    const result = await updatePrivacySettings({ show_photo: !showPhoto })
    if (result.success) setShowPhoto(!showPhoto)
    setIsUpdating(null)
  }

  const handleUnblock = async (userId: string) => {
    setIsUpdating(`unblock-${userId}`)
    const result = await unblockUser(userId)
    if (result.success) {
      setBlocks((prev) => prev.filter((b) => b.blocked_id !== userId))
    }
    setIsUpdating(null)
  }

  const handleExportData = async () => {
    setIsUpdating('export')
    const result = await exportUserData()
    if (result.success && result.data) {
      setExportData(result.data)
      setShowExportModal(true)
    }
    setIsUpdating(null)
  }

  const downloadExport = () => {
    if (!exportData) return
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `haven-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportModal(false)
  }

  const handleDeleteRequest = async () => {
    setIsUpdating('delete')
    const result = await requestAccountDeletion()
    if (result.success) {
      window.location.href = '/'
    }
    setIsUpdating(null)
  }

  const handleCancelDeletion = async () => {
    setIsUpdating('cancel-delete')
    const result = await cancelAccountDeletion()
    if (result.success) {
      setDeletedAt(null)
    }
    setIsUpdating(null)
  }

  if (isLoading) {
    return <SafetySkeleton />
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <Bloom mood="love" size="lg" className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Safety Center</h1>
        <p className="text-[var(--text-muted)]">Control your privacy and security settings</p>
      </motion.div>

      {/* Pending deletion warning */}
      {deletedAt && (
        <motion.div variants={itemVariants} className="p-4 bg-[var(--rose)]/10 border border-[var(--rose)]/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-[var(--rose)] flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-[var(--rose)]">Account Scheduled for Deletion</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Your account will be permanently deleted in 30 days.
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={isUpdating === 'cancel-delete'}
                className="btn btn-secondary btn-sm mt-3"
              >
                {isUpdating === 'cancel-delete' ? 'Canceling...' : 'Cancel Deletion'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-[var(--rose)]/10 border border-[var(--rose)]/20 rounded-xl flex items-center gap-3">
          <X className="text-[var(--rose)]" size={20} />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
        </motion.div>
      )}

      {/* Privacy Toggles */}
      <motion.section variants={itemVariants} className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Eye className="text-[var(--violet)]" size={20} />
          Privacy Settings
        </h2>

        <div className="space-y-4">
          {/* Anonymous Mode */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <EyeOff size={18} className="text-[var(--sky)]" />
                <span className="font-medium">Anonymous Mode</span>
                {isAnonymous && (
                  <span className="text-xs px-2 py-0.5 bg-[var(--sky)]/20 text-[var(--sky)] rounded-full">Active</span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {isAnonymous ? `Posting as ${anonymousAlias}` : 'Hide your identity when posting'}
              </p>
              {!eligible && !isAnonymous && (
                <p className="text-xs text-[var(--amber)] mt-1">
                  Requires 14+ days membership and trust score 20+
                </p>
              )}
            </div>
            <button
              onClick={handleToggleAnonymous}
              disabled={isUpdating === 'anonymous' || (!eligible && !isAnonymous) || anonSuspended}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isAnonymous ? 'bg-[var(--sky)]' : 'bg-[var(--bg-tertiary)]'
              } ${(!eligible && !isAnonymous) || anonSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Show Real Name */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="flex-1">
              <span className="font-medium">Show Real Name</span>
              <p className="text-sm text-[var(--text-muted)] mt-1">Display your real name on your profile</p>
            </div>
            <button
              onClick={handleToggleRealName}
              disabled={isUpdating === 'realname'}
              className={`relative w-12 h-6 rounded-full transition-colors ${showRealName ? 'bg-[var(--teal)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showRealName ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Show Photo */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="flex-1">
              <span className="font-medium">Show Profile Photo</span>
              <p className="text-sm text-[var(--text-muted)] mt-1">Display your photo instead of emoji</p>
            </div>
            <button
              onClick={handleTogglePhoto}
              disabled={isUpdating === 'photo'}
              className={`relative w-12 h-6 rounded-full transition-colors ${showPhoto ? 'bg-[var(--teal)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showPhoto ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Chat Encryption */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[var(--teal)]" />
                <span className="font-medium">Chat Encryption</span>
                <span className="text-xs px-2 py-0.5 bg-[var(--teal)]/20 text-[var(--teal)] rounded-full">Always On</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">All messages are encrypted in transit</p>
            </div>
            <Check className="text-[var(--teal)]" size={20} />
          </div>
        </div>

        {/* Trust Score */}
        <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Trust Score</span>
            <span className="font-bold">{trustScore}</span>
          </div>
          <div className="mt-2 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--rose)] to-[var(--violet)]"
              style={{ width: `${Math.min(100, (trustScore / 50) * 100)}%` }}
            />
          </div>
        </div>
      </motion.section>

      {/* Block List */}
      <motion.section variants={itemVariants} className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserX className="text-[var(--rose)]" size={20} />
          Blocked Users ({blocks.length})
        </h2>

        {blocks.length === 0 ? (
          <p className="text-[var(--text-muted)] text-center py-8">You haven&apos;t blocked anyone</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.blocked_id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-lg">
                    {block.blocked_user.avatar_emoji}
                  </div>
                  <span className="font-medium">{block.blocked_user.username}</span>
                </div>
                <button
                  onClick={() => handleUnblock(block.blocked_id)}
                  disabled={isUpdating === `unblock-${block.blocked_id}`}
                  className="btn btn-secondary btn-sm"
                >
                  {isUpdating === `unblock-${block.blocked_id}` ? '...' : 'Unblock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Emergency Resources */}
      <motion.section variants={itemVariants} className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Phone className="text-[var(--amber)]" size={20} />
          Emergency Resources
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          If you&apos;re in crisis or need support, these helplines are here for you.
        </p>

        <div className="space-y-3">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.phone}
              href={`tel:${contact.phone}`}
              className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div>
                <div className="font-medium">{contact.name}</div>
                <p className="text-sm text-[var(--text-muted)]">{contact.description}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{contact.hours}</p>
              </div>
              <div className="flex items-center gap-2 text-[var(--sky)]">
                <span className="font-mono">{contact.phone}</span>
                <ExternalLink size={16} />
              </div>
            </a>
          ))}
        </div>
      </motion.section>

      {/* Data & Account */}
      <motion.section variants={itemVariants} className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="text-[var(--violet)]" size={20} />
          Data & Account
        </h2>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            disabled={isUpdating === 'export'}
            className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="text-[var(--sky)]" size={20} />
              <div className="text-left">
                <div className="font-medium">Export My Data</div>
                <p className="text-sm text-[var(--text-muted)]">Download all your Haven data as JSON</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[var(--text-muted)]" />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--rose)]/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="text-[var(--rose)]" size={20} />
              <div className="text-left">
                <div className="font-medium text-[var(--rose)]">Delete Account</div>
                <p className="text-sm text-[var(--text-muted)]">Permanently delete your account</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-[var(--rose)]" />
          </button>
        </div>
      </motion.section>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold mb-4">Your Data is Ready</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Click below to download.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExportModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={downloadExport} className="btn btn-brand flex-1">
                <Download size={18} /> Download
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[var(--rose)]/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-[var(--rose)]" size={32} />
              </div>
              <h3 className="text-lg font-bold">Delete Your Account?</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Your account will be scheduled for deletion in 30 days. You can cancel this by logging back in.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleDeleteRequest}
                disabled={isUpdating === 'delete'}
                className="btn bg-[var(--rose)] text-white hover:bg-[var(--rose)]/90 flex-1"
              >
                {isUpdating === 'delete' ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

function SafetySkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
      <div className="text-center">
        <div className="w-24 h-24 bg-[var(--bg-hover)] rounded-full mx-auto mb-4" />
        <div className="h-8 w-40 bg-[var(--bg-hover)] rounded-lg mx-auto mb-2" />
        <div className="h-4 w-64 bg-[var(--bg-hover)] rounded-lg mx-auto" />
      </div>
      <div className="card">
        <div className="h-6 w-40 bg-[var(--bg-hover)] rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[var(--bg-hover)] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
