import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, Save, Square } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { authSession } from "../auth/authSession";
import { selectedVisit } from "./selectedVisit";
import { useClinicalOrder, useClinicalOrderDefinitions, useSaveClinicalOrder } from "./clinicalOrders.api";
import {
  useCompleteVisit,
  useEndVisitSession,
  useFinalizeVisitDocumentation,
  useSaveVisitDraft,
  useStartVisitSession,
  useVisitDetails
} from "./visits.api";

type DraftForm = {
  chiefComplaint: string;
  examination: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
};

export function VisitWorkspacePage() {
  const visitId = selectedVisit.get() ?? "";
  const details = useVisitDetails(visitId);
  const saveDraft = useSaveVisitDraft(visitId);
  const startSession = useStartVisitSession(visitId);
  const endSession = useEndVisitSession(visitId);
  const completeVisit = useCompleteVisit(visitId);
  const finalizeDocumentation = useFinalizeVisitDocumentation(visitId);
  const orderDefinitions = useClinicalOrderDefinitions();
  const clinicalOrder = useClinicalOrder(visitId);
  const saveClinicalOrder = useSaveClinicalOrder(visitId);
  const [orderValues, setOrderValues] = useState<Record<string, { textValue: string; itemsText: string }>>({});
  const [doctorId, setDoctorId] = useState("");
  const [form, setForm] = useState<DraftForm>({
    chiefComplaint: "",
    examination: "",
    diagnosis: "",
    treatmentPlan: "",
    notes: ""
  });

  const canEdit = authSession.hasPermission("Visit_Edit");
  const canStart = authSession.hasPermission("Visit_Start");

  useEffect(() => {
    if (!details.data) return;
    setForm({
      chiefComplaint: details.data.chiefComplaint ?? "",
      examination: details.data.examination ?? "",
      diagnosis: details.data.diagnosis ?? "",
      treatmentPlan: details.data.treatmentPlan ?? "",
      notes: details.data.notes ?? ""
    });
    setDoctorId(current => current || details.data.visit.doctorId);
  }, [details.data]);


  useEffect(() => {
    if (!orderDefinitions.data) return;

    const next: Record<string, { textValue: string; itemsText: string }> = {};
    for (const definition of orderDefinitions.data) {
      const existing = clinicalOrder.data?.sections.find(section => section.definitionCode === definition.code);
      next[definition.code] = {
        textValue: existing?.textValue ?? "",
        itemsText: existing?.items.map(item => item.name).join("\n") ?? ""
      };
    }
    setOrderValues(next);
  }, [orderDefinitions.data, clinicalOrder.data]);

  const activeSession = useMemo(
    () => details.data?.sessions.find(session => !session.endedAtUtc),
    [details.data?.sessions]
  );

  if (!visitId) return <Navigate to="/visits" replace />;
  if (details.isLoading) return <div className="state-card">Loading visit workspace...</div>;
  if (details.isError || !details.data) return <div className="state-card error-box">Unable to load visit workspace.</div>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveDraft.mutateAsync({
      rowVersion: details.data!.visit.rowVersion,
      chiefComplaint: form.chiefComplaint || null,
      examination: form.examination || null,
      diagnosis: form.diagnosis || null,
      treatmentPlan: form.treatmentPlan || null,
      notes: form.notes || null
    });
  }

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <Link className="back-link" to="/visits"><ArrowLeft size={14} />Visits</Link>
          <span className="eyebrow">DOCTOR WORKSPACE</span>
          <h1>{details.data.visit.patientName}</h1>
          <p>
            <span dir="ltr">{details.data.visit.patientNumber}</span>
            {" · "}
            {details.data.visit.status}
            {" · "}
            {details.data.visit.documentationStatus}
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <form className="card clinical-editor" onSubmit={submit}>
          <header className="section-head">
            <div>
              <span className="eyebrow">CLINICAL DOCUMENTATION</span>
              <h2>Visit notes</h2>
              <p>Draft saves use concurrency protection to avoid overwriting newer changes.</p>
            </div>
            {canEdit && (
              <button className="primary-button" disabled={saveDraft.isPending}>
                <Save size={15} />
                {saveDraft.isPending ? "Saving..." : "Save draft"}
              </button>
            )}
          </header>

          <div className="clinical-form">
            <label className="field">Chief complaint
              <textarea disabled={!canEdit} value={form.chiefComplaint} onChange={event => setForm({ ...form, chiefComplaint: event.target.value })} />
            </label>
            <label className="field">Examination
              <textarea disabled={!canEdit} value={form.examination} onChange={event => setForm({ ...form, examination: event.target.value })} />
            </label>
            <label className="field">Diagnosis
              <textarea disabled={!canEdit} value={form.diagnosis} onChange={event => setForm({ ...form, diagnosis: event.target.value })} />
            </label>
            <label className="field">Treatment plan
              <textarea disabled={!canEdit} value={form.treatmentPlan} onChange={event => setForm({ ...form, treatmentPlan: event.target.value })} />
            </label>
            <label className="field full-span">Notes
              <textarea disabled={!canEdit} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>

          {saveDraft.isSuccess && <div className="save-state success">Draft saved.</div>}
          {saveDraft.isError && <div className="save-state error-box">Draft changed or could not be saved. Reload the visit and try again.</div>}
        </form>


        <section className="card clinical-order-card">
          <header className="section-head">
            <div>
              <span className="eyebrow">CLINICAL ORDERS</span>
              <h2>Prescription & orders</h2>
              <p>Sections are configured by the clinic and saved against this visit.</p>
            </div>
            {canEdit && (
              <button
                type="button"
                className="primary-button"
                disabled={saveClinicalOrder.isPending || orderDefinitions.isLoading}
                onClick={() => {
                  const sections = (orderDefinitions.data ?? []).map(definition => {
                    const value = orderValues[definition.code] ?? { textValue: "", itemsText: "" };
                    return {
                      definitionCode: definition.code,
                      textValue: definition.sectionType === "Text" ? (value.textValue || null) : null,
                      items: definition.sectionType === "Structured"
                        ? value.itemsText
                            .split("\n")
                            .map(item => item.trim())
                            .filter(Boolean)
                            .map(name => ({ name, detailsJson: null }))
                        : []
                    };
                  });
                  saveClinicalOrder.mutate({ sections });
                }}
              >
                <Save size={15} />
                {saveClinicalOrder.isPending ? "Saving..." : "Save orders"}
              </button>
            )}
          </header>

          {orderDefinitions.isLoading && <div className="state-card">Loading clinical order sections...</div>}
          {orderDefinitions.isError && <div className="error-box">Unable to load clinical order configuration.</div>}
          {orderDefinitions.data?.length === 0 && (
            <div className="mini-empty">No clinical order sections are configured yet.</div>
          )}

          <div className="clinical-order-sections">
            {orderDefinitions.data?.map(definition => {
              const value = orderValues[definition.code] ?? { textValue: "", itemsText: "" };
              return (
                <label className="field" key={definition.code}>
                  {definition.name}
                  {definition.sectionType === "Text" ? (
                    <textarea
                      disabled={!canEdit}
                      value={value.textValue}
                      onChange={event =>
                        setOrderValues(current => ({
                          ...current,
                          [definition.code]: { ...value, textValue: event.target.value }
                        }))
                      }
                    />
                  ) : definition.sectionType === "Structured" ? (
                    <textarea
                      disabled={!canEdit}
                      value={value.itemsText}
                      placeholder="One item per line"
                      onChange={event =>
                        setOrderValues(current => ({
                          ...current,
                          [definition.code]: { ...value, itemsText: event.target.value }
                        }))
                      }
                    />
                  ) : (
                    <div className="mini-empty">Attachments for this section will use the file workflow.</div>
                  )}
                </label>
              );
            })}
          </div>

          {saveClinicalOrder.isSuccess && <div className="save-state success">Clinical orders saved.</div>}
          {saveClinicalOrder.isError && <div className="error-box">Unable to save clinical orders.</div>}
        </section>

        <aside className="workspace-side">
          <section className="card">
            <header className="section-head">
              <div><h2>Doctor session</h2><p>Only one session can be active at a time.</p></div>
            </header>

            {activeSession ? (
              <div className="session-card active">
                <strong>{activeSession.doctorName}</strong>
                <small>Started {new Date(activeSession.startedAtUtc).toLocaleString()}</small>
                {canStart && (
                  <button className="secondary-button" disabled={endSession.isPending} onClick={() => endSession.mutate(activeSession.id)}>
                    <Square size={14} />End session
                  </button>
                )}
              </div>
            ) : (
              <div className="session-start">
                <label className="field">Doctor
                  <select value={doctorId} onChange={event => setDoctorId(event.target.value)} disabled={!canStart}>
                    {details.data.availableDoctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
                  </select>
                </label>
                {canStart && (
                  <button className="primary-button" disabled={!doctorId || startSession.isPending} onClick={() => startSession.mutate(doctorId)}>
                    <Play size={14} />Start session
                  </button>
                )}
              </div>
            )}

            {(startSession.isError || endSession.isError) && <div className="error-box">Unable to change the active session.</div>}
          </section>

          <section className="card">
            <header className="section-head">
              <div><h2>Visit lifecycle</h2><p>Visit completion and documentation are separate states.</p></div>
            </header>

            <div className="visit-lifecycle">
              <div><span>Visit</span><strong>{details.data.visit.status}</strong></div>
              <div><span>Documentation</span><strong>{details.data.visit.documentationStatus}</strong></div>
            </div>

            {canEdit && details.data.visit.status === "Open" && (
              <button
                className="primary-button"
                disabled={Boolean(activeSession) || completeVisit.isPending}
                onClick={() => completeVisit.mutate(details.data!.visit.rowVersion)}
              >
                {completeVisit.isPending ? "Completing..." : "Complete visit"}
              </button>
            )}

            {canEdit && details.data.visit.documentationStatus !== "Completed" && (
              <button
                className="secondary-button"
                disabled={finalizeDocumentation.isPending}
                onClick={() => finalizeDocumentation.mutate(details.data!.visit.rowVersion)}
              >
                {finalizeDocumentation.isPending ? "Finalizing..." : "Finalize documentation"}
              </button>
            )}

            {activeSession && details.data.visit.status === "Open" && (
              <div className="lifecycle-note">End the active doctor session before completing the visit.</div>
            )}

            {(completeVisit.isError || finalizeDocumentation.isError) && (
              <div className="error-box">Visit state changed or workflow configuration is incomplete. Reload and try again.</div>
            )}
          </section>

          <section className="card">
            <header className="section-head"><div><h2>Session history</h2></div></header>
            <div className="session-history">
              {details.data.sessions.length === 0 && <div className="mini-empty">No doctor sessions yet.</div>}
              {details.data.sessions.map(session => (
                <div key={session.id}>
                  <strong>{session.doctorName}</strong>
                  <small>
                    {new Date(session.startedAtUtc).toLocaleString()}
                    {session.endedAtUtc ? " → " + new Date(session.endedAtUtc).toLocaleString() : " · Active"}
                  </small>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
