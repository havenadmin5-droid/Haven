"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { CITIES, PROFESSIONS, AVATAR_EMOJIS } from "@/lib/constants";
import { register as registerAction } from "../actions";
import { Bloom } from "@/components/mascot";

type Step = "credentials" | "profile" | "privacy";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      avatarEmoji: "🌈",
    },
  });

  const selectedAvatar = watch("avatarEmoji") ?? "🌈";

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      if (!data) {
        setServerError("Form data is missing. Please try again.");
        return;
      }

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        // Only append non-null, non-undefined values
        if (value != null) {
          formData.append(key, String(value));
        }
      });

      const result = await registerAction(formData);

      if (!result) {
        setServerError("No response from server. Please try again.");
        return;
      }

      if (!result.success) {
        setServerError(result.error ?? "An error occurred");
      } else {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  // Step navigation
  const nextStep = () => {
    if (step === "credentials") setStep("profile");
    else if (step === "profile") setStep("privacy");
  };

  const prevStep = () => {
    if (step === "profile") setStep("credentials");
    else if (step === "privacy") setStep("profile");
  };

  if (showSuccess) {
    return (
      <div className="text-center">
        <Bloom mood="love" size="xl" className="mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Welcome to Haven!</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          We&apos;ve sent a verification email to your inbox.
          Please click the link to verify your account.
        </p>
        <Link href="/login" className="btn btn-brand">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {["credentials", "profile", "privacy"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s
                  ? "bg-[var(--violet)] text-white"
                  : ["profile", "privacy"].indexOf(step) > ["credentials", "profile", "privacy"].indexOf(s)
                    ? "bg-[var(--teal)] text-white"
                    : "bg-[var(--bg-input)] text-[var(--text-muted)]"
              }`}
            >
              {["profile", "privacy"].indexOf(step) > ["credentials", "profile", "privacy"].indexOf(s) ? (
                <Check size={16} />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div className="w-12 h-0.5 bg-[var(--border-color)] mx-2" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Server error */}
        {serverError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {serverError}
          </div>
        )}

        {/* Step 1: Credentials */}
        {step === "credentials" && (
          <>
            <h2 className="text-2xl font-bold mb-2">Create your account</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Enter your email and create a secure password.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors?.email?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full pr-12"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors?.password?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="w-full"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
              />
              {errors?.confirmPassword?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="button" onClick={nextStep} className="btn btn-brand w-full">
              Continue
            </button>
          </>
        )}

        {/* Step 2: Profile */}
        {step === "profile" && (
          <>
            <h2 className="text-2xl font-bold mb-2">Set up your profile</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Choose how you want to appear in the community.
            </p>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full"
                placeholder="your_username"
                {...register("username")}
              />
              {errors?.username?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Avatar</label>
              <div className="grid grid-cols-8 gap-2">
                {(AVATAR_EMOJIS ?? []).map((emoji) => (
                  <button
                    key={emoji ?? "default"}
                    type="button"
                    onClick={() => emoji && setValue("avatarEmoji", emoji)}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                      selectedAvatar === emoji
                        ? "bg-[var(--violet)] ring-2 ring-[var(--violet)] ring-offset-2"
                        : "bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {emoji ?? "🌈"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-2">
                City
              </label>
              <select id="city" className="w-full" {...register("city")}>
                <option value="">Select your city</option>
                {(CITIES ?? []).map((city) => (
                  <option key={city ?? "unknown"} value={city ?? ""}>
                    {city ?? "Unknown"}
                  </option>
                ))}
              </select>
              {errors?.city?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium mb-2">
                Profession
              </label>
              <select id="profession" className="w-full" {...register("profession")}>
                <option value="">Select your profession</option>
                {(PROFESSIONS ?? []).map((profession) => (
                  <option key={profession ?? "unknown"} value={profession ?? ""}>
                    {profession ?? "Unknown"}
                  </option>
                ))}
              </select>
              {errors?.profession?.message && (
                <p className="mt-1 text-sm text-red-500">{errors.profession.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={prevStep} className="btn btn-ghost flex-1">
                Back
              </button>
              <button type="button" onClick={nextStep} className="btn btn-brand flex-1">
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3: Privacy Checkpoint */}
        {step === "privacy" && (
          <>
            <h2 className="text-2xl font-bold mb-2">Your privacy matters</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Haven is built with your safety in mind. Here&apos;s what you should know:
            </p>

            <div className="space-y-4 mb-8">
              <PrivacyItem
                icon="🔒"
                title="Your real name is private"
                description="Only your username is visible by default. You choose if and when to share your real name."
              />
              <PrivacyItem
                icon="🌐"
                title="Anonymous mode available"
                description="After building trust, you can enable anonymous mode to participate without revealing your identity."
              />
              <PrivacyItem
                icon="📧"
                title="Email protected"
                description="Your email is only visible to verified community members, never to the public."
              />
              <PrivacyItem
                icon="🛡️"
                title="You're in control"
                description="Manage all your privacy settings anytime in the Safety Center."
              />
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] mb-6">
              <p className="text-sm text-[var(--text-secondary)]">
                By creating an account, you agree to our community guidelines
                and privacy policy. We take your safety seriously.
              </p>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={prevStep} className="btn btn-ghost flex-1">
                Back
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-brand flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Login link */}
      <p className="mt-8 text-center text-[var(--text-secondary)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--violet)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function PrivacyItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
