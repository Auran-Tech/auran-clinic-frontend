import type { ReactNode } from "react";
import { FileClock, Stethoscope, UserRound, Users } from "lucide-react";
import { useI18n } from "../../lib/i18n/i18n";
import { useDashboard } from "./dashboard.api";

export function DashboardPage(){
  const dashboard=useDashboard();
  const { t }=useI18n();

  if(dashboard.isLoading)return <div className="state-card">{t("Loading dashboard...","جارٍ تحميل لوحة التحكم...")}</div>;
  if(dashboard.isError||!dashboard.data)return <div className="state-card error-box">{t("Unable to load dashboard.","تعذر تحميل لوحة التحكم.")}</div>;

  const data=dashboard.data;

  return <section className="page">
    <header className="page-heading">
      <div>
        <span className="eyebrow">{t("CLINIC / DASHBOARD","العيادة / لوحة التحكم")}</span>
        <h1>{t("Clinic overview","نظرة عامة على العيادة")}</h1>
        <p>{t("Today’s operational picture for the current clinic.","ملخص العمليات اليومية للعيادة الحالية.")}</p>
      </div>
    </header>

    <div className="dashboard-kpis">
      <Kpi icon={<Users size={18}/>} label={t("Patients","المرضى")} value={data.totalPatients} sub={t(`${data.newPatientsToday} new today`,`${data.newPatientsToday} جدد اليوم`)}/>
      <Kpi icon={<UserRound size={18}/>} label={t("Active queue","الانتظار النشط")} value={data.activeQueueCount} sub={t(`${data.openVisitsCount} open visits`,`${data.openVisitsCount} زيارات مفتوحة`)}/>
      <Kpi icon={<FileClock size={18}/>} label={t("Pending docs","توثيق معلق")} value={data.pendingDocumentationCount} sub={t("Documentation still required","يوجد توثيق مطلوب")}/>
      <Kpi icon={<Stethoscope size={18}/>} label={t("Follow-ups","المتابعات")} value={data.followUpsToday} sub={t(`${data.followUpsOverdue} overdue`,`${data.followUpsOverdue} متأخرة`)}/>
    </div>

    <div className="dashboard-grid">
      <section className="card">
        <header className="section-head"><div><h2>{t("Live queue","قائمة الانتظار")}</h2><p>{t("Current patients moving through the clinic.","المرضى الموجودون حاليًا داخل مسار العيادة.")}</p></div></header>
        {data.queue.length===0?<div className="mini-empty">{t("No active queue entries.","لا توجد حالات انتظار نشطة.")}</div>:<div className="dashboard-list">
          {data.queue.map((item,index)=><div className="dashboard-list-row" key={item.patientNumber+"-"+index}>
            <div className="queue-status-dot" style={{background:item.statusColor}}/>
            <div><strong>{item.patientName}</strong><small><span dir="ltr">{item.patientNumber}</span> · {item.doctorName??t("Unassigned","غير معين")}</small></div>
            <span>{item.statusName}</span>
          </div>)}
        </div>}
      </section>

      <section className="card">
        <header className="section-head"><div><h2>{t("Follow-ups due","متابعات مستحقة")}</h2><p>{t("Today and overdue clinical follow-up work.","متابعات اليوم والمتابعات المتأخرة.")}</p></div></header>
        {data.followUps.length===0?<div className="mini-empty">{t("No follow-ups due.","لا توجد متابعات مستحقة.")}</div>:<div className="dashboard-list">
          {data.followUps.map((item,index)=><div className="dashboard-list-row" key={item.patientNumber+"-"+index}>
            <span className={"due-pill "+item.dueCategory.toLowerCase()}>{dueLabel(item.dueCategory,t)}</span>
            <div><strong>{item.patientName}</strong><small>{item.recommendation}</small></div>
            <span dir="ltr">{item.recommendedDate??"—"}</span>
          </div>)}
        </div>}
      </section>
    </div>
  </section>
}

function Kpi({icon,label,value,sub}:{icon:ReactNode;label:string;value:number;sub:string}){
  return <article className="card dashboard-kpi"><div className="dashboard-kpi-icon">{icon}</div><div><small>{label}</small><strong>{value}</strong><span>{sub}</span></div></article>
}

function dueLabel(value:string,t:(english:string,arabic:string)=>string){
  if(value==="Today")return t("Today","اليوم");
  if(value==="Overdue")return t("Overdue","متأخرة");
  if(value==="Upcoming")return t("Upcoming","قادمة");
  if(value==="Completed")return t("Completed","مكتملة");
  return value;
}
