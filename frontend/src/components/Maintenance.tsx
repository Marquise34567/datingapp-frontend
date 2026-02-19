import React from "react";

export default function Maintenance() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-b from-zinc-900/60 to-zinc-900/70 backdrop-blur-sm">
      <div className="mx-4 max-w-xl rounded-2xl bg-white/6 border border-white/10 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-linear-to-br from-zinc-950 to-zinc-700 text-white grid place-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7-4.35-9.2-7.05C-0.1 8.3 5.2 3 8.7 5.6 10.3 6.9 12 9 12 9s1.7-2.1 3.3-3.4C18.8 3 24.1 8.3 21.2 13.95 19 17.65 12 21 12 21z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">We'll be back soon</h1>
            <p className="mt-1 text-sm text-zinc-300">We're doing some maintenance — thanks for your patience.</p>
          </div>
        </div>

        <div className="mt-6 text-zinc-200">
          <p className="text-sm leading-relaxed">
            The site is temporarily down for improvements. Check back in a few minutes.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-zinc-400">Estimated downtime: ~10 minutes</div>
          <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center rounded-full bg-white/6 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10">
            Check status
          </a>
        </div>
      </div>
    </div>
  );
}
