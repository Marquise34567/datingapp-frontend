import React, { useEffect, useState } from "react";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function Maintenance() {
  const [remainingMs, setRemainingMs] = useState<number>(FIVE_MINUTES_MS);
  const [hidden, setHidden] = useState<boolean>(false);

  useEffect(() => {
    const end = Date.now() + FIVE_MINUTES_MS;

    const tick = () => {
      const rem = Math.max(0, end - Date.now());
      setRemainingMs(rem);
      if (rem === 0) setHidden(true);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  if (hidden) return null;

  const formatMs = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const backTime = new Date(Date.now() + remainingMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="mx-4 w-full max-w-2xl rounded-3xl bg-gradient-to-br from-white/6 to-white/3/40 border border-white/10 p-10 shadow-2xl backdrop-blur-sm transform-gpu">
        <div className="flex items-center gap-4">
          <img src="/sparkdd-favicon.svg" alt="Sparkd" className="h-14 w-14 rounded-xl shadow-lg ring-1 ring-white/10" />
          <div>
            <h1 className="text-3xl tracking-tight text-white font-serif gradient-text">Sparkd is getting an upgrade</h1>
            <p className="mt-1 text-sm text-zinc-300">We're polishing the coach for a smoother, smarter experience.</p>
          </div>
        </div>

        <div className="mt-6 text-zinc-200">
          <p className="text-base leading-relaxed">
            The site is temporarily offline for maintenance. We expect to be back shortly — thanks for your patience. Follow us on Twitter for updates.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-zinc-300">Estimated remaining: <span className="font-semibold text-white">{formatMs(remainingMs)}</span> — back by <span className="font-medium text-white">{backTime}</span></div>
          <div className="flex items-center gap-3">
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-md hover:brightness-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/></svg>
              Check status
            </a>
            <a href="/" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/6 text-zinc-200 hover:bg-white/2">Return home</a>
          </div>
        </div>
      </div>
    </div>
  );
}
