import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n/i18n";
import { useVisits } from "./visits.api";
import { selectedVisit } from "./selectedVisit";

export function VisitsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const visits = useVisits();
  const [search, setSearch] = useState("");

  if (visits.isLoading) return <div className="state-card">{t("Loading visits...","جارٍ تحميل الزيارات...")}</div>;
  if (visits.isError || !visits.data) return <div className="state-card error-box">{t("Unable to load visits.","تعذر تحميل الزيارات.")}</div>;

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
          <span className="eyebrow">{t("CLINIC / VISITS","العيادة / الزيارات")}</span>
          <h1>{t("Visits","الزيارات")}</h1>
          <p>{t("Open clinical workspace, documentation status and doctor sessions.","افتح مساحة العمل الطبية وتابع حالة التوثيق وجلسات الأطباء.")}</p>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Search patient, doctor, or status...","ابحث بالمريض أو الطبيب أو الحالة...")} />
          </label>
          <span className="count-pill">{filtered.length} {t("visits","زيارة")}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="state-card">{t("No visits found.","لا توجد زيارات.")}</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Patient","المريض")}</th>
                  <th>{t("Doctor","الطبيب")}</th>
                  <th>{t("Status","الحالة")}</th>
                  <th>{t("Documentation","التوثيق")}</th>
                  <th>{t("Started","بدأت")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(visit => (
                  <tr key={visit.id}>
                    <td>
                      <button className="patient-link-button" onClick={() => { selectedVisit.set(visit.id); navigate("/visits/workspace"); }}>
                        <strong>{visit.patientName}</strong>
                        <small className="table-subline" dir="ltr">{visit.patientNumber}</small>
                      </button>
                    </td>
                    <td>{visit.doctorName}</td>
                    <td><span className="status-pill">{visitStatusLabel(visit.status,t)}</span></td>
                    <td><span className="status-pill">{documentationLabel(visit.documentationStatus,t)}</span></td>
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

function visitStatusLabel(value:string,t:(english:string,arabic:string)=>string){
  if(value==="Open")return t("Open","مفتوحة");
  if(value==="Completed")return t("Completed","مكتملة");
  if(value==="Cancelled")return t("Cancelled","ملغاة");
  return value;
}

function documentationLabel(value:string,t:(english:string,arabic:string)=>string){
  if(value==="NotStarted")return t("Not started","لم يبدأ");
  if(value==="Draft")return t("Draft","مسودة");
  if(value==="Pending")return t("Pending","معلق");
  if(value==="Completed")return t("Completed","مكتمل");
  return value;
}
