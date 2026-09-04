"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import QuizForm from "@/components/QuizForm";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import type { Profile, Quiz } from "@/lib/types";

interface AdminStats {
  totalStudents: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalAttempts: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalQuizzes: 0,
    publishedQuizzes: 0,
    totalAttempts: 0,
  });
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyQuizId, setBusyQuizId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadAdminData = useCallback(async () => {
    const supabase = supabaseBrowser();

    const [quizzesRes, studentsRes, attemptsRes] = await Promise.all([
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false }),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
    ]);

    if (quizzesRes.error || studentsRes.error) {
      setError("Couldn't load admin data right now.");
      return;
    }

    const quizList = (quizzesRes.data ?? []) as Quiz[];
    const studentList = (studentsRes.data ?? []) as Profile[];

    setQuizzes(quizList);
    setStudents(studentList);
    setStats({
      totalStudents: studentList.length,
      totalQuizzes: quizList.length,
      publishedQuizzes: quizList.filter((q) => q.published).length,
      totalAttempts: attemptsRes.count ?? 0,
    });
  }, []);

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

      if (profileData.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      await loadAdminData();
      if (!active) return;

      setProfile(profileData as Profile);
      setEmail(userData.user.email ?? "");
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router, loadAdminData]);

  async function togglePublish(quiz: Quiz) {
    setBusyQuizId(quiz.id);
    const supabase = supabaseBrowser();
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({ published: !quiz.published })
      .eq("id", quiz.id);

    if (updateError) {
      setError(`Couldn't update "${quiz.title}". Please try again.`);
    } else {
      await loadAdminData();
    }
    setBusyQuizId(null);
  }

  async function deleteQuiz(quiz: Quiz) {
    if (!confirm(`Delete "${quiz.title}"? This also removes its questions and attempts.`)) {
      return;
    }
    setBusyQuizId(quiz.id);
    const supabase = supabaseBrowser();
    const { error: deleteError } = await supabase.from("quizzes").delete().eq("id", quiz.id);

    if (deleteError) {
      setError(`Couldn't delete "${quiz.title}". Please try again.`);
    } else {
      await loadAdminData();
    }
    setBusyQuizId(null);
  }

  function exportStudents() {
    setExporting(true);
    try {
      const rows = students.map((s, i) => ({
        "#": i + 1,
        Name: s.full_name ?? "—",
        Email: s.email ?? "—",
        Role: s.role,
        "Created At": new Date(s.created_at).toLocaleString(),
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(workbook, "TurboX-Students.xlsx");
    } finally {
      setExporting(false);
    }
  }

  if (loading || !profile) {
    return <Loading label="Loading admin dashboard" />;
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar role="admin" name={profile.full_name ?? "Admin"} email={email} />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">
              Admin overview
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage quizzes, publishing, and your student roster.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/quizzes"
              className="focus-ring rounded-lg border border-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:border-crimson/50 hover:text-white"
            >
              Student View
            </Link>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="focus-ring rounded-lg bg-crimson px-4 py-2.5 text-sm font-medium text-white hover:bg-crimson-bright"
            >
              {showForm ? "Close form" : "+ Create Quiz"}
            </button>
            <button
              onClick={exportStudents}
              disabled={exporting || students.length === 0}
              className="focus-ring rounded-lg border border-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:border-crimson/50 hover:text-white disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export Students Excel"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Students" value={stats.totalStudents} />
          <StatCard label="Total Quizzes" value={stats.totalQuizzes} />
          <StatCard label="Published Quizzes" value={stats.publishedQuizzes} />
          <StatCard label="Total Attempts" value={stats.totalAttempts} />
        </div>

        {showForm && (
          <div className="mt-8">
            <QuizForm
              onCreated={() => {
                setShowForm(false);
                loadAdminData();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">
            Quizzes
          </h2>
          {quizzes.length === 0 ? (
            <EmptyState
              title="No quizzes yet."
              description="Create your first quiz to get started."
            />
          ) : (
            <div className="panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3.5 font-medium">Title</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Created</th>
                      <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="border-b border-neutral-900 last:border-0">
                        <td className="px-5 py-4 text-white">{quiz.title}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${
                              quiz.published
                                ? "border border-emerald-700/40 bg-emerald-900/20 text-emerald-400"
                                : "border border-neutral-700 bg-neutral-900 text-neutral-400"
                            }`}
                          >
                            {quiz.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-neutral-500">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => togglePublish(quiz)}
                              disabled={busyQuizId === quiz.id}
                              className="focus-ring rounded-md border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 hover:border-crimson/50 hover:text-white disabled:opacity-50"
                            >
                              {quiz.published ? "Unpublish" : "Publish"}
                            </button>
                            <button
                              onClick={() => deleteQuiz(quiz)}
                              disabled={busyQuizId === quiz.id}
                              className="focus-ring rounded-md border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-400 hover:border-crimson/60 hover:text-crimson-bright disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">
            Students
          </h2>
          {students.length === 0 ? (
            <EmptyState title="No students yet." />
          ) : (
            <div className="panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3.5 font-medium">#</th>
                      <th className="px-5 py-3.5 font-medium">Name</th>
                      <th className="px-5 py-3.5 font-medium">Email</th>
                      <th className="px-5 py-3.5 font-medium">Role</th>
                      <th className="px-5 py-3.5 font-medium">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} className="border-b border-neutral-900 last:border-0">
                        <td className="px-5 py-4 text-neutral-500">{i + 1}</td>
                        <td className="px-5 py-4 text-white">{s.full_name ?? "—"}</td>
                        <td className="px-5 py-4 text-neutral-500">{s.email ?? "—"}</td>
                        <td className="px-5 py-4 text-neutral-400 capitalize">{s.role}</td>
                        <td className="px-5 py-4 text-neutral-500">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
