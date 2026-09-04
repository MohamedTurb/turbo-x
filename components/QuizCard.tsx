import Link from "next/link";
import type { QuizWithCount } from "@/lib/types";

export default function QuizCard({ quiz }: { quiz: QuizWithCount }) {
  return (
    <div className="panel flex flex-col justify-between rounded-2xl p-6 transition-colors hover:border-crimson/40">
      <div>
        <h3 className="font-display text-lg font-semibold text-white">
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="mt-2 line-clamp-3 text-sm text-neutral-400">
            {quiz.description}
          </p>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {typeof quiz.question_count === "number"
            ? `${quiz.question_count} question${quiz.question_count === 1 ? "" : "s"}`
            : ""}
        </span>
        <Link
          href={`/quiz/${quiz.id}`}
          className="focus-ring rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-crimson-bright"
        >
          Start
        </Link>
      </div>
    </div>
  );
}
