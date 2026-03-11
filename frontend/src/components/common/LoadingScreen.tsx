export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#060A14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-[#060A14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-slate-400 text-sm font-medium">Loading Weaver...</div>
      </div>
    </div>
  );
}
