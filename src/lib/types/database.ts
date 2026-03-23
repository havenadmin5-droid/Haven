/**
 * Database types for Haven
 * Run `npm run db:types` after migrations to regenerate from Supabase
 */

export type UserRole = "member" | "city_mod" | "community_mod" | "admin" | "super_admin";
export type ThemePreference = "light" | "dark" | "system";

export type City =
  | "Mumbai"
  | "Delhi"
  | "Bangalore"
  | "Hyderabad"
  | "Chennai"
  | "Kolkata"
  | "Pune"
  | "Ahmedabad"
  | "Jaipur"
  | "Lucknow"
  | "Chandigarh"
  | "Kochi"
  | "Goa"
  | "Indore"
  | "Coimbatore"
  | "Nagpur"
  | "Vadodara"
  | "Surat"
  | "Thiruvananthapuram"
  | "Bhopal"
  | "Visakhapatnam"
  | "Mysore"
  | "Other";

export type Profession =
  | "Software Engineer"
  | "Designer"
  | "Product Manager"
  | "Data Scientist"
  | "Doctor"
  | "Lawyer"
  | "Therapist"
  | "Counselor"
  | "Teacher"
  | "Professor"
  | "Writer"
  | "Artist"
  | "Musician"
  | "Photographer"
  | "Filmmaker"
  | "Marketing"
  | "Finance"
  | "HR"
  | "Entrepreneur"
  | "Consultant"
  | "Social Worker"
  | "NGO Worker"
  | "Activist"
  | "Healthcare Worker"
  | "Student"
  | "Researcher"
  | "Journalist"
  | "Content Creator"
  | "Other";

export interface Profile {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url: string | null;
  show_photo: boolean;
  real_name: string | null;
  show_real_name: boolean;
  email: string;
  pronouns: string | null;
  city: City;
  profession: Profession;
  bio: string | null;
  skills: string[];
  interests: string[];
  is_verified: boolean;
  is_available: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  is_anonymous: boolean;
  anonymous_alias: string | null;
  anon_unlocked: boolean;
  anon_suspended: boolean;
  trust_score: number;
  role: UserRole;
  theme_pref: ThemePreference;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Public profile view (with privacy masking applied)
export interface PublicProfile {
  id: string;
  display_name: string;
  display_avatar: string | null;
  avatar_emoji: string;
  display_real_name: string | null;
  display_city: City | null;
  profession: Profession;
  bio: string | null;
  skills: string[];
  interests: string[];
  is_verified: boolean;
  is_available: boolean;
  pronouns: string | null;
  created_at: string;
}

// Community types
export type CommunityTag =
  | "Social"
  | "Support"
  | "Professional"
  | "Art"
  | "Tech"
  | "Wellness"
  | "Music"
  | "Books"
  | "Gaming"
  | "Sports"
  | "Travel"
  | "Food"
  | "Fashion"
  | "Film"
  | "Other";

export type CommunityMemberRole = "member" | "moderator" | "admin";
export type CommunityMemberStatus = "active" | "pending" | "banned";

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tag: CommunityTag;
  avatar_emoji: string;
  color: string;
  is_private: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joined_at: string;
}

export interface CommunityWithMembership extends Community {
  is_member: boolean;
  member_role?: CommunityMemberRole;
}

// Post types
export interface Post {
  id: string;
  author_id: string;
  community_id: string | null;
  content: string;
  image_urls: string[];
  is_anonymous: boolean;
  is_flagged: boolean;
  is_hidden: boolean;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
    is_anonymous: boolean;
    anonymous_alias: string | null;
    is_verified: boolean;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar_emoji: string;
  } | null;
  user_reactions?: number[];
}

// Reaction types (10 stickers)
export const REACTIONS = [
  { index: 0, emoji: "❤️", label: "Love" },
  { index: 1, emoji: "🌈", label: "Pride" },
  { index: 2, emoji: "🔥", label: "Fire" },
  { index: 3, emoji: "✨", label: "Sparkle" },
  { index: 4, emoji: "💜", label: "Purple Heart" },
  { index: 5, emoji: "🦋", label: "Butterfly" },
  { index: 6, emoji: "🫂", label: "Hug" },
  { index: 7, emoji: "💪", label: "Strong" },
  { index: 8, emoji: "🎉", label: "Celebrate" },
  { index: 9, emoji: "🌸", label: "Blossom" },
] as const;

export interface PostReaction {
  post_id: string;
  user_id: string;
  reaction_type: number;
  created_at: string;
}

// Comment types
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_anonymous: boolean;
  is_hidden: boolean;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
    is_anonymous: boolean;
    anonymous_alias: string | null;
    is_verified: boolean;
  };
  replies?: CommentWithAuthor[];
}

// Job types
export type JobType = "full_time" | "part_time" | "freelance" | "internship" | "contract";

export interface Job {
  id: string;
  posted_by: string;
  title: string;
  company: string;
  description: string;
  city: City;
  job_type: JobType;
  is_remote: boolean;
  salary_range: string | null;
  tags: string[];
  apply_url: string | null;
  apply_email: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface JobWithPoster extends Job {
  poster: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
    is_anonymous: boolean;
    is_verified: boolean;
  };
  is_saved?: boolean;
}

export interface JobSave {
  user_id: string;
  job_id: string;
  saved_at: string;
}

// Event types
export type EventCategory =
  | "art"
  | "music"
  | "tech"
  | "wellness"
  | "dance"
  | "books"
  | "fitness"
  | "social"
  | "support"
  | "workshop";

