import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-300">
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:py-10">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl bg-indigo-500 text-sm font-black text-white shadow-lg shadow-indigo-950/50"
            >
              S
            </span>
            <p className="text-lg font-bold tracking-tight text-white">Splitsy</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Shared expenses, settled simply.
          </p>
        </div>

        <nav aria-label="Legal" className="text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Legal
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            <li>
              <Link
                className="font-medium text-slate-300 underline-offset-4 transition hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-4 focus:ring-offset-slate-950"
                href="/terms"
              >
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-slate-300 underline-offset-4 transition hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-4 focus:ring-offset-slate-950"
                href="/privacy"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
