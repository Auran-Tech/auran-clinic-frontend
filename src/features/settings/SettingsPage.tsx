import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { authSession } from "../auth/authSession";
import {
  useClinicSettings,
  useFieldSettings,
  useSaveClinicSettings,
  useSaveFieldSettings,
  useSaveWorkflowSettings,
  useWorkflowSettings,
  type ClinicSettings,
  type DynamicFieldType,
  type SaveClinicalFieldSetting,
  type SaveFieldOptionSetting,
  type SavePatientProfileFieldSetting,
  type SavePatientProfileSectionSetting,
  type WorkflowSettings
} from "./settings.api";
import {
  useAllClinicalOrderDefinitions,
  useSaveClinicalOrderDefinitions,
  type ClinicalOrderDefinition,
  type ClinicalOrderSectionType
} from "../visits/clinicalOrders.api";

type Tab = "clinic" | "workflow" | "orders" | "fields";
type ClinicSettingsForm = Omit<ClinicSettings, "clinicCode">;

const fieldTypes: DynamicFieldType[] = [
  "Text",
  "LongText",
  "Number",
  "Boolean",
  "Date",
  "SingleSelect",
  "MultiSelect",
  "Image",
  "File"
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("clinic");
  const canManage = authSession.hasPermission("Settings_Manage");

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM / SETTINGS</span>
          <h1>Settings & Configuration</h1>
          <p>Clinic identity, workflow and configurable clinical data.</p>
        </div>
      </header>

      <div className="settings-tabs">
        <button className={tab === "clinic" ? "active" : ""} onClick={() => setTab("clinic")}>Clinic settings</button>
        <button className={tab === "workflow" ? "active" : ""} onClick={() => setTab("workflow")}>Workflow</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Clinical orders</button>
        <button className={tab === "fields" ? "active" : ""} onClick={() => setTab("fields")}>Dynamic fields</button>
      </div>

      {tab === "clinic" && <ClinicSettingsPanel canManage={canManage} />}
      {tab === "workflow" && <WorkflowPanel canManage={canManage} />}
      {tab === "orders" && <ClinicalOrderSettingsPanel canManage={canManage} />}
      {tab === "fields" && <DynamicFieldsPanel canManage={canManage} />}
    </section>
  );
}

function ClinicSettingsPanel({ canManage }: { canManage: boolean }) {
  const query = useClinicSettings();
  const save = useSaveClinicSettings();
  const [form, setForm] = useState<ClinicSettingsForm | null>(null);

  useEffect(() => {
    if (!query.data) return;
    const { clinicCode: _code, ...rest } = query.data;
    setForm(rest);
  }, [query.data]);

  if (query.isLoading || !form) return <div className="state-card">Loading clinic settings...</div>;
  if (query.isError) return <div className="state-card error-box">Unable to load clinic settings.</div>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    await save.mutateAsync(form!);
  }

  const set = (key: keyof ClinicSettingsForm, value: string | number) =>
    setForm(current => current ? { ...current, [key]: value } : current);

  return (
    <form className="card settings-form" onSubmit={submit}>
      <header className="section-head">
        <div>
          <span className="eyebrow">GENERAL</span>
          <h2>Clinic identity</h2>
          <p>Branding, localization and operational defaults.</p>
        </div>
        {canManage && <button className="primary-button" disabled={save.isPending}><Save size={15} />{save.isPending ? "Saving..." : "Save settings"}</button>}
      </header>

      <div className="settings-grid">
        <label className="field">Clinic name<input disabled={!canManage} value={form.clinicName} onChange={event => set("clinicName", event.target.value)} /></label>
        <label className="field">Patient prefix<input disabled={!canManage} value={form.patientNumberPrefix ?? ""} onChange={event => set("patientNumberPrefix", event.target.value)} /></label>
        <label className="field">Time zone<input disabled={!canManage} value={form.timeZoneId ?? ""} onChange={event => set("timeZoneId", event.target.value)} placeholder="Africa/Cairo" /></label>
        <label className="field">Locale<select disabled={!canManage} value={form.locale ?? "en"} onChange={event => set("locale", event.target.value)}><option value="en">English</option><option value="ar">العربية</option></select></label>
        <label className="field">Phone<input disabled={!canManage} value={form.phone ?? ""} onChange={event => set("phone", event.target.value)} /></label>
        <label className="field">Email<input disabled={!canManage} type="email" value={form.email ?? ""} onChange={event => set("email", event.target.value)} /></label>
        <label className="field full-span">Address<input disabled={!canManage} value={form.address ?? ""} onChange={event => set("address", event.target.value)} /></label>
        <label className="field">Primary color<input disabled={!canManage} value={form.primaryColor ?? ""} onChange={event => set("primaryColor", event.target.value)} placeholder="#3B82F6" /></label>
        <label className="field">Secondary color<input disabled={!canManage} value={form.secondaryColor ?? ""} onChange={event => set("secondaryColor", event.target.value)} placeholder="#6366F1" /></label>
        <label className="field">Date format<input disabled={!canManage} value={form.dateFormat ?? ""} onChange={event => set("dateFormat", event.target.value)} /></label>
        <label className="field">Time format<input disabled={!canManage} value={form.timeFormat ?? ""} onChange={event => set("timeFormat", event.target.value)} /></label>
        <label className="field">Documentation reminder hours<input disabled={!canManage} type="number" min="1" max="168" value={form.documentationReminderHours} onChange={event => set("documentationReminderHours", Number(event.target.value))} /></label>
      </div>

      {save.isSuccess && <div className="save-state success">Clinic settings saved.</div>}
      {save.isError && <div className="error-box">Unable to save clinic settings.</div>}
    </form>
  );
}

