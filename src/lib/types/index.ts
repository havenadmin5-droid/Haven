/**
 * Central type exports for Haven
 */

export * from "./database";

// UI-specific types
export type BloomMood = "happy" | "wink" | "love";

export type NavItem = {
  name: string;
  href: string;
  icon: string;
  color: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
};

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  city: string;
  profession: string;
  avatar_emoji: string;
}

// API response types
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
