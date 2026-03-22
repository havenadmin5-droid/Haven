# HAVEN - Product Features Document

*Find Your Safe Space*

A private, secure community platform connecting queer professionals, allies, and support networks across India.

Version 1.0 | March 2026 | **Confidential**

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [Core Platform Features](#3-core-platform-features)
4. [Safety & Moderation](#4-safety--moderation)
5. [Admin & Governance](#5-admin--governance)
6. [Additional Features](#6-additional-features)
7. [User Journeys](#7-user-journeys)
8. [Tech Stack (Free Tier)](#8-tech-stack-free-tier-focus)
9. [Roadmap & Phases](#9-roadmap--phases)
10. [Success Metrics](#10-success-metrics)

---

## 1. Vision & Mission

### Our Vision

A world where every queer individual can find trusted professionals, build meaningful community, and access opportunities without fear of discrimination or exposure.

### Mission Statement

Haven is a privacy-first, community-driven platform that connects LGBTQIA+ individuals with verified professionals, safe job opportunities, local events, and micro-communities. We believe that access to safe healthcare, legal support, mental health resources, and career opportunities is a fundamental right, not a privilege.

### Core Principles

- **Privacy by Default**: Real names, photos, and personal details are never exposed without explicit consent. Users choose what to reveal.
- **Community Verification**: Professionals are verified by the community and admin team, building trust through collective accountability.
- **Zero Discrimination**: Every feature is designed to eliminate barriers that queer individuals face in mainstream platforms.
- **Free & Accessible**: Core features are free forever. No ads. No data selling. No surveillance capitalism.
- **Safety First**: Every interaction passes through moderation layers. Emergency resources are always one tap away.

---

## 2. The Problem We Solve

Queer individuals face unique, compounding challenges when navigating professional and personal networks:

### Healthcare Access
Finding a queer-affirming psychiatrist, therapist, or doctor is a gamble. One wrong choice can mean misgendering, pathologizing, or outright refusal of care.

### Employment Discrimination
Queer individuals face disproportionate hiring bias, hostile workplaces, and lack of inclusive benefits. Finding safe employers is nearly impossible.

### Isolation in New Cities
Moving to a new city means starting from zero. No community, no trusted contacts, no safe spaces. The loneliness compounds existing mental health challenges.

### Privacy & Safety Risks
Existing platforms expose identity by default. For many in India, being outed can mean family rejection, workplace termination, or physical danger.

### Haven's Answer

One platform that solves all of this: a private directory of verified professionals, a safe job board, city-based events, micro-communities for interests, encrypted messaging, and emergency resources. All wrapped in a privacy-first architecture where users control exactly what the world sees.

---

## 3. Core Platform Features

Below is the complete feature set, organized by module. Each feature is tagged with a priority: P0 (launch essential), P1 (fast follow), or P2 (growth phase).

### 3.1 User Identity & Privacy System

The foundation of Haven. Every feature builds on this privacy layer.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 🎭 | **Dual Identity** | Users register with a username (public) and real name (private). They choose which to display at any time. Toggle is instant, platform-wide. | **P0** |
| 🖼️ | **Avatar System** | Pre-built avatar gallery (emoji + illustrated). No obligation to upload real photos. Custom upload optional with moderation. | **P0** |
| 👻 | **Anonymous Mode** | One-tap toggle to go fully anonymous across the platform. Username replaced with random ID, avatar hidden. | **P0** |
| 📧 | **Private Contact** | Professional email shown only to verified community members. Anti-scraping protection built in. | **P0** |
| 📍 | **Fuzzy Location** | Location shown as city-level only. Map pins are approximate (1-3km radius). Exact address never stored. | **P0** |
| 🔐 | **Data Encryption** | All personal data encrypted at rest. Messages use end-to-end encryption. Zero-knowledge architecture for sensitive fields. | **P0** |
| 🗑️ | **Data Deletion** | Full account deletion with 30-day grace period. All data, messages, and posts permanently removed. GDPR-style compliance. | **P1** |
| 📱 | **2FA Authentication** | Optional two-factor authentication via authenticator app or SMS. Recommended for all users. | **P1** |
| 🚨 | **Panic Button** | Instantly switch to a decoy screen (news/weather app) when device is accessed by others. Quick-exit feature. | **P1** |
| 👁️ | **Profile Viewers** | See who viewed your profile (optional). Can be disabled for full stealth mode. | **P2** |

### 3.2 Professional Directory

The heart of Haven. A searchable, filterable directory of queer-friendly professionals verified by the community.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 🔎 | **Smart Search** | Search by profession, skill, city, or keyword. Auto-suggestions and fuzzy matching for misspellings. | **P0** |
| 🏙️ | **City Filter** | Filter professionals by city. Auto-detect user location or manual selection. Multi-city support. | **P0** |
| 💼 | **Profession Tags** | 20+ profession categories: Psychiatrist, Therapist, Doctor, Lawyer, Teacher, Engineer, Designer, and more. | **P0** |
| ✅ | **Verified Badge** | Community-verified professionals get a trust badge. Verification by admin review + community vouching (3+ vouches). | **P0** |
| 🏷️ | **Skill Tags** | Professionals list specific skills (e.g., LGBTQ+ Affirming Therapy, HRT Consultation, Employment Law). | **P0** |
| 📊 | **Availability Status** | Professionals can toggle Available/Unavailable. Filters respect this status. | **P1** |
| ⭐ | **Reviews & Ratings** | Anonymous reviews from community members. Only verified contacts can leave reviews. No public rating number, qualitative only. | **P1** |
| 📅 | **Booking Integration** | Link to external booking tools (Calendly, etc.). No built-in calendar to keep scope manageable. | **P2** |
| 🔗 | **Referral System** | Community members can refer professionals to each other. Builds trust graph organically. | **P2** |

### 3.3 Community Spaces (Micro-Communities)

Interest-based groups where people find their tribe. Think of it as private subreddits for the community.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 🎵 | **Interest Groups** | Pre-seeded communities: Music, Dance, Art, Tech, Books, Fitness, Travel, Cooking, Photography, Film, Fashion, Gaming, Wellness, Writing, Startups. | **P0** |
| 🔒 | **Public/Private** | Communities can be public (open join) or private (invite/approval only). Sensitive support groups default to private. | **P0** |
| 📝 | **Community Posts** | Members post text, images, and links within community spaces. Threaded discussions supported. | **P0** |
| 👑 | **Community Admins** | Each community has designated moderators with pin/delete/mute powers. | **P0** |
| 🏷️ | **Custom Tags** | Community-created tags for organizing discussions (e.g., #jam-sessions, #portfolio-review). | **P1** |
| 📌 | **Pinned Posts** | Admins can pin important posts, rules, or resources to the top of each community. | **P1** |
| 📊 | **Member Directory** | Browse members within a specific community. Search by city or skill within the group. | **P1** |
| 🤖 | **Auto-Moderation** | AI-powered content flagging for hate speech, spam, and inappropriate content. Human review for edge cases. | **P2** |

### 3.4 Job Board

A safe space for inclusive hiring. Community-sourced job listings from verified allies and queer-owned businesses.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 📋 | **Job Listings** | Post jobs with title, company, city, type (full-time/part-time/freelance/internship), remote option, salary range, and description. | **P0** |
| 🔎 | **Job Search** | Filter by city, type, remote-friendly, profession category. Keyword search across title and description. | **P0** |
| 💾 | **Save & Apply** | Save jobs for later. One-click apply sends your Haven profile (what you choose to share) to the poster. | **P0** |
| 🏢 | **Company Profiles** | Basic company info with community-sourced inclusivity rating. Is this employer queer-friendly? | **P1** |
| 📣 | **Job Alerts** | Set up alerts for new jobs matching your criteria. Email or in-app notifications. | **P1** |
| 🤝 | **Referral Leads** | Community members can share informal leads: freelance gigs, projects, consultancies. | **P1** |
| 📊 | **Application Tracker** | Track status of your applications within the platform. | **P2** |
| 📝 | **Resume Builder** | Simple, privacy-aware resume builder. Can generate PDF with username instead of real name. | **P2** |

### 3.5 Events Platform

City-based events for connection, learning, and celebration. Public or private, always safe.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 🎪 | **Event Creation** | Create events with title, description, date/time, venue, city, category, and capacity. Rich text description supported. | **P0** |
| 🔒 | **Public/Private** | Public events visible to all. Private events visible only to invited members or specific communities. | **P0** |
| 🏙️ | **City-Based** | Events organized by city. Users see events in their selected city by default, can explore others. | **P0** |
| ✋ | **RSVP System** | One-click RSVP. Capacity limits enforced. Waitlist when full. | **P0** |
| 🏷️ | **Categories** | Art, Music, Tech, Wellness, Dance, Books, Fitness, Social, Support Group, Workshop, and more. | **P0** |
| 📸 | **Event Gallery** | Post-event photo sharing (with consent toggles for each photo). Community memories. | **P1** |
| 🔁 | **Recurring Events** | Set up weekly/monthly recurring events (e.g., book club every Thursday). | **P1** |
| 📍 | **Venue Privacy** | Exact venue address revealed only after RSVP for private events. Anti-harassment measure. | **P0** |

### 3.6 Messaging & Chat

Community is built through conversation. Secure, real-time messaging for individuals and groups.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 💬 | **Direct Messages** | One-on-one messaging between community members. Must be mutual (both must accept first message). | **P0** |
| 👥 | **Group Chat** | Community-linked group chats. Auto-created for each community. Custom groups also supported. | **P0** |
| 📸 | **Media Sharing** | Share images, files, and links in chat. Image compression for performance. | **P0** |
| 🔔 | **Notifications** | Real-time push notifications for new messages. Configurable per-chat mute settings. | **P0** |
| 🔐 | **E2E Encryption** | All messages encrypted end-to-end. Server cannot read message contents. | **P0** |
| ⏰ | **Disappearing Msgs** | Optional auto-delete timer for sensitive conversations (24h, 7d, 30d). | **P1** |
| 🎤 | **Voice Messages** | Record and send voice notes. Useful for longer, more personal communication. | **P2** |
| 📌 | **Pinned Messages** | Pin important messages in group chats. Quick access to key info. | **P1** |
| 🚫 | **Block & Report** | One-tap block with optional report. Blocked users cannot contact you or see your profile. | **P0** |

### 3.7 Community Feed & Posts

A safe social feed where the community shares experiences, resources, opportunities, and moments of joy.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 📝 | **Text Posts** | Share thoughts, stories, questions, and announcements. Markdown-lite formatting supported. | **P0** |
| 🖼️ | **Image Posts** | Upload and share images. EXIF data auto-stripped for privacy. Multiple image carousel. | **P0** |
| ❤️ | **Reactions** | Like/heart posts. No dislike button (positivity-first design). Reaction counts visible. | **P0** |
| 💬 | **Comments** | Threaded comments on posts. Reply to specific comments for organized discussion. | **P0** |
| ↗️ | **Share** | Share posts within Haven (to DMs, groups, or communities). No external share by design. | **P0** |
| 📌 | **Bookmarks** | Save posts privately for later reference. Personal bookmark collections. | **P1** |
| 🏷️ | **Hashtags** | Tag posts with relevant hashtags. Trending tags surfaced in discovery. | **P1** |
| 📊 | **Polls** | Create polls within posts. Great for community decision-making. | **P2** |
| 🔗 | **Link Previews** | Rich link previews for shared URLs. Auto-generated cards with title and image. | **P1** |

### 3.8 Map & Location Discovery

Visual discovery of community professionals in your area. Privacy-first location features.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| 🗺️ | **Interactive Map** | OpenStreetMap-based map showing community professionals as pins. Filter by profession and city. | **P0** |
| 📍 | **Fuzzy Pins** | All map pins are offset by 1-3km random radius. Exact locations never exposed. | **P0** |
| 🔎 | **Map Search** | Search professionals directly on map. Click pin for quick profile preview. | **P0** |
| 🏥 | **Safe Spaces** | Mark and discover queer-friendly businesses, cafes, clinics, and shelters on the map. | **P1** |
| 📏 | **Proximity Filter** | Filter by distance from your location. Useful when traveling to a new city. | **P1** |
| 🎪 | **Event Pins** | Upcoming events shown on map with distinct markers. Visual event discovery. | **P2** |

### 3.9 Resource Hub

Curated, life-saving resources always accessible within the platform. No searching required.

| Icon | Feature | Description | Priority |
|------|---------|-------------|----------|
| ⚖️ | **Legal Rights** | Know Your Rights guides: Section 377 repeal implications, workplace protections, anti-discrimination laws. | **P0** |
| 🧠 | **Mental Health** | Mental health first aid, crisis resources, finding affirming therapists, self-care guides. | **P0** |
| 🩺 | **Health Resources** | HRT information, sexual health, trusted clinics, insurance navigation for trans healthcare. | **P0** |
| 🆘 | **Emergency Contacts** | One-tap access to crisis helplines: iCall, Vandrevala Foundation, local emergency numbers. | **P0** |
| 🌱 | **Coming Out Guide** | Curated resources for those on their journey. Family communication templates, support groups. | **P0** |
| 🏢 | **Workplace Guide** | Dealing with workplace discrimination, knowing your rights, reporting harassment. | **P1** |
| 🏠 | **Safe Housing** | Finding LGBTQ+-friendly accommodation, roommate matching, landlord awareness. | **P1** |
| 🤝 | **Ally Toolkit** | Shareable guides for allies: how to support, what to say, what not to say, resources. | **P1** |

---

## 4. Safety & Moderation

Safety is not a feature; it is the foundation. Every interaction on Haven passes through multiple safety layers.

### Safety Architecture

Haven operates on a principle of "safe by default." Users must opt IN to share information, never opt OUT. Every privacy control defaults to maximum protection. The burden of trust is on the platform, not the user.

- **Content Moderation**: AI-powered first pass (hate speech, spam, inappropriate content) + human review for flagged items. Zero tolerance for harassment.
- **Report System**: One-tap report on any content, message, profile, or event. Reports are anonymous. Response within 24 hours guaranteed.
- **Block System**: Instant, comprehensive blocking. Blocked users cannot see your profile, posts, or contact you. No notification sent to blocked user.
- **Anti-Doxxing Protection**: Real names, emails, phone numbers in posts are auto-detected and flagged. Prevents accidental or malicious identity exposure.
- **Invite Verification**: New members can be referred by existing members (optional). Referral chains help maintain community integrity.
- **Honeypot Detection**: Fake profiles and bad actors identified through behavioral analysis. Suspicious patterns flagged for admin review.
- **Safe Browsing Mode**: Disguised app icon option (shows as "Weather" or "News"). Quick-exit shortcut clears screen instantly.
- **Data Minimization**: Only essential data collected. No tracking, no analytics beyond basic platform health. No third-party scripts.

---

## 5. Admin & Governance

A transparent, accountable moderation structure that serves the community.

### Admin Roles & Permissions

- **Super Admin**: Platform-level control. User management, feature toggles, content policies, analytics dashboard.
- **City Moderator**: Manage events, reports, and professional verification for a specific city.
- **Community Moderator**: Manage posts, members, and discussions within their assigned communities.
- **Verified Professional**: Trusted status with ability to be featured in directory. No moderation powers.

### Admin Dashboard Features

- Real-time analytics: Total members, daily active users, new signups, engagement metrics.
- Report queue: Prioritized by severity. One-click actions: warn, mute, suspend, ban.
- User management: Search, view profiles, verify professionals, manage roles.
- Content management: Review flagged posts, manage community guidelines, broadcast announcements.
- Event oversight: Approve/reject events, manage featured events, handle event reports.
- Audit log: Every admin action logged with timestamp, actor, and reason. Full accountability.

---

## 6. Additional Features

Beyond the core modules, these features round out the Haven experience.

### Onboarding & First Experience

- **Guided Onboarding**: Step-by-step setup wizard. Choose avatar, set privacy preferences, select city, pick communities to join.
- **Welcome Guide**: Interactive tour of key features. Skippable for experienced users.
- **Starter Connections**: Suggest relevant professionals, communities, and events based on city and interests.
- **Privacy Checkpoint**: Dedicated screen explaining all privacy options before completing registration. Informed consent.

### Notifications & Engagement

- **Smart Notifications**: Configurable per-feature. Mute communities, prioritize DMs, event reminders.
- **Digest Emails**: Optional weekly digest of community highlights, new events, and job postings. Never spammy.
- **Activity Feed**: Personal activity log showing your interactions, posts, and connections.

### Accessibility & Inclusion

- **Multi-language Support**: Hindi, English, Tamil, Bengali, Marathi, Telugu, Kannada. Community-contributed translations.
- **Screen Reader Optimized**: Full ARIA labels, keyboard navigation, high-contrast mode.
- **Low-bandwidth Mode**: Text-only mode for users with slow internet connections.
- **Inclusive Language**: Platform copy reviewed for inclusive language. Non-binary pronoun support in profiles.

### Mentorship Program (P2)

- **Mentor Matching**: Experienced community members paired with newcomers based on profession, city, and interests.
- **Structured Check-ins**: Monthly prompts for mentor-mentee pairs. Optional, never mandatory.
- **Skill Sharing**: Informal knowledge exchange. Offer or request skills within the community.

### Stickers, Reactions & Expression

- **Custom Sticker Packs**: Community-created sticker packs celebrating queer culture, humor, and solidarity. Free to use.
- **Pride Reactions**: Beyond hearts, react with rainbow, fire, solidarity fist, sparkle, and community-designed reactions.
- **Profile Badges**: Earned badges for community contributions: Event Host, Mentor, Verified Pro, 1-Year Member, Connector.

---

## 7. User Journeys

### Journey 1: New in Town

Arjun just moved to Bangalore. He's queer and doesn't know anyone.

1. Downloads Haven, registers with username "sunrise_spark". Uses emoji avatar. Real name hidden.
2. Selects Bangalore as city. Sees 40+ professionals in directory.
3. Searches "Therapist" — finds 3 verified, queer-affirming therapists with community reviews.
4. Messages one therapist through Haven. Books appointment via linked Calendly.
5. Joins "Queer Coders India" and "Pride Fitness Club" communities.
6. Discovers "Queer Tech Meetup" event happening next week. RSVPs.
7. Within 2 weeks: has a therapist, a gym buddy, and a professional network. All safe.

### Journey 2: Job Seeker

Priya was let go after coming out at work. She needs an inclusive employer.

1. Opens Job Board, filters by "Remote" and "Software Engineer."
2. Finds 4 listings from community-verified inclusive companies.
3. Applies using her Haven profile (shares only username and skills, not real name).
4. Connects with the hiring manager through Haven DM. Sets up interview.
5. Gets hired. Posts a celebration in the community feed. 89 hearts.

### Journey 3: Professional Offering Help

Dr. Meera is a psychiatrist who wants to serve the queer community.

1. Registers with real name shown, professional details, and skills listed.
2. Requests verification. 3 community members vouch for her. Admin approves.
3. Gets Verified badge. Shows up at top of "Psychiatrist" search results.
4. Receives 12 contact requests in the first month. Manages availability through status toggle.
5. Creates a recurring "Mental Health Monday" event. 25 regular attendees.

---

## 8. Tech Stack (Free Tier Focus)

Haven is designed to run entirely on free tiers of modern cloud services. Zero cost to launch, scalable when needed.

| Layer | Technology | Why & Free Tier Details |
|-------|------------|-------------------------|
| **Frontend** | **Next.js + React** | Fast, SEO-friendly, Vercel-hosted. Free tier: 100GB bandwidth, serverless functions. |
| **Backend / DB** | **Supabase** | Postgres DB + Auth + Realtime + Storage. Free tier: 500MB DB, 1GB storage, 50K monthly active users. |
| **Auth** | **Supabase Auth** | Email/password + magic link + social login. Row-level security for privacy. Free with Supabase. |
| **Realtime Chat** | **Supabase Realtime** | WebSocket-based realtime subscriptions. Handles chat, notifications, presence. Free tier included. |
| **Hosting** | **Vercel** | Auto-deploy from Git. Global CDN. Free tier handles significant traffic. |
| **Maps** | **Leaflet + OpenStreetMap** | 100% free, open-source map library. No API key needed. Privacy-friendly. |
| **Email** | **Resend** | Transactional emails. Free tier: 3,000 emails/month. |
| **Media Storage** | **Supabase Storage** | Image uploads with CDN. Free tier: 1GB. Auto-compression built in. |
| **Search** | **Supabase Full-Text** | Postgres full-text search. No external service needed. Fast and free. |
| **Analytics** | **Plausible (self-host)** | Privacy-friendly analytics. Self-hosted = free. No cookies, no tracking. |
| **CDN / Security** | **Cloudflare** | Free DDoS protection, SSL, caching. Essential for safety. |
| **AI Moderation** | **Perspective API** | Google's free toxicity detection API. Handles content moderation first-pass. |

**Total Launch Cost: ₹0**

Every technology in this stack has a generous free tier. Haven can serve thousands of users before any paid plan is needed. When scale demands it, upgrading is straightforward.

---

## 9. Roadmap & Phases

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Weeks 1-4 | Auth + Privacy system, Professional Directory, City selection, Basic search, User profiles with dual identity |
| **Phase 2: Community** | Weeks 5-8 | Community Spaces, Feed & Posts, Image uploads, Reactions & comments, Basic moderation tools |
| **Phase 3: Connect** | Weeks 9-12 | Real-time Chat (DM + Group), Job Board with search & apply, Event creation & RSVP, Notifications |
| **Phase 4: Discover** | Weeks 13-16 | Map integration (Leaflet/OSM), Resource Hub, Admin dashboard, Verification system, Safety Center |
| **Phase 5: Grow** | Weeks 17-20 | Mobile-responsive polish, Stickers & reactions, Mentorship matching, Multi-language (Hindi + English), Performance optimization |
| **Phase 6: Scale** | Ongoing | Advanced moderation AI, Analytics dashboard, Recurring events, Resume builder, Voice messages, Ally features |

---

## 10. Success Metrics

How we measure whether Haven is truly serving the community:

- **Community Growth**: Monthly active users, new registrations, city expansion rate.
- **Directory Usage**: Professional searches per day, contact requests sent, verification completion rate.
- **Job Board Impact**: Jobs posted, applications sent, successful placements (self-reported).
- **Event Engagement**: Events created, RSVP rate, attendance rate, repeat event hosts.
- **Safety Health**: Average report response time (<24h target), false positive rate, user trust score (survey).
- **Retention**: 30-day retention rate (target: 60%+), daily active / monthly active ratio.
- **Community Sentiment**: Quarterly anonymous survey. Net Promoter Score. Qualitative feedback.

---

*Built with love, for the community, by the community.*

**Everyone deserves a safe haven.**