function WorkflowPanel({ canManage }: { canManage: boolean }) {
  const query = useWorkflowSettings();
  const save = useSaveWorkflowSettings();
  const [data, setData] = useState<WorkflowSettings | null>(null);

  useEffect(() => {
    if (query.data) setData({
      statuses: query.data.statuses.map(item => ({ ...item })),
      transitions: query.data.transitions.map(item => ({ ...item }))
    });
  }, [query.data]);

  const codes = useMemo(() => data?.statuses.map(item => item.code).filter(Boolean) ?? [], [data]);

  if (query.isLoading || !data) return <div className="state-card">Loading workflow...</div>;
  if (query.isError) return <div className="state-card error-box">Unable to load workflow settings.</div>;

  const patchStatus = (index: number, key: string, value: string | number | boolean) =>
    setData(current => current ? { ...current, statuses: current.statuses.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) } : current);

  const patchTransition = (index: number, key: "fromCode" | "toCode", value: string) =>
    setData(current => current ? { ...current, transitions: current.transitions.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) } : current);

  return (
    <div className="card">
      <header className="section-head">
        <div>
          <span className="eyebrow">LIVE QUEUE</span>
          <h2>Workflow configuration</h2>
          <p>Status codes are stable semantic keys; transitions control allowed queue movement.</p>
        </div>
        {canManage && <button className="primary-button" disabled={save.isPending} onClick={() => save.mutate(data)}><Save size={15} />{save.isPending ? "Saving..." : "Save workflow"}</button>}
      </header>

      <div className="workflow-config">
        <section>
          <div className="config-head">
            <h3>Statuses</h3>
            {canManage && <button className="secondary-button" onClick={() => setData({ ...data, statuses: [...data.statuses, { code: "NEW_STATUS", name: "New status", color: "#64748B", sortOrder: (data.statuses.length + 1) * 10, isFinal: false }] })}><Plus size={14} />Add status</button>}
          </div>
          <div className="config-list">
            {data.statuses.map((status, index) => (
              <div className="workflow-status-row" key={index}>
                <input disabled={!canManage} value={status.code} onChange={event => patchStatus(index, "code", event.target.value.toUpperCase())} placeholder="CODE" />
                <input disabled={!canManage} value={status.name} onChange={event => patchStatus(index, "name", event.target.value)} placeholder="Name" />
                <input disabled={!canManage} value={status.color} onChange={event => patchStatus(index, "color", event.target.value)} placeholder="#3B82F6" />
                <input disabled={!canManage} type="number" value={status.sortOrder} onChange={event => patchStatus(index, "sortOrder", Number(event.target.value))} />
                <label className="final-check"><input disabled={!canManage} type="checkbox" checked={status.isFinal} onChange={event => patchStatus(index, "isFinal", event.target.checked)} /><span>Final</span></label>
                {canManage && <button className="danger-icon" onClick={() => setData({ ...data, statuses: data.statuses.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="config-head">
            <h3>Transitions</h3>
            {canManage && codes.length > 1 && <button className="secondary-button" onClick={() => setData({ ...data, transitions: [...data.transitions, { fromCode: codes[0], toCode: codes[1] }] })}><Plus size={14} />Add transition</button>}
          </div>
          <div className="config-list">
            {data.transitions.map((transition, index) => (
              <div className="workflow-transition-row" key={index}>
                <select disabled={!canManage} value={transition.fromCode} onChange={event => patchTransition(index, "fromCode", event.target.value)}>{codes.map(code => <option key={code}>{code}</option>)}</select>
                <span>→</span>
                <select disabled={!canManage} value={transition.toCode} onChange={event => patchTransition(index, "toCode", event.target.value)}>{codes.map(code => <option key={code}>{code}</option>)}</select>
                {canManage && <button className="danger-icon" onClick={() => setData({ ...data, transitions: data.transitions.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {save.isSuccess && <div className="save-state success">Workflow saved. Live Queue refreshed.</div>}
      {save.isError && <div className="error-box">Unable to save workflow. A status may already be used by queue history or configuration may be invalid.</div>}
    </div>
  );
}

function ClinicalOrderSettingsPanel({ canManage }: { canManage: boolean }) {
  const query = useAllClinicalOrderDefinitions();
  const save = useSaveClinicalOrderDefinitions();
  const [data, setData] = useState<ClinicalOrderDefinition[] | null>(null);

  useEffect(() => {
    if (query.data) setData(query.data.map(item => ({ ...item })));
  }, [query.data]);

  if (query.isLoading || !data) return <div className="state-card">Loading clinical order sections...</div>;
  if (query.isError) return <div className="state-card error-box">Unable to load clinical order configuration.</div>;

  const patch = (index: number, key: keyof ClinicalOrderDefinition, value: string | number | boolean) =>
    setData(current => current ? current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) : current);

  return (
    <div className="card">
      <header className="section-head">
        <div>
          <span className="eyebrow">CLINICAL WORKSPACE</span>
          <h2>Clinical order sections</h2>
          <p>Configure prescription, structured order and attachment sections used by the Doctor Workspace.</p>
        </div>
        {canManage && <button className="primary-button" disabled={save.isPending} onClick={() => save.mutate(data)}><Save size={15} />{save.isPending ? "Saving..." : "Save sections"}</button>}
      </header>

      <div className="config-head">
        <h3>Sections</h3>
        {canManage && <button className="secondary-button" onClick={() => setData([...data, { code: "NEW_SECTION", name: "New section", sectionType: "Text", sortOrder: (data.length + 1) * 10, isEnabled: true }])}><Plus size={14} />Add section</button>}
      </div>

      <div className="config-list">
        {data.map((item, index) => (
          <div className="order-definition-row" key={index}>
            <input disabled={!canManage} value={item.code} onChange={event => patch(index, "code", event.target.value.toUpperCase())} placeholder="CODE" />
            <input disabled={!canManage} value={item.name} onChange={event => patch(index, "name", event.target.value)} placeholder="Name" />
            <select disabled={!canManage} value={item.sectionType} onChange={event => patch(index, "sectionType", event.target.value as ClinicalOrderSectionType)}>
              <option value="Structured">Structured items</option>
              <option value="Text">Text</option>
              <option value="Image">Image attachment</option>
              <option value="File">File attachment</option>
            </select>
            <input disabled={!canManage} type="number" value={item.sortOrder} onChange={event => patch(index, "sortOrder", Number(event.target.value))} />
            <label className="final-check"><input disabled={!canManage} type="checkbox" checked={item.isEnabled} onChange={event => patch(index, "isEnabled", event.target.checked)} /><span>Enabled</span></label>
            {canManage && <button className="danger-icon" onClick={() => setData(data.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>

      {save.isSuccess && <div className="save-state success">Clinical order configuration saved.</div>}
      {save.isError && <div className="error-box">Unable to save clinical order configuration.</div>}
    </div>
  );
}

function DynamicFieldsPanel({ canManage }: { canManage: boolean }) {
  const query = useFieldSettings();
  const save = useSaveFieldSettings();
  const [profileSections, setProfileSections] = useState<SavePatientProfileSectionSetting[] | null>(null);
  const [clinicalFields, setClinicalFields] = useState<SaveClinicalFieldSetting[] | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setProfileSections(query.data.profileSections.map(section => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sortOrder,
      isEnabled: section.isEnabled,
      fields: section.fields.map(field => ({
        id: field.id,
        label: field.label,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        isEnabled: field.isEnabled,
        sortOrder: field.sortOrder,
        options: field.options.map(option => ({
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder
        }))
      }))
    })));
    setClinicalFields(query.data.clinicalFields.map(field => ({
      id: field.id,
      name: field.name,
      fieldType: field.fieldType,
      unit: field.unit,
      isEnabled: field.isEnabled,
      sortOrder: field.sortOrder,
      options: field.options.map(option => ({
        label: option.label,
        value: option.value,
        sortOrder: option.sortOrder
      }))
    })));
  }, [query.data]);

  if (query.isLoading || !profileSections || !clinicalFields) return <div className="state-card">Loading dynamic field configuration...</div>;
  if (query.isError) return <div className="state-card error-box">Unable to load dynamic field configuration.</div>;

  const submit = () => save.mutate({ profileSections, clinicalFields });

  return (
    <div className="dynamic-field-settings">
      <section className="card">
        <header className="section-head">
          <div>
            <span className="eyebrow">PATIENT PROFILE</span>
            <h2>Profile sections & fields</h2>
            <p>Configure additional patient information rendered dynamically in Patient Profile.</p>
          </div>
          {canManage && <button className="primary-button" disabled={save.isPending} onClick={submit}><Save size={15} />{save.isPending ? "Saving..." : "Save fields"}</button>}
        </header>

        <div className="config-head">
          <h3>Sections</h3>
          {canManage && <button className="secondary-button" onClick={() => setProfileSections([...profileSections, { name: "New section", sortOrder: (profileSections.length + 1) * 10, isEnabled: true, fields: [] }])}><Plus size={14} />Add section</button>}
        </div>

        <div className="field-section-list">
          {profileSections.map((section, sectionIndex) => (
            <article className="field-config-card" key={section.id ?? `new-section-${sectionIndex}`}>
              <div className="field-config-head">
                <input disabled={!canManage} value={section.name} onChange={event => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, name: event.target.value } : item))} />
                <input disabled={!canManage} type="number" value={section.sortOrder} onChange={event => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, sortOrder: Number(event.target.value) } : item))} />
                <label className="final-check"><input disabled={!canManage} type="checkbox" checked={section.isEnabled} onChange={event => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, isEnabled: event.target.checked } : item))} /><span>Enabled</span></label>
                {canManage && <button className="secondary-button" onClick={() => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, fields: [...item.fields, newProfileField(item.fields.length)] } : item))}><Plus size={13} />Field</button>}
                {canManage && <button className="danger-icon" onClick={() => setProfileSections(profileSections.filter((_, index) => index !== sectionIndex))}><Trash2 size={14} /></button>}
              </div>

              <div className="field-config-list">
                {section.fields.map((field, fieldIndex) => (
                  <FieldEditor
                    key={field.id ?? `new-field-${fieldIndex}`}
                    field={field}
                    canManage={canManage}
                    onChange={next => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, fields: item.fields.map((entry, entryIndex) => entryIndex === fieldIndex ? next : entry) } : item))}
                    onRemove={() => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, fields: item.fields.filter((_, entryIndex) => entryIndex !== fieldIndex) } : item))}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <header className="section-head">
          <div>
            <span className="eyebrow">MEASUREMENTS</span>
            <h2>Clinical measurement fields</h2>
            <p>Configure numeric, text, date and selectable measurements recorded against patients.</p>
          </div>
        </header>

        <div className="config-head">
          <h3>Fields</h3>
          {canManage && <button className="secondary-button" onClick={() => setClinicalFields([...clinicalFields, newClinicalField(clinicalFields.length)])}><Plus size={14} />Add measurement</button>}
        </div>

        <div className="field-config-list">
          {clinicalFields.map((field, index) => (
            <ClinicalFieldEditor
              key={field.id ?? `new-clinical-${index}`}
              field={field}
              canManage={canManage}
              onChange={next => setClinicalFields(clinicalFields.map((item, itemIndex) => itemIndex === index ? next : item))}
              onRemove={() => setClinicalFields(clinicalFields.filter((_, itemIndex) => itemIndex !== index))}
            />
          ))}
        </div>
      </section>

      {save.isSuccess && <div className="save-state success">Dynamic field configuration saved.</div>}
      {save.isError && <div className="error-box">Unable to save dynamic field configuration.</div>}
    </div>
  );
}

function FieldEditor({
  field,
  canManage,
  onChange,
  onRemove
}: {
  field: SavePatientProfileFieldSetting;
  canManage: boolean;
  onChange: (field: SavePatientProfileFieldSetting) => void;
  onRemove: () => void;
}) {
  return (
    <div className="field-editor">
      <div className="field-editor-row">
        <input disabled={!canManage} value={field.label} onChange={event => onChange({ ...field, label: event.target.value })} placeholder="Field label" />
        <FieldTypeSelect disabled={!canManage} value={field.fieldType} onChange={value => onChange({ ...field, fieldType: value, options: supportsOptions(value) ? field.options : [] })} />
        <input disabled={!canManage} type="number" value={field.sortOrder} onChange={event => onChange({ ...field, sortOrder: Number(event.target.value) })} />
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={field.isRequired} onChange={event => onChange({ ...field, isRequired: event.target.checked })} /><span>Required</span></label>
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={field.isEnabled} onChange={event => onChange({ ...field, isEnabled: event.target.checked })} /><span>Enabled</span></label>
        {canManage && <button className="danger-icon" onClick={onRemove}><Trash2 size={14} /></button>}
      </div>
      {supportsOptions(field.fieldType) && <OptionsEditor options={field.options} canManage={canManage} onChange={options => onChange({ ...field, options })} />}
    </div>
  );
}

function ClinicalFieldEditor({
  field,
  canManage,
  onChange,
  onRemove
}: {
  field: SaveClinicalFieldSetting;
  canManage: boolean;
  onChange: (field: SaveClinicalFieldSetting) => void;
  onRemove: () => void;
}) {
  return (
    <div className="field-editor">
      <div className="clinical-field-editor-row">
        <input disabled={!canManage} value={field.name} onChange={event => onChange({ ...field, name: event.target.value })} placeholder="Measurement name" />
        <FieldTypeSelect disabled={!canManage} value={field.fieldType} onChange={value => onChange({ ...field, fieldType: value, options: supportsOptions(value) ? field.options : [] })} />
        <input disabled={!canManage} value={field.unit ?? ""} onChange={event => onChange({ ...field, unit: event.target.value || null })} placeholder="Unit" />
        <input disabled={!canManage} type="number" value={field.sortOrder} onChange={event => onChange({ ...field, sortOrder: Number(event.target.value) })} />
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={field.isEnabled} onChange={event => onChange({ ...field, isEnabled: event.target.checked })} /><span>Enabled</span></label>
        {canManage && <button className="danger-icon" onClick={onRemove}><Trash2 size={14} /></button>}
      </div>
      {supportsOptions(field.fieldType) && <OptionsEditor options={field.options} canManage={canManage} onChange={options => onChange({ ...field, options })} />}
    </div>
  );
}

function OptionsEditor({
  options,
  canManage,
  onChange
}: {
  options: SaveFieldOptionSetting[];
  canManage: boolean;
  onChange: (options: SaveFieldOptionSetting[]) => void;
}) {
  return (
    <div className="field-options">
      <div className="config-head">
        <h4>Options</h4>
        {canManage && <button className="secondary-button" onClick={() => onChange([...options, { label: "New option", value: `option_${options.length + 1}`, sortOrder: (options.length + 1) * 10 }])}><Plus size={12} />Option</button>}
      </div>
      {options.map((option, index) => (
        <div className="field-option-row" key={index}>
          <input disabled={!canManage} value={option.label} onChange={event => onChange(options.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder="Label" />
          <input disabled={!canManage} value={option.value} onChange={event => onChange(options.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Value" />
          <input disabled={!canManage} type="number" value={option.sortOrder} onChange={event => onChange(options.map((item, itemIndex) => itemIndex === index ? { ...item, sortOrder: Number(event.target.value) } : item))} />
          {canManage && <button className="danger-icon" onClick={() => onChange(options.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={13} /></button>}
        </div>
      ))}
    </div>
  );
}

function FieldTypeSelect({
  value,
  disabled,
  onChange
}: {
  value: DynamicFieldType;
  disabled: boolean;
  onChange: (value: DynamicFieldType) => void;
}) {
  return (
    <select disabled={disabled} value={value} onChange={event => onChange(event.target.value as DynamicFieldType)}>
      {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
    </select>
  );
}

function supportsOptions(type: DynamicFieldType) {
  return type === "SingleSelect" || type === "MultiSelect";
}

function newProfileField(index: number): SavePatientProfileFieldSetting {
  return {
    label: "New field",
    fieldType: "Text",
    isRequired: false,
    isEnabled: true,
    sortOrder: (index + 1) * 10,
    options: []
  };
}

function newClinicalField(index: number): SaveClinicalFieldSetting {
  return {
    name: "New measurement",
    fieldType: "Number",
    unit: null,
    isEnabled: true,
    sortOrder: (index + 1) * 10,
    options: []
  };
}
