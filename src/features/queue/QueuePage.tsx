import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Plus, RefreshCcw, Users } from "lucide-react";
import { useI18n } from "../../lib/i18n/i18n";
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
  const { t } = useI18n();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const canMove = authSession.hasPermission("Queue_Move");

  if (board.isLoading) return <div className="state-card">{t("Loading live queue...","جارٍ تحميل قائمة الانتظار...")}</div>;
  if (board.isError || !board.data) return <div className="state-card error-box">{t("Unable to load live queue.","تعذر تحميل قائمة الانتظار.")}</div>;

  const statuses = [...board.data.statuses].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{t("CLINIC / LIVE QUEUE","العيادة / قائمة الانتظار")}</span>
          <h1>{t("Live Queue","قائمة الانتظار")}</h1>
          <p>{t("Real-time patient flow based on the clinic workflow configuration.","تدفق المرضى لحظيًا حسب إعدادات مسار العمل بالعيادة.")}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={() => board.refetch()}><RefreshCcw size={15} />{t("Refresh","تحديث")}</button>
          {canMove && <button className="primary-button" onClick={() => setCheckInOpen(true)}><Plus size={15} />{t("Check in","إضافة للانتظار")}</button>}
        </div>
      </header>

      {statuses.length === 0 ? (
        <div className="card state-card">
          <strong>{t("Queue workflow is not configured.","مسار قائمة الانتظار غير مُعد.")}</strong>
          <p>{t("Configure workflow statuses and transitions before using the live queue.","قم بإعداد الحالات والانتقالات قبل استخدام قائمة الانتظار.")}</p>
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

      {checkInOpen && <CheckInModal doctors={board.data.staff} onClose={() => setCheckInOpen(false)} />}
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
  const { t } = useI18n();
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
        <div><strong>{status.name}</strong><small>{entries.length} {t("patients","مرضى")}</small></div>
        <span>{entries.length}</span>
      </header>

      <div className="queue-lane-body">
        {entries.length === 0 && <div className="queue-empty">{t("No patients","لا يوجد مرضى")}</div>}
        {entries.map(entry => <QueueCard key={entry.id} entry={entry} allowedStatuses={allowedStatuses} canMove={canMove} />)}
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
  const { t } = useI18n();
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
          <small><span dir="ltr">{entry.patientNumber}</span> · {waitingMinutes} {t("min","دقيقة")}</small>
        </div>
      </div>

      <div className="queue-card-meta">
        <span><Users size={13} />{entry.doctorName ?? t("Unassigned","غير معين")}</span>
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

      {move.isError && <div className="queue-error">{t("Queue changed. Board refreshed.","تم تغيير حالة الانتظار. تم تحديث اللوحة.")}</div>}
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
  const { t } = useI18n();
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
          <div><h2>{t("Check in patient","إضافة مريض للانتظار")}</h2><p>{t("Create the visit and add the patient to the first workflow status.","إنشاء الزيارة وإضافة المريض لأول حالة في مسار العمل.")}</p></div>
        </header>

        <div className="modal-body form-grid">
          <label className="field full-span">{t("Find patient","ابحث عن المريض")}
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Search name, patient number, or phone","ابحث بالاسم أو رقم المريض أو الهاتف")} />
          </label>

          <label className="field full-span">{t("Patient","المريض")}
            <select required value={patientId} onChange={event => setPatientId(event.target.value)}>
              <option value="">{t("Select patient","اختر المريض")}</option>
              {patients.data?.data.map(patient => (
                <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.patientNumber}</option>
              ))}
            </select>
          </label>

          <label className="field full-span">{t("Doctor","الطبيب")}
            <select required value={doctorId} onChange={event => setDoctorId(event.target.value)}>
              <option value="">{t("Select doctor","اختر الطبيب")}</option>
              {doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
            </select>
          </label>

          {doctors.length === 0 && <div className="error-box full-span">{t("No active doctor is available. Assign the Doctor role to an active user first.","لا يوجد طبيب نشط متاح. عيّن دور الطبيب لمستخدم نشط أولًا.")}</div>}
          {checkIn.isError && <div className="error-box full-span">{t("Unable to check in patient. The patient may already be active in the queue or workflow configuration may be missing.","تعذر إضافة المريض للانتظار. قد يكون المريض موجودًا بالفعل أو إعدادات المسار غير مكتملة.")}</div>}
        </div>

        <footer className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>{t("Cancel","إلغاء")}</button>
          <button className="primary-button" disabled={checkIn.isPending || !patientId || !doctorId}>
            {checkIn.isPending ? t("Checking in...","جارٍ الإضافة...") : t("Check in","إضافة للانتظار")}
          </button>
        </footer>
      </form>
    </div>
  );
}

function initials(value: string) {
  return value.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
