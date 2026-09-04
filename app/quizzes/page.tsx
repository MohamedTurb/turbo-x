"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import QuizCard from "@/components/QuizCard";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import type { Profile, QuizWithCount } from "@/lib/types";

export default function QuizzesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [quizzes, setQuizzes] = useState<QuizWithCount[]>([]);
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

      const { data: quizList, error: quizError } = await supabase
        .from("quizzes")
        .select("id, title, description, published, created_at, duration_minutes")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (quizError) {
        setError("Couldn't load quizzes right now. Please try again shortly.");
        setLoading(false);
        return;
      }

      const list = quizList ?? [];
      if (list.length === 0) {
        setQuizzes([]);
        setProfile(profileData as Profile);
        setEmail(userData.user.email ?? "");
        setLoading(false);
        return;
      }

      const { data: questionRows } = await supabase
        .from("questions")
        .select("quiz_id")
        .in(
          "quiz_id",
          list.map((q) => q.id)
        );

      const counts = new Map<number, number>();
      (questionRows ?? []).forEach((row: { quiz_id: number }) => {
        counts.set(row.quiz_id, (counts.get(row.quiz_id) ?? 0) + 1);
      });

      setQuizzes(
        list.map((q) => ({ ...q, question_count: counts.get(q.id) ?? 0 }))
      );
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
    return <Loading label="Loading quizzes" />;
  }

  return (
    <div className="min-h-screen bg-ink">
<Navbar
  role="student"
  name={profile.full_name ?? "Student"}
  email={email}
/>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-white">
            Quizzes
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Published quizzes available to you right now.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
            {error}
          </div>
        )}

        {quizzes.length === 0 && !error ? (
          <EmptyState title="No published quizzes yet." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
