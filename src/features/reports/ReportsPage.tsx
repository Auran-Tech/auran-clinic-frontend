import { useMemo,useState } from "react";
import { useOperationalReport } from "./reports.api";

function iso(date:Date){return date.toISOString().slice(0,10)}

export function ReportsPage(){
  const today=useMemo(()=>new Date(),[]);
  const defaultFrom=useMemo(()=>{const d=new Date(today);d.setDate(d.getDate()-29);return iso(d)},[today]);
  const[fromDate,setFromDate]=useState(defaultFrom);
  const[toDate,setToDate]=useState(iso(today));
  const report=useOperationalReport(fromDate,toDate);

  return <section className="page">
    <header className="page-heading"><div><span className="eyebrow">ANALYTICS / REPORTS</span><h1>Reports</h1><p>Operational clinic performance for the selected clinic-local date range.</p></div></header>
    <div className="card report-filter"><label className="field">From<input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label className="field">To<input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label></div>
    {report.isLoading&&<div className="state-card">Loading report...</div>}
    {report.isError&&<div className="state-card error-box">Unable to load report.</div>}
    {report.data&&<>
      <div className="report-kpis">
        <Kpi label="Patients" value={report.data.patientCount} sub={report.data.newPatientCount+" new"}/>
        <Kpi label="Visits" value={report.data.visitCount} sub={report.data.completedVisitCount+" completed"}/>
        <Kpi label="Active queue" value={report.data.activeQueueCount} sub={report.data.openVisitCount+" open visits"}/>
        <Kpi label="Pending docs" value={report.data.pendingDocumentationCount} sub="Requires documentation"/>
        <Kpi label="Follow-ups today" value={report.data.followUpsToday} sub={report.data.followUpsOverdue+" overdue"}/>
      </div>
      <div className="card"><header className="section-head"><div><h2>Doctor activity</h2><p>{report.data.fromDate} → {report.data.toDate}</p></div></header>
        {report.data.doctorActivity.length===0?<div className="mini-empty">No doctor activity in this range.</div>:<div className="table-scroll"><table><thead><tr><th>Doctor</th><th>Visits</th><th>Completed</th><th>Pending documentation</th></tr></thead><tbody>{report.data.doctorActivity.map(row=><tr key={row.doctorName}><td><strong>{row.doctorName}</strong></td><td>{row.visitCount}</td><td>{row.completedVisitCount}</td><td>{row.pendingDocumentationCount}</td></tr>)}</tbody></table></div>}
      </div>
    </>}
  </section>
}

function Kpi({label,value,sub}:{label:string;value:number;sub:string}){return <article className="card report-kpi"><small>{label}</small><strong>{value}</strong><span>{sub}</span></article>}
