# HAVEN - Master Technical Blueprint

*For Claude Code Implementation*

Tech Stack · Database Schema · Security Rules · Feature Specs · UI Components

v1.0 | March 2026 | **Confidential**

---

## 1. Tech Stack & Project Setup

### Guiding Principle

Every technology must have a generous free tier. Haven launches at zero cost. The stack must be production-grade, not a toy. All choices optimize for developer velocity with Claude Code as the primary coding agent.

### 1.1 Technology Choices

| Layer | Technology | Why & Free Tier Details |
|-------|------------|-------------------------|
| **Framework** | **Next.js 14 (App Router)** | React-based, server components, API routes built-in. Vercel deploys free. SSR for SEO. |
| **Language** | **TypeScript** | Type safety catches bugs at compile time. Essential for a platform handling sensitive data. |
| **Database** | **Supabase (Postgres)** | Free: 500MB DB, 2 projects, 50K MAU. Row-Level Security for privacy. Realtime built-in. |
| **Auth** | **Supabase Auth** | Email/password + magic link + Google OAuth. Free with Supabase. Built-in session mgmt. |
| **Realtime** | **Supabase Realtime** | WebSocket subscriptions for chat, notifications, presence indicators. Free tier included. |
| **Storage** | **Supabase Storage** | Image uploads, avatars, event covers. Free: 1GB. CDN included. Auto-compression. |
| **Styling** | **Tailwind CSS 4** | Utility-first CSS. Consistent design system. Tiny bundle size. Free. |
| **UI Components** | **shadcn/ui + custom** | Accessible, composable components. Copy-paste, no dependency. Free. |
| **Animations** | **Framer Motion** | Production-grade React animations. Gestures, layout animations. Free. |
| **Maps** | **Leaflet + OpenStreetMap** | 100% free, no API key. Privacy-friendly. Custom markers supported. |
| **Email** | **Resend** | Transactional emails. Free: 3,000/month. React email templates. |
| **Search** | **Postgres Full-Text** | Built into Supabase. tsvector + GIN index. No external service needed. |
| **Moderation** | **Perspective API** | Google's free toxicity detection. Handles content moderation first-pass. |
| **CDN/Security** | **Cloudflare** | Free DDoS protection, SSL, caching, WAF rules. Essential for safety. |
| **Hosting** | **Vercel** | Auto-deploy from Git. Edge functions. Free: 100GB bandwidth. |
| **Icons** | **Lucide React** | Open source icon set. Tree-shakable. Free. |
| **Forms** | **React Hook Form + Zod** | Performant forms with schema validation. Type-safe. Free. |
| **State** | **Zustand** | Lightweight global state. 1KB. No boilerplate. Free. |

### 1.2 Project Structure

```
haven/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/               # Auth group: /login, /register
│   │   ├── (main)/               # Main app group (requires auth)
│   │   │   ├── feed/             # Home feed
│   │   │   ├── directory/        # Professional directory
│   │   │   ├── communities/      # Community spaces
│   │   │   ├── jobs/             # Job board
│   │   │   ├── events/           # Events platform
│   │   │   ├── chat/             # Messaging
│   │   │   ├── map/              # Map discovery
│   │   │   ├── resources/        # Resource hub
│   │   │   ├── safety/           # Safety center
│   │   │   ├── profile/          # User profile
│   │   │   └── admin/            # Admin panel
│   │   ├── api/                  # API routes
│   │   └── layout.tsx            # Root layout + providers
│   ├── components/
│   │   ├── ui/                   # Base UI components (Button, Card, Input...)
│   │   ├── layout/               # Sidebar, Topbar, MobileNav
│   │   ├── features/             # Feature-specific composites
│   │   └── mascot/               # Bloom mascot component
│   ├── lib/
│   │   ├── supabase/             # Supabase client, server, middleware
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Helpers, formatters, validators
│   │   ├── stores/               # Zustand stores
│   │   └── types/                # TypeScript type definitions
│   └── styles/                   # Global styles, tailwind config
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── seed.sql                  # Dev seed data
│   └── config.toml               # Supabase local config
├── public/                       # Static assets
└── .env.local                    # Environment variables
```

### 1.3 Initial Setup Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest haven --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
cd haven
npm install @supabase/supabase-js @supabase/ssr zustand framer-motion
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react leaflet react-leaflet date-fns
npm install -D @types/leaflet supabase

# 3. Init Supabase locally
npx supabase init
npx supabase start

