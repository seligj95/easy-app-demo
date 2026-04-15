"use client";

import { useState } from "react";
import { EjectModal } from "./eject-modal";

// POC Limitation: The eject banner visibility is controlled by the NEXT_PUBLIC_SHOW_EJECT_BANNER
// environment variable. In the Day 1 managed container, this is set to "true" via Bicep so users
// see the option to eject. After ejection (Day 2), the developer's own deployment won't include
// this variable, so the banner disappears automatically.
//
// In a production implementation, this would instead check the user's Azure RBAC role on the
// App Service resource (Owner/Contributor) via the Easy Auth X-MS-CLIENT-PRINCIPAL header,
// so only admins see the eject option regardless of deployment mode.

export function EjectBanner() {
  const showBanner = process.env.NEXT_PUBLIC_SHOW_EJECT_BANNER === "true";
  const [modalOpen, setModalOpen] = useState(false);

  if (!showBanner) return null;

  return (
    <>
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm text-white">
        <span>
          <strong>Managed Agent UI</strong> — Want to customize this app or add
          your own code?
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md border border-white/30 bg-white/10 px-4 py-1.5 font-medium transition-colors hover:bg-white/20"
        >
          Customize Source Code →
        </button>
      </div>
      <EjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
