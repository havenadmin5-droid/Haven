# HAVEN - Engineering Standards & Architecture

Performance · Security · Scalability · Maintainability · Data Protection

*Supplement to Master Technical Blueprint*

v1.0 | March 2026 | **Confidential**

---

## 1. Application Architecture

### Architecture Principle

Haven follows a layered architecture with strict separation of concerns. Server Components handle data fetching. Client Components handle interactivity. Server Actions handle mutations. No business logic lives in components — it lives in service functions. Every external API call goes through a server-side wrapper.

### 1.1 Next.js Component Boundaries

Getting server vs. client components wrong kills performance and leaks secrets. Here are the hard rules:

| Concern | Server Component (default) | Client Component ('use client') |
|---------|---------------------------|--------------------------------|
| Data fetching | YES — fetch in component body | NEVER — receive data as props |
| Supabase queries | YES — via createServerClient | NEVER — use server actions |
| Environment secrets | YES — can access process.env | NEVER — only NEXT_PUBLIC_ vars |
| useState / useEffect | NEVER | YES |
| Event handlers (onClick) | NEVER | YES |
| Framer Motion animations | NEVER | YES |
| Form inputs | NEVER | YES |
| Layout shells, page wrappers | YES | Only if interactive |
| Supabase Realtime subscriptions | NEVER | YES — in useEffect |

**Pattern: Server Component pages fetch data, pass it to Client Component islands for interactivity.**

```tsx
// app/(main)/directory/page.tsx — SERVER COMPONENT (default)
export default async function DirectoryPage() {
  const supabase = createServerClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_emoji, city, profession, bio, skills, is_verified')
    .order('is_verified', { ascending: false });

  return <DirectoryClient profiles={profiles ?? []} />;
}

// components/features/DirectoryClient.tsx — CLIENT COMPONENT
'use client';
export function DirectoryClient({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState('');
  // ...all interactivity here
}
```

### 1.2 Service Layer Pattern

All business logic lives in /lib/services/. Components and server actions call service functions. Services call Supabase. This prevents logic duplication and makes testing possible.

```typescript
// lib/services/profiles.ts
import { createServerClient } from '@/lib/supabase/server';
import { maskAnonymousProfile } from '@/lib/utils/privacy';

export async function getDirectoryProfiles(filters: DirectoryFilters) {
  const supabase = createServerClient();
  let query = supabase.from('profiles').select('*');

  if (filters.city !== 'All') query = query.eq('city', filters.city);
  if (filters.profession !== 'All') query = query.eq('profession', filters.profession);
  if (filters.search) {
    query = query.or(`username.ilike.%${filters.search}%,profession.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('is_verified', { ascending: false });
  if (error) throw new ServiceError('Failed to fetch profiles', error);

  // Mask anonymous profiles server-side
  return (data ?? []).map(p => p.is_anonymous ? maskAnonymousProfile(p) : p);
}
```

**File Structure for Services**

```
lib/services/
├── profiles.ts      # getProfile, updateProfile, searchDirectory
├── communities.ts   # getCommunities, joinCommunity, leaveCommunity
├── posts.ts         # createPost, getPosts, reactToPost
├── jobs.ts          # getJobs, createJob, saveJob
├── events.ts        # getEvents, createEvent, rsvpEvent
├── chat.ts          # getConversations, sendMessage, acceptDM
├── moderation.ts    # reportContent, resolveReport, checkToxicity
├── anonymity.ts     # checkEligibility, toggleAnonymous, handleStrike
└── admin.ts         # getStats, manageUsers, auditLog
```

### 1.3 Server Actions for Mutations

All writes go through Next.js Server Actions. Never call Supabase directly from client components for mutations.

```typescript
// app/(main)/feed/actions.ts
'use server';
import { createPost } from '@/lib/services/posts';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreatePostSchema = z.object({
  content: z.string().min(1).max(2000),
  communityId: z.string().uuid().optional(),
  isAnonymous: z.boolean().default(false),
});