# 4. Environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
PERSPECTIVE_API_KEY=your_perspective_key
```

---

## 2. Database Schema & Security

### Security First Principle

Every table uses Row-Level Security (RLS). No data is accessible without explicit policy. The anon key can NEVER read sensitive fields (real_name, email, phone). Service role key is server-only, never exposed to the client.

### 2.1 Core Tables

#### profiles

Extends Supabase auth.users. Contains all user-facing data with privacy controls.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | References auth.users(id). ON DELETE CASCADE. |
| username | text UNIQUE | NO | Public display name. 3-30 chars, alphanumeric + underscore only. |
| real_name | text | YES | Private. Encrypted at rest. Never exposed via API without user consent. |
| show_real_name | boolean | NO | Default FALSE. User must explicitly opt-in. |
| email | text | NO | Contact email. Visible only to verified members (RLS enforced). |
| avatar_emoji | text | NO | Default avatar. One of the preset emoji set. |
| avatar_url | text | YES | Custom photo URL (Supabase Storage). Optional. |
| show_photo | boolean | NO | Default FALSE. Controls whether avatar_url is shown. |
| city | text | NO | User's city. From the approved cities enum. |
| profession | text | NO | From the approved professions enum. |
| bio | text | YES | Max 280 chars. Displayed on profile and directory cards. |
| skills | text[] | YES | Array of skill tags. Max 10. |
| is_verified | boolean | NO | Default FALSE. Set TRUE by admin after verification process. |
| is_available | boolean | NO | Default TRUE. Professional availability toggle. |
| is_anonymous | boolean | NO | Default FALSE. When TRUE, display as random ID everywhere. |
| anonymous_alias | text | YES | Auto-generated: haven_user_XXXXX. Regenerated each session. |
| trust_score | integer | NO | Default 0. Increases with age, engagement, zero reports. Range 0-100. |
| anon_unlocked | boolean | NO | Default FALSE. TRUE when trust_score >= 20 AND account age >= 14 days. |
| role | text | NO | Default 'member'. Enum: member, city_mod, community_mod, admin, super_admin. |
| created_at | timestamptz | NO | Auto-set on insert. |
| updated_at | timestamptz | NO | Auto-updated via trigger. |
| is_banned | boolean | NO | Default FALSE. Banned users cannot login. |
| ban_reason | text | YES | Admin-provided reason. |
| anon_suspended | boolean | NO | Default FALSE. TRUE after 3+ reports while anonymous. |
| theme_pref | text | NO | Default 'light'. Enum: light, dark, system. |
| pronouns | text | YES | Optional. Freeform text, max 50 chars. |

#### communities

Interest-based groups. Can be public or private (invite/approval only).

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| name | text UNIQUE | NO | Community display name. Max 60 chars. |
| slug | text UNIQUE | NO | URL-safe slug. Auto-generated from name. |
| description | text | YES | Max 500 chars. |
| tag | text | NO | Category from approved tags enum. |
| avatar_emoji | text | NO | Community icon. |
| color | text | NO | Hex color for UI theming. |
| is_private | boolean | NO | Default FALSE. Private = invite/approval only. |
| member_count | integer | NO | Denormalized counter. Updated via trigger. |
| created_by | uuid FK | NO | References profiles(id). |
| created_at | timestamptz | NO | Auto-set. |

#### community_members

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| community_id | uuid FK | NO | References communities(id). Part of composite PK. |
| user_id | uuid FK | NO | References profiles(id). Part of composite PK. |
| role | text | NO | Default 'member'. Enum: member, moderator, admin. |
| joined_at | timestamptz | NO | Auto-set. |
| status | text | NO | Default 'active'. Enum: active, pending (for private communities), banned. |

#### posts

Community feed posts. Can belong to a community or be global feed.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| author_id | uuid FK | NO | References profiles(id). |
| community_id | uuid FK | YES | NULL = global feed. FK to communities(id). |
| content | text | NO | Post text. Max 2000 chars. |
| image_urls | text[] | YES | Array of Supabase Storage URLs. Max 4 images. |
| is_anonymous | boolean | NO | Default FALSE. If TRUE, author shown as anonymous (but tracked internally). |
| is_flagged | boolean | NO | Default FALSE. Set TRUE by auto-moderation or manual report. |
| is_hidden | boolean | NO | Default FALSE. Hidden by admin review. |
| created_at | timestamptz | NO | Auto-set. |
| updated_at | timestamptz | NO | Auto-updated. |

#### post_reactions

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| post_id | uuid FK | NO | References posts(id). Part of composite PK. |
| user_id | uuid FK | NO | References profiles(id). Part of composite PK. |
| reaction_type | integer | NO | Index 0-9 mapping to sticker set. Composite PK with post_id + user_id + reaction_type. |
| created_at | timestamptz | NO | Auto-set. |

#### comments

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| post_id | uuid FK | NO | References posts(id). |
| author_id | uuid FK | NO | References profiles(id). |
| parent_id | uuid FK | YES | For threaded replies. NULL = top-level. References comments(id). |
| content | text | NO | Max 1000 chars. |
| is_anonymous | boolean | NO | Default FALSE. |
| created_at | timestamptz | NO | Auto-set. |

#### jobs

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| posted_by | uuid FK | NO | References profiles(id). |
| title | text | NO | Job title. Max 120 chars. |
| company | text | NO | Company name. Max 100 chars. |
| description | text | NO | Full description. Max 3000 chars. |
| city | text | NO | From approved cities. |
| job_type | text | NO | Enum: full_time, part_time, freelance, internship, contract. |
| is_remote | boolean | NO | Default FALSE. |
| salary_range | text | YES | Free text. e.g., '8-15 LPA'. |
| tags | text[] | YES | Skill tags. Max 5. |
| apply_url | text | YES | External application link. |
| apply_email | text | YES | Email for applications. |
| is_active | boolean | NO | Default TRUE. FALSE when filled or expired. |
| expires_at | timestamptz | YES | Auto-deactivate after this date. Default: 30 days from created_at. |
| created_at | timestamptz | NO | Auto-set. |

#### job_saves

Tracks saved/bookmarked jobs per user.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| user_id | uuid FK | NO | Part of composite PK. |
| job_id | uuid FK | NO | Part of composite PK. |
| saved_at | timestamptz | NO | Auto-set. |

#### events

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| host_id | uuid FK | NO | References profiles(id). |
| title | text | NO | Max 120 chars. |
| description | text | NO | Max 2000 chars. |
| city | text | NO | From approved cities. |
| venue_name | text | YES | Venue name (public). e.g., 'Gallery 7, Kala Ghoda'. |
| venue_address | text | YES | Exact address. PRIVATE EVENTS: only visible after RSVP. |
| date | date | NO | Event date. |
| time | time | NO | Start time. |
| end_time | time | YES | End time (optional). |
| category | text | NO | Enum: art, music, tech, wellness, dance, books, fitness, social, support, workshop. |
| is_private | boolean | NO | Default FALSE. |
| capacity | integer | YES | NULL = unlimited. |
| cover_url | text | YES | Event cover image (Supabase Storage). |
| emoji | text | YES | Fallback icon if no cover image. |
| is_recurring | boolean | NO | Default FALSE. |
| recurrence_rule | text | YES | iCal RRULE format. e.g., 'FREQ=WEEKLY;BYDAY=TH'. |
| community_id | uuid FK | YES | Link to a community (optional). |
| created_at | timestamptz | NO | Auto-set. |

#### event_rsvps

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| event_id | uuid FK | NO | Part of composite PK. |
| user_id | uuid FK | NO | Part of composite PK. |
| status | text | NO | Enum: going, maybe, waitlisted. Default 'going'. |
| created_at | timestamptz | NO | Auto-set. |

#### conversations

Represents a DM thread or group chat. Group chats link to communities.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| type | text | NO | Enum: dm, group. |
| name | text | YES | For group chats. NULL for DMs. |
| community_id | uuid FK | YES | If this is a community group chat. |
| created_at | timestamptz | NO | Auto-set. |
| updated_at | timestamptz | NO | Tracks last message time. For ordering. |

#### conversation_members

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| conversation_id | uuid FK | NO | Part of composite PK. |
| user_id | uuid FK | NO | Part of composite PK. |
| role | text | NO | Default 'member'. Enum: member, admin. |
| is_muted | boolean | NO | Default FALSE. |
| last_read_at | timestamptz | YES | For unread count calculation. |
| joined_at | timestamptz | NO | Auto-set. |

#### messages

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| conversation_id | uuid FK | NO | References conversations(id). |
| sender_id | uuid FK | NO | References profiles(id). |
| content | text | YES | Message text. Max 4000 chars. |
| image_url | text | YES | Attached image. |
| is_system | boolean | NO | Default FALSE. System messages (joined, left, etc.). |
| created_at | timestamptz | NO | Auto-set. |

#### reports

All user reports. Anonymous to the reported user, always visible to admins.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| reporter_id | uuid FK | NO | Who filed the report. Never revealed to reported user. |
| reported_user_id | uuid FK | YES | If reporting a user. |
| reported_content_id | uuid | YES | Generic reference to post/comment/message ID. |
| reported_content_type | text | YES | Enum: post, comment, message, profile, event. |
| reason | text | NO | Enum: harassment, spam, inappropriate, doxxing, hate_speech, other. |
| details | text | YES | Freeform details. Max 500 chars. |
| status | text | NO | Default 'pending'. Enum: pending, reviewing, resolved, dismissed. |
| resolved_by | uuid FK | YES | Admin who resolved the report. |
| resolution_note | text | YES | Admin's resolution notes. |
| created_at | timestamptz | NO | Auto-set. |
| resolved_at | timestamptz | YES | When resolved. |

#### blocks

Block list. Works on real user IDs, survives anonymous mode changes.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| blocker_id | uuid FK | NO | Part of composite PK. Who initiated the block. |
| blocked_id | uuid FK | NO | Part of composite PK. Who is blocked. |
| created_at | timestamptz | NO | Auto-set. |

#### audit_log

Every admin action logged for accountability. Immutable table — no UPDATE or DELETE allowed.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | NO | Auto-generated. |
| actor_id | uuid FK | NO | Admin who performed the action. |
| action | text | NO | Enum: ban_user, verify_user, resolve_report, delete_content, feature_event, etc. |
| target_type | text | NO | What was acted on: user, post, event, community, report. |
| target_id | uuid | NO | ID of the target. |
| details | jsonb | YES | Additional context in JSON. |
| created_at | timestamptz | NO | Auto-set. |

### 2.2 Row-Level Security Policies

#### CRITICAL

RLS is the backbone of Haven's privacy model. Every table must have RLS enabled. Without it, the anon key exposes everything. Test every policy manually before shipping.

#### profiles — RLS Policies

- **SELECT**: Users can read their OWN full profile. Other users can read only: id, username, avatar_emoji, city, profession, bio, skills, is_verified, is_available, pronouns. real_name visible only IF show_real_name = TRUE. email visible only IF viewer is a verified community member (is_verified = TRUE).
- **UPDATE**: Users can only update their OWN profile. Cannot modify: id, role, is_verified, trust_score, is_banned, anon_unlocked, anon_suspended.
- **INSERT**: Only via auth trigger (on signup). No manual inserts.
- **DELETE**: Not allowed via API. Account deletion via server function with 30-day soft delete.

#### Block-aware filtering (applies to ALL tables)

Every SELECT query on user-generated content must exclude blocked relationships. Implement via a reusable SQL function:

```sql
CREATE FUNCTION is_blocked(user_a uuid, user_b uuid) RETURNS boolean AS $$
SELECT EXISTS(
  SELECT 1 FROM blocks
  WHERE (blocker_id = user_a AND blocked_id = user_b)
     OR (blocker_id = user_b AND blocked_id = user_a)
);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Example: posts visible only if author not blocked by viewer
CREATE POLICY "Posts visible if not blocked" ON posts
FOR SELECT USING (
  NOT is_blocked(auth.uid(), author_id)
  AND is_hidden = FALSE
);
```

#### Anonymous Mode — Server Logic

Anonymous mode is handled at the API/server layer, NOT in RLS:

- When is_anonymous = TRUE, API responses replace username with anonymous_alias, hide avatar_url, hide city, and hide profession.
- RLS still links all actions to the real user_id. Admins query the real ID via service role.
- The anonymous_alias regenerates on each new session (not each page load) to prevent pattern-tracking.
- Anonymous mode check: server function validates anon_unlocked = TRUE AND anon_suspended = FALSE before allowing toggle.

---

## 3. Accountable Anonymity System

### Core Principle

Anonymous to the community, NEVER to the system. Anonymity is a privacy tool, not a weapon. It is earned, monitored, and revocable.

### 3.1 Eligibility Rules

- Account must be at least 14 days old.
- Trust score must be >= 20 (earned via: days active, posts without reports, community joins, profile completion).
- Zero unresolved reports against the user.
- anon_suspended must be FALSE (not previously revoked for abuse).
- Users cannot enable anonymous mode during their first 14 days under any circumstances.

### 3.2 Restrictions While Anonymous

| Action | Anonymous | Normal |
|--------|-----------|--------|
| Initiate DMs | BLOCKED | Allowed |
| Reply to DMs (if messaged first) | Allowed | Allowed |
| Post in global feed | Allowed (flagged for review) | Allowed |
| Post in communities | Allowed (flagged) | Allowed |
| Create events | BLOCKED | Allowed |
| Join public communities | Allowed | Allowed |
| Join private communities | BLOCKED | Allowed |
| Contact professionals | BLOCKED (must reveal username) | Allowed |
| Browse directory | Allowed | Allowed |
| Daily message limit | 20 messages/day | Unlimited |
| Create job listings | BLOCKED | Allowed |
| RSVP to events | Allowed (public only) | Allowed |

### 3.3 Three-Strike Reveal System

1. **Report #1**: Warning notification sent to anonymous user. No action.
2. **Report #2**: Second warning. Trust score reduced by 10.
3. **Report #3** (from different reporters): Anonymous mode auto-suspended. anon_suspended = TRUE. Admin alerted. User must appeal to regain access.
4. If appeal approved: anon_suspended reset to FALSE, trust score reset to 15 (below unlock threshold, must re-earn).
5. If appeal denied or second suspension: Anonymous mode permanently revoked.

### 3.4 Block Persistence

- Blocks operate on real user IDs, not display aliases.
- If User A blocks User B, then User B enables anonymous mode: B STILL cannot see A's profile, posts, or send messages. The block table uses immutable UUIDs.
- Conversely, if anonymous User X harasses User A, and A blocks X: the block persists even when X disables anonymous mode.

---

## 4. Feature Specs with Acceptance Criteria

Each feature below is defined with its scope, behavior, and testable acceptance criteria. Claude Code should implement each spec as a discrete task.

### 4.1 Authentication & Registration

**Scope**: Email/password auth via Supabase Auth. Registration collects username, city, profession, avatar. Privacy controls set during onboarding.

**Acceptance Criteria**:
- User can register with email, password, username, city, profession, and avatar selection.
- Username validated: 3-30 chars, alphanumeric + underscore, unique (case-insensitive check).
- Password minimum: 8 chars, 1 uppercase, 1 number.
- On registration, show_real_name defaults to FALSE, show_photo defaults to FALSE, is_anonymous defaults to FALSE.
- Privacy checkpoint screen shown before registration completes, explaining all privacy defaults.
- Email verification required. Unverified users can browse but cannot post, message, or contact professionals.
- Login with email + password. Session persisted via Supabase cookie.
- Logout clears session and redirects to landing page.
- Forgot password flow sends reset email via Supabase Auth.
- Error messages are generic (do not reveal if email exists in system — prevents enumeration).

### 4.2 Professional Directory

**Scope**: Searchable, filterable listing of community professionals with privacy-aware contact.

**Acceptance Criteria**:
- Directory page shows all professionals as cards with: display name (respecting anonymous/real name setting), avatar (emoji or photo per setting), profession, city, skills, verified badge, availability status.
- Search input filters by username, real_name (only if show_real_name=TRUE), profession, and skills array. Debounced 300ms.
- City dropdown filter. Profession dropdown filter. Both combinable with search.
- Results sorted by: verified first, then available first, then alphabetical.
- Clicking 'Contact' on a card opens a new DM conversation (or navigates to existing one).
- Contact button is disabled for anonymous users (shows tooltip: 'Disable anonymous mode to contact professionals').
- Email field shown only to users where viewer.is_verified = TRUE (RLS enforced, not just UI).
- Profile cards for blocked users are never shown (RLS enforced).
- Empty state: 'No professionals found. Try adjusting your filters.' with Bloom mascot.
- Loading state: skeleton card placeholders (not spinner).

### 4.3 Community Spaces

**Acceptance Criteria**:
- Communities page shows all communities as cards with: name, avatar, tag, member count, description, color-coded background.
- Tag filter bar at top. Clicking a tag filters communities. 'All' resets.
- 'Join' button toggles membership. Joining triggers confetti animation.
- Private communities show 'Request to Join' button instead. Triggers pending status.
- Joined communities appear in sidebar under 'My Communities' section.
- Inside a community: feed of posts filtered to that community. Members list. Pinned posts at top.
- Community moderators can: pin posts, delete posts, mute members, approve/deny join requests (private).
- Anonymous users can join public communities but NOT private ones.
- Member directory within community searchable by city and skill.
- Community group chat auto-created and linked in the community page header.

### 4.4 Job Board

**Acceptance Criteria**:
- Job board shows listings as cards: logo/emoji, title, company, city, type badge, remote badge, salary, description preview, tags, posted date.
- Search by title and company. City filter dropdown. Job type filter.
- 'Apply' button: if apply_url exists, opens in new tab. If apply_email exists, opens mailto. If neither, opens DM with poster.
- Save/unsave toggle with filled/outline star icon. Saved jobs accessible from profile page.
- Create job form (authenticated users only): title, company, description, city, type, remote toggle, salary, tags (max 5), apply URL/email.
- Jobs auto-expire after 30 days. Poster can manually deactivate.
- Anonymous users CANNOT post jobs (button disabled, tooltip explains).
- Job poster's display name shown per their privacy settings (not always real name).
- Empty state: 'No matching jobs. Try different filters.' with Bloom mascot.

### 4.5 Events Platform

**Acceptance Criteria**:
- Events page shows cards with: cover image (or emoji fallback), title, city, date/time, category badge, private badge, attendee count, host name, description preview.
- City filter dropdown. Category filter optional.
- RSVP button toggles attendance. RSVP triggers confetti.
- Private events: venue_address hidden until user RSVPs. Show 'RSVP to see location' placeholder.
- Capacity enforcement: when attendees = capacity, RSVP changes to 'Join Waitlist'.
- Create event form: title, description, date, time, city, venue, category, capacity, public/private toggle, cover image upload.
- Anonymous users CANNOT create events. Can RSVP to public events only.
- Past events automatically moved to 'Past Events' tab with gallery option.

### 4.6 Messaging & Chat

**Acceptance Criteria**:
- Chat page: left panel lists conversations (DMs + groups). Right panel shows active conversation.
- Conversations sorted by most recent message (updated_at DESC).
- Unread count badge on each conversation. Calculated from last_read_at vs latest message.
- DMs: first message requires mutual acceptance. Sender sees 'Message request sent'. Recipient sees 'Accept / Decline' prompt.
- Group chats: created automatically for each community. Custom groups also creatable.
- Messages render in real-time via Supabase Realtime subscription.
- Image sharing: click attach icon, select image, preview, send. Stored in Supabase Storage.
- Block button in conversation header. Blocks the user and removes conversation from list.
- Anonymous users CANNOT initiate DMs. Can reply to conversations they're already part of.
- Anonymous users have 20 messages/day limit. Counter resets at midnight UTC. Show remaining count.
- Typing indicator: show '...' when other user is typing (Supabase Realtime presence).
- Empty state: Bloom mascot with 'Select a chat to start talking'.
- Mobile: conversation list fills screen. Tapping opens full-screen chat with back button.

### 4.7 Community Feed & Posts

**Acceptance Criteria**:
- Feed page shows posts in reverse chronological order. Infinite scroll pagination (20 per page).
- New post composer at top: text input, image upload button (max 4 images), post button.
- Post card shows: author avatar, display name, time ago, city, content text, images (carousel if multiple), reactions bar.
- Sticker reaction system: 10 reactions (heart, rainbow, fire, sparkle, purple heart, butterfly, hug, strong, celebrate, bloom). Click existing to toggle. Plus button opens picker.
- Reaction picker appears as a horizontal pill bar with all 10 options. Click to react and close picker.
- Comments: click comment icon to expand threaded comments. Reply to specific comment.
- Share: share within Haven only (to a DM or community). No external share button.
- Images auto-strip EXIF data on upload (server-side via Supabase edge function).
- Anonymous posts show anonymous alias, generic avatar, and hide city.
- Posts from blocked users never appear in feed (RLS enforced).
- Content moderation: new posts sent to Perspective API. Toxicity score > 0.8 auto-flagged for review.
- Posting triggers confetti animation.

### 4.8 Map & Location Discovery

**Acceptance Criteria**:
- Map page shows Leaflet/OSM map with custom markers for professionals.
- Each marker shows avatar emoji. Click reveals tooltip: display name, profession, city, verified badge.
- All pin locations are FUZZY: offset by random 1-3km from actual city center. Randomization seeded by user ID (consistent per user, different per map viewer).
- City filter and profession filter above map.
- Below map: grid of professional cards for quick scanning.
- Footer note always visible: 'Locations are approximate for privacy.'
- Dark mode: map tiles switch to dark variant (CartoDB dark_all tiles).
- Mobile: map fills 60% of screen height, cards scrollable below.

### 4.9 Safety Center

**Acceptance Criteria**:
- Safety center page with Bloom mascot (love mood) in header section.
- Privacy toggles: Anonymous Mode (with eligibility check), Show Real Name, Location Privacy, Profile Visibility, Chat Encryption indicator (always on, non-toggleable).
- Each toggle shows current state with description. Changes save immediately (optimistic UI + server sync).
- Anonymous mode toggle: if not eligible, show disabled with explanation ('Available after 14 days with good standing').
- Emergency resources section: crisis helpline numbers with one-tap call functionality on mobile.
- Block list management: view all blocked users, unblock option.
- Data export: button to request full data export (GDPR-style). Generates JSON download via server function.
- Account deletion: button with confirmation modal. Starts 30-day soft delete. All data purged after period.

---

## 5. UI Component Library Specs

### Design Language: Living Garden

Colorful but balanced. Vibrant accents on soft backgrounds. Every navigation item has its own signature color. Rainbow gradients used for active states, hero elements, and celebratory moments. Bloom mascot appears in empty states, loading moments, and celebrations. Rounded, friendly shapes throughout. Light theme default, dark theme as rich jewel-toned alternative.

### 5.1 Color System

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| --bg-main | #FFFBF7 | #1A1625 | Page background. Warm cream / deep plum. |
| --bg-card | #FFFFFF | #241F31 | Card surfaces. |
| --bg-input | #F8F5FF | #2E2840 | Input fields, search bars. |
| --text-primary | #2D2640 | #F0ECF5 | Headings, body text. Must pass WCAG AA. |
| --text-secondary | #6B6280 | #A099B2 | Descriptions, metadata. |
| --text-muted | #A09AB2 | #6B6280 | Timestamps, hints. Lower contrast intentional. |
| --rose | #FF6B8A | #FF6B8A | Primary action, hearts, alerts, warm CTA. |
| --violet | #7C5CFC | #9B7FFF | Brand accent, active nav, links, focus rings. |
| --teal | #00C9A7 | #00E0B8 | Success, verified badges, available status. |
| --amber | #FFB84D | #FFC566 | Warnings, job salary tags, attention states. |
| --sky | #4DA6FF | #5CB8FF | Info states, links, sky-themed elements. |
| --peach | #FFAA85 | #FFBB99 | Secondary warm accent, event cards. |
| --mint | #38D9A9 | #4DE8BB | Fresh accent, community health. |
| --lavender | #B4A7FF | #C4B9FF | Soft accent, badge backgrounds. |

### Navigation Color Map

Each sidebar item has a unique accent color for its icon and active state:

- **Home Feed**: --rose (#FF6B8A)
- **Directory**: --violet (#7C5CFC)
- **Communities**: --teal (#00C9A7)
- **Jobs**: --amber (#FFB84D)
- **Events**: --peach (#FFAA85)
- **Messages**: --sky (#4DA6FF)
- **Map**: --mint (#38D9A9)
- **Resources**: --lavender (#B4A7FF)
- **Safety**: --rose (#FF6B8A)
- **Profile**: --violet (#7C5CFC)
- **Admin**: gradient (rainbow)

### 5.2 Typography

- **Display / Headings**: Quicksand (weight 700-900). Rounded terminals, friendly feel. Used for: page titles, card titles, navigation labels, hero text.
- **Body / UI**: Nunito (weight 400-700). Slightly rounded, excellent readability. Used for: body text, descriptions, input text, buttons.
- **Code / Data**: JetBrains Mono or Consolas. Used for: technical displays, code snippets if any.
- **Scale**: 11px (muted captions) → 13px (body) → 15px (card titles) → 18px (section headers) → 26px (page titles) → clamp(2.8rem, 7vw, 5rem) (hero).

### 5.3 Core Components

#### Button Variants

- **btn-brand**: Rainbow gradient background, white text. Used for primary CTAs. Gradient animates on hover. Box shadow with rose glow.
- **btn-rose**: Solid rose background. Used for secondary actions (post, apply, RSVP).
- **btn-ghost**: White/card background, border. Transforms to violet on hover. Used for tertiary actions.
- **btn-icon**: Square, icon only. 38x38px. Rounded 12px. Used for chat send, attach, settings.
- All buttons: active:scale(0.96) for tactile feedback. Rounded pill shape (border-radius: 50px).

#### Card System

- **Base card**: White surface, 1px border, 16px radius, 20px padding. Hover: lift 3px + shadow-md + border brightens.
- **Card gradient bar**: Hidden 4px rainbow gradient at top, appears on hover (opacity transition).
- **Card glow**: On hover, box-shadow transitions to shadow-glow (violet tinted).
- **Community cards**: background tinted with community color (e.g., tech = blue-tint, music = pink-tint).
- **Event cards**: cover image at top (160px), content below. Zero padding top for image bleed.

#### Bloom Mascot (Custom SVG Component)

- **Three moods**: happy (default, smiling), wink (one eye closed, playful), love (heart eyes, celebratory).
- **Sizes**: 32px (inline), 50px (section headers), 70px (empty states), 80px (hero/auth).
- **Animation**: gentle float (translateY -8px, 3s loop). Sparkles pulse around body.
- **Usage**: landing hero, auth screens, empty states (no results, no chats, first visit), safety center header, confetti trigger, loading states.

#### Sticker Reaction System

- **10 reactions**: ❤️ Love, 🌈 Pride, 🔥 Fire, ✨ Sparkle, 💜 Purple Heart, 🦋 Butterfly, 🫂 Hug, 💪 Strong, 🎉 Celebrate, 🌸 Bloom.
- **Reaction pill**: rounded capsule with emoji + count. Active state: rose-tinted background.
- **Reaction picker**: horizontal pill bar that slides down. Each emoji scales 1.35x on hover. Click reacts and closes.
- **Confetti system**: 12 colored dots shoot upward and fade. Triggered on: post, join community, RSVP, first login.

#### Search & Filters

- **Search bar**: pill shape, search icon left, clear button right. Focus ring: violet with 4px soft glow.
- **Filter dropdowns**: custom styled select with chevron icon. Rounded 12px.
- **Tag pills**: rounded capsule, font-weight 700. Active state: violet background, white text. Hover: scale 1.05 + violet border.

#### Theme Toggle

- **Pill-shaped toggle** in sidebar header. Sun emoji for light, moon for dark.
- **Transition**: all CSS variables animate over 300ms. No flash of unstyled content.
- **Dark theme**: deep plum base (#1A1625), elevated surfaces slightly lighter, borders softer. Jewel-toned accents (slightly brighter than light mode for contrast). Text-primary inverts to near-white #F0ECF5.
- **WCAG AA compliance** required for both themes. Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text.

#### Animations & Motion

- **Page enter**: staggered fadeUp on cards (50ms delay per card).
- **Sidebar hover**: items translateX(4px) right.
- **Cards hover**: translateY(-3px) + shadow elevation.
- **Chat messages**: popIn (scale 0.8 to 1.05 to 1) on new messages.
- **Confetti**: 12 colored dots, absolute positioned, animate upward 100px + rotate 720deg + fade out, 1s duration.
- **Floating shapes**: 6 large blurred circles in fixed position, drifting on different animation timings (15-28s loops). Opacity 0.06 light / 0.04 dark.
- **Rainbow gradient flow**: background-size 200%, position animates 0% to 100% and back. Used on brand buttons, hero title, logo.
- **Reduced motion**: respect prefers-reduced-motion media query. Disable all animations except essential feedback.

### 5.4 Responsive Breakpoints

- **Desktop**: >= 1024px. Full sidebar + main content.
- **Tablet**: 768px - 1023px. Collapsible sidebar (hamburger trigger). Content full-width.
- **Mobile**: < 768px. Sidebar hidden. Bottom navigation bar (5 items: Home, Directory, Communities, Jobs, Messages). Chat: full-screen conversation view with back button. Cards: single column grid.

---

## 6. Claude Code Implementation Order

This is the exact sequence Claude Code should follow. Each phase builds on the previous one. Do NOT skip ahead.

### Phase 1: Foundation (Days 1-3)

1. Initialize Next.js project with TypeScript, Tailwind, ESLint.
2. Set up Supabase project. Run migration for profiles table.
3. Implement Supabase client (browser + server + middleware).
4. Build auth flow: register, login, logout, email verification.
5. Build onboarding: privacy checkpoint, avatar selection, city/profession.
6. Build layout shell: sidebar, main area, mobile bottom nav, theme toggle.
7. Implement Bloom mascot SVG component with three moods.
8. Set up Tailwind design tokens (all CSS variables from Section 5).

### Phase 2: Directory & Profiles (Days 4-6)

9. Run migration for full profiles table with all columns.
10. Implement RLS policies for profiles.
11. Build profile page (view own + edit).
12. Build directory page with search, city filter, profession filter.
13. Build professional card component.
14. Implement photo upload to Supabase Storage.
15. Build display name logic (anonymous mode, real name toggle).

### Phase 3: Communities & Feed (Days 7-10)

16. Run migrations for communities, community_members, posts, post_reactions, comments.
17. Implement RLS for all new tables.
18. Build communities page with tag filter and join/leave.
19. Build community detail page with scoped feed.
20. Build global feed page with new post composer.
21. Implement sticker reaction system.
22. Implement comments with threading.
23. Implement image upload for posts (EXIF strip).
24. Integrate Perspective API for auto-moderation.
25. Build confetti animation system.

### Phase 4: Jobs & Events (Days 11-14)

26. Run migrations for jobs, job_saves, events, event_rsvps.
27. Build job board page with filters, save, apply.
28. Build create job form with validation.
29. Build events page with city/category filters.
30. Build create event form with cover image upload.
31. Implement RSVP system with capacity/waitlist.
32. Implement private event venue reveal after RSVP.

### Phase 5: Chat & Realtime (Days 15-18)

33. Run migrations for conversations, conversation_members, messages.
34. Set up Supabase Realtime subscriptions.
35. Build conversation list with unread counts.
36. Build chat message area with real-time updates.
37. Implement DM initiation with mutual acceptance.
38. Build group chat creation from communities.
39. Implement message input with image sharing.
40. Build typing indicators via Supabase Realtime presence.

### Phase 6: Safety & Admin (Days 19-22)

41. Run migrations for reports, blocks, audit_log.
42. Build Safety Center with all privacy toggles.
43. Implement Accountable Anonymity (eligibility check, restrictions, 3-strike).
44. Build block system (instant block, RLS enforcement).
45. Build report system (one-tap report, admin queue).
46. Build Admin dashboard (stats, report queue, user management, audit log).
47. Implement resource hub with all content.
48. Implement emergency contacts with tap-to-call.

### Phase 7: Map & Polish (Days 23-26)

49. Build map page with Leaflet/OpenStreetMap.
50. Implement fuzzy pin locations.
51. Implement dark map tiles for dark mode.
52. Full responsive pass (tablet + mobile).
53. WCAG AA audit and fixes for both themes.
54. Performance optimization (image lazy loading, query optimization, skeleton states).
55. Error boundary and fallback UI throughout.

---

*Build with love. Ship with safety. Iterate with community.*
