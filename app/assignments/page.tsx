"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import type { Assignment, Profile } from "@/lib/types";

export default function AssignmentsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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

      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .order("due_date", { ascending: true });

      if (!active) return;

      if (assignmentError) {
        setError("Couldn't load assignments right now.");
      } else {
        setAssignments((assignmentData ?? []) as Assignment[]);
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
    return <Loading label="Loading assignments" />;
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar role="student" name={profile.full_name ?? "Student"} email={email} />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-white">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Coursework assigned to you by your instructors.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-crimson-bright">
            {error}
          </div>
        )}

        {assignments.length === 0 && !error ? (
          <EmptyState title="No assignments yet." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {assignments.map((a) => (
              <div key={a.id} className="panel rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold text-white">
                  {a.title}
                </h3>
                {a.description && (
                  <p className="mt-2 text-sm text-neutral-400">{a.description}</p>
                )}
                {a.due_date && (
                  <p className="mt-4 text-xs text-neutral-500">
                    Due {new Date(a.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
