export function TopBar() {
  return (
    <header className="flex items-center justify-end gap-6 border-b border-rose-100 bg-gradient-to-r from-[#fdf2f8] to-[#faf5f5] px-8 py-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
      <button
        type="button"
        className="relative text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeWidth="2"
            strokeLinecap="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0h6z"
          />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
      </button>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-amber-300 ring-2 ring-white shadow dark:ring-slate-700" />
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Subhendra</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">TAT</p>
        </div>
      </div>
    </header>
  );
}
