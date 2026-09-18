"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { SubmissionWithDetails } from "@/lib/types";

interface SubmissionReviewProps {
  submission: SubmissionWithDetails | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    submissionId: number,
    grade: number,
    feedback: string | null
  ) => Promise<void> | void;
}

export default function SubmissionReview({
  submission,
  open,
  onClose,
  onSave,
}: SubmissionReviewProps) {
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!submission) {
      return;
    }

    setGradeInput(submission.grade === null ? "" : String(submission.grade));
    setFeedbackInput(submission.feedback ?? "");
    setError(null);
    setFileError(null);
    setFileUrl(null);

    if (!submission.file_path) {
      return;
    }

    let active = true;

    async function loadSignedUrl() {
      if (!submission?.file_path) {
        setFileError("No submission file is available.");
        setFileLoading(false);
        return;
      }

      try {
        setFileLoading(true);

        const supabase = supabaseBrowser();
        const { data, error } = await supabase.storage
          .from("assignments")
          .createSignedUrl(submission.file_path, 60);

        if (error || !data?.signedUrl) {
          throw new Error(
            error?.message ?? "Unable to load the submission file."
          );
        }

        if (active) {
          setFileUrl(data.signedUrl);
        }
      } catch (err) {
        if (active) {
          setFileError(
            err instanceof Error
              ? err.message
              : "Unable to load the submission file."
          );
        }
      } finally {
        if (active) {
          setFileLoading(false);
        }
      }
    }

    void loadSignedUrl();

    return () => {
      active = false;
    };
  }, [submission]);

  async function handleSave() {
    if (!submission) {
      return;
    }

    setError(null);

    const trimmedGrade = gradeInput.trim();
    if (trimmedGrade !== "") {
      const numericGrade = Number(trimmedGrade);
      if (Number.isNaN(numericGrade) || numericGrade < 0) {
        setError("Grade must be a non-negative number.");
        return;
      }
    }

    setSaving(true);

    try {
      const gradeValue = trimmedGrade === "" ? null : Number(trimmedGrade);
      await onSave(submission.id, gradeValue ?? 0, feedbackInput.trim() || null);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the grade."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open || !submission) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Submission review
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">
              {submission.student?.full_name ?? "Student"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-600 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Assignment
            </p>
            <p className="mt-2 text-base font-medium text-white">
              {submission.assignment?.title ?? "Unknown assignment"}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Submitted
            </p>
            <p className="mt-2 text-base font-medium text-white">
              {new Date(submission.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Grade
            </label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
              placeholder="e.g. 92"
            />
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Current grade
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {submission.grade === null ? "—" : submission.grade}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-neutral-300">
            Feedback
          </label>
          <textarea
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
            placeholder="Provide detailed feedback for the student..."
          />
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Submitted file
          </p>

          {!submission.file_path ? (
            <p className="mt-3 text-sm text-neutral-400">No file attached</p>
          ) : fileLoading ? (
            <p className="mt-3 text-sm text-neutral-400">Loading file…</p>
          ) : fileError ? (
            <p className="mt-3 text-sm text-red-400">{fileError}</p>
          ) : fileUrl ? (
            <button
              type="button"
              onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
              className="mt-3 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
            >
              Open Submission
            </button>
          ) : (
            <p className="mt-3 text-sm text-neutral-400">No file attached</p>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-800 px-5 py-3 text-sm font-medium text-neutral-300 hover:border-neutral-600 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-crimson px-5 py-3 text-sm font-semibold text-white hover:bg-crimson-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Grade"}
          </button>
        </div>
      </div>
    </div>
  );
}
