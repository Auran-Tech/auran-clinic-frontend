import { FormEvent, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n/i18n";
import { selectedPatient } from "./selectedPatient";
import { authSession } from "../auth/authSession";
import { useCreatePatient, usePatients, type PatientDuplicateCandidate } from "./patients.api";

type PatientForm = {
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
};

const emptyForm: PatientForm = { fullName: "", phone: "", gender: "", dateOfBirth: "" };

export function PatientsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [search, setSearch] = useState(() => {
    const value = sessionStorage.getItem("auran.clinic.patient-search") ?? "";
    sessionStorage.removeItem("auran.clinic.patient-search");
    return value;
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [duplicates, setDuplicates] = useState<PatientDuplicateCandidate[]>([]);
  const { data, isLoading, isError } = usePatients({ search, page: 1, pageSize: 20 });
  const createPatient = useCreatePatient();
  const canCreate = authSession.hasPermission("Patient_Create");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setDuplicates([]);
    try {
      await createPatient.mutateAsync({
        fullName: form.fullName,
        phone: form.phone,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null
      });
      setShowCreate(false);
      setForm(emptyForm);
    } catch (error) {
      const candidates = (error as Error & { duplicates?: PatientDuplicateCandidate[] }).duplicates;
      if (candidates) setDuplicates(candidates);
    }
  }

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{t("CLINIC / PATIENTS","العيادة / المرضى")}</span>
          <h1>{t("Patients","المرضى")}</h1>
          <p>{t("Search, register and open patient clinical profiles.","ابحث عن المرضى وسجل مرضى جدد وافتح ملفاتهم الطبية.")}</p>
        </div>
        {canCreate && <button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={16} />{t("New patient","مريض جديد")}</button>}
      </header>

      <div className="card">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Search patient name, ID, or phone...","ابحث بالاسم أو رقم المريض أو الهاتف...")} />
          </label>
          <span className="count-pill">{data?.setting.totalCount ?? 0} {t("patients","مريض")}</span>
        </div>

        {isLoading && <div className="state-card">{t("Loading patients...","جارٍ تحميل المرضى...")}</div>}
        {isError && <div className="state-card error-box">{t("Could not load patients.","تعذر تحميل المرضى.")}</div>}
        {!isLoading && !isError && data?.data.length === 0 && <div className="state-card">{t("No patients found.","لا يوجد مرضى.")}</div>}

        {data && data.data.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead><tr><th>{t("ID","الرقم")}</th><th>{t("Patient","المريض")}</th><th>{t("Phone","الهاتف")}</th><th>{t("Gender","النوع")}</th><th>{t("Date of birth","تاريخ الميلاد")}</th></tr></thead>
              <tbody>
                {data.data.map(patient => (
                  <tr key={patient.id}>
                    <td><code dir="ltr">{patient.patientNumber}</code></td>
                    <td><button className="patient-link-button" onClick={() => { selectedPatient.set(patient.id); navigate("/patients/profile"); }}><strong>{patient.fullName}</strong></button></td>
                    <td><span dir="ltr">{patient.phone}</span></td>
                    <td>{patient.gender==="Male"?t("Male","ذكر"):patient.gender==="Female"?t("Female","أنثى"):patient.gender??"—"}</td>
                    <td><span dir="ltr">{patient.dateOfBirth ?? "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={submit}>
            <header className="modal-head">
              <div><h2>{t("New patient","مريض جديد")}</h2><p>{t("Duplicate detection runs before creation.","يتم فحص التكرار قبل إنشاء المريض.")}</p></div>
              <button type="button" className="icon-button" aria-label={t("Close","إغلاق")} onClick={() => setShowCreate(false)}><X size={17} /></button>
            </header>
            <div className="modal-body form-grid">
              <label className="field">{t("Full name","الاسم الكامل")}<input required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} /></label>
              <label className="field">{t("Phone","الهاتف")}<input required dir="ltr" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
              <label className="field">{t("Gender","النوع")}<select value={form.gender} onChange={event => setForm({ ...form, gender: event.target.value })}><option value="">{t("Select","اختر")}</option><option value="Male">{t("Male","ذكر")}</option><option value="Female">{t("Female","أنثى")}</option></select></label>
              <label className="field">{t("Date of birth","تاريخ الميلاد")}<input type="date" value={form.dateOfBirth} onChange={event => setForm({ ...form, dateOfBirth: event.target.value })} /></label>

              {duplicates.length > 0 && (
                <div className="duplicate-warning">
                  <strong>{t("Potential duplicate found","تم العثور على مريض محتمل مكرر")}</strong>
                  <p>{t("Review the existing patient before creating another record.","راجع المريض الموجود قبل إنشاء سجل جديد.")}</p>
                  {duplicates.map(candidate => <div key={candidate.id}><code>{candidate.patientNumber}</code> · {candidate.fullName} · <span dir="ltr">{candidate.phone}</span></div>)}
                </div>
              )}

              {createPatient.isError && duplicates.length === 0 && <div className="error-box">{t("Unable to create patient.","تعذر إنشاء المريض.")}</div>}
            </div>
            <footer className="modal-foot">
              <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>{t("Cancel","إلغاء")}</button>
              <button className="primary-button" disabled={createPatient.isPending}>{createPatient.isPending ? t("Checking...","جارٍ الفحص...") : t("Create patient","إنشاء المريض")}</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
