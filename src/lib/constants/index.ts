import type { City, Profession, NavItem, CommunityTag } from "@/lib/types";

/**
 * Navigation items with their signature colors
 */
export const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/feed", icon: "Home", color: "var(--rose)", requiresAuth: true },
  { name: "Directory", href: "/directory", icon: "Users", color: "var(--violet)", requiresAuth: true },
  { name: "Communities", href: "/communities", icon: "Heart", color: "var(--teal)", requiresAuth: true },
  { name: "Jobs", href: "/jobs", icon: "Briefcase", color: "var(--amber)", requiresAuth: true },
  { name: "Events", href: "/events", icon: "Calendar", color: "var(--peach)", requiresAuth: true },
  { name: "Messages", href: "/chat", icon: "MessageCircle", color: "var(--sky)", requiresAuth: true },
  { name: "Map", href: "/map", icon: "MapPin", color: "var(--mint)", requiresAuth: true },
  { name: "Resources", href: "/resources", icon: "BookOpen", color: "var(--lavender)", requiresAuth: true },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { name: "Safety", href: "/safety", icon: "Shield", color: "var(--rose)", requiresAuth: true },
  { name: "Profile", href: "/profile", icon: "User", color: "var(--violet)", requiresAuth: true },
  { name: "Admin", href: "/admin", icon: "Settings", color: "var(--violet)", requiresAuth: true, adminOnly: true },
];

/**
 * Mobile bottom navigation (limited to 5 items)
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/feed", icon: "Home", color: "var(--rose)", requiresAuth: true },
  { name: "Directory", href: "/directory", icon: "Users", color: "var(--violet)", requiresAuth: true },
  { name: "Communities", href: "/communities", icon: "Heart", color: "var(--teal)", requiresAuth: true },
  { name: "Jobs", href: "/jobs", icon: "Briefcase", color: "var(--amber)", requiresAuth: true },
  { name: "Messages", href: "/chat", icon: "MessageCircle", color: "var(--sky)", requiresAuth: true },
];

/**
 * Approved cities in India
 */
export const CITIES: City[] = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Kochi",
  "Goa",
  "Indore",
  "Coimbatore",
  "Nagpur",
  "Vadodara",
  "Surat",
  "Thiruvananthapuram",
  "Bhopal",
  "Visakhapatnam",
  "Mysore",
  "Other",
];

/**
 * Approved professions
 */
export const PROFESSIONS: Profession[] = [
  "Software Engineer",
  "Designer",
  "Product Manager",
  "Data Scientist",
  "Doctor",
  "Lawyer",
  "Therapist",
  "Counselor",
  "Teacher",
  "Professor",
  "Writer",
  "Artist",
  "Musician",
  "Photographer",
  "Filmmaker",
  "Marketing",
  "Finance",
  "HR",
  "Entrepreneur",
  "Consultant",
  "Social Worker",
  "NGO Worker",
  "Activist",
  "Healthcare Worker",
  "Student",
  "Researcher",
  "Journalist",
  "Content Creator",
  "Other",
];

/**
 * Avatar emoji options
 */
export const AVATAR_EMOJIS = [
  "🌈", "🦋", "✨", "🌸", "🌺", "🌻", "🌼", "🌷",
  "🦩", "🦚", "🐻", "🐼", "🐨", "🦊", "🐯", "🦁",
  "🐸", "🐙", "🦄", "🐲", "🔮", "💫", "⭐", "🌙",
  "☀️", "🌊", "🍀", "🌵", "🎨", "🎭", "🎪", "🎠",
];

/**
 * Sticker reactions
 */
export const REACTIONS = [
  { emoji: "❤️", name: "Love" },
  { emoji: "🌈", name: "Pride" },
  { emoji: "🔥", name: "Fire" },
  { emoji: "✨", name: "Sparkle" },
  { emoji: "💜", name: "Purple Heart" },
  { emoji: "🦋", name: "Butterfly" },
  { emoji: "🫂", name: "Hug" },
  { emoji: "💪", name: "Strong" },
  { emoji: "🎉", name: "Celebrate" },
  { emoji: "🌸", name: "Bloom" },
];

/**
 * Event categories
 */
export const EVENT_CATEGORIES = [
  "art",
  "music",
  "tech",
  "wellness",
  "dance",
  "books",
  "fitness",
  "social",
  "support",
  "workshop",
] as const;

/**
 * Job types
 */
export const JOB_TYPES = [
  "full_time",
  "part_time",
  "freelance",
  "internship",
  "contract",
] as const;

/**
 * Report reasons
 */
export const REPORT_REASONS = [
  "harassment",
  "spam",
  "inappropriate",
  "doxxing",
  "hate_speech",
  "other",
] as const;

/**
 * Community tags
 */
export const COMMUNITY_TAGS: CommunityTag[] = [
  "Social",
  "Support",
  "Professional",
  "Art",
  "Tech",
  "Wellness",
  "Music",
  "Books",
  "Gaming",
  "Sports",
  "Travel",
  "Food",
  "Fashion",
  "Film",
  "Other",
];

/**
 * Community tag colors
 */
export const COMMUNITY_TAG_COLORS: Record<CommunityTag, string> = {
  Social: "#E91E63",     // Rose
  Support: "#8B5CF6",    // Violet
  Professional: "#14B8A6", // Teal
  Art: "#F59E0B",        // Amber
  Tech: "#3B82F6",       // Sky
  Wellness: "#10B981",   // Mint
  Music: "#EC4899",      // Pink
  Books: "#6366F1",      // Indigo
  Gaming: "#8B5CF6",     // Violet
  Sports: "#EF4444",     // Red
  Travel: "#06B6D4",     // Cyan
  Food: "#F97316",       // Orange
  Fashion: "#D946EF",    // Fuchsia
  Film: "#A855F7",       // Purple
  Other: "#6B7280",      // Gray
};

/**
 * Community avatar emojis
 */
export const COMMUNITY_EMOJIS = [
  "🌈", "💜", "🏳️‍🌈", "🏳️‍⚧️", "✨", "🦋", "🌸", "🌺",
  "💫", "🔮", "🎭", "🎨", "🎪", "📚", "💻", "🎮",
  "⚽", "✈️", "🍕", "👗", "🎬", "🎵", "🧘", "💪",
  "🤝", "💝", "🌟", "🦄", "🐻", "🌻", "🍀", "🔥",
];

/**
 * Crisis helpline numbers (India)
 */
export const CRISIS_HELPLINES = [
  {
    name: "iCall",
    number: "9152987821",
    description: "Mental health support",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    description: "24/7 mental health helpline",
  },
  {
    name: "AASRA",
    number: "9820466726",
    description: "Crisis intervention",
  },
  {
    name: "Snehi",
    number: "044-24640050",
    description: "Emotional support",
  },
];
