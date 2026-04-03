function LogoMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white">
      <svg
        aria-hidden="true"
        className="h-4 w-4 text-slate-950"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M8 4.75h8.5c1.243 0 2.25 1.007 2.25 2.25v10c0 1.243-1.007 2.25-2.25 2.25H7.5A2.75 2.75 0 0 1 4.75 16.5V8A3.25 3.25 0 0 1 8 4.75Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M8.5 9.25h6.75M8.5 12h6.75M8.5 14.75h4.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      </svg>
    </span>
  );
}

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-sm font-semibold text-slate-950">Resume Extractor</p>
            <p className="text-xs text-slate-500">Structured parsing workflow</p>
          </div>
        </div>

        <div className="hidden items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:flex">
          Production-ready UI
        </div>
      </div>
    </header>
  );
}
