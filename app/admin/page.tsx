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
import type { Assignment, Profile, Quiz } from "@/lib/types";

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const [busyQuizId, setBusyQuizId] = useState<number | null>(null);
  const [busyAssignmentId, setBusyAssignmentId] =
    useState<number | null>(null);

  const [exporting, setExporting] = useState(false);

  // Assignment form
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] =
    useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentFile, setAssignmentFile] =
    useState<File | null>(null);
  const [creatingAssignment, setCreatingAssignment] =
    useState(false);

  const loadAdminData = useCallback(async () => {
    const supabase = supabaseBrowser();

    const [
      quizzesRes,
      studentsRes,
      attemptsRes,
      assignmentsRes,
    ] = await Promise.all([
      supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false }),

      supabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (
      quizzesRes.error ||
      studentsRes.error ||
      assignmentsRes.error
    ) {
      console.error(
        quizzesRes.error ||
          studentsRes.error ||
          assignmentsRes.error
      );

      setError("Couldn't load admin data right now.");
      return;
    }

    const quizList = (quizzesRes.data ?? []) as Quiz[];
    const studentList = (studentsRes.data ?? []) as Profile[];
    const assignmentList = (assignmentsRes.data ??
      []) as Assignment[];

    setQuizzes(quizList);
    setStudents(studentList);
    setAssignments(assignmentList);

    setStats({
      totalStudents: studentList.length,
      totalQuizzes: quizList.length,
      publishedQuizzes: quizList.filter(
        (q) => q.published
      ).length,
      totalAttempts: attemptsRes.count ?? 0,
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = supabaseBrowser();

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.replace("/login");
        return;
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
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
      .update({
        published: !quiz.published,
      })
      .eq("id", quiz.id);

    if (updateError) {
      setError(
        `Couldn't update "${quiz.title}". Please try again.`
      );
    } else {
      await loadAdminData();
    }

    setBusyQuizId(null);
  }

  async function deleteQuiz(quiz: Quiz) {
    if (
      !confirm(
        `Delete "${quiz.title}"? This also removes its questions and attempts.`
      )
    ) {
      return;
    }

    setBusyQuizId(quiz.id);

    const supabase = supabaseBrowser();

    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quiz.id);

    if (deleteError) {
      setError(
        `Couldn't delete "${quiz.title}". Please try again.`
      );
    } else {
      await loadAdminData();
    }

    setBusyQuizId(null);
  }

  async function createAssignment() {
    setError(null);

    if (!assignmentTitle.trim()) {
      setError("Please enter an assignment title.");
      return;
    }

    if (!assignmentFile) {
      setError("Please choose an assignment file.");
      return;
    }

    setCreatingAssignment(true);

    try {
      const supabase = supabaseBrowser();

      const fileExtension =
        assignmentFile.name.includes(".")
          ? assignmentFile.name.split(".").pop()
          : "";

      const safeExtension = fileExtension
        ? `.${fileExtension}`
        : "";

      const fileName = `${crypto.randomUUID()}${safeExtension}`;

      const filePath = `assignment-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, assignmentFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        setError(
          `Couldn't upload the file: ${uploadError.message}`
        );
        return;
      }

      const { error: insertError } = await supabase
        .from("assignments")
        .insert({
          title: assignmentTitle.trim(),
          description:
            assignmentDescription.trim() || null,
          file_path: filePath,
          due_date: assignmentDueDate
            ? new Date(assignmentDueDate).toISOString()
            : null,
        });

      if (insertError) {
        console.error(insertError);

        await supabase.storage
          .from("assignments")
          .remove([filePath]);

        setError(
          `Couldn't create the assignment: ${insertError.message}`
        );

        return;
      }

      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate("");
      setAssignmentFile(null);
      setShowAssignmentForm(false);

      const fileInput = document.getElementById(
        "assignment-file"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong while creating the assignment."
      );
    } finally {
      setCreatingAssignment(false);
    }
  }

  async function deleteAssignment(
    assignment: Assignment
  ) {
    if (
      !confirm(
        `Delete "${assignment.title}"? This will remove the assignment from the platform.`
      )
    ) {
      return;
    }

    setBusyAssignmentId(assignment.id);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      if (assignment.file_path) {
        const { error: storageError } =
          await supabase.storage
            .from("assignments")
            .remove([assignment.file_path]);

        if (storageError) {
          console.error(storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignment.id);

      if (deleteError) {
        console.error(deleteError);

        setError(
          `Couldn't delete "${assignment.title}". Please try again.`
        );

        return;
      }

      await loadAdminData();
    } finally {
      setBusyAssignmentId(null);
    }
  }

  function exportStudents() {
    setExporting(true);

    try {
      const rows = students.map((s, i) => ({
        "#": i + 1,
        Name: s.full_name ?? "—",
        Email: s.email ?? "—",
        Role: s.role,
        "Created At": new Date(
          s.created_at
        ).toLocaleString(),
      }));

      const worksheet =
        XLSX.utils.json_to_sheet(rows);

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Students"
      );

      XLSX.writeFile(
        workbook,
        "TurboX-Students.xlsx"
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading || !profile) {
    return <Loading label="Loading admin dashboard" />;
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar
        role="admin"
        name={profile.full_name ?? "Admin"}
        email={email}
      />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">
              Admin overview
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Manage quizzes, assignments, publishing,
              and your student roster.
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
              {showForm
                ? "Close form"
                : "+ Create Quiz"}
            </button>

            <button
              onClick={() =>
                setShowAssignmentForm(
                  (v) => !v
                )
              }
              className="focus-ring rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-2.5 text-sm font-medium text-crimson-bright hover:bg-crimson/20"
            >
              {showAssignmentForm
                ? "Close Assignment"
                : "+ Create Assignment"}
            </button>

            <button
              onClick={exportStudents}
              disabled={
                exporting ||
                students.length === 0
              }
              className="focus-ring rounded-lg border border-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:border-crimson/50 hover:text-white disabled:opacity-50"
            >
              {exporting
                ? "Exporting…"
                : "Export Students Excel"}
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
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

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Students"
            value={stats.totalStudents}
          />

          <StatCard
            label="Total Quizzes"
            value={stats.totalQuizzes}
          />

          <StatCard
            label="Published Quizzes"
            value={stats.publishedQuizzes}
          />

          <StatCard
            label="Total Attempts"
            value={stats.totalAttempts}
          />
        </div>

        {/* QUIZ FORM */}
        {showForm && (
          <div className="mt-8">
            <QuizForm
              onCreated={() => {
                setShowForm(false);
                loadAdminData();
              }}
              onCancel={() =>
                setShowForm(false)
              }
            />
          </div>
        )}

        {/* ASSIGNMENT FORM */}
        {showAssignmentForm && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-white">
                Create Assignment
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Upload an assignment file for your
                students.
              </p>
            </div>

            <div className="grid gap-5">
              {/* TITLE */}
              <div>
                <label
                  htmlFor="assignment-title"
                  className="mb-2 block text-sm font-medium text-neutral-300"
                >
                  Assignment Title
                </label>

                <input
                  id="assignment-title"
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) =>
                    setAssignmentTitle(
                      e.target.value
                    )
                  }
                  placeholder="C++ OOP Assignment #1"
                  className="focus-ring w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="assignment-description"
                  className="mb-2 block text-sm font-medium text-neutral-300"
                >
                  Description
                </label>

                <textarea
                  id="assignment-description"
                  value={assignmentDescription}
                  onChange={(e) =>
                    setAssignmentDescription(
                      e.target.value
                    )
                  }
                  placeholder="Describe what students need to do..."
                  rows={4}
                  className="focus-ring w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
                />
              </div>

              {/* DUE DATE */}
              <div>
                <label
                  htmlFor="assignment-due-date"
                  className="mb-2 block text-sm font-medium text-neutral-300"
                >
                  Due Date
                </label>

                <input
                  id="assignment-due-date"
                  type="datetime-local"
                  value={assignmentDueDate}
                  onChange={(e) =>
                    setAssignmentDueDate(
                      e.target.value
                    )
                  }
                  className="focus-ring w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              {/* FILE */}
              <div>
                <label
                  htmlFor="assignment-file"
                  className="mb-2 block text-sm font-medium text-neutral-300"
                >
                  Assignment File
                </label>

                <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-5">
                  <input
                    id="assignment-file"
                    type="file"
                    onChange={(e) =>
                      setAssignmentFile(
                        e.target.files?.[0] ??
                          null
                      )
                    }
                    className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-neutral-950 hover:file:bg-neutral-200"
                  />

                  {assignmentFile && (
                    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
                      Selected:{" "}
                      {assignmentFile.name}
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-neutral-600">
                  The file will be stored securely in
                  Supabase Storage.
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowAssignmentForm(false)
                  }
                  disabled={
                    creatingAssignment
                  }
                  className="focus-ring rounded-xl border border-neutral-800 px-5 py-3 text-sm font-medium text-neutral-300 hover:border-neutral-600 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={createAssignment}
                  disabled={
                    creatingAssignment
                  }
                  className="focus-ring rounded-xl bg-crimson px-6 py-3 text-sm font-semibold text-white hover:bg-crimson-bright disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingAssignment
                    ? "Uploading..."
                    : "Create Assignment"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* QUIZZES */}
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
                      <th className="px-5 py-3.5 font-medium">
                        Title
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Created
                      </th>

                      <th className="px-5 py-3.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {quizzes.map((quiz) => (
                      <tr
                        key={quiz.id}
                        className="border-b border-neutral-900 last:border-0"
                      >
                        <td className="px-5 py-4 text-white">
                          {quiz.title}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${
                              quiz.published
                                ? "border border-emerald-700/40 bg-emerald-900/20 text-emerald-400"
                                : "border border-neutral-700 bg-neutral-900 text-neutral-400"
                            }`}
                          >
                            {quiz.published
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-neutral-500">
                          {new Date(
                            quiz.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                togglePublish(
                                  quiz
                                )
                              }
                              disabled={
                                busyQuizId ===
                                quiz.id
                              }
                              className="focus-ring rounded-md border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 hover:border-crimson/50 hover:text-white disabled:opacity-50"
                            >
                              {quiz.published
                                ? "Unpublish"
                                : "Publish"}
                            </button>

                            <button
                              onClick={() =>
                                deleteQuiz(
                                  quiz
                                )
                              }
                              disabled={
                                busyQuizId ===
                                quiz.id
                              }
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

        {/* ASSIGNMENTS */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Assignments
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage files and deadlines for students.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowAssignmentForm(true)
              }
              className="focus-ring rounded-lg border border-neutral-800 px-3 py-2 text-xs text-neutral-300 hover:border-crimson/50 hover:text-white"
            >
              + New Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet."
              description="Create your first assignment and upload its file."
            />
          ) : (
            <div className="panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3.5 font-medium">
                        Assignment
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        File
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Due Date
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Created
                      </th>

                      <th className="px-5 py-3.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignments.map(
                      (assignment) => (
                        <tr
                          key={assignment.id}
                          className="border-b border-neutral-900 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">
                              {assignment.title}
                            </div>

                            {assignment.description && (
                              <div className="mt-1 max-w-md truncate text-xs text-neutral-500">
                                {
                                  assignment.description
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-400">
                              {assignment.file_path
                                ? "Uploaded"
                                : "No File"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-neutral-500">
                            {assignment.due_date
                              ? new Date(
                                  assignment.due_date
                                ).toLocaleString()
                              : "No deadline"}
                          </td>

                          <td className="px-5 py-4 text-neutral-500">
                            {new Date(
                              assignment.created_at
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  deleteAssignment(
                                    assignment
                                  )
                                }
                                disabled={
                                  busyAssignmentId ===
                                  assignment.id
                                }
                                className="focus-ring rounded-md border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-400 hover:border-crimson/60 hover:text-crimson-bright disabled:opacity-50"
                              >
                                {busyAssignmentId ===
                                assignment.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* STUDENTS */}
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
                      <th className="px-5 py-3.5 font-medium">
                        #
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Name
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Email
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Role
                      </th>

                      <th className="px-5 py-3.5 font-medium">
                        Created At
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((s, i) => (
                      <tr
                        key={s.id}
                        className="border-b border-neutral-900 last:border-0"
                      >
                        <td className="px-5 py-4 text-neutral-500">
                          {i + 1}
                        </td>

                        <td className="px-5 py-4 text-white">
                          {s.full_name ?? "—"}
                        </td>

                        <td className="px-5 py-4 text-neutral-500">
                          {s.email ?? "—"}
                        </td>

                        <td className="px-5 py-4 capitalize text-neutral-400">
                          {s.role}
                        </td>

                        <td className="px-5 py-4 text-neutral-500">
                          {new Date(
                            s.created_at
                          ).toLocaleDateString()}
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
