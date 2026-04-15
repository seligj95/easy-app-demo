"use client";

import { useEffect, useRef, useState } from "react";

interface EjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function EjectModal({ open, onClose }: EjectModalProps) {
  const [forkCommand, setForkCommand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"clone" | "azd" | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      setLoading(true);
      fetch("/api/eject")
        .then((r) => r.json())
        .then((data) => setForkCommand(data.forkCommand))
        .finally(() => setLoading(false));
    } else {
      dialog.close();
    }
  }, [open]);

  function copyToClipboard(text: string, which: "clone" | "azd") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Customize Your Agent UI
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Step 1 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              1
            </span>
            <h3 className="font-medium text-gray-900">Fork & Configure</h3>
          </div>
          <p className="mb-3 ml-8 text-sm text-gray-600">
            Run this command in your terminal. It forks the template to your
            GitHub account, clones it, and pre-fills your Azure configuration.
            Requires the{" "}
            <a
              href="https://cli.github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline"
            >
              GitHub CLI
            </a>
            .
          </p>
          <div className="relative ml-8">
            {loading ? (
              <div className="rounded-lg bg-gray-900 p-4 text-sm text-gray-400">
                Loading configuration...
              </div>
            ) : (
              <>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-relaxed text-green-400">
                  {forkCommand}
                </pre>
                <button
                  onClick={() =>
                    forkCommand && copyToClipboard(forkCommand, "clone")
                  }
                  className="absolute right-2 top-2 rounded-md bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-600"
                >
                  {copied === "clone" ? "✓ Copied" : "Copy"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              2
            </span>
            <h3 className="font-medium text-gray-900">Customize</h3>
          </div>
          <p className="ml-8 text-sm text-gray-600">
            Make your changes — update the UI, add features, change the layout.
            It&apos;s a standard Next.js app with Tailwind CSS.
          </p>
        </div>

        {/* Step 3 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              3
            </span>
            <h3 className="font-medium text-gray-900">Deploy</h3>
          </div>
          <p className="mb-3 ml-8 text-sm text-gray-600">
            Deploy your customized code to the same App Service. The managed
            banner disappears automatically.
          </p>
          <div className="relative ml-8">
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-relaxed text-green-400">
              {`azd auth login\nazd up`}
            </pre>
            <button
              onClick={() => copyToClipboard("azd auth login && azd up", "azd")}
              className="absolute right-2 top-2 rounded-md bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-600"
            >
              {copied === "azd" ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="ml-8 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <strong>Note:</strong> Running{" "}
          <code className="rounded bg-blue-100 px-1">azd up</code> deploys your
          code to the same App Service — no URL change, no downtime.
        </div>
      </div>
    </dialog>
  );
}
