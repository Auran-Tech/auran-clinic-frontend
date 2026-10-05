import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Plus, RefreshCcw, Users } from "lucide-react";
import { authSession } from "../auth/authSession";
import { usePatients } from "../patients/patients.api";
import {
  useMoveQueueEntry,
  useQueueBoard,
  useQueueCheckIn,
  type QueueEntry,
  type QueueStatus
} from "./queue.api";

export function QueuePage() {
  const board = useQueueBoard();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const canMove = authSession.hasPermission("Queue_Move");

  if (board.isLoading) return <div className="state-card">Loading live queue...</div>;
  if (board.isError || !board.data) return <div className="state-card error-box">Unable to load live queue.</div>;

  const statuses = [...board.data.statuses].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CLINIC / LIVE QUEUE</span>
          <h1>Live Queue</h1>
          <p>Real-time patient flow based on the clinic workflow configuration.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => board.refetch()}><RefreshCcw size={15} />Refresh</button>
          {canMove && <button className="primary-button" onClick={() => setCheckInOpen(true)}><Plus size={15} />Check in</button>}
        </div>
      </header>

      {statuses.length === 0 ? (
        <div className="card state-card">
          <strong>Queue workflow is not configured.</strong>
          <p>Configure workflow statuses and transitions before using the live queue.</p>
        </div>
      ) : (
        <div className="queue-board">
          {statuses.map(status => (
            <QueueLane
              key={status.id}
              status={status}
              entries={board.data.entries.filter(entry => entry.workflowStatusId === status.id)}
              statuses={statuses}
              transitions={board.data.transitions}
              canMove={canMove}
            />
          ))}
        </div>
      )}

      {checkInOpen && (
        <CheckInModal
          doctors={board.data.staff}
          onClose={() => setCheckInOpen(false)}
        />
      )}
    </section>
  );
}

function QueueLane({
  status,
  entries,
  statuses,
  transitions,
  canMove
}: {
  status: QueueStatus;
  entries: QueueEntry[];
  statuses: QueueStatus[];
  transitions: Array<{ fromStatusId: string; toStatusId: string }>;
  canMove: boolean;
}) {
  const allowedStatuses = useMemo(
    () => transitions
      .filter(transition => transition.fromStatusId === status.id)
      .map(transition => statuses.find(item => item.id === transition.toStatusId))
      .filter((item): item is QueueStatus => Boolean(item)),
    [status.id, statuses, transitions]
  );

  return (
    <article className="queue-lane">
      <header>
        <div className="queue-status-dot" style={{ background: status.color }} />
        <div><strong>{status.name}</strong><small>{entries.length} patients</small></div>
        <span>{entries.length}</span>
      </header>

      <div className="queue-lane-body">
        {entries.length === 0 && <div className="queue-empty">No patients</div>}
        {entries.map(entry => (
          <QueueCard
            key={entry.id}
            entry={entry}
            allowedStatuses={allowedStatuses}
            canMove={canMove}
          />
        ))}
      </div>
    </article>
  );
}

function QueueCard({
  entry,
  allowedStatuses,
  canMove
}: {
  entry: QueueEntry;
  allowedStatuses: QueueStatus[];
  canMove: boolean;
}) {
  const move = useMoveQueueEntry();
  const waitingMinutes = Math.max(0, Math.floor((Date.now() - new Date(entry.entryAtUtc).getTime()) / 60_000));

  async function moveTo(status: QueueStatus) {
    await move.mutateAsync({
      queueEntryId: entry.id,
      toStatusId: status.id,
      rowVersion: entry.rowVersion
    });
  }

  return (
    <div className="queue-card">
      <div className="queue-card-top">
        <div className="queue-avatar">{initials(entry.patientName)}</div>
        <div>
          <strong>{entry.patientName}</strong>
          <small><span dir="ltr">{entry.patientNumber}</span> · {waitingMinutes} min</small>
        </div>
      </div>

      <div className="queue-card-meta">
        <span><Users size={13} />{entry.doctorName ?? "Unassigned"}</span>
      </div>

      {canMove && allowedStatuses.length > 0 && (
        <div className="queue-actions">
          {allowedStatuses.map(status => (
            <button key={status.id} disabled={move.isPending} onClick={() => moveTo(status)}>
              {status.name}<ArrowRight size={13} />
            </button>
          ))}
        </div>
      )}

      {move.isError && <div className="queue-error">Queue changed. Board refreshed.</div>}
    </div>
  );
}

function CheckInModal({
  doctors,
  onClose
}: {
  doctors: Array<{ id: string; fullName: string }>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const patients = usePatients({ search, page: 1, pageSize: 10 });
  const checkIn = useQueueCheckIn();

  async function submit(event: FormEvent) {
    event.preventDefault();
    await checkIn.mutateAsync({ patientId, doctorId });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal compact-modal" onSubmit={submit}>
        <header className="modal-head">
          <div><h2>Check in patient</h2><p>Create the visit and add the patient to the first workflow status.</p></div>
        </header>

        <div className="modal-body form-grid">
          <label className="field full-span">Find patient
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, patient number, or phone" />
          </label>

          <label className="field full-span">Patient
            <select required value={patientId} onChange={event => setPatientId(event.target.value)}>
              <option value="">Select patient</option>
              {patients.data?.data.map(patient => (
                <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.patientNumber}</option>
              ))}
            </select>
          </label>

          <label className="field full-span">Doctor
            <select required value={doctorId} onChange={event => setDoctorId(event.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
            </select>
          </label>

          {doctors.length === 0 && <div className="error-box full-span">No active doctor is available. Assign the Doctor role to an active user first.</div>}
          {checkIn.isError && <div className="error-box full-span">Unable to check in patient. The patient may already be active in the queue or workflow configuration may be missing.</div>}
        </div>

        <footer className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={checkIn.isPending || !patientId || !doctorId}>
            {checkIn.isPending ? "Checking in..." : "Check in"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function initials(value: string) {
  return value.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
