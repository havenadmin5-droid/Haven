/**
 * Haven Database Seed Script
 *
 * Creates sample data to make the app feel alive on first load.
 * Run with: npx tsx scripts/seed.ts
 *
 * IMPORTANT: Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Sample data
const SAMPLE_PROFILES = [
  {
    username: "asha_mehta",
    avatar_emoji: "🦋",
    city: "Mumbai" as const,
    profession: "Therapist" as const,
    bio: "Licensed therapist specializing in LGBTQIA+ mental health. Safe space for everyone. DMs open for consultations.",
    skills: ["CBT", "Trauma-Informed Care", "Couples Therapy"],
    is_verified: true,
    is_available: true,
    pronouns: "she/her",
  },
  {
    username: "dev_arjun",
    avatar_emoji: "💻",
    city: "Bangalore" as const,
    profession: "Software Engineer" as const,
    bio: "Senior engineer at a tech startup. Passionate about building inclusive tech. Let's connect!",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    is_verified: true,
    is_available: true,
    pronouns: "he/him",
  },
  {
    username: "priya_creates",
    avatar_emoji: "🎨",
    city: "Delhi" as const,
    profession: "Designer" as const,
    bio: "UI/UX designer creating beautiful, accessible experiences. Available for freelance work.",
    skills: ["Figma", "UI Design", "User Research", "Accessibility"],
    is_verified: false,
    is_available: true,
    pronouns: "she/they",
  },
  {
    username: "dr_ravi",
    avatar_emoji: "🩺",
    city: "Chennai" as const,
    profession: "Doctor" as const,
    bio: "General physician with a focus on LGBTQIA+ healthcare. No judgment, just care.",
    skills: ["Primary Care", "HIV/PrEP", "HRT Consultation"],
    is_verified: true,
    is_available: true,
    pronouns: "he/him",
  },
  {
    username: "ananya_writes",
    avatar_emoji: "✍️",
    city: "Kolkata" as const,
    profession: "Writer" as const,
    bio: "Freelance writer and content creator. Writing queer stories that matter.",
    skills: ["Content Writing", "Copywriting", "Storytelling"],
    is_verified: false,
    is_available: true,
    pronouns: "she/her",
  },
  {
    username: "kai_fitness",
    avatar_emoji: "💪",
    city: "Pune" as const,
    profession: "Healthcare Worker" as const,
    bio: "Certified fitness trainer. Creating safe workout spaces for everyone.",
    skills: ["Personal Training", "Nutrition", "HIIT"],
    is_verified: false,
    is_available: true,
    pronouns: "they/them",
  },
  {
    username: "advocate_sana",
    avatar_emoji: "⚖️",
    city: "Hyderabad" as const,
    profession: "Lawyer" as const,
    bio: "Human rights lawyer specializing in LGBTQIA+ legal issues. Fighting for equality.",
    skills: ["Family Law", "Employment Law", "Discrimination Cases"],
    is_verified: true,
    is_available: true,
    pronouns: "she/her",
  },
  {
    username: "rohan_tunes",
    avatar_emoji: "🎵",
    city: "Goa" as const,
    profession: "Musician" as const,
    bio: "Singer-songwriter creating music that celebrates love in all forms.",
    skills: ["Vocals", "Guitar", "Music Production"],
    is_verified: false,
    is_available: false,
    pronouns: "he/him",
  },
  {
    username: "meera_pm",
    avatar_emoji: "📱",
    city: "Bangalore" as const,
    profession: "Product Manager" as const,
    bio: "Building products that make a difference. Looking to connect with like-minded folks.",
    skills: ["Product Strategy", "Agile", "User Analytics"],
    is_verified: false,
    is_available: true,
    pronouns: "she/her",
  },
  {
    username: "sam_social",
    avatar_emoji: "🌈",
    city: "Mumbai" as const,
    profession: "Social Worker" as const,
    bio: "Working with NGOs on LGBTQIA+ rights. Let's create change together.",
    skills: ["Community Outreach", "Advocacy", "Crisis Support"],
    is_verified: true,
    is_available: true,
    pronouns: "they/them",
  },
];

const SAMPLE_COMMUNITIES = [
  {
    name: "Queer Coders India",
    slug: "queer-coders",
    description: "A community for LGBTQIA+ software developers, engineers, and tech enthusiasts in India. Share knowledge, find mentors, and build together.",
    tag: "Tech" as const,
    avatar_emoji: "💻",
    color: "#7C5CFC",
    is_private: false,
  },
  {
    name: "Rainbow Readers",
    slug: "rainbow-readers",
    description: "Book lovers unite! Discuss queer literature, share recommendations, and join our monthly book club.",
    tag: "Books" as const,
    avatar_emoji: "📚",
    color: "#FF6B8A",
    is_private: false,
  },
  {
    name: "Pride Mumbai",
    slug: "pride-mumbai",
    description: "The official community for Mumbai's LGBTQIA+ community. Events, meetups, and local resources.",
    tag: "Social" as const,
    avatar_emoji: "🏳️‍🌈",
    color: "#00C9A7",
    is_private: false,
  },
  {
    name: "Mental Wellness Circle",
    slug: "wellness-circle",
    description: "A safe space to discuss mental health, share resources, and support each other on our wellness journeys.",
    tag: "Support" as const,
    avatar_emoji: "💜",
    color: "#B4A7FF",
    is_private: false,
  },
  {
    name: "Queer Artists Collective",
    slug: "queer-artists",
    description: "Showcase your art, collaborate on projects, and connect with fellow LGBTQIA+ artists across India.",
    tag: "Art" as const,
    avatar_emoji: "🎨",
    color: "#FFB84D",
    is_private: false,
  },
];

const SAMPLE_POSTS = [
  {
    content: "Just finished my first therapy session and feeling so seen for the first time. To anyone hesitating - it's worth it. 💜",
    is_anonymous: false,
  },
  {
    content: "Looking for a queer-friendly dentist in Bangalore. Any recommendations? Preferably someone who doesn't ask uncomfortable questions about 'partners' 🙄",
    is_anonymous: false,
  },
  {
    content: "Coming out to my colleagues today. Wish me luck! 🌈✨",
    is_anonymous: false,
  },
  {
    content: "Just got my first rainbow mug for the office. Small wins, but they matter! ☕🏳️‍🌈",
    is_anonymous: false,
  },
  {
    content: "PSA: The new queer-owned cafe in Indiranagar (Bangalore) is amazing! Great coffee, safe vibes, and the owner is super friendly. Highly recommend!",
    is_anonymous: false,
  },
  {
    content: "Feeling lonely today. Living in a small town where being out isn't really an option. Grateful for this community at least. 💙",
    is_anonymous: true,
  },
  {
    content: "Just finished reading 'The World That Belongs to Us' - an anthology of Indian queer literature. Highly recommend! 📚",
    is_anonymous: false,
  },
  {
    content: "Anyone else struggle with imposter syndrome at work? Being the only openly queer person on my team is exhausting sometimes.",
    is_anonymous: true,
  },
];

const SAMPLE_JOBS = [
  {
    title: "Senior Frontend Developer",
    company: "InclusiTech Solutions",
    description: "We're looking for a Senior Frontend Developer to join our inclusive team. Work on cutting-edge React/Next.js projects in a supportive environment. Remote-friendly with flexible hours. We actively welcome LGBTQIA+ applicants.",
    city: "Bangalore" as const,
    job_type: "full_time" as const,
    is_remote: true,
    salary_range: "25-35 LPA",
    tags: ["React", "Next.js", "TypeScript"],
    apply_email: "careers@inclusitech.example.com",
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  {
    title: "Content Writer",
    company: "Pride Media",
    description: "Join our queer-owned media company as a content writer. Create engaging articles, social media content, and more. Part-time position perfect for students or those looking for flexible work.",
    city: "Mumbai" as const,
    job_type: "part_time" as const,
    is_remote: true,
    salary_range: "15-20k/month",
    tags: ["Writing", "Social Media", "LGBTQIA+"],
    apply_email: "hr@pridemedia.example.com",
    is_active: true,
    expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: "UI/UX Designer",
    company: "RainbowApps",
    description: "Design beautiful, accessible mobile apps for our diverse user base. 3+ years experience required. Strong portfolio with inclusive design examples preferred.",
    city: "Delhi" as const,
    job_type: "full_time" as const,
    is_remote: false,
    salary_range: "18-28 LPA",
    tags: ["Figma", "Mobile Design", "Accessibility"],
    apply_url: "https://rainbowapps.example.com/careers",
    is_active: true,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: "HR Manager - DEI Focus",
    company: "Diversity First Corp",
    description: "Lead our DEI initiatives and create an inclusive workplace. Experience with LGBTQIA+ employee resource groups is a plus. Great opportunity to make a real impact.",
    city: "Pune" as const,
    job_type: "full_time" as const,
    is_remote: false,
    salary_range: "20-30 LPA",
    tags: ["HR", "DEI", "Leadership"],
    apply_email: "talent@diversityfirst.example.com",
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const SAMPLE_EVENTS = [
  {
    title: "Pride Potluck Picnic",
    description: "Join us for a fun afternoon picnic in the park! Bring a dish to share. All are welcome - allies too! We'll have games, music, and great company.",
    city: "Mumbai" as const,
    venue_name: "Shivaji Park",
    venue_address: "Shivaji Park, Dadar West",
    event_date: getNextWeekend(),
    event_time: "16:00",
    end_time: "19:00",
    category: "social" as const,
    is_private: false,
    capacity: 50,
    emoji: "🧺",
  },
  {
    title: "Queer Tech Meetup",
    description: "Monthly meetup for LGBTQIA+ folks in tech. This month's topic: Breaking into the industry. Networking, talks, and free pizza!",
    city: "Bangalore" as const,
    venue_name: "CoWork Central",
    venue_address: "100ft Road, Indiranagar",
    event_date: getNextWeekend(),
    event_time: "18:30",
    end_time: "21:00",
    category: "tech" as const,
    is_private: false,
    capacity: 30,
    emoji: "💻",
  },
  {
    title: "Support Group Session",
    description: "A safe space to share, listen, and heal together. Facilitated by a licensed therapist. Confidential and supportive environment.",
    city: "Delhi" as const,
    venue_name: "The Wellness Center",
    venue_address: "Hauz Khas Village",
    event_date: getNextWeekday(),
    event_time: "19:00",
    end_time: "21:00",
    category: "support" as const,
    is_private: true,
    capacity: 12,
    emoji: "💜",
  },
  {
    title: "Queer Book Club",
    description: "This month we're reading 'The World That Belongs to Us'. Join us to discuss Indian queer literature over chai and snacks.",
    city: "Chennai" as const,
    venue_name: "Cafe Bookworm",
    venue_address: "T. Nagar",
    event_date: getDateInDays(10),
    event_time: "17:00",
    end_time: "19:00",
    category: "books" as const,
    is_private: false,
    capacity: 15,
    emoji: "📚",
  },
  {
    title: "Dance Night",
    description: "Let loose and dance the night away! Safe space, great music, no judgment. DJ Priya spinning queer bangers all night.",
    city: "Goa" as const,
    venue_name: "Rainbow Beach Club",
    venue_address: "Baga Beach Road",
    event_date: getNextWeekend(),
    event_time: "21:00",
    end_time: "02:00",
    category: "dance" as const,
    is_private: false,
    capacity: 100,
    emoji: "💃",
  },
];

// Helper functions for dates
function getNextWeekend(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const nextSaturday = new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
  return nextSaturday.toISOString().split("T")[0]!;
}

function getNextWeekday(): string {
  const now = new Date();
  let daysToAdd = 1;
  let nextDay = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    daysToAdd++;
    nextDay = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }
  return nextDay.toISOString().split("T")[0]!;
}

function getDateInDays(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0]!;
}

// Main seed function
async function seed() {
  console.log("Starting Haven seed...\n");

  // Check for existing data
  const { count: profileCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (profileCount && profileCount > 1) {
    console.log(`Found ${profileCount} existing profiles. Skipping seed to avoid duplicates.`);
    console.log("To re-seed, manually clear the database first.\n");
    return;
  }

  // Create fake users in Supabase Auth
  console.log("Creating sample users...");
  const createdUsers: { id: string; email: string }[] = [];

  for (const profile of SAMPLE_PROFILES) {
    const email = `${profile.username}@haven-demo.local`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "demo-password-123",
      email_confirm: true,
    });

    if (authError) {
      console.error(`Failed to create user ${profile.username}:`, authError.message);
      continue;
    }

    if (authData.user) {
      createdUsers.push({ id: authData.user.id, email });
      console.log(`  Created user: ${profile.username}`);
    }
  }

  // Update profiles with sample data
  console.log("\nUpdating profiles...");
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i]!;
    const profileData = SAMPLE_PROFILES[i]!;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: profileData.username,
        avatar_emoji: profileData.avatar_emoji,
        city: profileData.city,
        profession: profileData.profession,
        bio: profileData.bio,
        skills: profileData.skills,
        is_verified: profileData.is_verified,
        is_available: profileData.is_available,
        pronouns: profileData.pronouns,
        trust_score: profileData.is_verified ? 80 : 50,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error(`Failed to update profile ${profileData.username}:`, profileError.message);
    } else {
      console.log(`  Updated profile: ${profileData.username}`);
    }
  }

  // Create communities
  console.log("\nCreating communities...");
  const communityIds: string[] = [];
  const firstUserId = createdUsers[0]?.id;

  if (firstUserId) {
    for (const community of SAMPLE_COMMUNITIES) {
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .insert({
          ...community,
          created_by: firstUserId,
        })
        .select()
        .single();

      if (communityError) {
        console.error(`Failed to create community ${community.name}:`, communityError.message);
      } else if (communityData) {
        communityIds.push(communityData.id);
        console.log(`  Created community: ${community.name}`);

        // Add some members
        const membersToAdd = createdUsers.slice(0, Math.floor(Math.random() * 5) + 3);
        for (const member of membersToAdd) {
          await supabase.from("community_members").insert({
            community_id: communityData.id,
            user_id: member.id,
            role: member.id === firstUserId ? "admin" : "member",
            status: "active",
          });
        }
      }
    }
  }

  // Create posts
  console.log("\nCreating posts...");
  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const post = SAMPLE_POSTS[i]!;
    const authorIndex = i % createdUsers.length;
    const author = createdUsers[authorIndex]!;
    const communityId = i < 3 && communityIds.length > 0 ? communityIds[i % communityIds.length] : null;

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        author_id: author.id,
        community_id: communityId,
        content: post.content,
        is_anonymous: post.is_anonymous,
        image_urls: [],
      })
      .select()
      .single();

    if (postError) {
      console.error(`Failed to create post:`, postError.message);
    } else if (postData) {
      console.log(`  Created post: "${post.content.substring(0, 40)}..."`);

      // Add some reactions
      const reactors = createdUsers.slice(0, Math.floor(Math.random() * 5) + 2);
      for (const reactor of reactors) {
        if (reactor.id !== author.id) {
          await supabase.from("post_reactions").insert({
            post_id: postData.id,
            user_id: reactor.id,
            reaction_type: Math.floor(Math.random() * 10),
          });
        }
      }
    }
  }

  // Create jobs
  console.log("\nCreating jobs...");
  for (let i = 0; i < SAMPLE_JOBS.length; i++) {
    const job = SAMPLE_JOBS[i]!;
    const posterIndex = i % createdUsers.length;
    const poster = createdUsers[posterIndex]!;

    const { error: jobError } = await supabase.from("jobs").insert({
      ...job,
      posted_by: poster.id,
    });

    if (jobError) {
      console.error(`Failed to create job ${job.title}:`, jobError.message);
    } else {
      console.log(`  Created job: ${job.title}`);
    }
  }

  // Create events
  console.log("\nCreating events...");
  for (let i = 0; i < SAMPLE_EVENTS.length; i++) {
    const event = SAMPLE_EVENTS[i]!;
    const hostIndex = i % createdUsers.length;
    const host = createdUsers[hostIndex]!;
    const communityId = i === 1 && communityIds.length > 0 ? communityIds[0] : null;

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        ...event,
        host_id: host.id,
        community_id: communityId,
      })
      .select()
      .single();

    if (eventError) {
      console.error(`Failed to create event ${event.title}:`, eventError.message);
    } else if (eventData) {
      console.log(`  Created event: ${event.title}`);

      // Add some RSVPs
      const attendees = createdUsers.slice(0, Math.floor(Math.random() * 5) + 2);
      for (const attendee of attendees) {
        await supabase.from("event_rsvps").insert({
          event_id: eventData.id,
          user_id: attendee.id,
          status: "going",
        });
      }
    }
  }

  console.log("\nSeed completed successfully! 🌈");
  console.log("\nDemo accounts created:");
  console.log("  Email format: <username>@haven-demo.local");
  console.log("  Password: demo-password-123");
  console.log("\nExample: asha_mehta@haven-demo.local / demo-password-123\n");
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
