"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import type {
  Profile,
  QuizAttemptWithQuiz,
  SubmissionWithDetails,
} from "@/lib/types";

export default function GradesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [attempts, setAttempts] = useState<QuizAttemptWithQuiz[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (profileError || !profileData) {
        router.replace("/login");
        return;
      }

      if (profileData.role === "admin") {
        router.replace("/admin");
        return;
      }

      const [attemptsRes, submissionsRes] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("*, quiz:quizzes(id, title)")
          .eq("student_id", userData.user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("submissions")
          .select(
            `*, assignment:assignments(id, title)`
          )
          .eq("student_id", userData.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (attemptsRes.error || submissionsRes.error) {
        setError("Couldn't load your grades right now.");
      } else {
        setAttempts((attemptsRes.data ?? []) as QuizAttemptWithQuiz[]);
        setSubmissions((submissionsRes.data ?? []) as SubmissionWithDetails[]);
      }

      setProfile(profileData as Profile);
      setEmail(userData.user.email ?? "");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !profile) {
    return <Loading label="Loading grades" />;
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar role="student" name={profile.full_name ?? "Student"} email={email} />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-white">
            Grades
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every quiz attempt you&apos;ve recorded.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 font-display text-lg font-semibold text-white">
              Quiz Results
            </h2>

            {attempts.length === 0 && !error ? (
              <EmptyState
                title="No quiz attempts yet."
                description="Take a published quiz to see your results here."
              />
            ) : (
              <div className="panel overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                        <th className="px-5 py-3.5 font-medium">Quiz</th>
                        <th className="px-5 py-3.5 font-medium">Score</th>
                        <th className="px-5 py-3.5 font-medium">Total</th>
                        <th className="px-5 py-3.5 font-medium">Percentage</th>
                        <th className="px-5 py-3.5 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((a) => (
                        <tr key={a.id} className="border-b border-neutral-900 last:border-0">
                          <td className="px-5 py-4 text-white">
                            {a.quiz?.title ?? `Quiz #${a.quiz_id}`}
                          </td>
                          <td className="px-5 py-4 text-neutral-300">{a.score}</td>
                          <td className="px-5 py-4 text-neutral-300">{a.total_points}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-full border border-crimson/30 bg-crimson/10 px-2.5 py-1 text-xs text-crimson-bright">
                              {a.percentage}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-neutral-500">
                            {new Date(a.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-lg font-semibold text-white">
              Assignment Grades
            </h2>

            {submissions.length === 0 && !error ? (
              <EmptyState
                title="No assignment submissions yet."
                description="Upload a solution to an assignment to see its grade here."
              />
            ) : (
              <div className="panel overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                        <th className="px-5 py-3.5 font-medium">Assignment</th>
                        <th className="px-5 py-3.5 font-medium">Status</th>
                        <th className="px-5 py-3.5 font-medium">Grade</th>
                        <th className="px-5 py-3.5 font-medium">Feedback</th>
                        <th className="px-5 py-3.5 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="border-b border-neutral-900 last:border-0 align-top">
                          <td className="px-5 py-4 text-white">
                            {submission.assignment?.title ?? `Assignment #${submission.assignment_id}`}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                submission.grade === null
                                  ? "border border-amber-700/40 bg-amber-900/20 text-amber-300"
                                  : "border border-emerald-700/40 bg-emerald-900/20 text-emerald-300"
                              }`}
                            >
                              {submission.grade === null ? "Pending" : "Graded"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-neutral-300">
                            {submission.grade ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-neutral-400">
                            {submission.feedback ? (
                              <span className="whitespace-pre-wrap">{submission.feedback}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-4 text-neutral-500">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
