import { useMemo,useState } from "react";
import { useI18n } from "../../lib/i18n/i18n";
import { useOperationalReport } from "./reports.api";

function iso(date:Date){return date.toISOString().slice(0,10)}

export function ReportsPage(){
  const { t }=useI18n();
  const today=useMemo(()=>new Date(),[]);
  const defaultFrom=useMemo(()=>{const d=new Date(today);d.setDate(d.getDate()-29);return iso(d)},[today]);
  const[fromDate,setFromDate]=useState(defaultFrom);
  const[toDate,setToDate]=useState(iso(today));
  const report=useOperationalReport(fromDate,toDate);

  return <section className="page">
    <header className="page-heading"><div><span className="eyebrow">{t("ANALYTICS / REPORTS","التحليلات / التقارير")}</span><h1>{t("Reports","التقارير")}</h1><p>{t("Operational clinic performance for the selected clinic-local date range.","أداء العيادة التشغيلي خلال الفترة المحددة حسب توقيت العيادة.")}</p></div></header>
    <div className="card report-filter"><label className="field">{t("From","من")}<input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label className="field">{t("To","إلى")}<input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label></div>
    {report.isLoading&&<div className="state-card">{t("Loading report...","جارٍ تحميل التقرير...")}</div>}
    {report.isError&&<div className="state-card error-box">{t("Unable to load report.","تعذر تحميل التقرير.")}</div>}
    {report.data&&<>
      <div className="report-kpis">
        <Kpi label={t("Patients","المرضى")} value={report.data.patientCount} sub={t(`${report.data.newPatientCount} new`,`${report.data.newPatientCount} جدد`)}/>
        <Kpi label={t("Visits","الزيارات")} value={report.data.visitCount} sub={t(`${report.data.completedVisitCount} completed`,`${report.data.completedVisitCount} مكتملة`)}/>
        <Kpi label={t("Active queue","انتظار نشط")} value={report.data.activeQueueCount} sub={t(`${report.data.openVisitCount} open visits`,`${report.data.openVisitCount} زيارات مفتوحة`)}/>
        <Kpi label={t("Pending docs","توثيق معلق")} value={report.data.pendingDocumentationCount} sub={t("Requires documentation","يتطلب استكمال التوثيق")}/>
        <Kpi label={t("Follow-ups today","متابعات اليوم")} value={report.data.followUpsToday} sub={t(`${report.data.followUpsOverdue} overdue`,`${report.data.followUpsOverdue} متأخرة`)}/>
      </div>
      <div className="card"><header className="section-head"><div><h2>{t("Doctor activity","نشاط الأطباء")}</h2><p>{report.data.fromDate} → {report.data.toDate}</p></div></header>
        {report.data.doctorActivity.length===0?<div className="mini-empty">{t("No doctor activity in this range.","لا يوجد نشاط أطباء خلال هذه الفترة.")}</div>:<div className="table-scroll"><table><thead><tr><th>{t("Doctor","الطبيب")}</th><th>{t("Visits","الزيارات")}</th><th>{t("Completed","مكتملة")}</th><th>{t("Pending documentation","توثيق معلق")}</th></tr></thead><tbody>{report.data.doctorActivity.map(row=><tr key={row.doctorName}><td><strong>{row.doctorName}</strong></td><td>{row.visitCount}</td><td>{row.completedVisitCount}</td><td>{row.pendingDocumentationCount}</td></tr>)}</tbody></table></div>}
      </div>
    </>}
  </section>
}

function Kpi({label,value,sub}:{label:string;value:number;sub:string}){return <article className="card report-kpi"><small>{label}</small><strong>{value}</strong><span>{sub}</span></article>}