export async function createPostAction(formData: FormData) {
  const parsed = CreatePostSchema.safeParse({
    content: formData.get('content'),
    communityId: formData.get('communityId'),
  });

  if (!parsed.success) return { error: 'Invalid input' };

  try {
    await createPost(parsed.data);
    revalidatePath('/feed');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to create post' };
  }
}
```

### 1.4 Middleware Chain

Next.js middleware runs on EVERY request before reaching any page. Haven's middleware chain handles auth, rate limiting headers, and security headers.

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const response = NextResponse.next();

  // 1. Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' blob: data: *.supabase.co images.unsplash.com tile.openstreetmap.org; connect-src 'self' *.supabase.co"
  );

  // 2. Auth session refresh
  const supabase = createServerClient(/* cookies config */);
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Protected route check
  const isProtected = request.nextUrl.pathname.startsWith('/(main)');
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

### 1.5 Error Handling Strategy

Errors are categorized into three layers. Each layer has a different handling pattern:

| Layer | Error Type | Handling |
|-------|------------|----------|
| Service | Database errors, auth errors, validation errors | Throw typed ServiceError with code + message. Never expose raw DB errors to client. |
| Server Action | ServiceError caught from service layer | Return { error: string } object. Never throw from server actions. Log full error server-side. |
| Component | Network errors, unexpected states | React Error Boundaries per route segment. Fallback UI with Bloom mascot + retry button. |

**Error Boundary per Route Segment**

```tsx
// app/(main)/directory/error.tsx
'use client';
export default function DirectoryError({ error, reset }) {
  return (
    <ErrorFallback
      title="Something went wrong"
      description="We couldn't load the directory. Please try again."
      onRetry={reset}
      mascotMood="wink" // Bloom stays friendly even on errors
    />
  );
}
```

---

## 2. Security Architecture

### CRITICAL: This Is a Queer Safety Platform

Security is not optional. A data breach could literally endanger users' lives. Every decision must assume adversarial conditions: hostile actors trying to scrape user data, out users, or infiltrate communities. The security model must be paranoid by design.

### 2.1 Authentication Hardening

- **Rate limiting on auth endpoints**: Max 5 login attempts per email per 15 minutes. After 5 failures, require CAPTCHA (hCaptcha — free tier).
- **Email enumeration prevention**: Registration and forgot-password always return the same generic message regardless of whether the email exists.
- **Password requirements**: Minimum 8 chars, 1 uppercase, 1 number. Checked client-side (UX) AND server-side (security).
- **Session management**: Supabase handles JWT tokens. Access token expires every 1 hour. Refresh token expires in 7 days. Refresh only via httpOnly cookie.
- **Logout**: Invalidate session server-side via supabase.auth.signOut(). Clear all cookies. Redirect to landing.
- **OAuth (future)**: Only Google OAuth initially. Verify email domain. No implicit trust of OAuth profile data.

### 2.2 Input Validation & Sanitization

#### Golden Rule

NEVER trust client input. Every field that hits the server must be validated with Zod schemas. Every text field that renders in UI must be sanitized against XSS. This applies even to data from Supabase — if another user authored it, it's untrusted.

**Validation Rules by Field Type**

| Field | Validation | Sanitization |
|-------|------------|--------------|
| Username | 3-30 chars, /^[a-zA-Z0-9_]+$/ | Lowercase, trim. Reject SQL injection patterns. |
| Bio / Post content | Max 2000 chars, string | HTML-encode all output. Strip `<script>`, on* attributes. Use DOMPurify on render. |
| Email | z.string().email() | Lowercase, trim. Never display raw in UI. |
| City / Profession | Must be in allowed enum | Reject any value not in whitelist array. |
| Image uploads | Max 5MB, MIME: image/jpeg, image/png, image/webp only | Re-encode server-side (strips malicious payloads). EXIF strip mandatory. |
| UUIDs | z.string().uuid() | Reject non-UUID strings. Prevents SQL injection via ID params. |
| Search queries | Max 100 chars, string | Escape special Postgres characters (%, _, etc). Never interpolate into raw SQL. |
| URLs (apply_url) | z.string().url() | Only allow https://. Reject javascript: and data: protocols. |

### 2.3 API Rate Limiting

Rate limiting protects against abuse, scraping, and DDoS. Implement at two levels:

**Level 1: Cloudflare (infrastructure)**

- Free tier includes: 5 WAF rules, basic DDoS protection, bot detection.
- Configure: Rate limit /api/* to 100 requests/minute per IP.
- Configure: Rate limit /api/auth/* to 10 requests/minute per IP.
- Challenge suspicious IPs with JS challenge (not CAPTCHA — less friction).

**Level 2: Application (per-user)**

Use an in-memory rate limiter for the free tier. Upgrade to Redis (Upstash free tier) when needed.

| Endpoint / Action | Limit | Window |
|-------------------|-------|--------|
| Login attempts (per email) | 5 | 15 minutes. After limit: require hCaptcha. |
| Registration | 3 | 1 hour per IP. Prevents mass account creation. |
| Create post | 20 | 1 hour per user. Anti-spam. |
| Send message | 100 (normal) / 20 (anonymous) | 1 day per user. |
| Contact professional | 10 | 1 hour per user. Anti-harassment. |
| Report | 10 | 1 day per user. Prevents report bombing. |
| Search / directory fetch | 60 | 1 minute per user. Anti-scraping. |
| Image upload | 20 | 1 hour per user. Storage protection. |
| Password reset | 3 | 1 hour per email. Enumeration protection. |

### 2.4 Anti-Scraping Protection

The directory contains sensitive data (queer professionals). Scraping this data could endanger lives. Protections:

- **Email addresses**: NEVER rendered in HTML. Loaded via separate authenticated API call only when user clicks "Show contact." Rendered in a canvas element (not selectable text).
- **Directory pagination**: Server-side only. No API endpoint returns more than 20 profiles at once. No "get all" endpoint exists.
- **Honeypot profiles**: 2-3 fake profiles seeded in directory. If these emails receive messages, the source IP is flagged and blocked.
- **User-Agent filtering**: Block known scraping libraries (Python requests, curl, wget) at Cloudflare level unless explicitly whitelisted.
- **No public API**: There is no public API. All data access requires authenticated session. The anon key has NO read access to profiles.

### 2.5 Content Security Policy (CSP)

CSP headers prevent XSS, clickjacking, and data exfiltration. Set in middleware:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';  // Required for Next.js
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  font-src fonts.gstatic.com;
  img-src 'self' blob: data: *.supabase.co images.unsplash.com
    tile.openstreetmap.org *.tile.openstreetmap.org;
  connect-src 'self' *.supabase.co;
  frame-ancestors 'none';  // Prevents embedding in iframes
  base-uri 'self';
  form-action 'self';
```

