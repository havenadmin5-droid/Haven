"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { login } from "../actions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("email", data?.email ?? "");
      formData.append("password", data?.password ?? "");

      const result = await login(formData);

      if (result && !result.success) {
        setServerError(result.error ?? "An error occurred");
      }
      // If successful, the server action redirects
    } catch (error) {
      console.error("Login error:", error);
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Sign in to Haven</h2>
      <p className="text-[var(--text-secondary)] mb-8">
        Welcome back! Enter your credentials to continue.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Server error */}
        {serverError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {serverError}
          </div>
        )}

        {/* Email */}
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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full pr-12"
              placeholder="Enter your password"
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

        {/* Forgot password link */}
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--violet)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-brand w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-8 text-center text-[var(--text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--violet)] hover:underline font-medium">
          Join Haven
        </Link>
      </p>
    </div>
  );
}
