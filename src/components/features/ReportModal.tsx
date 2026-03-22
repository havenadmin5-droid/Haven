"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Flag, Check } from "lucide-react";
import { createReport } from "@/app/(main)/report/actions";
import { REPORT_REASONS } from "@/lib/types";
import type { ReportReason, ReportableContentType } from "@/lib/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  reportedContentId?: string;
  reportedContentType?: ReportableContentType;
  contentPreview?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedContentId,
  reportedContentType,
  contentPreview,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    setError(null);

    const result = await createReport({
      reportedUserId,
      reportedContentId,
      reportedContentType,
      reason: selectedReason,
      details: details.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset state after close
        setTimeout(() => {
          setSubmitted(false);
          setSelectedReason(null);
          setDetails("");
        }, 300);
      }, 2000);
    } else {
      setError(result.error || "Failed to submit report");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setTimeout(() => {
        setSubmitted(false);
        setSelectedReason(null);
        setDetails("");
        setError(null);
      }, 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[var(--bg-primary)] rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Flag className="text-[var(--rose)]" size={20} />
                <h2 className="text-lg font-bold">Report</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--teal)]/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="text-[var(--teal)]" size={32} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Report Submitted</h3>
                  <p className="text-[var(--text-muted)]">
                    Thank you for helping keep Haven safe. Our team will review this report.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Content Preview */}
                  {contentPreview && (
                    <div className="mb-4 p-3 bg-[var(--bg-secondary)] rounded-xl">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Reporting:</p>
                      <p className="text-sm line-clamp-2">{contentPreview}</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-[var(--rose)]/10 border border-[var(--rose)]/20 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="text-[var(--rose)] flex-shrink-0" size={18} />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {/* Reason Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Why are you reporting this?
                    </label>
                    <div className="space-y-2">
                      {REPORT_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          onClick={() => setSelectedReason(reason.value)}
                          className={`w-full p-3 rounded-xl text-left transition-colors ${
                            selectedReason === reason.value
                              ? "bg-[var(--rose)]/10 border-2 border-[var(--rose)]"
                              : "bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          <div className="font-medium">{reason.label}</div>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {reason.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Additional details (optional)
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Provide any additional context that might help our review..."
                      className="w-full resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                      {details.length}/500
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!submitted && (
              <div className="p-4 border-t border-[var(--border-color)] flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                  className="btn bg-[var(--rose)] text-white hover:bg-[var(--rose)]/90 flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