### 2.6 Image Security Pipeline

Every uploaded image passes through this pipeline before being stored:

1. **Client-side**: Validate file size (max 5MB) and MIME type (jpeg/png/webp only).
2. **Server-side**: Re-validate MIME type by reading file magic bytes (not just Content-Type header — headers can be spoofed).
3. **EXIF strip**: Remove ALL EXIF metadata using sharp library. This prevents GPS coordinates, camera info, and timestamps from leaking.
4. **Re-encode**: Re-encode the image using sharp (converts to WebP, max 1200px width, quality 80%). This destroys any embedded malicious payloads.
5. **Upload to Supabase Storage** with a randomized filename (UUID). Original filename never preserved.
6. **Serve via Supabase CDN** with cache headers. Never serve from application server.

```typescript
// lib/utils/image-pipeline.ts
import sharp from 'sharp';

export async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()  // Auto-rotate based on EXIF (before strip)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()  // Remove transparency (prevents overlay attacks)
    .webp({ quality: 80 })  // Re-encode as WebP
    .toBuffer();
  // sharp automatically strips ALL metadata including EXIF/GPS
}
```

---

## 3. Performance Engineering

### 3.1 Database Performance

**Required Indexes**

Without proper indexes, search and feed queries will degrade rapidly as data grows. These indexes must be created in the initial migration:

| Index | Table.Column(s) | Why |
|-------|-----------------|-----|
| idx_profiles_city | profiles.city | Directory city filter. Equality scan. |
| idx_profiles_profession | profiles.profession | Directory profession filter. |
| idx_profiles_search | profiles (tsvector) | Full-text search on username, profession, skills. GIN index. |
| idx_profiles_verified_avail | profiles(is_verified DESC, is_available DESC) | Directory default sort order. |
| idx_posts_created | posts.created_at DESC | Feed chronological sort. |
| idx_posts_community | posts.community_id | Community-scoped feed filter. |
| idx_jobs_city_active | jobs(city, is_active) | Job board city filter + active only. |
| idx_events_city_date | events(city, date) | Events city + upcoming sort. |
| idx_messages_conv_created | messages(conversation_id, created_at) | Chat message ordering. |
| idx_conv_members_user | conversation_members.user_id | User's conversation list lookup. |
| idx_blocks_both | blocks(blocker_id, blocked_id) | Block check in RLS. Both directions. |
| idx_reports_status | reports.status | Admin report queue filter. |
| idx_community_members | community_members(community_id, user_id) | Membership checks. Composite PK already indexes this. |

