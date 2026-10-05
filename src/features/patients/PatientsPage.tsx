import { FormEvent, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { authSession } from "../auth/authSession";
import { useCreatePatient, usePatients, type PatientDuplicateCandidate } from "./patients.api";

type PatientForm = {
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
};

const emptyForm: PatientForm = { fullName: "", phone: "", gender: "", dateOfBirth: "" };

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [duplicates, setDuplicates] = useState<PatientDuplicateCandidate[]>([]);
  const { data, isLoading, isError } = usePatients({ search, page: 1, pageSize: 20 });
  const createPatient = useCreatePatient();
  const canCreate = authSession.hasPermission("Patient_Create");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setDuplicates([]);
    try {
      await createPatient.mutateAsync({
        fullName: form.fullName,
        phone: form.phone,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null
      });
      setShowCreate(false);
      setForm(emptyForm);
    } catch (error) {
      const candidates = (error as Error & { duplicates?: PatientDuplicateCandidate[] }).duplicates;
      if (candidates) setDuplicates(candidates);
    }
  }

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CLINIC / PATIENTS</span>
          <h1>Patients</h1>
          <p>Search, register and open patient clinical profiles.</p>
        </div>
        {canCreate && <button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={16} />New patient</button>}
      </header>

      <div className="card">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search patient name, ID, or phone..." />
          </label>
          <span className="count-pill">{data?.setting.totalCount ?? 0} patients</span>
        </div>

        {isLoading && <div className="state-card">Loading patients...</div>}
        {isError && <div className="state-card error-box">Could not load patients.</div>}
        {!isLoading && !isError && data?.data.length === 0 && <div className="state-card">No patients found.</div>}

        {data && data.data.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th>ID</th><th>Patient</th><th>Phone</th><th>Gender</th><th>Date of birth</th></tr></thead>
              <tbody>
                {data.data.map(patient => (
                  <tr key={patient.id}>
                    <td><code dir="ltr">{patient.patientNumber}</code></td>
                    <td><strong>{patient.fullName}</strong></td>
                    <td><span dir="ltr">{patient.phone}</span></td>
                    <td>{patient.gender ?? "—"}</td>
                    <td><span dir="ltr">{patient.dateOfBirth ?? "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={submit}>
            <header className="modal-head">
              <div><h2>New patient</h2><p>Duplicate detection runs before creation.</p></div>
              <button type="button" className="icon-button" onClick={() => setShowCreate(false)}><X size={17} /></button>
            </header>
            <div className="modal-body form-grid">
              <label className="field">Full name<input required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} /></label>
              <label className="field">Phone<input required dir="ltr" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
              <label className="field">Gender<select value={form.gender} onChange={event => setForm({ ...form, gender: event.target.value })}><option value="">Select</option><option>Male</option><option>Female</option></select></label>
              <label className="field">Date of birth<input type="date" value={form.dateOfBirth} onChange={event => setForm({ ...form, dateOfBirth: event.target.value })} /></label>

              {duplicates.length > 0 && (
                <div className="duplicate-warning">
                  <strong>Potential duplicate found</strong>
                  <p>Review the existing patient before creating another record.</p>
                  {duplicates.map(candidate => <div key={candidate.id}><code>{candidate.patientNumber}</code> · {candidate.fullName} · <span dir="ltr">{candidate.phone}</span></div>)}
                </div>
              )}

              {createPatient.isError && duplicates.length === 0 && <div className="error-box">Unable to create patient.</div>}
            </div>
            <footer className="modal-foot">
              <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="primary-button" disabled={createPatient.isPending}>{createPatient.isPending ? "Checking..." : "Create patient"}</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
