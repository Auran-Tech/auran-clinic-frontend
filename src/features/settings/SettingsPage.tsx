import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { authSession } from "../auth/authSession";
import { useI18n } from "../../lib/i18n/i18n";
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
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("clinic");
  const canManage = authSession.hasPermission("Settings_Manage");

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{t("SYSTEM / SETTINGS","النظام / الإعدادات")}</span>
          <h1>{t("Settings & Configuration","الإعدادات والتكوين")}</h1>
          <p>{t("Clinic identity, workflow and configurable clinical data.","هوية العيادة ومسار العمل والبيانات الطبية القابلة للتخصيص.")}</p>
        </div>
      </header>

      <div className="settings-tabs">
        <button className={tab === "clinic" ? "active" : ""} onClick={() => setTab("clinic")}>{t("Clinic settings","إعدادات العيادة")}</button>
        <button className={tab === "workflow" ? "active" : ""} onClick={() => setTab("workflow")}>{t("Workflow","مسار العمل")}</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>{t("Clinical orders","الطلبات الطبية")}</button>
        <button className={tab === "fields" ? "active" : ""} onClick={() => setTab("fields")}>{t("Dynamic fields","الحقول الديناميكية")}</button>
      </div>

      {tab === "clinic" && <ClinicSettingsPanel canManage={canManage} />}
      {tab === "workflow" && <WorkflowPanel canManage={canManage} />}
      {tab === "orders" && <ClinicalOrderSettingsPanel canManage={canManage} />}
      {tab === "fields" && <DynamicFieldsPanel canManage={canManage} />}
    </section>
  );
}