**Full-Text Search Setup**

```sql
-- Add tsvector column to profiles
ALTER TABLE profiles ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(profession, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(skills, ' '), '')), 'C') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'D')
) STORED;

CREATE INDEX idx_profiles_search ON profiles USING GIN (search_vector);

-- Query: search for 'therapist anxiety'
SELECT * FROM profiles
WHERE search_vector @@ plainto_tsquery('english', 'therapist anxiety')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'therapist anxiety')) DESC;
```

### 3.2 Query Optimization Rules

- **NEVER use SELECT \***. Always specify exact columns needed. This prevents accidental exposure of sensitive fields (real_name, email) and reduces payload.
- **Paginate everything**. Use cursor-based pagination (`WHERE created_at < $last_seen ORDER BY created_at DESC LIMIT 20`) not OFFSET-based (OFFSET degrades at scale).
- **Denormalize counters**. member_count on communities, attendee_count on events. Update via Postgres triggers, not application-level COUNT(*) queries.
- **Use Supabase's .select() with nested relations** for JOINs: `supabase.from('posts').select('*, author:profiles(username, avatar_emoji)')` — single query instead of N+1.
- **Cache user's block list** in Zustand store (loaded on login). Check locally before rendering — don't rely only on RLS for UI filtering (RLS handles security, local cache handles UX speed).
- **Debounce search inputs**: 300ms. Don't fire a query on every keystroke.

### 3.3 Frontend Performance

**Bundle Optimization**

- **Dynamic imports for heavy pages**: `const MapView = dynamic(() => import('./MapView'), { ssr: false })`. Leaflet is 40KB+ and must not block initial load.
- **Tree-shake Lucide icons**: `import { Heart } from 'lucide-react'` not `import * as icons`.
- **Framer Motion**: `import { motion } from 'framer-motion'` is already tree-shakable. Avoid importing AnimatePresence unless needed.
- **No moment.js**. Use date-fns. Import individual functions: `import { formatDistanceToNow } from 'date-fns'`.

**Image Optimization**

- **Use next/image for ALL images**. Automatic WebP conversion, responsive srcset, lazy loading.
- **Blur placeholder**: Generate blurDataURL for uploaded images (10x10 pixel base64). Show while full image loads.
- **Avatar images**: Max 200x200px. Served as WebP. Cached at CDN edge (Supabase Storage CDN).
- **Event covers**: Max 800x400px. Served as WebP. Lazy-loaded below the fold.
- **Feed post images**: Max 1200px width. Lazy-loaded. Click to expand full resolution.

**Loading States**

- **Skeleton screens** for all data-dependent UI (never spinners). Skeleton matches card layout shape.
- **Optimistic UI** for mutations: reactions, saves, RSVPs update instantly in UI, sync to server in background. On failure, revert with toast.
- **Streaming**: Use React Suspense boundaries per page section. Header + sidebar load instantly. Content area streams in.
- **Stale-While-Revalidate**: Use Next.js ISR (revalidate: 60) for semi-static pages (resource hub, community list).

**Performance Budgets**

| Metric | Target | Red Line (must fix) |
|--------|--------|---------------------|
| First Contentful Paint (FCP) | < 1.5s | > 2.5s |
| Largest Contentful Paint (LCP) | < 2.5s | > 4.0s |
| Cumulative Layout Shift (CLS) | < 0.1 | > 0.25 |
| Time to Interactive (TTI) | < 3.5s | > 5.0s |
| JS Bundle (initial) | < 150KB gzipped | > 250KB |
| API response (directory) | < 200ms | > 500ms |
| Chat message delivery | < 100ms (realtime) | > 300ms |

---

## 4. Data Protection & Privacy Compliance

### 4.1 Data Classification

