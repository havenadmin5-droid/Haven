import { z } from "zod";
import { CITIES, PROFESSIONS } from "@/lib/constants";

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 * Password requirements: 8+ chars, 1 uppercase, 1 number
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  city: z.enum(CITIES as [string, ...string[]], {
    required_error: "Please select your city",
  }),
  profession: z.enum(PROFESSIONS as [string, ...string[]], {
    required_error: "Please select your profession",
  }),
  avatarEmoji: z.string().min(1, "Please select an avatar"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or less")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  avatar_emoji: z.string().optional(),
  real_name: z
    .string()
    .max(100, "Name must be 100 characters or less")
    .optional(),
  show_real_name: z.boolean().optional(),
  bio: z
    .string()
    .max(280, "Bio must be 280 characters or less")
    .optional(),
  city: z.enum(CITIES as [string, ...string[]]).optional(),
  profession: z.enum(PROFESSIONS as [string, ...string[]]).optional(),
  pronouns: z
    .string()
    .max(50, "Pronouns must be 50 characters or less")
    .optional(),
  skills: z
    .array(z.string())
    .max(10, "You can add up to 10 skills")
    .optional(),
  interests: z
    .array(z.string())
    .max(15, "You can add up to 15 interests")
    .optional(),
  show_photo: z.boolean().optional(),
  is_available: z.boolean().optional(),
  theme_pref: z.enum(["light", "dark", "system"]).optional(),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
