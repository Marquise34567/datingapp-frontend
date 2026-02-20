import React from "react";

type Props = {
  title?: string;
  message?: string;
  statusUrl?: string;
  onReturnHome?: () => void;
};

export default function MaintenanceOverlay({
  title = "Sparkd is getting an upgrade",
  message = "We’re polishing the coach for a smoother, smarter experience — hang tight.",
  statusUrl,
  onReturnHome,
}: Props) {
  return (
    <div className="fixed inset-0 z-9999">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />

      {/* Subtle gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-pink-500/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-400/15 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="w-[92%] max-w-lg rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <span className="h-2 w-2 rounded-full bg-pink-400" />
              Maintenance
            </span>
            <span className="text-xs text-white/60">Online soon</span>
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/80 md:text-base">
            {message}
          </p>

          {/* ETA removed — show only message and actions */}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => (onReturnHome ? onReturnHome() : (window.location.href = "/"))}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg transition hover:scale-[1.01] active:scale-[0.99]"
            >
              Return home
            </button>

            <a
              href={statusUrl || "#"}
              target={statusUrl ? "_blank" : undefined}
              rel="noreferrer"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/90 shadow-lg transition hover:bg-white/15"
            >
              Check status
            </a>
          </div>

          <p className="mt-5 text-xs text-white/60">Thanks for your patience. Your chats and settings are safe.</p>
        </div>
      </div>
    </div>
  );
}
