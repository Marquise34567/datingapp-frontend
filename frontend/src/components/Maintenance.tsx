import React from "react";

export default function Maintenance() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-b from-zinc-900/70 to-zinc-900/80 backdrop-blur-md">
      <div className="mx-4 w-full max-w-2xl rounded-3xl bg-gradient-to-br from-white/5 to-white/3 border border-white/8 p-10 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <img src="/sparkdd-favicon.svg" alt="Sparkd" className="h-14 w-14 rounded-lg shadow-md" />
          <div>
            <h1 className="text-3xl font-["Playfair Display",serif] tracking-tight text-white">Sparkd is getting an upgrade</h1>
            <p className="mt-1 text-sm text-zinc-300">We're improving the coach for a better experience.</p>
          </div>
        </div>

        <div className="mt-6 text-zinc-200">
          <p className="text-base leading-relaxed">
            The site is temporarily offline for maintenance. We expect to be back shortly — thanks for your patience. Follow us on Twitter for updates.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-zinc-400">Estimated downtime: ~10 minutes</div>
          <div className="flex items-center gap-3">
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:brightness-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/></svg>
              Check status
            </a>
            <a href="/" className="text-sm text-zinc-300 underline" >Return home</a>
          </div>
        </div>
      </div>
    </div>
  );
}
