"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import Loading from "@/components/Loading";
import type { Profile, QuizAttempt } from "@/lib/types";

interface DashboardStats {
  overallProgress: number;
  quizAverage: number;
  assignmentAverage: number;
  completed: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    overallProgress: 0,
    quizAverage: 0,
    assignmentAverage: 0,
    completed: 0,
  });
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

      const { data: attempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_id", userData.user.id);

      if (!active) return;

      if (attemptsError) {
        setError("Couldn't load your progress right now.");
      } else {
        const list = (attempts ?? []) as QuizAttempt[];
        const quizAverage =
          list.length > 0
            ? Math.round(
                list.reduce((sum, a) => sum + Number(a.percentage), 0) /
                  list.length
              )
            : 0;

        setStats({
          overallProgress: quizAverage,
          quizAverage,
          assignmentAverage: 0,
          completed: list.length,
        });
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
    return <Loading label="Loading your dashboard" />;
  }

  const navCards = [
    {
      href: "/quizzes",
      title: "Quizzes",
      body: "Take published quizzes and see your results instantly.",
    },
    {
      href: "/assignments",
      title: "Assignments",
      body: "View coursework assigned to you and submission status.",
    },
    {
      href: "/grades",
      title: "Grades",
      body: "Review every quiz attempt and score you've recorded.",
    },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <Navbar role="student" name={profile.full_name ?? "Student"} email={email} />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-white">
            Welcome back, {profile.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here's where things stand across your quizzes and assignments.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Overall Progress" value={stats.overallProgress} suffix="%" />
          <StatCard label="Quiz Average" value={stats.quizAverage} suffix="%" />
          <StatCard label="Assignment Average" value={stats.assignmentAverage} suffix="%" />
          <StatCard label="Completed" value={stats.completed} />
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {navCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="panel group rounded-2xl p-6 transition-colors hover:border-crimson/40"
            >
              <h2 className="font-display text-lg font-semibold text-white">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-400">{card.body}</p>
              <span className="mt-4 inline-block text-sm text-crimson-bright opacity-0 transition-opacity group-hover:opacity-100">
                Open
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
