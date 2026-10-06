import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n/i18n";
import { authSession } from "../auth/authSession";
import { useAddProfileItem, usePatientProfile } from "./patientProfile.api";
import {
  useAddMeasurement,
  usePatientDynamicProfile,
  usePatientMeasurements,
  useSaveDynamicValue,
  type ClinicalField,
  type PatientDynamicField
} from "./patientClinicalData.api";
import { selectedPatient } from "./selectedPatient";
import { downloadFile, usePatientFiles, useUploadPatientFile } from "../files/files.api";

type Kind = "allergies" | "conditions" | "medications";

export function PatientProfilePage() {
  const { t } = useI18n();
  const patientId = selectedPatient.get() ?? "";
  const { data, isLoading, isError } = usePatientProfile(patientId);
  const dynamicProfile = usePatientDynamicProfile(patientId);
  const measurements = usePatientMeasurements(patientId);
  const files = usePatientFiles(patientId);
  const uploadFile = useUploadPatientFile(patientId);
  const [fileCategory, setFileCategory] = useState("");
  const [fileNotes, setFileNotes] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [measurementOpen, setMeasurementOpen] = useState(false);
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
  if (isLoading) return <div className="state-card">{t("Loading patient profile...","جارٍ تحميل ملف المريض...")}</div>;
  if (isError || !data) return <div className="state-card error-box">{t("Unable to load patient profile.","تعذر تحميل ملف المريض.")}</div>;

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <Link className="back-link" to="/patients"><ArrowLeft size={14} />{t("Patients","المرضى")}</Link>
          <span className="eyebrow">{t("PATIENT PROFILE","ملف المريض")}</span>
          <h1>{data.patient.fullName}</h1>
          <p><code dir="ltr">{data.patient.patientNumber}</code> · <span dir="ltr">{data.patient.phone}</span></p>
        </div>
      </header>

      <div className="profile-summary card">
        <div><small>{t("Gender","النوع")}</small><strong>{data.patient.gender==="Male"?t("Male","ذكر"):data.patient.gender==="Female"?t("Female","أنثى"):data.patient.gender??"—"}</strong></div>
        <div><small>{t("Date of birth","تاريخ الميلاد")}</small><strong dir="ltr">{data.patient.dateOfBirth ?? "—"}</strong></div>
        <div><small>{t("Patient ID","رقم المريض")}</small><strong><code dir="ltr">{data.patient.patientNumber}</code></strong></div>
      </div>

      <div className="profile-grid">
        <ProfileSection
          title={t("Allergies","الحساسية")}
          items={data.allergies.map(item => ({ id: item.id, title: item.name, detail: item.reaction }))}
          canEdit={canEdit}
          onAdd={() => setKind("allergies")}
        />
        <ProfileSection
          title={t("Conditions","الأمراض")}
          items={data.conditions.map(item => ({ id: item.id, title: item.name, detail: item.notes }))}
          canEdit={canEdit}
          onAdd={() => setKind("conditions")}
        />
        <ProfileSection
          title={t("Medications","الأدوية")}
          items={data.medications.map(item => ({ id: item.id, title: item.name, detail: item.dosage }))}
          canEdit={canEdit}
          onAdd={() => setKind("medications")}
        />
      </div>

      <section className="card clinical-block">
        <header className="section-head">
          <div>
            <span className="eyebrow">{t("CONFIGURABLE PROFILE","الملف القابل للتخصيص")}</span>
            <h2>{t("Custom patient profile","بيانات المريض الإضافية")}</h2>
            <p>{t("Fields are defined by clinic configuration and rendered dynamically.","يتم تحديد الحقول من إعدادات العيادة وعرضها ديناميكيًا.")}</p>
          </div>
        </header>

        {dynamicProfile.isLoading && <div className="state-card">{t("Loading profile fields...","جارٍ تحميل حقول الملف...")}</div>}
        {dynamicProfile.isError && <div className="error-box">{t("Unable to load custom profile.","تعذر تحميل الملف المخصص.")}</div>}
        {dynamicProfile.data?.sections.length === 0 && <div className="mini-empty">{t("No custom profile fields are configured.","لا توجد حقول إضافية مُعدة.")}</div>}

        <div className="dynamic-sections">
          {dynamicProfile.data?.sections.map(section => (
            <article key={section.sectionId} className="dynamic-section">
              <header><h3>{section.name}</h3><small>{section.fields.length} {t("fields","حقول")}</small></header>
              <div className="dynamic-fields">
                {section.fields.map(field => (
                  <DynamicFieldEditor key={field.fieldId} field={field} patientId={patientId} canEdit={canEdit} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card clinical-block">
        <header className="section-head">
          <div>
            <span className="eyebrow">{t("CLINICAL DATA","البيانات الطبية")}</span>
            <h2>{t("Measurements","القياسات")}</h2>
            <p>{t("Latest patient measurements based on clinic-configured clinical fields.","أحدث قياسات المريض حسب الحقول الطبية المُعدة بالعيادة.")}</p>
          </div>
          {canEdit && <button className="primary-button" onClick={() => setMeasurementOpen(true)}><Plus size={15} />{t("Add measurement","إضافة قياس")}</button>}
        </header>

        {measurements.isLoading && <div className="state-card">{t("Loading measurements...","جارٍ تحميل القياسات...")}</div>}
        {measurements.isError && <div className="error-box">{t("Unable to load measurements.","تعذر تحميل القياسات.")}</div>}
        {measurements.data && measurements.data.measurements.length === 0 && <div className="mini-empty">{t("No measurements recorded yet.","لا توجد قياسات مسجلة بعد.")}</div>}

        <div className="measurement-list">
          {measurements.data?.measurements.map(item => (
            <div key={item.id} className="measurement-row">
              <div><strong>{item.fieldName}</strong><small>{new Date(item.recordedAtUtc).toLocaleString()}</small></div>
              <b>{formatMeasurement(item,t)} {item.unit ?? ""}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="card clinical-block">
        <header className="section-head">
          <div>
            <span className="eyebrow">{t("PATIENT FILES","ملفات المريض")}</span>
            <h2>{t("Attachments","المرفقات")}</h2>
            <p>{t("PDF, images, text and DOCX files linked to this patient.","ملفات PDF وصور ونصوص وDOCX مرتبطة بالمريض.")}</p>
          </div>
          {canEdit && (
            <label className="secondary-button file-picker">
              <Plus size={15} />{t("Upload file","رفع ملف")}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx"
                onChange={async event => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  await uploadFile.mutateAsync({
                    file: selected,
                    category: fileCategory || undefined,
                    notes: fileNotes || undefined
                  });
                  event.target.value = "";
                }}
              />
            </label>
          )}
        </header>

        {canEdit && (
          <div className="attachment-meta-form">
            <label className="field">{t("Category","التصنيف")}
              <input value={fileCategory} onChange={event => setFileCategory(event.target.value)} placeholder={t("Lab, Scan, Referral...","معمل، أشعة، تحويل...")} />
            </label>
            <label className="field">{t("Notes","ملاحظات")}
              <input value={fileNotes} onChange={event => setFileNotes(event.target.value)} placeholder={t("Optional note","ملاحظة اختيارية")} />
            </label>
          </div>
        )}

        {files.isLoading && <div className="state-card">{t("Loading files...","جارٍ تحميل الملفات...")}</div>}
        {files.isError && <div className="error-box">{t("Unable to load patient files.","تعذر تحميل ملفات المريض.")}</div>}
        {files.data?.length === 0 && <div className="mini-empty">{t("No files uploaded yet.","لا توجد ملفات مرفوعة بعد.")}</div>}

        <div className="attachment-list">
          {files.data?.map(file => (
            <button key={file.fileId} className="attachment-row" onClick={() => downloadFile(file)}>
              <div>
                <strong>{file.originalName}</strong>
                <small>{file.category || t("Attachment","مرفق")} · {formatBytes(file.size)}</small>
              </div>
              <span dir="ltr">{new Date(file.uploadedAtUtc).toLocaleString()}</span>
            </button>
          ))}
        </div>

        {uploadFile.isError && <div className="error-box">{t("Upload rejected. Check file type and size.","تم رفض الرفع. تحقق من نوع الملف وحجمه.")}</div>}
      </section>

      {kind && (
        <div className="modal-backdrop">
          <form className="modal compact-modal" onSubmit={submit}>
            <header className="modal-head">
              <div><h2>{kindTitle(kind,t)}</h2><p>{t("Saved to the patient's clinical profile.","سيتم الحفظ في الملف الطبي للمريض.")}</p></div>
            </header>
            <div className="modal-body form-grid">
              <label className="field">{t("Name","الاسم")}<input required value={name} onChange={event => setName(event.target.value)} /></label>
              <label className="field">
                {kind === "allergies" ? t("Reaction","رد الفعل") : kind === "medications" ? t("Dosage","الجرعة") : t("Notes","ملاحظات")}
                <input value={detail} onChange={event => setDetail(event.target.value)} />
              </label>
              {mutation.isError && <div className="error-box">{t("Unable to save clinical profile item.","تعذر حفظ العنصر في الملف الطبي.")}</div>}
            </div>
            <footer className="modal-foot">
              <button type="button" className="secondary-button" onClick={() => setKind(null)}>{t("Cancel","إلغاء")}</button>
              <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save","حفظ")}</button>
            </footer>
          </form>
        </div>
      )}

      {measurementOpen && measurements.data && (
        <MeasurementModal
          patientId={patientId}
          fields={measurements.data.fields}
          onClose={() => setMeasurementOpen(false)}
        />
      )}
    </section>
  );
}

function DynamicFieldEditor({
  field,
  patientId,
  canEdit
}: {
  field: PatientDynamicField;
  patientId: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const save = useSaveDynamicValue(patientId);
  const initialValue = useMemo(() => getDynamicValue(field), [field]);
  const [value, setValue] = useState(initialValue);

  async function saveValue() {
    const payload: Record<string, unknown> = { fieldId: field.fieldId };

    if (field.fieldType === "Number") payload.numberValue = value === "" ? null : Number(value);
    else if (field.fieldType === "Boolean") payload.booleanValue = value === "true";
    else if (field.fieldType === "Date") payload.dateValue = value || null;
    else if (field.fieldType === "MultiSelect") payload.jsonValue = value || null;
    else payload.textValue = value || null;

    await save.mutateAsync(payload);
  }

  return (
    <div className="dynamic-field">
      <label>{field.label}{field.isRequired && <span>*</span>}</label>
      <div className="dynamic-control">
        {field.fieldType === "Boolean" ? (
          <select disabled={!canEdit} value={value} onChange={event => setValue(event.target.value)}>
            <option value="">{t("Not set","غير محدد")}</option>
            <option value="true">{t("Yes","نعم")}</option>
            <option value="false">{t("No","لا")}</option>
          </select>
        ) : field.fieldType === "SingleSelect" ? (
          <select disabled={!canEdit} value={value} onChange={event => setValue(event.target.value)}>
            <option value="">{t("Select","اختر")}</option>
            {field.options.map(option => <option key={option.id} value={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <input
            disabled={!canEdit}
            type={field.fieldType === "Number" ? "number" : field.fieldType === "Date" ? "date" : "text"}
            value={value}
            onChange={event => setValue(event.target.value)}
          />
        )}
        {canEdit && <button className="icon-button" disabled={save.isPending} onClick={saveValue} aria-label={t(`Save ${field.label}`,`حفظ ${field.label}`)}><Save size={14} /></button>}
      </div>
    </div>
  );
}

function MeasurementModal({
  patientId,
  fields,
  onClose
}: {
  patientId: string;
  fields: ClinicalField[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const mutation = useAddMeasurement(patientId);
  const [fieldId, setFieldId] = useState(fields[0]?.id ?? "");
  const [value, setValue] = useState("");
  const selected = fields.find(field => field.id === fieldId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;

    const payload: Record<string, unknown> = { clinicalFieldId: selected.id };
    if (selected.fieldType === "Number") payload.numberValue = Number(value);
    else if (selected.fieldType === "Boolean") payload.booleanValue = value === "true";
    else if (selected.fieldType === "Date") payload.dateValue = value || null;
    else payload.textValue = value || null;

    await mutation.mutateAsync(payload);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal compact-modal" onSubmit={submit}>
        <header className="modal-head"><div><h2>{t("Add measurement","إضافة قياس")}</h2><p>{t("Record a new clinical measurement.","سجل قياسًا طبيًا جديدًا.")}</p></div></header>
        <div className="modal-body form-grid">
          <label className="field">{t("Measurement","القياس")}
            <select required value={fieldId} onChange={event => { setFieldId(event.target.value); setValue(""); }}>
              {fields.map(field => <option key={field.id} value={field.id}>{field.name}{field.unit ? ` (${field.unit})` : ""}</option>)}
            </select>
          </label>
          <label className="field">{t("Value","القيمة")}
            {selected?.fieldType === "Boolean" ? (
              <select value={value} onChange={event => setValue(event.target.value)} required>
                <option value="">{t("Select","اختر")}</option><option value="true">{t("Yes","نعم")}</option><option value="false">{t("No","لا")}</option>
              </select>
            ) : (
              <input required type={selected?.fieldType === "Number" ? "number" : selected?.fieldType === "Date" ? "date" : "text"} value={value} onChange={event => setValue(event.target.value)} />
            )}
          </label>
          {mutation.isError && <div className="error-box">{t("Unable to save measurement.","تعذر حفظ القياس.")}</div>}
        </div>
        <footer className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>{t("Cancel","إلغاء")}</button>
          <button className="primary-button" disabled={mutation.isPending || fields.length === 0}>{mutation.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save measurement","حفظ القياس")}</button>
        </footer>
      </form>
    </div>
  );
}

function getDynamicValue(field: PatientDynamicField): string {
  if (field.fieldType === "Number") return field.numberValue?.toString() ?? "";
  if (field.fieldType === "Boolean") return field.booleanValue == null ? "" : String(field.booleanValue);
  if (field.fieldType === "Date") return field.dateValue ?? "";
  if (field.fieldType === "MultiSelect") return field.jsonValue ?? "";
  return field.textValue ?? "";
}

function formatMeasurement(item: {
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: string | null;
}, t:(english:string,arabic:string)=>string) {
  if (item.numberValue != null) return item.numberValue;
  if (item.booleanValue != null) return item.booleanValue ? t("Yes","نعم") : t("No","لا");
  if (item.dateValue) return item.dateValue;
  if (item.textValue) return item.textValue;
  if (item.jsonValue) return item.jsonValue;
  return "—";
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
  const { t } = useI18n();
  return (
    <article className="card profile-section">
      <header>
        <div><h2>{title}</h2><small>{items.length} {t("recorded","مسجل")}</small></div>
        {canEdit && <button className="icon-button" onClick={onAdd} aria-label={t(`Add ${title}`,`إضافة ${title}`)}><Plus size={16} /></button>}
      </header>

      {items.length === 0 ? (
        <div className="mini-empty">{t("Nothing recorded yet.","لا توجد بيانات مسجلة بعد.")}</div>
      ) : (
        <div className="profile-items">
          {items.map(item => (
            <div key={item.id}>
              <strong>{item.title}</strong>
              <small>{item.detail || t("No additional details","لا توجد تفاصيل إضافية")}</small>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function kindTitle(kind:Kind,t:(english:string,arabic:string)=>string){
  if(kind==="allergies")return t("Add allergy","إضافة حساسية");
  if(kind==="conditions")return t("Add condition","إضافة مرض");
  return t("Add medication","إضافة دواء");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
