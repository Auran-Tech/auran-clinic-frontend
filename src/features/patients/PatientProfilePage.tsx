import { FormEvent, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { authSession } from "../auth/authSession";
import { useAddProfileItem, usePatientProfile } from "./patientProfile.api";
import { selectedPatient } from "./selectedPatient";

type Kind = "allergies" | "conditions" | "medications";

export function PatientProfilePage() {
  const patientId = selectedPatient.get() ?? "";
  const { data, isLoading, isError } = usePatientProfile(patientId);
  const [kind, setKind] = useState<Kind | null>(null);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const canEdit = authSession.hasPermission("MedicalProfile_Edit");

  const mutation = useAddProfileItem(patientId, kind ?? "allergies");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!kind) return;

    const payload: Record<string, string | null> =
      kind === "allergies"
        ? { name, reaction: detail || null, notes: null }
        : kind === "medications"
          ? { name, dosage: detail || null, notes: null }
          : { name, notes: detail || null };

    await mutation.mutateAsync(payload);
    setName("");
    setDetail("");
    setKind(null);
  }

  if (!patientId) return <Navigate to="/patients" replace />;
  if (isLoading) return <div className="state-card">Loading patient profile...</div>;
  if (isError || !data) return <div className="state-card error-box">Unable to load patient profile.</div>;

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <Link className="back-link" to="/patients"><ArrowLeft size={14} />Patients</Link>
          <span className="eyebrow">PATIENT PROFILE</span>
          <h1>{data.patient.fullName}</h1>
          <p><code dir="ltr">{data.patient.patientNumber}</code> · <span dir="ltr">{data.patient.phone}</span></p>
        </div>
      </header>

      <div className="profile-summary card">
        <div><small>Gender</small><strong>{data.patient.gender ?? "—"}</strong></div>
        <div><small>Date of birth</small><strong dir="ltr">{data.patient.dateOfBirth ?? "—"}</strong></div>
        <div><small>Patient ID</small><strong><code dir="ltr">{data.patient.patientNumber}</code></strong></div>
      </div>

      <div className="profile-grid">
        <ProfileSection
          title="Allergies"
          items={data.allergies.map(item => ({ id: item.id, title: item.name, detail: item.reaction }))}
          canEdit={canEdit}
          onAdd={() => setKind("allergies")}
        />
        <ProfileSection
          title="Conditions"
          items={data.conditions.map(item => ({ id: item.id, title: item.name, detail: item.notes }))}
          canEdit={canEdit}
          onAdd={() => setKind("conditions")}
        />
        <ProfileSection
          title="Medications"
          items={data.medications.map(item => ({ id: item.id, title: item.name, detail: item.dosage }))}
          canEdit={canEdit}
          onAdd={() => setKind("medications")}
        />
      </div>

      {kind && (
        <div className="modal-backdrop">
          <form className="modal compact-modal" onSubmit={submit}>
            <header className="modal-head">
              <div><h2>Add {kind.slice(0, -1)}</h2><p>Saved to the patient's clinical profile.</p></div>
            </header>
            <div className="modal-body form-grid">
              <label className="field">Name<input required value={name} onChange={event => setName(event.target.value)} /></label>
              <label className="field">
                {kind === "allergies" ? "Reaction" : kind === "medications" ? "Dosage" : "Notes"}
                <input value={detail} onChange={event => setDetail(event.target.value)} />
              </label>
              {mutation.isError && <div className="error-box">Unable to save clinical profile item.</div>}
            </div>
            <footer className="modal-foot">
              <button type="button" className="secondary-button" onClick={() => setKind(null)}>Cancel</button>
              <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}

function ProfileSection({
  title,
  items,
  canEdit,
  onAdd
}: {
  title: string;
  items: Array<{ id: string; title: string; detail?: string | null }>;
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <article className="card profile-section">
      <header>
        <div><h2>{title}</h2><small>{items.length} recorded</small></div>
        {canEdit && <button className="icon-button" onClick={onAdd} aria-label={`Add ${title}`}><Plus size={16} /></button>}
      </header>

      {items.length === 0 ? (
        <div className="mini-empty">Nothing recorded yet.</div>
      ) : (
        <div className="profile-items">
          {items.map(item => (
            <div key={item.id}>
              <strong>{item.title}</strong>
              <small>{item.detail || "No additional details"}</small>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
