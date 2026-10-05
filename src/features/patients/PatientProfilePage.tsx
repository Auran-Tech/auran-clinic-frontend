import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
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

type Kind = "allergies" | "conditions" | "medications";

export function PatientProfilePage() {
  const patientId = selectedPatient.get() ?? "";
  const { data, isLoading, isError } = usePatientProfile(patientId);
  const dynamicProfile = usePatientDynamicProfile(patientId);
  const measurements = usePatientMeasurements(patientId);
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

      <section className="card clinical-block">
        <header className="section-head">
          <div>
            <span className="eyebrow">CONFIGURABLE PROFILE</span>
            <h2>Custom patient profile</h2>
            <p>Fields are defined by clinic configuration and rendered dynamically.</p>
          </div>
        </header>

        {dynamicProfile.isLoading && <div className="state-card">Loading profile fields...</div>}
        {dynamicProfile.isError && <div className="error-box">Unable to load custom profile.</div>}
        {dynamicProfile.data?.sections.length === 0 && <div className="mini-empty">No custom profile fields are configured.</div>}

        <div className="dynamic-sections">
          {dynamicProfile.data?.sections.map(section => (
            <article key={section.sectionId} className="dynamic-section">
              <header><h3>{section.name}</h3><small>{section.fields.length} fields</small></header>
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
            <span className="eyebrow">CLINICAL DATA</span>
            <h2>Measurements</h2>
            <p>Latest patient measurements based on clinic-configured clinical fields.</p>
          </div>
          {canEdit && <button className="primary-button" onClick={() => setMeasurementOpen(true)}><Plus size={15} />Add measurement</button>}
        </header>

        {measurements.isLoading && <div className="state-card">Loading measurements...</div>}
        {measurements.isError && <div className="error-box">Unable to load measurements.</div>}
        {measurements.data && measurements.data.measurements.length === 0 && <div className="mini-empty">No measurements recorded yet.</div>}

        <div className="measurement-list">
          {measurements.data?.measurements.map(item => (
            <div key={item.id} className="measurement-row">
              <div><strong>{item.fieldName}</strong><small>{new Date(item.recordedAtUtc).toLocaleString()}</small></div>
              <b>{formatMeasurement(item)} {item.unit ?? ""}</b>
            </div>
          ))}
        </div>
      </section>

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
            <option value="">Not set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        ) : field.fieldType === "SingleSelect" ? (
          <select disabled={!canEdit} value={value} onChange={event => setValue(event.target.value)}>
            <option value="">Select</option>
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
        {canEdit && <button className="icon-button" disabled={save.isPending} onClick={saveValue} aria-label={`Save ${field.label}`}><Save size={14} /></button>}
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
        <header className="modal-head"><div><h2>Add measurement</h2><p>Record a new clinical measurement.</p></div></header>
        <div className="modal-body form-grid">
          <label className="field">Measurement
            <select required value={fieldId} onChange={event => { setFieldId(event.target.value); setValue(""); }}>
              {fields.map(field => <option key={field.id} value={field.id}>{field.name}{field.unit ? ` (${field.unit})` : ""}</option>)}
            </select>
          </label>
          <label className="field">Value
            {selected?.fieldType === "Boolean" ? (
              <select value={value} onChange={event => setValue(event.target.value)} required>
                <option value="">Select</option><option value="true">Yes</option><option value="false">No</option>
              </select>
            ) : (
              <input required type={selected?.fieldType === "Number" ? "number" : selected?.fieldType === "Date" ? "date" : "text"} value={value} onChange={event => setValue(event.target.value)} />
            )}
          </label>
          {mutation.isError && <div className="error-box">Unable to save measurement.</div>}
        </div>
        <footer className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={mutation.isPending || fields.length === 0}>{mutation.isPending ? "Saving..." : "Save measurement"}</button>
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
}) {
  if (item.numberValue != null) return item.numberValue;
  if (item.booleanValue != null) return item.booleanValue ? "Yes" : "No";
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
