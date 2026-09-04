import Link from "next/link";

const pillars = [
  {
    title: "Quizzes that adapt to the syllabus",
    body: "Build assessments question by question, publish when they're ready, and see results the moment students submit.",
  },
  {
    title: "One record of every attempt",
    body: "Every score, percentage and timestamp lands in one place — for the student who took it and the instructor grading it.",
  },
  {
    title: "Access that matches the role",
    body: "Students see their own work. Instructors see the whole class. Nothing crosses that line by accident.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(225,29,46,0.18), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col px-6 pb-24 pt-8 sm:px-10">
        <nav className="flex items-center justify-between py-6">
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            TURBOX
          </span>
          <Link
            href="/login"
            className="focus-ring rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-crimson/50 hover:text-white"
          >
            Sign in
          </Link>
        </nav>

        <section className="mx-auto mt-20 max-w-3xl text-center sm:mt-28">
          <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-6xl">
            Learn. Practice. Perform.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-neutral-400 sm:text-lg">
            A modern learning and assessment platform for students and
            instructors.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/login"
              className="focus-ring rounded-lg bg-crimson px-7 py-3 text-sm font-medium text-white shadow-glow transition-colors hover:bg-crimson-bright"
            >
              Get Started
            </Link>
          </div>
        </section>

        <section className="mt-28 grid gap-5 sm:mt-36 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="panel rounded-2xl p-6">
              <h2 className="font-display text-base font-medium text-white">
                {p.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                {p.body}
              </p>
            </div>
          ))}
        </section>
      </div>

      <footer className="relative border-t border-line px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-neutral-600">
          <span>TurboX</span>
          <span>Built for classrooms that move fast.</span>
        </div>
      </footer>
    </main>
  );
}
