"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import type {
  Assignment,
  Profile,
  Submission,
} from "@/lib/types";

type SubmissionWithAssignment = Submission & {
  assignment?: Assignment;
};

export default function AssignmentsPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [profile, setProfile] =
    useState<Profile | null>(null);
  const [email, setEmail] = useState("");

  const [assignments, setAssignments] =
    useState<Assignment[]>([]);
  const [submissions, setSubmissions] =
    useState<SubmissionWithAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );

  const [uploadingId, setUploadingId] =
    useState<number | null>(null);

  const [selectedFiles, setSelectedFiles] =
    useState<Record<number, File | null>>({});

  const loadAssignments = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data: profileData, error: profileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError || !profileData) {
      router.replace("/login");
      return;
    }

    if (profileData.role === "admin") {
      router.replace("/admin");
      return;
    }

    setProfile(profileData as Profile);
    setEmail(user.email ?? "");

    const { data: assignmentData, error: assignmentError } =
      await supabase
        .from("assignments")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (assignmentError) {
      console.error(assignmentError);
      setError(
        "Couldn't load assignments right now."
      );
      return;
    }

    const { data: submissionData, error: submissionError } =
      await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (submissionError) {
      console.error(submissionError);
      setError(
        "Couldn't load your submissions right now."
      );
      return;
    }

    setAssignments(
      (assignmentData ?? []) as Assignment[]
    );

    setSubmissions(
      (submissionData ?? []) as SubmissionWithAssignment[]
    );
  }, [router, supabase]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        await loadAssignments();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [loadAssignments]);

  function getSubmission(assignmentId: number) {
    return submissions.find(
      (submission) =>
        submission.assignment_id === assignmentId
    );
  }

  function isOverdue(assignment: Assignment) {
    if (!assignment.due_date) {
      return false;
    }

    return new Date(assignment.due_date) < new Date();
  }

  async function downloadAssignment(
    assignment: Assignment
  ) {
    if (!assignment.file_path) {
      setError(
        "This assignment does not have a file attached."
      );
      return;
    }

    setError(null);

    const { data, error: downloadError } =
      await supabase.storage
        .from("assignments")
        .download(assignment.file_path);

    if (downloadError || !data) {
      console.error(downloadError);
      setError(
        "Couldn't download the assignment file."
      );
      return;
    }

    const url = URL.createObjectURL(data);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      assignment.file_path.split("/").pop() ??
      "assignment-file";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  async function submitAssignment(
    assignment: Assignment
  ) {
    const file = selectedFiles[assignment.id];

    if (!file) {
      setError(
        "Please choose a file before submitting."
      );
      return;
    }

    if (isOverdue(assignment)) {
      setError(
        "This assignment is past its deadline."
      );
      return;
    }

    setUploadingId(assignment.id);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const extension =
        file.name.includes(".")
          ? file.name.split(".").pop()
          : "";

      const safeExtension = extension
        ? `.${extension}`
        : "";

      const fileName = `${crypto.randomUUID()}${safeExtension}`;

      const filePath = `submissions/${user.id}/${assignment.id}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("assignments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error(uploadError);
        setError(
          `Couldn't upload your file: ${uploadError.message}`
        );
        return;
      }

      const existingSubmission =
        getSubmission(assignment.id);

      if (existingSubmission) {
        if (existingSubmission.file_path) {
          await supabase.storage
            .from("assignments")
            .remove([
              existingSubmission.file_path,
            ]);
        }

        const { error: updateError } =
          await supabase
            .from("submissions")
            .update({
              file_path: filePath,
              grade: null,
              feedback: null,
            })
            .eq("id", existingSubmission.id);

        if (updateError) {
          console.error(updateError);

          await supabase.storage
            .from("assignments")
            .remove([filePath]);

          setError(
            "Couldn't update your submission."
          );

          return;
        }
      } else {
        const { error: insertError } =
          await supabase
            .from("submissions")
            .insert({
              assignment_id: assignment.id,
              student_id: user.id,
              file_path: filePath,
            });

        if (insertError) {
          console.error(insertError);

          await supabase.storage
            .from("assignments")
            .remove([filePath]);

          setError(
            "Couldn't save your submission."
          );

          return;
        }
      }

      setSelectedFiles((previous) => ({
        ...previous,
        [assignment.id]: null,
      }));

      const input = document.getElementById(
        `submission-${assignment.id}`
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await loadAssignments();
    } catch (error) {
      console.error(error);
      setError(
        "Something went wrong while submitting your assignment."
      );
    } finally {
      setUploadingId(null);
    }
  }

  if (loading || !profile) {
    return (
      <Loading label="Loading assignments" />
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar
        role="student"
        name={profile.full_name ?? "Student"}
        email={email}
      />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-medium text-crimson-bright">
            Student Workspace
          </p>

          <h1 className="mt-2 font-display text-3xl font-semibold text-white">
            Assignments
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            View your assignments, download the required
            files, and submit your solutions before the
            deadline.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* EMPTY */}
        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet."
            description="Your instructor hasn't published any assignments yet."
          />
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => {
              const submission =
                getSubmission(assignment.id);

              const overdue =
                isOverdue(assignment);

              const hasGrade =
                submission?.grade !== null &&
                submission?.grade !== undefined;

              const selectedFile =
                selectedFiles[assignment.id];

              return (
                <article
                  key={assignment.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl"
                >
                  <div className="p-6 sm:p-8">
                    {/* TOP */}
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                            Assignment
                          </span>

                          {submission && (
                            <span className="rounded-full border border-emerald-700/30 bg-emerald-900/20 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                              Submitted
                            </span>
                          )}

                          {!submission &&
                            overdue && (
                              <span className="rounded-full border border-red-700/30 bg-red-900/20 px-3 py-1 text-[11px] font-semibold text-red-400">
                                Overdue
                              </span>
                            )}
                        </div>

                        <h2 className="font-display text-2xl font-semibold text-white">
                          {assignment.title}
                        </h2>

                        {assignment.description && (
                          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-neutral-400">
                            {assignment.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 lg:min-w-[190px]">
                        <p className="text-xs uppercase tracking-wider text-neutral-500">
                          Due Date
                        </p>

                        <p
                          className={`mt-2 text-sm font-semibold ${
                            overdue
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {assignment.due_date
                            ? new Date(
                                assignment.due_date
                              ).toLocaleString()
                            : "No deadline"}
                        </p>
                      </div>
                    </div>

                    {/* DOWNLOAD */}
                    <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Assignment File
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            Download the instructions or
                            required materials.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            downloadAssignment(
                              assignment
                            )
                          }
                          disabled={
                            !assignment.file_path
                          }
                          className="focus-ring rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓ Download Assignment
                        </button>
                      </div>
                    </div>

                    {/* SUBMISSION */}
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="mb-5">
                        <h3 className="font-semibold text-white">
                          Your Submission
                        </h3>

                        <p className="mt-1 text-xs text-neutral-500">
                          Upload your solution before the
                          deadline.
                        </p>
                      </div>

                      {submission && (
                        <div className="mb-5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-neutral-500">
                                Submitted
                              </p>

                              <p className="mt-1 text-sm text-white">
                                {submission.file_path
                                  ?.split("/")
                                  .pop() ??
                                  "Submitted file"}
                              </p>

                              <p className="mt-1 text-xs text-neutral-600">
                                {new Date(
                                  submission.created_at
                                ).toLocaleString()}
                              </p>
                            </div>

                            {hasGrade && (
                              <div className="rounded-xl border border-white/10 bg-black/20 px-5 py-3 text-center">
                                <p className="text-xs text-neutral-500">
                                  Grade
                                </p>

                                <p className="mt-1 text-2xl font-black text-emerald-400">
                                  {submission.grade}
                                </p>
                              </div>
                            )}
                          </div>

                          {submission.feedback && (
                            <div className="mt-4 border-t border-white/10 pt-4">
                              <p className="text-xs uppercase tracking-wider text-neutral-500">
                                Instructor Feedback
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                                {submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {overdue ? (
                        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-sm text-red-400">
                          The deadline for this assignment
                          has passed. New submissions are
                          disabled.
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor={`submission-${assignment.id}`}
                            className="mb-2 block text-sm font-medium text-neutral-300"
                          >
                            {submission
                              ? "Replace Submission"
                              : "Upload Solution"}
                          </label>

                          <input
                            id={`submission-${assignment.id}`}
                            type="file"
                            onChange={(e) =>
                              setSelectedFiles(
                                (previous) => ({
                                  ...previous,
                                  [assignment.id]:
                                    e.target.files?.[0] ??
                                    null,
                                })
                              )
                            }
                            className="block w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2 text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-neutral-950 hover:file:bg-neutral-200"
                          />

                          {selectedFile && (
                            <p className="mt-2 text-xs text-emerald-400">
                              Selected:{" "}
                              {selectedFile.name}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              submitAssignment(
                                assignment
                              )
                            }
                            disabled={
                              uploadingId ===
                                assignment.id ||
                              !selectedFile
                            }
                            className="focus-ring mt-4 rounded-xl bg-crimson px-6 py-3 text-sm font-semibold text-white transition hover:bg-crimson-bright disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {uploadingId ===
                            assignment.id
                              ? "Uploading..."
                              : submission
                              ? "Replace Submission"
                              : "Submit Assignment"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* BACK */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-sm text-neutral-500 transition hover:text-white"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