| Level | Data Types | Handling Rules |
|-------|------------|----------------|
| CRITICAL | real_name, email, phone (future), avatar_url (real photo), IP addresses | Encrypted at rest (Supabase default). Never logged. Never in error messages. Accessible only via service role or user's own session. 30-day hard delete on account deletion. |
| SENSITIVE | city, profession, skills, bio, messages, reports | Encrypted at rest. Accessible via RLS-gated queries only. Pseudonymized in analytics. Retained max 1 year after account deletion for legal compliance. |
| INTERNAL | user_id, trust_score, role, is_banned, audit_log | Not exposed to other users. Admin-only access. Retained indefinitely for platform integrity. |
| PUBLIC | username, avatar_emoji, is_verified, is_available | Visible to all authenticated users. No special handling needed. |

### 4.2 Encryption Strategy

- **At rest**: Supabase encrypts all data at rest with AES-256 by default (Postgres on their infrastructure). No additional application-level encryption needed for the free tier.
- **In transit**: All connections over TLS 1.3. Enforced by both Supabase and Vercel. No HTTP allowed.
- **Messages**: Supabase Realtime uses WSS (WebSocket Secure). Messages are encrypted in transit. For true E2E encryption (future phase), implement Signal Protocol client-side. For v1, server-side encryption is acceptable given we control the infrastructure.
- **Passwords**: Handled by Supabase Auth (bcrypt hashing). Never stored in our schema.
- **Backup encryption**: Supabase handles database backups (free tier: daily backups, 7-day retention). Encrypted by default.

### 4.3 Data Retention & Deletion

**Account Deletion Flow**

1. User clicks "Delete Account" in Safety Center.
2. Confirmation modal: "This action is permanent. All your data will be deleted in 30 days. You can cancel within this period."
3. Set deleted_at timestamp on profiles. Set is_active = FALSE.
4. Immediately hide profile from directory, feed, and search.
5. User can login within 30 days to cancel deletion (resets deleted_at to NULL).
6. After 30 days, a scheduled function (Supabase pg_cron) runs the hard delete.
7. Hard delete: Remove all posts, comments, reactions, messages, saves, RSVPs, memberships, reports filed BY user. Anonymize reports filed AGAINST user (keep for safety but remove reporter_id).
8. Audit log entry created: action = 'account_deleted', target_id = user_id.

**Data Export**

- User can request full data export from Safety Center.
- Server function collects: profile data, posts, comments, messages, saved jobs, RSVP history, community memberships.
- Generates JSON file. Download link sent via email (expires in 24 hours).
- Rate limited: 1 export per 24 hours per user.

### 4.4 Logging Rules

#### What We NEVER Log

Real names, email addresses, message content, IP addresses beyond rate-limiting, password attempts, search queries containing personal info. Logs are for debugging and monitoring, not surveillance.

- **Application logs**: Structured JSON format. Fields: timestamp, level (info/warn/error), service, action, user_id (hashed), duration_ms, error_code.
- **No PII in logs**: User IDs are hashed before logging. City, profession, and content are NEVER logged.
- **Log retention**: 30 days. Auto-purged after.
- **Error logs**: Stack traces allowed but MUST be scrubbed of any user data before logging.
- **Audit log (database)**: Separate from application logs. Only admin actions. Immutable (no UPDATE/DELETE policy). Retained indefinitely.

---

## 5. Scalability Architecture

### 5.1 Free Tier Capacity Planning

| Resource | Free Tier Limit | Estimated Capacity |
|----------|-----------------|---------------------|
| Supabase DB | 500MB | ~50K profiles + 200K posts + 500K messages. Sufficient for 5,000-10,000 active users. |
| Supabase Auth | 50K MAU | More than enough for initial years. |
| Supabase Storage | 1GB | ~10,000 images at 100KB avg (WebP compressed). Add S3 when exceeded. |
| Supabase Realtime | 200 concurrent | Supports ~200 simultaneous chat users. Sufficient for v1. |
| Vercel | 100GB bandwidth/mo | ~500K page views/month at 200KB avg page size. |
| Resend | 3,000 emails/mo | Sufficient for ~100 new registrations/month + notifications. |
| Cloudflare | Unlimited bandwidth | DDoS protection, CDN caching. No limits on free tier. |

### 5.2 Scaling Triggers & Playbook

When each free tier limit approaches 80%, execute the corresponding upgrade plan:

