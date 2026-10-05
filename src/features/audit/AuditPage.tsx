import { useMemo,useState } from "react";
import { Search } from "lucide-react";
import { useAuditLogs } from "./audit.api";

export function AuditPage(){
  const logs=useAuditLogs();
  const[search,setSearch]=useState("");
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return (logs.data??[]).filter(x=>!q||x.actorName.toLowerCase().includes(q)||x.action.toLowerCase().includes(q)||x.entityType.toLowerCase().includes(q));
  },[logs.data,search]);

  return <section className="page">
    <header className="page-heading"><div><span className="eyebrow">SYSTEM / AUDIT</span><h1>Audit Log</h1><p>Tenant-scoped security and operational history.</p></div></header>
    <div className="card">
      <div className="toolbar"><label className="search-field"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search actor, event, or target..."/></label><span className="count-pill">{filtered.length} events</span></div>
      {logs.isLoading&&<div className="state-card">Loading audit events...</div>}
      {logs.isError&&<div className="state-card error-box">Unable to load audit events.</div>}
      {logs.data&&<div className="audit-list">{filtered.map(log=><article key={log.id} className="audit-row">
        <div className="audit-event"><strong>{humanize(log.action)}</strong><small>{log.entityType}</small></div>
        <div><strong>{log.actorName}</strong><small>{log.ipAddress??"—"}</small></div>
        <div className="audit-meta"><span dir="ltr">{new Date(log.occurredAtUtc).toLocaleString()}</span>{log.metadataJson&&<details><summary>Details</summary><pre>{prettyJson(log.metadataJson)}</pre></details>}</div>
      </article>)}</div>}
    </div>
  </section>
}

function humanize(value:string){return value.replaceAll("."," · ").replace(/([a-z])([A-Z])/g,"$1 $2")}
function prettyJson(value:string){try{return JSON.stringify(JSON.parse(value),null,2)}catch{return value}}
