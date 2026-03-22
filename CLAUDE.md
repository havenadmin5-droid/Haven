# CLAUDE.md — Haven Project Instructions

## What is Haven?

Haven is a privacy-first community platform for LGBTQIA+ individuals in India. It connects queer professionals, allies, and support networks through a professional directory, job board, events, communities, encrypted chat, and resource hub. **Security is existential** — a data breach could endanger users' lives.

## Documentation

Read these docs in `/docs/` before starting any work:

| Doc | Purpose | When to reference |
|-----|---------|-------------------|
| `FEATURES.md` | Product vision, all 75+ features, user journeys | Understanding "why" and "what" |
| `TECHNICAL_BLUEPRINT.md` | DB schema, feature specs with acceptance criteria, UI component specs, implementation phases | Understanding "what to build" and in what order |
| `ENGINEERING_STANDARDS.md` | Architecture patterns, security rules, performance requirements, testing strategy | Understanding "how to build it safely" |

## Critical Rules (Never Violate)

### Security
- **RLS on EVERY Supabase table.** No exceptions. Test that unauthorized access fails.
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** Only in server-side code.
- **Never use `SELECT *`.** Always specify exact columns. Prevents leaking `real_name`, `email`.
- **Validate ALL input with Zod schemas** — both client-side (UX) and server-side (security).
- **Strip EXIF from all image uploads** using `sharp` before storing.
- **Email addresses never rendered in HTML.** Load via separate authenticated API call.
- **Sanitize all user-generated text** against XSS before rendering (DOMPurify).

### Architecture
- **Server Components** for data fetching. **Client Components** for interactivity. Never mix.
- **Service layer pattern:** Components → Server Actions → Services → Supabase. No Supabase calls in components.
- **Every mutation goes through Server Actions** with Zod validation. Never call Supabase directly from client for writes.
- **Cursor-based pagination** everywhere (not OFFSET). `WHERE created_at < $last ORDER BY created_at DESC LIMIT 20`.
- **Block-aware queries:** Every user-content query must filter out blocked users (via RLS + `is_blocked()` function).

### Privacy
- **Anonymous mode**: Display changes only. Internal tracking always uses real `user_id`. Admin always sees real identity.
- **Anonymous restrictions**: Cannot initiate DMs, create events, join private communities, contact professionals, or create jobs.
- **Anonymous eligibility**: Account >= 14 days old + trust_score >= 20 + zero unresolved reports + anon_suspended = FALSE.
- **Blocks work on real UUIDs**, not display names. Persist through anonymous mode changes.

### Performance
- **Add database indexes** from Engineering Standards Section 3.1 in the FIRST migration.
- **Use `next/image`** for all images (WebP, lazy loading, blur placeholders).
- **Dynamic import** Leaflet and any component > 50KB: `dynamic(() => import('./Map'), { ssr: false })`.
- **Denormalize counters** via Postgres triggers (member_count, attendee_count, reaction_count).
- **Debounce search** inputs: 300ms.

## Implementation Order

Follow this EXACT sequence from Technical Blueprint Section 6. Do NOT skip ahead.

1. **Phase 1: Foundation (Days 1-3)** — Next.js + Supabase setup, auth flow, layout shell, Bloom mascot, design tokens
2. **Phase 2: Directory & Profiles (Days 4-6)** — Profiles table + RLS, directory page, profile page, photo upload
3. **Phase 3: Communities & Feed (Days 7-10)** — Communities, posts, reactions, comments, image upload, Perspective API moderation
4. **Phase 4: Jobs & Events (Days 11-14)** — Job board, events, RSVP system, capacity/waitlist
5. **Phase 5: Chat & Realtime (Days 15-18)** — Conversations, Supabase Realtime, DM acceptance, group chat, typing indicators
6. **Phase 6: Safety & Admin (Days 19-22)** — Reports, blocks, audit log, Safety Center, Accountable Anonymity, Admin dashboard
7. **Phase 7: Map & Polish (Days 23-26)** — Leaflet/OSM map, fuzzy pins, responsive pass, WCAG AA audit, performance optimization

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Supabase (Postgres + Auth + Realtime + Storage)
- **Styling:** Tailwind CSS 4 + shadcn/ui + custom components
- **Animations:** Framer Motion
- **Maps:** Leaflet + OpenStreetMap
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Email:** Resend
- **Moderation:** Perspective API (Google, free)
- **Icons:** Lucide React
- **Hosting:** Vercel (free tier)
- **CDN/Security:** Cloudflare (free tier)
- **Asset Generation:** MCP Asset Generator (AI-powered, see below)

## MCP Asset Generator

Located in `/mcp-asset-generator/`. An MCP server for AI-powered asset generation tailored to Haven's "Living Garden" aesthetic.

