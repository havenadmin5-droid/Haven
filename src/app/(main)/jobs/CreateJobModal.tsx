"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Briefcase, Link, Mail } from "lucide-react";
import { createJob } from "./actions";
import { CITIES } from "@/lib/constants";
import { JOB_TYPES } from "@/lib/types/database";
import type { JobWithPoster, City, JobType } from "@/lib/types";

interface CreateJobModalProps {
  onClose: () => void;
  onJobCreated: (job: JobWithPoster) => void;
}

export function CreateJobModal({ onClose, onJobCreated }: CreateJobModalProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState<City | "">("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [isRemote, setIsRemote] = useState(false);
  const [salaryRange, setSalaryRange] = useState("");
  const [tags, setTags] = useState("");
  const [applyMethod, setApplyMethod] = useState<"url" | "email" | "dm">("url");
  const [applyUrl, setApplyUrl] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    title.trim() &&
    company.trim() &&
    description.trim() &&
    city &&
    jobType &&
    (applyMethod === "dm" || applyMethod === "url" ? applyUrl.trim() || applyMethod === "dm" : applyEmail.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("company", company.trim());
      formData.append("description", description.trim());
      formData.append("city", city);
      formData.append("job_type", jobType);
      formData.append("is_remote", String(isRemote));
      if (salaryRange.trim()) {
        formData.append("salary_range", salaryRange.trim());
      }
      if (tags.trim()) {
        formData.append("tags", tags.trim());
      }
      if (applyMethod === "url" && applyUrl.trim()) {
        formData.append("apply_url", applyUrl.trim());
      }
      if (applyMethod === "email" && applyEmail.trim()) {
        formData.append("apply_email", applyEmail.trim());
      }

      const result = await createJob(formData);

      if (!result.success) {
        setError(result.error ?? "Failed to create job");
      } else if (result.job) {
        onJobCreated(result.job);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] rounded-2xl shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="text-[var(--rose)]" size={24} />
              Post a Job
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                maxLength={120}
                className="w-full"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {title.length}/120
              </p>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Haven Technologies"
                maxLength={100}
                className="w-full"
              />
            </div>

            {/* City and Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as City)}
                  className="w-full"
                >
                  <option value="">Select city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="w-full"
                >
                  <option value="">Select type</option>
                  {JOB_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Remote toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_remote"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-color)]"
              />
              <label htmlFor="is_remote" className="text-sm">
                This position allows remote work
              </label>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Salary Range (optional)
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g., 8-15 LPA or $80k-$120k"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={5}
                maxLength={3000}
                className="w-full resize-none"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {description.length}/3000
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Skills/Tags (optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., React, Node.js, TypeScript (comma separated, max 5)"
                className="w-full"
              />
            </div>

            {/* Apply method */}
            <div>
              <label className="block text-sm font-medium mb-2">
                How should candidates apply? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setApplyMethod("url")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    applyMethod === "url"
                      ? "bg-[var(--violet)]/10 text-[var(--violet)] border border-[var(--violet)]"
                      : "border border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <Link size={16} />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setApplyMethod("email")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    applyMethod === "email"
                      ? "bg-[var(--violet)]/10 text-[var(--violet)] border border-[var(--violet)]"
                      : "border border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <Mail size={16} />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setApplyMethod("dm")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                    applyMethod === "dm"
                      ? "bg-[var(--violet)]/10 text-[var(--violet)] border border-[var(--violet)]"
                      : "border border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  DM
                </button>
              </div>

              {applyMethod === "url" && (
                <input
                  type="url"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  placeholder="https://yourcompany.com/careers/apply"
                  className="w-full"
                />
              )}

              {applyMethod === "email" && (
                <input
                  type="email"
                  value={applyEmail}
                  onChange={(e) => setApplyEmail(e.target.value)}
                  placeholder="jobs@yourcompany.com"
                  className="w-full"
                />
              )}

              {applyMethod === "dm" && (
                <p className="text-sm text-[var(--text-muted)]">
                  Candidates will be able to message you directly on Haven.
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 btn btn-brand"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Posting...
                  </>
                ) : (
                  <>
                    <Briefcase size={18} />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
