import type { ReactNode } from "react";
import { FileClock, Stethoscope, UserRound, Users } from "lucide-react";
import { useDashboard } from "./dashboard.api";

export function DashboardPage(){
  const dashboard=useDashboard();

  if(dashboard.isLoading)return <div className="state-card">Loading dashboard...</div>;
  if(dashboard.isError||!dashboard.data)return <div className="state-card error-box">Unable to load dashboard.</div>;

  const data=dashboard.data;

  return <section className="page">
    <header className="page-heading">
      <div>
        <span className="eyebrow">CLINIC / DASHBOARD</span>
        <h1>Clinic overview</h1>
        <p>Today’s operational picture for the current clinic.</p>
      </div>
    </header>

    <div className="dashboard-kpis">
      <Kpi icon={<Users size={18}/>} label="Patients" value={data.totalPatients} sub={data.newPatientsToday+" new today"}/>
      <Kpi icon={<UserRound size={18}/>} label="Active queue" value={data.activeQueueCount} sub={data.openVisitsCount+" open visits"}/>
      <Kpi icon={<FileClock size={18}/>} label="Pending docs" value={data.pendingDocumentationCount} sub="Documentation still required"/>
      <Kpi icon={<Stethoscope size={18}/>} label="Follow-ups" value={data.followUpsToday} sub={data.followUpsOverdue+" overdue"}/>
    </div>

    <div className="dashboard-grid">
      <section className="card">
        <header className="section-head"><div><h2>Live queue</h2><p>Current patients moving through the clinic.</p></div></header>
        {data.queue.length===0?<div className="mini-empty">No active queue entries.</div>:<div className="dashboard-list">
          {data.queue.map((item,index)=><div className="dashboard-list-row" key={item.patientNumber+"-"+index}>
            <div className="queue-status-dot" style={{background:item.statusColor}}/>
            <div><strong>{item.patientName}</strong><small><span dir="ltr">{item.patientNumber}</span> · {item.doctorName??"Unassigned"}</small></div>
            <span>{item.statusName}</span>
          </div>)}
        </div>}
      </section>

      <section className="card">
        <header className="section-head"><div><h2>Follow-ups due</h2><p>Today and overdue clinical follow-up work.</p></div></header>
        {data.followUps.length===0?<div className="mini-empty">No follow-ups due.</div>:<div className="dashboard-list">
          {data.followUps.map((item,index)=><div className="dashboard-list-row" key={item.patientNumber+"-"+index}>
            <span className={"due-pill "+item.dueCategory.toLowerCase()}>{item.dueCategory}</span>
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