| Trigger | Signal | Action |
|---------|--------|--------|
| DB > 400MB | Monitor via Supabase dashboard | Upgrade to Supabase Pro ($25/mo, 8GB). Or archive old messages to cold storage. |
| Storage > 800MB | Track uploaded image count | Move to S3 + CloudFront ($0.023/GB). Or upgrade Supabase Pro. |
| Realtime > 150 concurrent | Monitor WebSocket connections | Upgrade Supabase. Or implement connection pooling (connect per-tab, not per-component). |
| Search latency > 300ms | Application performance monitoring | Add materialized views for common queries. Or introduce Meilisearch (free self-hosted). |
| Feed query > 200ms | Slow query log | Implement Redis caching layer (Upstash free: 10K cmds/day). Cache feed with 60s TTL. |

### 5.3 Denormalization Strategy

These counters are updated via Postgres triggers (not application code) to prevent inconsistency:

- **communities.member_count**: Trigger on INSERT/DELETE to community_members.
- **events.attendee_count**: Trigger on INSERT/DELETE to event_rsvps.
- **posts.reaction_count**: Trigger on INSERT/DELETE to post_reactions.
- **posts.comment_count**: Trigger on INSERT/DELETE to comments.
- **conversations.last_message_at**: Trigger on INSERT to messages. Used for conversation ordering.
- **profiles.trust_score**: Scheduled function (pg_cron, daily) recalculates based on: account age, posts without reports, communities joined, profile completeness.

```sql
-- Example: Trigger for community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();
```

---

## 6. Maintainability & Code Quality

### 6.1 TypeScript Strictness

- **tsconfig.json**: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `exactOptionalPropertyTypes: true`.
- Every function parameter and return type must be explicitly typed. No 'any' allowed.
- Shared types defined in `lib/types/`. One file per domain: `profile.ts`, `post.ts`, `job.ts`, `event.ts`, `chat.ts`.
- **Supabase types**: Auto-generated via `npx supabase gen types typescript`. Regenerate after every migration.
- **Zod schemas**: Every form and server action has a Zod schema. Types inferred from schemas (`z.infer<typeof Schema>`).

### 6.2 Code Organization Rules

- **One component per file**. Named export matching filename. Exception: small utility sub-components can coexist.
- **Components > 200 lines**: Split into sub-components. No single file should exceed 300 lines.
- **Custom hooks**: Extract reusable state logic into `lib/hooks/`. Naming: `useSearch`, `useChat`, `useAnonymousMode`.
- **Constants**: All magic numbers and strings in `lib/constants.ts`. Cities, professions, sticker sets, reaction names.
- **Avoid prop drilling > 2 levels**. Use Zustand for shared state or React Context for theme/auth.

### 6.3 Testing Strategy

