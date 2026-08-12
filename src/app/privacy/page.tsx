import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Splitsy",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-12 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-700">
          Placeholder
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-6 leading-7 text-slate-600">
          This page is a placeholder. Splitsy’s final Privacy Policy has not
          been written or approved, so this content must not be treated as a
          description of privacy practices.
        </p>
        <Link
          className="mt-8 inline-block font-semibold text-indigo-700 underline underline-offset-4"
          href="/"
        >
          Return to Splitsy
        </Link>
      </article>
    </main>
  );
}
