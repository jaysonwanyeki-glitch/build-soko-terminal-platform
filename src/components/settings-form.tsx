"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui";
import { classNames } from "@/lib/format";

export function SettingsForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"profile" | "password" | "prefs">("profile");

  // profile
  const [newName, setNewName] = useState(name);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // password
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    start(async () => {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      }).then((r) => r.json());
      if (res.ok) {
        setProfileMsg("Profile updated.");
        router.refresh();
      } else setProfileMsg(res.error || "Failed.");
    });
  };

  const changePw = (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    start(async () => {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      }).then((r) => r.json());
      if (res.ok) {
        setPwMsg({ ok: true, text: "Password changed successfully." });
        setCurPw("");
        setNewPw("");
      } else setPwMsg({ ok: false, text: res.error || "Failed." });
    });
  };

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    { id: "password" as const, label: "Password" },
    { id: "prefs" as const, label: "Preferences" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono text-lg font-black tracking-tight text-fg">SETTINGS <span className="text-gradient">·</span> ACCOUNT</h1>
        <p className="mono text-[11px] text-dim">Manage your profile, security and preferences.</p>
      </div>

      <div className="flex gap-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={classNames("mono rounded-lg border px-3 py-2 text-xs font-bold transition", tab === t.id ? "border-brand/50 bg-brand/10 text-brand" : "border-line text-muted hover:text-fg")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <Panel title="Profile" className="max-w-lg">
          <form onSubmit={saveProfile} className="space-y-3 p-4">
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Email (read-only)</label>
              <input value={email} disabled className="mono w-full rounded-xl border border-line bg-term-900/50 px-3 py-2.5 text-sm text-dim" />
            </div>
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Full Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none focus:border-brand" />
            </div>
            {profileMsg && <div className="mono rounded-lg border border-up/40 bg-up/5 px-3 py-2 text-xs text-up">{profileMsg}</div>}
            <button type="submit" disabled={pending} className="btn-brand mono rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
              {pending ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </Panel>
      )}

      {tab === "password" && (
        <Panel title="Change Password" className="max-w-lg">
          <form onSubmit={changePw} className="space-y-3 p-4">
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">Current Password</label>
              <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none focus:border-brand" />
            </div>
            <div>
              <label className="mono mb-1 block text-[10px] uppercase tracking-wider text-dim">New Password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} className="mono w-full rounded-xl border border-line bg-term-900 px-3 py-2.5 text-sm text-fg outline-none focus:border-brand" />
            </div>
            {pwMsg && (
              <div className={classNames("mono rounded-lg border px-3 py-2 text-xs", pwMsg.ok ? "border-up/40 bg-up/5 text-up" : "border-down/40 bg-down/5 text-down")}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" disabled={pending} className="btn-brand mono rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-term-950 transition hover:brightness-110 disabled:opacity-50">
              {pending ? "Changing…" : "Change Password"}
            </button>
          </form>
        </Panel>
      )}

      {tab === "prefs" && (
        <Panel title="Preferences" className="max-w-lg">
          <div className="space-y-3 p-4">
            <div className="mono flex items-center justify-between rounded-xl border border-line-soft bg-term-850/60 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-fg">Theme</div>
                <div className="text-[11px] text-dim">Dark mode (recommended)</div>
              </div>
              <span className="mono rounded-lg border border-line px-2.5 py-1 text-[10px] text-muted">Dark</span>
            </div>
            <div className="mono flex items-center justify-between rounded-xl border border-line-soft bg-term-850/60 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-fg">Default Currency</div>
                <div className="text-[11px] text-dim">All values shown in</div>
              </div>
              <span className="mono rounded-lg border border-line px-2.5 py-1 text-[10px] text-muted">KES</span>
            </div>
            <div className="mono flex items-center justify-between rounded-xl border border-line-soft bg-term-850/60 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-fg">Price Alerts</div>
                <div className="text-[11px] text-dim">Email notifications (coming soon)</div>
              </div>
              <span className="mono rounded-lg border border-line px-2.5 py-1 text-[10px] text-dim">Off</span>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
