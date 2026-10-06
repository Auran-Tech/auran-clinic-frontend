import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, Plus, Save, Square } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n/i18n";
import { authSession } from "../auth/authSession";
import { selectedVisit } from "./selectedVisit";
import { useClinicalOrder, useClinicalOrderDefinitions, useSaveClinicalOrder } from "./clinicalOrders.api";
import { downloadFile, useClinicalOrderFiles, useUploadClinicalOrderFile } from "../files/files.api";
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
  const { t } = useI18n();
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
  const orderFiles = useClinicalOrderFiles(visitId);
  const uploadOrderFile = useUploadClinicalOrderFile(visitId);
  const [orderValues, setOrderValues] = useState<Record<string, { textValue: string; itemsText: string }>>({});
  const [attachmentSection, setAttachmentSection] = useState("");
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
  if (details.isLoading) return <div className="state-card">{t("Loading visit workspace...","جارٍ تحميل مساحة عمل الزيارة...")}</div>;
  if (details.isError || !details.data) return <div className="state-card error-box">{t("Unable to load visit workspace.","تعذر تحميل مساحة عمل الزيارة.")}</div>;

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
          <Link className="back-link" to="/visits"><ArrowLeft size={14} />{t("Visits","الزيارات")}</Link>
          <span className="eyebrow">{t("DOCTOR WORKSPACE","مساحة عمل الطبيب")}</span>
          <h1>{details.data.visit.patientName}</h1>
          <p>
            <span dir="ltr">{details.data.visit.patientNumber}</span>
            {" · "}
            {visitStatusLabel(details.data.visit.status,t)}
            {" · "}
            {documentationLabel(details.data.visit.documentationStatus,t)}
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <form className="card clinical-editor" onSubmit={submit}>
          <header className="section-head">
            <div>
              <span className="eyebrow">{t("CLINICAL DOCUMENTATION","التوثيق الطبي")}</span>
              <h2>{t("Visit notes","ملاحظات الزيارة")}</h2>
              <p>{t("Draft saves use concurrency protection to avoid overwriting newer changes.","يتم حفظ المسودة مع حماية من الكتابة فوق تعديلات أحدث.")}</p>
            </div>
            {canEdit && (
              <button className="primary-button" disabled={saveDraft.isPending}>
                <Save size={15} />
                {saveDraft.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save draft","حفظ المسودة")}
              </button>
            )}
          </header>

          <div className="clinical-form">
            <label className="field">{t("Chief complaint","الشكوى الرئيسية")}
              <textarea disabled={!canEdit} value={form.chiefComplaint} onChange={event => setForm({ ...form, chiefComplaint: event.target.value })} />
            </label>
            <label className="field">{t("Examination","الفحص")}
              <textarea disabled={!canEdit} value={form.examination} onChange={event => setForm({ ...form, examination: event.target.value })} />
            </label>
            <label className="field">{t("Diagnosis","التشخيص")}
              <textarea disabled={!canEdit} value={form.diagnosis} onChange={event => setForm({ ...form, diagnosis: event.target.value })} />
            </label>
            <label className="field">{t("Treatment plan","خطة العلاج")}
              <textarea disabled={!canEdit} value={form.treatmentPlan} onChange={event => setForm({ ...form, treatmentPlan: event.target.value })} />
            </label>
            <label className="field full-span">{t("Notes","ملاحظات")}
              <textarea disabled={!canEdit} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>

          {saveDraft.isSuccess && <div className="save-state success">{t("Draft saved.","تم حفظ المسودة.")}</div>}
          {saveDraft.isError && <div className="save-state error-box">{t("Draft changed or could not be saved. Reload the visit and try again.","تعذر حفظ المسودة أو تم تعديلها من مستخدم آخر. أعد تحميل الزيارة وحاول مرة أخرى.")}</div>}
        </form>


        <section className="card clinical-order-card">
          <header className="section-head">
            <div>
              <span className="eyebrow">{t("CLINICAL ORDERS","الطلبات الطبية")}</span>
              <h2>{t("Prescription & orders","الروشتة والطلبات")}</h2>
              <p>{t("Sections are configured by the clinic and saved against this visit.","يتم إعداد الأقسام من العيادة وحفظها على هذه الزيارة.")}</p>
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
                {saveClinicalOrder.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save orders","حفظ الطلبات")}
              </button>
            )}
          </header>

          {orderDefinitions.isLoading && <div className="state-card">{t("Loading clinical order sections...","جارٍ تحميل أقسام الطلبات الطبية...")}</div>}
          {orderDefinitions.isError && <div className="error-box">{t("Unable to load clinical order configuration.","تعذر تحميل إعدادات الطلبات الطبية.")}</div>}
          {orderDefinitions.data?.length === 0 && (
            <div className="mini-empty">{t("No clinical order sections are configured yet.","لا توجد أقسام للطلبات الطبية مُعدة بعد.")}</div>
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
                      placeholder={t("One item per line","عنصر واحد في كل سطر")}
                      onChange={event =>
                        setOrderValues(current => ({
                          ...current,
                          [definition.code]: { ...value, itemsText: event.target.value }
                        }))
                      }
                    />
                  ) : (
                    <div className="mini-empty">{t("Attachments for this section will use the file workflow.","تُضاف مرفقات هذا القسم من خلال نظام الملفات.")}</div>
                  )}
                </label>
              );
            })}
          </div>


          <div className="clinical-order-files">
            <div className="config-head">
              <h3>{t("Order attachments","مرفقات الطلبات")}</h3>
              {canEdit && (
                <div className="order-file-upload">
                  <select value={attachmentSection} onChange={event => setAttachmentSection(event.target.value)}>
                    <option value="">{t("Whole order","الطلب بالكامل")}</option>
                    {(orderDefinitions.data ?? [])
                      .filter(definition => definition.sectionType === "Image" || definition.sectionType === "File")
                      .map(definition => <option key={definition.code} value={definition.code}>{definition.name}</option>)}
                  </select>
                  <label className="secondary-button file-picker">
                    <Plus size={14} />{t("Upload","رفع")}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx"
                      onChange={async event => {
                        const selected = event.target.files?.[0];
                        if (!selected) return;
                        await uploadOrderFile.mutateAsync({
                          file: selected,
                          definitionCode: attachmentSection || null
                        });
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {orderFiles.isLoading && <div className="state-card">{t("Loading order files...","جارٍ تحميل مرفقات الطلبات...")}</div>}
            {orderFiles.data?.length === 0 && <div className="mini-empty">{t("No order attachments yet.","لا توجد مرفقات للطلبات بعد.")}</div>}
            <div className="attachment-list">
              {orderFiles.data?.map(file => (
                <button key={file.fileId} className="attachment-row" onClick={() => downloadFile(file)}>
                  <div>
                    <strong>{file.originalName}</strong>
                    <small>{file.category || t("Whole order","الطلب بالكامل")} · {formatBytes(file.size)}</small>
                  </div>
                  <span dir="ltr">{new Date(file.uploadedAtUtc).toLocaleString()}</span>
                </button>
              ))}
            </div>
            {uploadOrderFile.isError && <div className="error-box">{t("Upload rejected. Save the order first and check file type/size.","تم رفض الرفع. احفظ الطلب أولًا وتحقق من نوع الملف وحجمه.")}</div>}
          </div>

          {saveClinicalOrder.isSuccess && <div className="save-state success">{t("Clinical orders saved.","تم حفظ الطلبات الطبية.")}</div>}
          {saveClinicalOrder.isError && <div className="error-box">{t("Unable to save clinical orders.","تعذر حفظ الطلبات الطبية.")}</div>}
        </section>

        <aside className="workspace-side">
          <section className="card">
            <header className="section-head">
              <div><h2>{t("Doctor session","جلسة الطبيب")}</h2><p>{t("Only one session can be active at a time.","يمكن أن تكون هناك جلسة واحدة نشطة فقط في نفس الوقت.")}</p></div>
            </header>

            {activeSession ? (
              <div className="session-card active">
                <strong>{activeSession.doctorName}</strong>
                <small>{t("Started","بدأت")} {new Date(activeSession.startedAtUtc).toLocaleString()}</small>
                {canStart && (
                  <button className="secondary-button" disabled={endSession.isPending} onClick={() => endSession.mutate(activeSession.id)}>
                    <Square size={14} />{t("End session","إنهاء الجلسة")}
                  </button>
                )}
              </div>
            ) : (
              <div className="session-start">
                <label className="field">{t("Doctor","الطبيب")}
                  <select value={doctorId} onChange={event => setDoctorId(event.target.value)} disabled={!canStart}>
                    {details.data.availableDoctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
                  </select>
                </label>
                {canStart && (
                  <button className="primary-button" disabled={!doctorId || startSession.isPending} onClick={() => startSession.mutate(doctorId)}>
                    <Play size={14} />{t("Start session","بدء الجلسة")}
                  </button>
                )}
              </div>
            )}

            {(startSession.isError || endSession.isError) && <div className="error-box">{t("Unable to change the active session.","تعذر تغيير الجلسة النشطة.")}</div>}
          </section>

          <section className="card">
            <header className="section-head">
              <div><h2>{t("Visit lifecycle","دورة الزيارة")}</h2><p>{t("Visit completion and documentation are separate states.","إكمال الزيارة وإكمال التوثيق حالتان منفصلتان.")}</p></div>
            </header>

            <div className="visit-lifecycle">
              <div><span>{t("Visit","الزيارة")}</span><strong>{visitStatusLabel(details.data.visit.status,t)}</strong></div>
              <div><span>{t("Documentation","التوثيق")}</span><strong>{documentationLabel(details.data.visit.documentationStatus,t)}</strong></div>
            </div>

            {canEdit && details.data.visit.status === "Open" && (
              <button
                className="primary-button"
                disabled={Boolean(activeSession) || completeVisit.isPending}
                onClick={() => completeVisit.mutate(details.data!.visit.rowVersion)}
              >
                {completeVisit.isPending ? t("Completing...","جارٍ الإكمال...") : t("Complete visit","إكمال الزيارة")}
              </button>
            )}

            {canEdit && details.data.visit.documentationStatus !== "Completed" && (
              <button
                className="secondary-button"
                disabled={finalizeDocumentation.isPending}
                onClick={() => finalizeDocumentation.mutate(details.data!.visit.rowVersion)}
              >
                {finalizeDocumentation.isPending ? t("Finalizing...","جارٍ الإنهاء...") : t("Finalize documentation","إنهاء التوثيق")}
              </button>
            )}

            {activeSession && details.data.visit.status === "Open" && (
              <div className="lifecycle-note">{t("End the active doctor session before completing the visit.","أنه جلسة الطبيب النشطة قبل إكمال الزيارة.")}</div>
            )}

            {(completeVisit.isError || finalizeDocumentation.isError) && (
              <div className="error-box">{t("Visit state changed or workflow configuration is incomplete. Reload and try again.","تغيرت حالة الزيارة أو إعدادات المسار غير مكتملة. أعد التحميل وحاول مرة أخرى.")}</div>
            )}
          </section>

          <section className="card">
            <header className="section-head"><div><h2>{t("Session history","سجل الجلسات")}</h2></div></header>
            <div className="session-history">
              {details.data.sessions.length === 0 && <div className="mini-empty">{t("No doctor sessions yet.","لا توجد جلسات أطباء بعد.")}</div>}
              {details.data.sessions.map(session => (
                <div key={session.id}>
                  <strong>{session.doctorName}</strong>
                  <small>
                    {new Date(session.startedAtUtc).toLocaleString()}
                    {session.endedAtUtc ? " → " + new Date(session.endedAtUtc).toLocaleString() : " · " + t("Active","نشطة")}
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


function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}


function visitStatusLabel(value:string,t:(english:string,arabic:string)=>string){
  if(value==="Open") return t("Open","مفتوحة");
  if(value==="Completed") return t("Completed","مكتملة");
  if(value==="Cancelled") return t("Cancelled","ملغاة");
  return value;
}

function documentationLabel(value:string,t:(english:string,arabic:string)=>string){
  if(value==="NotStarted") return t("Not started","لم يبدأ");
  if(value==="Draft") return t("Draft","مسودة");
  if(value==="Pending") return t("Pending","معلق");
  if(value==="Completed") return t("Completed","مكتمل");
  return value;
}
