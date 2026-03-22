'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Users, FileText, MessageSquare, Flag, Check, X, Ban,
  CheckCircle, EyeOff, Eye, Clock, type LucideIcon,
} from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import {
  resolveReport, banUser, unbanUser, verifyUser, suspendAnonymous,
  restoreAnonymous, searchUsers,
} from '@/app/(main)/admin/actions'
import type { AdminAction, AuditTargetType } from '@/lib/types'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  totalCommunities: number
  pendingReports: number
  bannedUsers: number
}

interface Report {
  id: string
  reporter_username: string
  reported_username: string | null
  reported_content_type: string | null
  reason: string
  details: string | null
  status: string
  created_at: string
}

interface AuditEntry {
  id: string
  actor_username: string
  action: AdminAction
  target_type: AuditTargetType
  target_id: string
  details: Record<string, unknown> | null
  created_at: string
}

interface SearchUser {
  id: string
  username: string
  avatar_emoji: string
  is_verified: boolean
  is_banned: boolean
  is_anonymous: boolean
  anon_suspended: boolean
  trust_score: number
  created_at: string
}

type Tab = 'overview' | 'reports' | 'users' | 'audit'

/**
 * AdminView - Admin dashboard for the SPA.
 */
export function AdminView() {
  const { isAdmin } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (!isAdmin) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()

      // Stats
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalPosts },
        { count: totalCommunities },
        { count: pendingReports },
        { count: bannedUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', false),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('communities').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      ])

      setStats({
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        totalPosts: totalPosts ?? 0,
        totalCommunities: totalCommunities ?? 0,
        pendingReports: pendingReports ?? 0,
        bannedUsers: bannedUsers ?? 0,
      })

      // Reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          id, reason, details, status, created_at,
          reporter:profiles!reports_reporter_id_fkey (username),
          reported_user:profiles!reports_reported_user_id_fkey (username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)

      if (reportsData) {
        setReports(reportsData.map(r => ({
          id: r.id,
          reason: r.reason,
          details: r.details,
          status: r.status,
          created_at: r.created_at,
          reporter_username: (r.reporter as unknown as { username: string })?.username || 'Unknown',
          reported_username: (r.reported_user as unknown as { username: string })?.username || null,
          reported_content_type: null,
        })))
      }

      // Audit log
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select(`
          id, action, target_type, target_id, details, created_at,
          actor:profiles!audit_logs_actor_id_fkey (username)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (auditData) {
        setAuditLog(auditData.map(a => ({
          id: a.id,
          action: a.action as AdminAction,
          target_type: a.target_type as AuditTargetType,
          target_id: a.target_id,
          details: a.details as Record<string, unknown>,
          created_at: a.created_at,
          actor_username: (a.actor as unknown as { username: string })?.username || 'Unknown',
        })))
      }

      setIsLoading(false)
    }

    loadAdminData()
  }, [isAdmin])

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return
    setIsSearching(true)
    const result = await searchUsers(userSearch)
    if (result.success && result.users) {
      setSearchResults(result.users)
    }
    setIsSearching(false)
  }

  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    setActionInProgress(reportId)
    const result = await resolveReport(reportId, resolution)
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    }
    setActionInProgress(null)
  }

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter ban reason:')
    if (!reason) return
    setActionInProgress(userId)
    const result = await banUser(userId, reason)
    if (result.success) {
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: true } : u)))
    }
    setActionInProgress(null)
  }

  const handleUnbanUser = async (userId: string) => {
    setActionInProgress(userId)
    const result = await unbanUser(userId)
    if (result.success) {
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: false } : u)))
    }
    setActionInProgress(null)
  }

  const handleVerifyUser = async (userId: string) => {
    setActionInProgress(userId)
    const result = await verifyUser(userId)
    if (result.success) {
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, is_verified: true } : u)))
    }
    setActionInProgress(null)
  }

  const handleSuspendAnonymous = async (userId: string) => {
    setActionInProgress(userId)
    const result = await suspendAnonymous(userId)
    if (result.success) {
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, is_anonymous: false, anon_suspended: true } : u)))
    }
    setActionInProgress(null)
  }

  const handleRestoreAnonymous = async (userId: string) => {
    setActionInProgress(userId)
    const result = await restoreAnonymous(userId)
    if (result.success) {
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, anon_suspended: false } : u)))
    }
    setActionInProgress(null)
  }

  const formatAction = (action: AdminAction): string => {
    const labels: Record<AdminAction, string> = {
      ban_user: 'Banned user',
      unban_user: 'Unbanned user',
      verify_user: 'Verified user',
      unverify_user: 'Unverified user',
      resolve_report: 'Resolved report',
      dismiss_report: 'Dismissed report',
      delete_content: 'Deleted content',
      restore_content: 'Restored content',
      feature_event: 'Featured event',
      unfeature_event: 'Unfeatured event',
      suspend_anonymous: 'Suspended anonymous mode',
      restore_anonymous: 'Restored anonymous mode',
      delete_community: 'Deleted community',
      warn_user: 'Warned user',
    }
    return labels[action] || action
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto mb-4 text-[var(--rose)]" size={48} />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-[var(--text-muted)]">You don&apos;t have permission to view this page.</p>
      </div>
    )
  }

  if (isLoading) {
    return <AdminSkeleton />
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
        <Shield className="text-[var(--violet)]" size={28} />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview' as Tab, label: 'Overview', icon: FileText },
          { id: 'reports' as Tab, label: 'Reports', icon: Flag, badge: reports.length },
          { id: 'users' as Tab, label: 'Users', icon: Users },
          { id: 'audit' as Tab, label: 'Audit Log', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--violet)] text-white'
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--rose)] text-white">{tab.badge}</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="var(--sky)" />
          <StatCard label="Active Users" value={stats.activeUsers} icon={CheckCircle} color="var(--teal)" />
          <StatCard label="Total Posts" value={stats.totalPosts} icon={MessageSquare} color="var(--violet)" />
          <StatCard label="Communities" value={stats.totalCommunities} icon={Users} color="var(--amber)" />
          <StatCard label="Pending Reports" value={stats.pendingReports} icon={Flag} color="var(--rose)" />
          <StatCard label="Banned Users" value={stats.bannedUsers} icon={Ban} color="var(--rose)" />
        </motion.div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <motion.div variants={itemVariants} className="space-y-4">
          {reports.length === 0 ? (
            <div className="card text-center py-12">
              <Check className="mx-auto mb-4 text-[var(--teal)]" size={48} />
              <h3 className="text-lg font-bold mb-2">All Clear!</h3>
              <p className="text-[var(--text-muted)]">No pending reports to review.</p>
            </div>
          ) : (
            reports.map((report) => (
              <motion.div key={report.id} layout className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--rose)]/10 text-[var(--rose)] capitalize">
                        {report.reason.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      <span className="text-[var(--text-muted)]">Reported by </span>
                      <span className="font-medium">{report.reporter_username}</span>
                      {report.reported_username && (
                        <>
                          <span className="text-[var(--text-muted)]"> against </span>
                          <span className="font-medium">{report.reported_username}</span>
                        </>
                      )}
                    </p>
                    {report.details && (
                      <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-secondary)] p-3 rounded-lg">
                        &quot;{report.details}&quot;
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(report.id, 'resolved')}
                      disabled={actionInProgress === report.id}
                      className="btn btn-sm bg-[var(--teal)] text-white hover:bg-[var(--teal)]/90"
                    >
                      <Check size={16} /> Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(report.id, 'dismissed')}
                      disabled={actionInProgress === report.id}
                      className="btn btn-secondary btn-sm"
                    >
                      <X size={16} /> Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex gap-2">
            <SearchInput
              value={userSearch}
              onChange={setUserSearch}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              placeholder="Search users by username..."
              className="flex-1"
            />
            <button onClick={handleSearchUsers} disabled={isSearching} className="btn btn-brand">
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xl">
                      {user.avatar_emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {user.is_verified && <CheckCircle className="text-[var(--sky)]" size={14} />}
                        {user.is_banned && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--rose)]/10 text-[var(--rose)] rounded-full">Banned</span>
                        )}
                        {user.is_anonymous && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--sky)]/10 text-[var(--sky)] rounded-full">Anonymous</span>
                        )}
                        {user.anon_suspended && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--amber)]/10 text-[var(--amber)] rounded-full">Anon Suspended</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Trust: {user.trust_score} • Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!user.is_verified && (
                      <button
                        onClick={() => handleVerifyUser(user.id)}
                        disabled={actionInProgress === user.id}
                        className="btn btn-sm btn-secondary"
                        title="Verify user"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {user.is_banned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id)}
                        disabled={actionInProgress === user.id}
                        className="btn btn-sm bg-[var(--teal)] text-white"
                        title="Unban user"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user.id)}
                        disabled={actionInProgress === user.id}
                        className="btn btn-sm bg-[var(--rose)] text-white"
                        title="Ban user"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    {user.anon_suspended ? (
                      <button
                        onClick={() => handleRestoreAnonymous(user.id)}
                        disabled={actionInProgress === user.id}
                        className="btn btn-sm btn-secondary"
                        title="Restore anonymous mode"
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspendAnonymous(user.id)}
                        disabled={actionInProgress === user.id}
                        className="btn btn-sm btn-secondary"
                        title="Suspend anonymous mode"
                      >
                        <EyeOff size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <motion.div variants={itemVariants} className="card">
          <h3 className="font-bold mb-4">Recent Admin Actions</h3>
          {auditLog.length === 0 ? (
            <p className="text-[var(--text-muted)] text-center py-8">No admin actions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[var(--violet)]/10 flex items-center justify-center">
                    <Shield className="text-[var(--violet)]" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{entry.actor_username}</span>{' '}
                      <span className="text-[var(--text-muted)]">{formatAction(entry.action)}</span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {entry.target_type}: {entry.target_id.slice(0, 8)}...
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} color={color} />
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

function AdminSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-[var(--bg-hover)] rounded" />
        <div className="h-8 w-48 bg-[var(--bg-hover)] rounded-lg" />
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-28 bg-[var(--bg-hover)] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card h-24 bg-[var(--bg-hover)]" />
        ))}
      </div>
    </div>
  )
}