function ClinicSettingsPanel({ canManage }: { canManage: boolean }) {
  const { t } = useI18n();
  const query = useClinicSettings();
  const save = useSaveClinicSettings();
  const [form, setForm] = useState<ClinicSettingsForm | null>(null);

  useEffect(() => {
    if (!query.data) return;
    const { clinicCode: _code, ...rest } = query.data;
    setForm(rest);
  }, [query.data]);

  if (query.isLoading || !form) return <div className="state-card">{t("Loading clinic settings...","جارٍ تحميل إعدادات العيادة...")}</div>;
  if (query.isError) return <div className="state-card error-box">{t("Unable to load clinic settings.","تعذر تحميل إعدادات العيادة.")}</div>;

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
          <span className="eyebrow">{t("GENERAL","عام")}</span>
          <h2>{t("Clinic identity","هوية العيادة")}</h2>
          <p>{t("Branding, localization and operational defaults.","الهوية البصرية واللغة والإعدادات التشغيلية الافتراضية.")}</p>
        </div>
        {canManage && <button className="primary-button" disabled={save.isPending}><Save size={15} />{save.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save settings","حفظ الإعدادات")}</button>}
      </header>

      <div className="settings-grid">
        <label className="field">{t("Clinic name","اسم العيادة")}<input disabled={!canManage} value={form.clinicName} onChange={event => set("clinicName", event.target.value)} /></label>
        <label className="field">{t("Patient prefix","بادئة رقم المريض")}<input disabled={!canManage} value={form.patientNumberPrefix ?? ""} onChange={event => set("patientNumberPrefix", event.target.value)} /></label>
        <label className="field">{t("Time zone","المنطقة الزمنية")}<input disabled={!canManage} value={form.timeZoneId ?? ""} onChange={event => set("timeZoneId", event.target.value)} placeholder="Africa/Cairo" /></label>
        <label className="field">{t("Locale","اللغة")}<select disabled={!canManage} value={form.locale ?? "en"} onChange={event => set("locale", event.target.value)}><option value="en">English</option><option value="ar">العربية</option></select></label>
        <label className="field">{t("Phone","الهاتف")}<input disabled={!canManage} value={form.phone ?? ""} onChange={event => set("phone", event.target.value)} /></label>
        <label className="field">{t("Email","البريد الإلكتروني")}<input disabled={!canManage} type="email" value={form.email ?? ""} onChange={event => set("email", event.target.value)} /></label>
        <label className="field full-span">{t("Address","العنوان")}<input disabled={!canManage} value={form.address ?? ""} onChange={event => set("address", event.target.value)} /></label>
        <label className="field">{t("Primary color","اللون الأساسي")}<input disabled={!canManage} value={form.primaryColor ?? ""} onChange={event => set("primaryColor", event.target.value)} placeholder="#3B82F6" /></label>
        <label className="field">{t("Secondary color","اللون الثانوي")}<input disabled={!canManage} value={form.secondaryColor ?? ""} onChange={event => set("secondaryColor", event.target.value)} placeholder="#6366F1" /></label>
        <label className="field">{t("Date format","تنسيق التاريخ")}<input disabled={!canManage} value={form.dateFormat ?? ""} onChange={event => set("dateFormat", event.target.value)} /></label>
        <label className="field">{t("Time format","تنسيق الوقت")}<input disabled={!canManage} value={form.timeFormat ?? ""} onChange={event => set("timeFormat", event.target.value)} /></label>
        <label className="field">{t("Documentation reminder hours","ساعات تذكير التوثيق")}<input disabled={!canManage} type="number" min="1" max="168" value={form.documentationReminderHours} onChange={event => set("documentationReminderHours", Number(event.target.value))} /></label>
      </div>

      {save.isSuccess && <div className="save-state success">{t("Clinic settings saved.","تم حفظ إعدادات العيادة.")}</div>}
      {save.isError && <div className="error-box">{t("Unable to save clinic settings.","تعذر حفظ إعدادات العيادة.")}</div>}
    </form>
  );
}

function WorkflowPanel({ canManage }: { canManage: boolean }) {
  const { t } = useI18n();
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

  if (query.isLoading || !data) return <div className="state-card">{t("Loading workflow...","جارٍ تحميل مسار العمل...")}</div>;
  if (query.isError) return <div className="state-card error-box">{t("Unable to load workflow settings.","تعذر تحميل إعدادات مسار العمل.")}</div>;

  const patchStatus = (index: number, key: string, value: string | number | boolean) =>
    setData(current => current ? { ...current, statuses: current.statuses.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) } : current);

  const patchTransition = (index: number, key: "fromCode" | "toCode", value: string) =>
    setData(current => current ? { ...current, transitions: current.transitions.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) } : current);

  return (
    <div className="card">
      <header className="section-head">
        <div>
          <span className="eyebrow">{t("LIVE QUEUE","قائمة الانتظار")}</span>
          <h2>{t("Workflow configuration","إعداد مسار العمل")}</h2>
          <p>{t("Status codes are stable semantic keys; transitions control allowed queue movement.","أكواد الحالات مفاتيح ثابتة، والانتقالات تحدد الحركات المسموحة في قائمة الانتظار.")}</p>
        </div>
        {canManage && <button className="primary-button" disabled={save.isPending} onClick={() => save.mutate(data)}><Save size={15} />{save.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save workflow","حفظ المسار")}</button>}
      </header>

      <div className="workflow-config">
        <section>
          <div className="config-head">
            <h3>{t("Statuses","الحالات")}</h3>
            {canManage && <button className="secondary-button" onClick={() => setData({ ...data, statuses: [...data.statuses, { code: "NEW_STATUS", name: t("New status","حالة جديدة"), color: "#64748B", sortOrder: (data.statuses.length + 1) * 10, isFinal: false }] })}><Plus size={14} />{t("Add status","إضافة حالة")}</button>}
          </div>
          <div className="config-list">
            {data.statuses.map((status, index) => (
              <div className="workflow-status-row" key={index}>
                <input disabled={!canManage} value={status.code} onChange={event => patchStatus(index, "code", event.target.value.toUpperCase())} placeholder="CODE" />
                <input disabled={!canManage} value={status.name} onChange={event => patchStatus(index, "name", event.target.value)} placeholder="Name" />
                <input disabled={!canManage} value={status.color} onChange={event => patchStatus(index, "color", event.target.value)} placeholder="#3B82F6" />
                <input disabled={!canManage} type="number" value={status.sortOrder} onChange={event => patchStatus(index, "sortOrder", Number(event.target.value))} />
                <label className="final-check"><input disabled={!canManage} type="checkbox" checked={status.isFinal} onChange={event => patchStatus(index, "isFinal", event.target.checked)} /><span>{t("Final","نهائية")}</span></label>
                {canManage && <button className="danger-icon" onClick={() => setData({ ...data, statuses: data.statuses.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="config-head">
            <h3>{t("Transitions","الانتقالات")}</h3>
            {canManage && codes.length > 1 && <button className="secondary-button" onClick={() => setData({ ...data, transitions: [...data.transitions, { fromCode: codes[0], toCode: codes[1] }] })}><Plus size={14} />{t("Add transition","إضافة انتقال")}</button>}
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

      {save.isSuccess && <div className="save-state success">{t("Workflow saved. Live Queue refreshed.","تم حفظ مسار العمل وتحديث قائمة الانتظار.")}</div>}
      {save.isError && <div className="error-box">{t("Unable to save workflow. A status may already be used by queue history or configuration may be invalid.","تعذر حفظ مسار العمل. قد تكون إحدى الحالات مستخدمة في السجل أو الإعداد غير صالح.")}</div>}
    </div>
  );
}

function ClinicalOrderSettingsPanel({ canManage }: { canManage: boolean }) {
  const { t } = useI18n();
  const query = useAllClinicalOrderDefinitions();
  const save = useSaveClinicalOrderDefinitions();
  const [data, setData] = useState<ClinicalOrderDefinition[] | null>(null);

  useEffect(() => {
    if (query.data) setData(query.data.map(item => ({ ...item })));
  }, [query.data]);

  if (query.isLoading || !data) return <div className="state-card">{t("Loading clinical order sections...","جارٍ تحميل أقسام الطلبات الطبية...")}</div>;
  if (query.isError) return <div className="state-card error-box">{t("Unable to load clinical order configuration.","تعذر تحميل إعدادات الطلبات الطبية.")}</div>;

  const patch = (index: number, key: keyof ClinicalOrderDefinition, value: string | number | boolean) =>
    setData(current => current ? current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) : current);

  return (
    <div className="card">
      <header className="section-head">
        <div>
          <span className="eyebrow">{t("CLINICAL WORKSPACE","مساحة العمل الطبية")}</span>
          <h2>{t("Clinical order sections","أقسام الطلبات الطبية")}</h2>
          <p>{t("Configure prescription, structured order and attachment sections used by the Doctor Workspace.","قم بإعداد أقسام الروشتة والطلبات المنظمة والمرفقات المستخدمة في مساحة عمل الطبيب.")}</p>
        </div>
        {canManage && <button className="primary-button" disabled={save.isPending} onClick={() => save.mutate(data)}><Save size={15} />{save.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save sections","حفظ الأقسام")}</button>}
      </header>

      <div className="config-head">
        <h3>{t("Sections","الأقسام")}</h3>
        {canManage && <button className="secondary-button" onClick={() => setData([...data, { code: "NEW_SECTION", name: t("New section","قسم جديد"), sectionType: "Text", sortOrder: (data.length + 1) * 10, isEnabled: true }])}><Plus size={14} />{t("Add section","إضافة قسم")}</button>}
      </div>

      <div className="config-list">
        {data.map((item, index) => (
          <div className="order-definition-row" key={index}>
            <input disabled={!canManage} value={item.code} onChange={event => patch(index, "code", event.target.value.toUpperCase())} placeholder="CODE" />
            <input disabled={!canManage} value={item.name} onChange={event => patch(index, "name", event.target.value)} placeholder="Name" />
            <select disabled={!canManage} value={item.sectionType} onChange={event => patch(index, "sectionType", event.target.value as ClinicalOrderSectionType)}>
              <option value="Structured">{t("Structured items","عناصر منظمة")}</option>
              <option value="Text">{t("Text","نص")}</option>
              <option value="Image">{t("Image attachment","مرفق صورة")}</option>
              <option value="File">{t("File attachment","مرفق ملف")}</option>
            </select>
            <input disabled={!canManage} type="number" value={item.sortOrder} onChange={event => patch(index, "sortOrder", Number(event.target.value))} />
            <label className="final-check"><input disabled={!canManage} type="checkbox" checked={item.isEnabled} onChange={event => patch(index, "isEnabled", event.target.checked)} /><span>{t("Enabled","مفعل")}</span></label>
            {canManage && <button className="danger-icon" onClick={() => setData(data.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>

      {save.isSuccess && <div className="save-state success">{t("Clinical order configuration saved.","تم حفظ إعدادات الطلبات الطبية.")}</div>}
      {save.isError && <div className="error-box">{t("Unable to save clinical order configuration.","تعذر حفظ إعدادات الطلبات الطبية.")}</div>}
    </div>
  );
}

function DynamicFieldsPanel({ canManage }: { canManage: boolean }) {
  const { t } = useI18n();
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

  if (query.isLoading || !profileSections || !clinicalFields) return <div className="state-card">{t("Loading dynamic field configuration...","جارٍ تحميل إعدادات الحقول الديناميكية...")}</div>;
  if (query.isError) return <div className="state-card error-box">{t("Unable to load dynamic field configuration.","تعذر تحميل إعدادات الحقول الديناميكية.")}</div>;

  const submit = () => save.mutate({ profileSections, clinicalFields });

  return (
    <div className="dynamic-field-settings">
      <section className="card">
        <header className="section-head">
          <div>
            <span className="eyebrow">{t("PATIENT PROFILE","ملف المريض")}</span>
            <h2>{t("Profile sections & fields","أقسام وحقول ملف المريض")}</h2>
            <p>{t("Configure additional patient information rendered dynamically in Patient Profile.","قم بإعداد بيانات إضافية تظهر ديناميكيًا في ملف المريض.")}</p>
          </div>
          {canManage && <button className="primary-button" disabled={save.isPending} onClick={submit}><Save size={15} />{save.isPending ? t("Saving...","جارٍ الحفظ...") : t("Save fields","حفظ الحقول")}</button>}
        </header>

        <div className="config-head">
          <h3>{t("Sections","الأقسام")}</h3>
          {canManage && <button className="secondary-button" onClick={() => setProfileSections([...profileSections, { name: t("New section","قسم جديد"), sortOrder: (profileSections.length + 1) * 10, isEnabled: true, fields: [] }])}><Plus size={14} />{t("Add section","إضافة قسم")}</button>}
        </div>

        <div className="field-section-list">
          {profileSections.map((section, sectionIndex) => (
            <article className="field-config-card" key={section.id ?? `new-section-${sectionIndex}`}>
              <div className="field-config-head">
                <input disabled={!canManage} value={section.name} onChange={event => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, name: event.target.value } : item))} />
                <input disabled={!canManage} type="number" value={section.sortOrder} onChange={event => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, sortOrder: Number(event.target.value) } : item))} />
                <label className="final-check"><input disabled={!canManage} type="checkbox" checked={section.isEnabled} onChange={event => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, isEnabled: event.target.checked } : item))} /><span>{t("Enabled","مفعل")}</span></label>
                {canManage && <button className="secondary-button" onClick={() => setProfileSections(profileSections.map((item, index) => index === sectionIndex ? { ...item, fields: [...item.fields, newProfileField(item.fields.length,t)] } : item))}><Plus size={13} />{t("Field","حقل")}</button>}
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
            <span className="eyebrow">{t("MEASUREMENTS","القياسات")}</span>
            <h2>{t("Clinical measurement fields","حقول القياسات الطبية")}</h2>
            <p>{t("Configure numeric, text, date and selectable measurements recorded against patients.","قم بإعداد القياسات الرقمية والنصية والتاريخية والاختيارات المسجلة للمرضى.")}</p>
          </div>
        </header>

        <div className="config-head">
          <h3>{t("Fields","الحقول")}</h3>
          {canManage && <button className="secondary-button" onClick={() => setClinicalFields([...clinicalFields, newClinicalField(clinicalFields.length,t)])}><Plus size={14} />{t("Add measurement","إضافة قياس")}</button>}
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

      {save.isSuccess && <div className="save-state success">{t("Dynamic field configuration saved.","تم حفظ إعدادات الحقول الديناميكية.")}</div>}
      {save.isError && <div className="error-box">{t("Unable to save dynamic field configuration.","تعذر حفظ إعدادات الحقول الديناميكية.")}</div>}
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
  const { t } = useI18n();
  return (
    <div className="field-editor">
      <div className="field-editor-row">
        <input disabled={!canManage} value={field.label} onChange={event => onChange({ ...field, label: event.target.value })} placeholder={t("Field label","اسم الحقل")} />
        <FieldTypeSelect disabled={!canManage} value={field.fieldType} onChange={value => onChange({ ...field, fieldType: value, options: supportsOptions(value) ? field.options : [] })} />
        <input disabled={!canManage} type="number" value={field.sortOrder} onChange={event => onChange({ ...field, sortOrder: Number(event.target.value) })} />
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={field.isRequired} onChange={event => onChange({ ...field, isRequired: event.target.checked })} /><span>{t("Required","مطلوب")}</span></label>
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={field.isEnabled} onChange={event => onChange({ ...field, isEnabled: event.target.checked })} /><span>{t("Enabled","مفعل")}</span></label>
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
  const { t } = useI18n();
  return (
    <div className="field-editor">
      <div className="clinical-field-editor-row">
        <input disabled={!canManage} value={field.name} onChange={event => onChange({ ...field, name: event.target.value })} placeholder={t("Measurement name","اسم القياس")} />
        <FieldTypeSelect disabled={!canManage} value={field.fieldType} onChange={value => onChange({ ...field, fieldType: value, options: supportsOptions(value) ? field.options : [] })} />
        <input disabled={!canManage} value={field.unit ?? ""} onChange={event => onChange({ ...field, unit: event.target.value || null })} placeholder={t("Unit","الوحدة")} />
        <input disabled={!canManage} type="number" value={field.sortOrder} onChange={event => onChange({ ...field, sortOrder: Number(event.target.value) })} />
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={field.isEnabled} onChange={event => onChange({ ...field, isEnabled: event.target.checked })} /><span>{t("Enabled","مفعل")}</span></label>
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
  const { t } = useI18n();
  return (
    <div className="field-options">
      <div className="config-head">
        <h4>{t("Options","الخيارات")}</h4>
        {canManage && <button className="secondary-button" onClick={() => onChange([...options, { label: t("New option","خيار جديد"), value: `option_${options.length + 1}`, sortOrder: (options.length + 1) * 10 }])}><Plus size={12} />{t("Option","خيار")}</button>}
      </div>
      {options.map((option, index) => (
        <div className="field-option-row" key={index}>
          <input disabled={!canManage} value={option.label} onChange={event => onChange(options.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} placeholder={t("Label","العنوان")} />
          <input disabled={!canManage} value={option.value} onChange={event => onChange(options.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder={t("Value","القيمة")} />
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
  const { t } = useI18n();
  return (
    <select disabled={disabled} value={value} onChange={event => onChange(event.target.value as DynamicFieldType)}>
      {fieldTypes.map(type => <option key={type} value={type}>{fieldTypeLabel(type,t)}</option>)}
    </select>
  );
}

function supportsOptions(type: DynamicFieldType) {
  return type === "SingleSelect" || type === "MultiSelect";
}

function newProfileField(index: number, t:(english:string,arabic:string)=>string): SavePatientProfileFieldSetting {
  return {
    label: t("New field","حقل جديد"),
    fieldType: "Text",
    isRequired: false,
    isEnabled: true,
    sortOrder: (index + 1) * 10,
    options: []
  };
}

function newClinicalField(index: number, t:(english:string,arabic:string)=>string): SaveClinicalFieldSetting {
  return {
    name: t("New measurement","قياس جديد"),
    fieldType: "Number",
    unit: null,
    isEnabled: true,
    sortOrder: (index + 1) * 10,
    options: []
  };
}


function fieldTypeLabel(type: DynamicFieldType, t: (english:string,arabic:string)=>string) {
  const labels: Record<DynamicFieldType,[string,string]> = {
    Text:["Text","نص"],
    LongText:["Long text","نص طويل"],
    Number:["Number","رقم"],
    Boolean:["Yes / No","نعم / لا"],
    Date:["Date","تاريخ"],
    Image:["Image","صورة"],
    File:["File","ملف"],
    SingleSelect:["Single select","اختيار واحد"],
    MultiSelect:["Multi select","اختيارات متعددة"]
  };
  return t(labels[type][0], labels[type][1]);
}
