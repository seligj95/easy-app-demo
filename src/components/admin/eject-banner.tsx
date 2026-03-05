"use client";

const TEMPLATE_REPO_URL =
  process.env.NEXT_PUBLIC_EJECT_REPO_URL ||
  "https://github.com/seligj95/easy-app-demo/generate";

export function EjectBanner() {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm text-white">
      <span>
        <strong>Managed Agent UI</strong> — Want to customize this app or add
        your own code?
      </span>
      <a
        href={TEMPLATE_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-white/30 bg-white/10 px-4 py-1.5 font-medium transition-colors hover:bg-white/20"
      >
        Customize Source Code →
      </a>
    </div>
  );
}
