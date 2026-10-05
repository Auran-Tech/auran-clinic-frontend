import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVisits } from "./visits.api";
import { selectedVisit } from "./selectedVisit";

export function VisitsPage() {
  const navigate = useNavigate();
  const visits = useVisits();
  const [search, setSearch] = useState("");

  if (visits.isLoading) return <div className="state-card">Loading visits...</div>;
  if (visits.isError || !visits.data) return <div className="state-card error-box">Unable to load visits.</div>;

  const query = search.trim().toLowerCase();
  const filtered = visits.data.filter(visit =>
    !query ||
    visit.patientName.toLowerCase().includes(query) ||
    visit.patientNumber.toLowerCase().includes(query) ||
    visit.doctorName.toLowerCase().includes(query) ||
    visit.status.toLowerCase().includes(query)
  );

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CLINIC / VISITS</span>
          <h1>Visits</h1>
          <p>Open clinical workspace, documentation status and doctor sessions.</p>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search patient, doctor, or status..." />
          </label>
          <span className="count-pill">{filtered.length} visits</span>
        </div>

        {filtered.length === 0 ? (
          <div className="state-card">No visits found.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Documentation</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(visit => (
                  <tr key={visit.id}>
                    <td>
                      <button
                        className="patient-link-button"
                        onClick={() => {
                          selectedVisit.set(visit.id);
                          navigate("/visits/workspace");
                        }}
                      >
                        <strong>{visit.patientName}</strong>
                        <small className="table-subline" dir="ltr">{visit.patientNumber}</small>
                      </button>
                    </td>
                    <td>{visit.doctorName}</td>
                    <td><span className="status-pill">{visit.status}</span></td>
                    <td><span className="status-pill">{visit.documentationStatus}</span></td>
                    <td><span dir="ltr">{new Date(visit.entryAtUtc).toLocaleString()}</span></td>
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