### Setup

```bash
cd mcp-asset-generator
cp .env.example .env  # Add OPENAI_API_KEY and/or GEMINI_API_KEY
npm install && npm run build
```

### Available Tools

| Tool | Description |
|------|-------------|
| `generate_image` | Create images using DALL-E/Gemini with Haven's aesthetic |
| `generate_sticker` | Generate kawaii, pride, minimal style stickers |
| `generate_logo` | Create logo concepts (can include Bloom mascot) |
| `get_design_references` | Curated links from Dribbble, Behance, Pinterest, Mobbin |
| `generate_color_palette` | Harmonious palettes matching Living Garden theme |
| `generate_gradient` | CSS gradients (linear, radial, conic, mesh) with animation |
| `suggest_visual_enhancement` | AI suggestions for improving UI/UX of specific pages |
| `create_animation_config` | Generate Framer Motion configurations |
| `generate_svg_pattern` | Decorative SVG patterns (dots, hearts, flowers, confetti) |
| `generate_illustration_prompt` | Detailed prompts for designers or AI image tools |

**Note:** Works without API keys — generates prompts usable with Midjourney, external tools, or designers.

## Visual Enhancement Components

Located in `/src/components/decorations/`. Import from `@/components/decorations`.

| Component | Usage |
|-----------|-------|
| `StickerPicker` | Reaction picker with 10 animated stickers |
| `StickerDisplay` | Display reaction counts |
| `ReactionButton` | Button that opens sticker picker |
| `Confetti` | Pride-colored celebration effect |
| `useConfetti` | Hook to trigger confetti programmatically |
| `RainbowGradient` | Animated pride gradient background |
| `MeshGradient` | Floating orb mesh gradient |
| `GradientText` | Animated rainbow text effect |
| `GradientBorder` | Animated rainbow border wrapper |
| `SparkleField` | Floating sparkle decorations |
| `Badge` | Colored badges (8 Haven colors + rainbow) |
| `VerifiedBadge` | Animated verification checkmark |
| `StatusIndicator` | Online/away/busy/offline with pulse |
| `PrideFlagBadge` | Pride flag badges (10 flags: rainbow, trans, bi, pan, etc.) |
| `SkillBadge` | Removable skill pill badges |
| `FloatingDecorations` | Animated hearts, stars, flowers, butterflies |
| `PrideRibbon` | Rainbow strip for page headers |
| `DecoratedDivider` | Divider with animated emoji |
| `RainbowWave` | Loading animation with pride colors |
| `EmojiCloud` | Floating emoji decoration |

### Example Usage

```tsx
import {
  StickerPicker,
  Confetti,
  GradientText,
  PrideFlagBadge,
  FloatingDecorations,
  Badge,
  useConfetti
} from '@/components/decorations';

// Celebration on action
const { isActive, trigger } = useConfetti();
<button onClick={() => trigger()}>Join Community</button>
<Confetti isActive={isActive} />

// Pride text
<GradientText className="text-4xl font-bold">Welcome to Haven</GradientText>

// Pride flag
<PrideFlagBadge flag="trans" showLabel />

// Floating background decorations
<FloatingDecorations count={15} types={['heart', 'flower', 'sparkle']} />
```

## Design Language: "Living Garden"

- **Theme:** Light default (#FFFBF7 warm cream), dark option (#1A1625 deep plum). Toggle in sidebar.
- **Fonts:** Quicksand (headings, 700-900) + Nunito (body, 400-700). NEVER use Inter, Roboto, or Arial.
- **Colors:** Colorful but balanced. Each nav item has its own accent color. Rose, violet, teal, amber, sky, peach, mint, lavender. Rainbow gradient for hero elements and celebrations.
- **Mascot:** Bloom — custom SVG rainbow spirit with 3 moods (happy, wink, love). Appears in empty states, auth, safety center, celebrations.
- **Reactions:** 10 sticker reactions (❤️🌈🔥✨💜🦋🫂💪🎉🌸) with picker popup.
- **Motion:** Staggered fadeUp on lists, card lift on hover, confetti on join/RSVP/post, floating background shapes.
- **Accessibility:** WCAG 2.1 AA. Respect `prefers-reduced-motion`. Minimum 44x44px touch targets. Skip link.

## Testing Requirements

- **RLS policies:** 100% tested. Every policy must have a test proving unauthorized access fails.
- **Privacy masking:** 100% tested (`lib/utils/privacy.ts`).
- **Service layer:** 80% coverage minimum.
- **Run `npx supabase gen types typescript`** after every migration.

## When Unsure

- Check the docs first — most answers are there.
- If a feature isn't in the docs, ask before implementing.
- If there's a security concern, always choose the more restrictive option.
- If you need to choose between a faster approach and a safer one, choose safer.
