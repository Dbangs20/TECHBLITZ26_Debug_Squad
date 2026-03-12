export function ClinicFlowLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex ${compact ? "flex-col items-center gap-2 text-center" : "items-center gap-3"}`}>
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-sky-400 to-cyan-500 text-white shadow-glass">
        <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
          <path d="M10 24h9l4-10 6 20 4-10h5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div className={`font-display font-semibold text-slate-950 dark:text-slate-50 ${compact ? "text-base leading-none" : "text-lg"}`}>ClinicFlow</div>
        {!compact ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">Smart Operating System for Clinics</div>
        ) : (
          <div className="max-w-[72px] text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Clinic ops</div>
        )}
      </div>
    </div>
  );
}