export type RSVPStatus = "going" | "maybe" | "waitlisted";

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string;
  city: City;
  venue_name: string | null;
  venue_address: string | null;
  event_date: string;
  event_time: string;
  end_time: string | null;
  category: EventCategory;
  is_private: boolean;
  capacity: number | null;
  attendee_count: number;
  cover_url: string | null;
  emoji: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  community_id: string | null;
  created_at: string;
}

export interface EventWithHost extends Event {
  host: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
    is_anonymous: boolean;
    is_verified: boolean;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  user_rsvp?: RSVPStatus | null;
}

export interface EventRSVP {
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  created_at: string;
}

// Constants for job types and event categories
export const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

export const EVENT_CATEGORIES: { value: EventCategory; label: string; emoji: string }[] = [
  { value: "art", label: "Art", emoji: "🎨" },
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "tech", label: "Tech", emoji: "💻" },
  { value: "wellness", label: "Wellness", emoji: "🧘" },
  { value: "dance", label: "Dance", emoji: "💃" },
  { value: "books", label: "Books", emoji: "📚" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "social", label: "Social", emoji: "🎉" },
  { value: "support", label: "Support", emoji: "💜" },
  { value: "workshop", label: "Workshop", emoji: "🔧" },
];

// Chat types
export type ConversationType = "dm" | "group";
export type ConversationRole = "member" | "admin";
export type DMRequestStatus = "pending" | "accepted" | "declined";

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  community_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: ConversationRole;
  is_muted: boolean;
  last_read_at: string | null;
  joined_at: string;
  dm_status: DMRequestStatus;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  is_system: boolean;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
    is_anonymous: boolean;
    anonymous_alias: string | null;
  };
}

export interface ConversationWithDetails extends Conversation {
  members: {
    user_id: string;
    role: ConversationRole;
    dm_status: DMRequestStatus;
    profile: {
      id: string;
      username: string;
      avatar_emoji: string;
      avatar_url: string | null;
      show_photo: boolean;
      is_anonymous: boolean;
      anonymous_alias: string | null;
    };
  }[];
  last_message?: {
    content: string | null;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
  // For DMs - the other participant
  other_user?: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
    is_anonymous: boolean;
    anonymous_alias: string | null;
  };
  // For group chats linked to communities
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar_emoji: string;
  };
}

// Report types
export type ReportReason =
  | "harassment"
  | "spam"
  | "inappropriate"
  | "doxxing"
  | "hate_speech"
  | "other";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type ReportableContentType = "post" | "comment" | "message" | "profile" | "event";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_content_id: string | null;
  reported_content_type: ReportableContentType | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ReportWithDetails extends Report {
  reporter: {
    id: string;
    username: string;
    avatar_emoji: string;
  };
  reported_user?: {
    id: string;
    username: string;
    avatar_emoji: string;
    is_anonymous: boolean;
    anonymous_alias: string | null;
  } | null;
  resolver?: {
    id: string;
    username: string;
  } | null;
}

// Block types
export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface BlockWithUser extends Block {
  blocked_user: {
    id: string;
    username: string;
    avatar_emoji: string;
    avatar_url: string | null;
    show_photo: boolean;
  };
}

// Audit log types
export type AdminAction =
  | "ban_user"
  | "unban_user"
  | "verify_user"
  | "unverify_user"
  | "resolve_report"
  | "dismiss_report"
  | "delete_content"
  | "restore_content"
  | "feature_event"
  | "unfeature_event"
  | "suspend_anonymous"
  | "restore_anonymous"
  | "delete_community"
  | "warn_user";

export type AuditTargetType =
  | "user"
  | "post"
  | "comment"
  | "event"
  | "community"
  | "report"
  | "message"
  | "job";

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: AdminAction;
  target_type: AuditTargetType;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogWithActor extends AuditLogEntry {
  actor: {
    id: string;
    username: string;
    avatar_emoji: string;
  };
}

// Report reasons for UI
export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "harassment", label: "Harassment", description: "Bullying, threats, or targeted abuse" },
  { value: "spam", label: "Spam", description: "Unsolicited advertising or repetitive content" },
  { value: "inappropriate", label: "Inappropriate Content", description: "Content that violates community guidelines" },
  { value: "doxxing", label: "Doxxing", description: "Sharing private information without consent" },
  { value: "hate_speech", label: "Hate Speech", description: "Discrimination or hate based on identity" },
  { value: "other", label: "Other", description: "Something else not listed above" },
];

// Anonymous eligibility result
export interface AnonymousEligibility {
  eligible: boolean;
  reason: string | null;
}

// Database schema types for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at" | "search_vector">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at" | "search_vector">>;
      };
      communities: {
        Row: Community;
        Insert: Omit<Community, "id" | "created_at" | "member_count">;
        Update: Partial<Omit<Community, "id" | "created_at" | "created_by">>;
      };
      community_members: {
        Row: CommunityMember;
        Insert: Omit<CommunityMember, "joined_at">;
        Update: Partial<Omit<CommunityMember, "community_id" | "user_id" | "joined_at">>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at" | "reaction_count" | "comment_count" | "is_flagged" | "is_hidden">;
        Update: Partial<Omit<Post, "id" | "created_at" | "author_id" | "reaction_count" | "comment_count">>;
      };
      post_reactions: {
        Row: PostReaction;
        Insert: Omit<PostReaction, "created_at">;
        Update: never;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "created_at" | "is_hidden">;
        Update: Partial<Omit<Comment, "id" | "created_at" | "author_id" | "post_id">>;
      };
    };
    Views: {
      public_profiles: {
        Row: PublicProfile;
      };
    };
    Functions: {
      is_blocked: {
        Args: { user_a: string; user_b: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      theme_preference: ThemePreference;
      city_enum: City;
      profession_enum: Profession;
      community_tag: CommunityTag;
    };
  };
}