| Layer | Tool | What to Test |
|-------|------|--------------|
| Unit | Vitest | Service functions, utility helpers, Zod schemas, privacy masking logic, trust score calculation. |
| Integration | Vitest + Supabase local | RLS policies (critical: verify blocked users can't see data, anon users masked correctly, email hidden from unverified users). |
| Component | React Testing Library | Key interactions: reaction picker, search filter, RSVP toggle, anonymous mode toggle, theme switch. |
| E2E | Playwright (Phase 7+) | Critical user journeys: register → search directory → contact pro. Create post → react. Block user → verify hidden. |

**Minimum Test Coverage Requirements**

- `lib/services/*`: 80% coverage. These contain business logic.
- `lib/utils/privacy.ts`: 100% coverage. Privacy masking is safety-critical.
- **RLS policies**: 100% tested via integration tests. Every policy must have a test proving it blocks unauthorized access.
- **Supabase migrations**: Test up AND down migrations in CI before deploying.

### 6.4 Migration Discipline

- Every database change goes through a migration file: `npx supabase migration new <description>`.
- Migration files are sequential, numbered, and descriptive: `20260401000000_create_profiles_table.sql`.
- Every migration must be reversible. Include a `-- ROLLBACK` comment block with the undo SQL.
- Never edit a deployed migration. Create a new migration to fix issues.
- **Seed data**: `supabase/seed.sql` contains test data for local development. Never run in production.
- After every migration: regenerate TypeScript types (`npx supabase gen types typescript`).

### 6.5 Monitoring & Observability (Free Tools)

| Concern | Tool | Setup |
|---------|------|-------|
| Uptime monitoring | UptimeRobot (free) | Check /api/health every 5 min. Alert on 3 consecutive failures. Email notification. |
| Error tracking | Sentry (free tier) | 50K events/month. Track unhandled errors, slow transactions. Source maps for stack traces. |
| Performance | Vercel Analytics (free) | Web Vitals tracking built into Vercel. LCP, FCP, CLS per page. |
| Database | Supabase Dashboard | Built-in query performance monitoring. Slow query log. Connection monitoring. |
| User analytics | Plausible (self-hosted) | Privacy-friendly. No cookies. Page views, referrers, device breakdown. GDPR compliant. |

**Health Check Endpoint**

```typescript
// app/api/health/route.ts
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (e) {
    return Response.json({ status: 'unhealthy', db: 'disconnected' }, { status: 503 });
  }
}
```

---

## 7. Accessibility Standards

Haven must be usable by everyone. WCAG 2.1 AA compliance is the minimum standard.

### 7.1 Requirements

- **Color contrast**: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text). Test both light AND dark themes.
- **Keyboard navigation**: Every interactive element focusable via Tab. Focus ring visible (violet, 3px offset). Enter/Space activates buttons. Escape closes modals and pickers.
- **Screen reader**: All images have descriptive alt text. Bloom mascot has aria-label describing its mood. Icon buttons have aria-label (not just emoji). Form inputs have associated labels.
- **ARIA landmarks**: `nav` for sidebar, `main` for content, `complementary` for resource panels. `role="alert"` for error messages.
- **Motion sensitivity**: Respect `prefers-reduced-motion`. Disable all animations (floating shapes, confetti, stagger reveals, hover transforms). Keep functionality intact.
- **Touch targets**: Minimum 44x44px for all interactive elements on mobile. Especially reaction pills and nav items.
- **Text scaling**: UI functional at 200% browser zoom. No horizontal scrolling. No text truncation of critical info.
- **Skip link**: Hidden "Skip to main content" link as first focusable element. Visible on focus.

### 7.2 Semantic HTML Checklist

- Use `<nav>` for sidebar and mobile navigation.
- Use `<main>` for primary content area.
- Use `<article>` for post cards and job listings.
- Use `<section>` with `aria-labelledby` for page sections.
- Use `<button>` for all clickable elements (not `<div onClick>`).
- Use `<input type="search">` for search bars.
- Use `<time datetime="...">` for all timestamps.
- Use `<dialog>` for modals (native HTML dialog element).
- Lists of items (directory results, job listings) use `<ul>`/`<li>`.

---

## 8. Pre-Launch Security Checklist

Before shipping to production, every item below must be verified:

### Authentication & Authorization

- [ ] RLS enabled on EVERY table (no exceptions).
- [ ] Test: unauthenticated user cannot access any data.
- [ ] Test: User A cannot read User B's real_name when show_real_name = FALSE.
- [ ] Test: User A cannot read User B's email when A is not verified.
- [ ] Test: Blocked user cannot see blocker's profile, posts, or send messages.
- [ ] Test: Anonymous user cannot initiate DMs, create events, or join private communities.
- [ ] Service role key is NEVER exposed to client (not in NEXT_PUBLIC_ vars).

### Data Protection

- [ ] All image uploads strip EXIF data (test: upload photo with GPS, verify stripped).
- [ ] Email addresses not rendered in HTML (test: View Source on directory page).
- [ ] No PII in application logs (test: search logs for email patterns).
- [ ] CSP headers set correctly (test: browser dev tools → Network → check headers).
- [ ] HTTPS enforced everywhere (test: try HTTP, verify redirect).

### Performance

- [ ] All pages pass Lighthouse performance audit > 90.
- [ ] No layout shifts (CLS < 0.1).
- [ ] Images served as WebP via next/image.
- [ ] Bundle size < 150KB gzipped (check with `next build --analyze`).
- [ ] Database queries have appropriate indexes (test: EXPLAIN ANALYZE on key queries).

### Safety

- [ ] Report button accessible on every piece of user-generated content.
- [ ] Block works bidirectionally (test: block user, verify hidden everywhere).
- [ ] Emergency contacts visible without scrolling on Safety page.
- [ ] Panic button / quick exit works (test on mobile).
- [ ] Anonymous mode restrictions enforced server-side (test: API call directly, not just UI).

---

*Security is not a feature. It's a promise to our community.*

**Build like their safety depends on it — because it does.**
