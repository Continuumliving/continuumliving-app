"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { updateResident } from "@/lib/admin-actions";
import type { ProfileRow, Role } from "@/lib/types";

export function ResidentEditor({ resident, isSelf }: { resident: ProfileRow; isSelf: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [firstName, setFirstName] = useState(resident.first_name ?? "");
  const [lastName, setLastName] = useState(resident.last_name ?? "");
  const [unit, setUnit] = useState(resident.unit_number === "—" ? "" : resident.unit_number ?? "");
  const [role, setRole] = useState<Role>(resident.role);

  const dirty =
    firstName !== (resident.first_name ?? "") ||
    lastName !== (resident.last_name ?? "") ||
    unit !== (resident.unit_number === "—" ? "" : resident.unit_number ?? "") ||
    role !== resident.role;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      toast("First name is required.");
      return;
    }
    if (role !== resident.role) {
      const msg =
        role === "admin"
          ? `Give ${firstName} full admin access to the back office?`
          : `Remove admin access from ${firstName}?`;
      if (!window.confirm(msg)) return;
    }
    setBusy(true);
    try {
      await updateResident(resident.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        unit_number: unit.trim() || "—",
        ...(role !== resident.role ? { role } : {}),
      });
      toast("Resident updated.");
      router.refresh();
    } catch (err) {
      toast((err as Error).message || "We could not save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="bo-form" onSubmit={save}>
      <div className="bo-field">
        <label htmlFor="fn">First name</label>
        <input id="fn" className="bo-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="ln">Last name</label>
        <input id="ln" className="bo-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="unit">Unit</label>
        <input id="unit" className="bo-input" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="role">Access</label>
        <select
          id="role"
          className="bo-select"
          value={role}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="user">Resident</option>
          <option value="admin">Admin · back office</option>
        </select>
        {isSelf ? <span className="hint">You can't change your own access.</span> : null}
      </div>
      <div className="bo-field full">
        <label>Email</label>
        <input className="bo-input" value={resident.email} disabled />
        <span className="hint">Sign-in email. Residents change it themselves.</span>
      </div>
      <div className="bo-form-actions">
        <span />
        <button type="submit" className="bo-btn primary" disabled={busy || !dirty}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
