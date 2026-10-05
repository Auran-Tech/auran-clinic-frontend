import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { authSession } from "../auth/authSession";
import { usePatients } from "./patients.api";

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = usePatients({ search, page: 1, pageSize: 20 });
  const canCreate = authSession.hasPermission("Patient_Create");

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CLINIC / PATIENTS</span>
          <h1>Patients</h1>
          <p>Search, register and open patient clinical profiles.</p>
        </div>
        {canCreate && <button className="primary-button"><Plus size={16} />New patient</button>}
      </header>

      <div className="card">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name, ID, or phone..." />
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
    </section>
  );
}
