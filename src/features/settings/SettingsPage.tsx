import { FormEvent,useEffect,useMemo,useState } from "react";
import { Plus,Save,Trash2 } from "lucide-react";
import { authSession } from "../auth/authSession";
import { useClinicSettings,useSaveClinicSettings,useSaveWorkflowSettings,useWorkflowSettings,type ClinicSettings,type WorkflowSettings } from "./settings.api";

type Tab="clinic"|"workflow";

export function SettingsPage(){
  const[tab,setTab]=useState<Tab>("clinic");
  const canManage=authSession.hasPermission("Settings_Manage");
  return <section className="page">
    <header className="page-heading"><div><span className="eyebrow">SYSTEM / SETTINGS</span><h1>Settings & Configuration</h1><p>Clinic identity, localization and configurable patient workflow.</p></div></header>
    <div className="settings-tabs"><button className={tab==="clinic"?"active":""} onClick={()=>setTab("clinic")}>Clinic settings</button><button className={tab==="workflow"?"active":""} onClick={()=>setTab("workflow")}>Workflow</button></div>
    {tab==="clinic"?<ClinicSettingsPanel canManage={canManage}/>:<WorkflowPanel canManage={canManage}/>}
  </section>
}

function ClinicSettingsPanel({canManage}:{canManage:boolean}){
  const query=useClinicSettings();const save=useSaveClinicSettings();
  const[form,setForm]=useState<Omit<ClinicSettings,"clinicCode">|null>(null);
  useEffect(()=>{if(query.data){const{clinicCode:_code,...rest}=query.data;setForm(rest)}},[query.data]);
  if(query.isLoading||!form)return <div className="state-card">Loading clinic settings...</div>;
  if(query.isError)return <div className="state-card error-box">Unable to load clinic settings.</div>;
  async function submit(e:FormEvent){e.preventDefault();await save.mutateAsync(form!)}
  const set=(key:keyof typeof form,value:string|number)=>setForm(current=>current?{...current,[key]:value}:current);
  return <form className="card settings-form" onSubmit={submit}>
    <header className="section-head"><div><span className="eyebrow">GENERAL</span><h2>Clinic identity</h2><p>Branding, localization and operational defaults.</p></div>{canManage&&<button className="primary-button" disabled={save.isPending}><Save size={15}/>{save.isPending?"Saving...":"Save settings"}</button>}</header>
    <div className="settings-grid">
      <label className="field">Clinic name<input disabled={!canManage} value={form.clinicName} onChange={e=>set("clinicName",e.target.value)}/></label>
      <label className="field">Patient prefix<input disabled={!canManage} value={form.patientNumberPrefix??""} onChange={e=>set("patientNumberPrefix",e.target.value)}/></label>
      <label className="field">Time zone<input disabled={!canManage} value={form.timeZoneId??""} onChange={e=>set("timeZoneId",e.target.value)} placeholder="Africa/Cairo"/></label>
      <label className="field">Locale<select disabled={!canManage} value={form.locale??"en"} onChange={e=>set("locale",e.target.value)}><option value="en">English</option><option value="ar">العربية</option></select></label>
      <label className="field">Phone<input disabled={!canManage} value={form.phone??""} onChange={e=>set("phone",e.target.value)}/></label>
      <label className="field">Email<input disabled={!canManage} type="email" value={form.email??""} onChange={e=>set("email",e.target.value)}/></label>
      <label className="field full-span">Address<input disabled={!canManage} value={form.address??""} onChange={e=>set("address",e.target.value)}/></label>
      <label className="field">Primary color<input disabled={!canManage} value={form.primaryColor??""} onChange={e=>set("primaryColor",e.target.value)} placeholder="#3B82F6"/></label>
      <label className="field">Secondary color<input disabled={!canManage} value={form.secondaryColor??""} onChange={e=>set("secondaryColor",e.target.value)} placeholder="#6366F1"/></label>
      <label className="field">Date format<input disabled={!canManage} value={form.dateFormat??""} onChange={e=>set("dateFormat",e.target.value)}/></label>
      <label className="field">Time format<input disabled={!canManage} value={form.timeFormat??""} onChange={e=>set("timeFormat",e.target.value)}/></label>
      <label className="field">Documentation reminder hours<input disabled={!canManage} type="number" min="1" max="168" value={form.documentationReminderHours} onChange={e=>set("documentationReminderHours",Number(e.target.value))}/></label>
    </div>
    {save.isSuccess&&<div className="save-state success">Clinic settings saved.</div>}{save.isError&&<div className="error-box">Unable to save clinic settings.</div>}
  </form>
}

function WorkflowPanel({canManage}:{canManage:boolean}){
  const query=useWorkflowSettings();const save=useSaveWorkflowSettings();
  const[data,setData]=useState<WorkflowSettings|null>(null);
  useEffect(()=>{if(query.data)setData({statuses:query.data.statuses.map(x=>({...x})),transitions:query.data.transitions.map(x=>({...x}))})},[query.data]);
  const codes=useMemo(()=>data?.statuses.map(x=>x.code).filter(Boolean)??[],[data]);
  if(query.isLoading||!data)return <div className="state-card">Loading workflow...</div>;
  if(query.isError)return <div className="state-card error-box">Unable to load workflow settings.</div>;
  const patchStatus=(i:number,key:string,value:string|number|boolean)=>setData(current=>current?{...current,statuses:current.statuses.map((s,index)=>index===i?{...s,[key]:value}:s)}:current);
  const removeStatus=(i:number)=>setData(current=>current?{statuses:current.statuses.filter((_,index)=>index!==i),transitions:current.transitions}:current);
  const patchTransition=(i:number,key:"fromCode"|"toCode",value:string)=>setData(current=>current?{...current,transitions:current.transitions.map((t,index)=>index===i?{...t,[key]:value}:t)}:current);
  return <div className="card">
    <header className="section-head"><div><span className="eyebrow">LIVE QUEUE</span><h2>Workflow configuration</h2><p>Status codes are stable semantic keys; transitions control allowed queue movement.</p></div>{canManage&&<button className="primary-button" disabled={save.isPending} onClick={()=>save.mutate(data)}><Save size={15}/>{save.isPending?"Saving...":"Save workflow"}</button>}</header>
    <div className="workflow-config">
      <section><div className="config-head"><h3>Statuses</h3>{canManage&&<button className="secondary-button" onClick={()=>setData({...data,statuses:[...data.statuses,{code:"NEW_STATUS",name:"New status",color:"#64748B",sortOrder:(data.statuses.length+1)*10,isFinal:false}]})}><Plus size={14}/>Add status</button>}</div>
      <div className="config-list">{data.statuses.map((s,i)=><div className="workflow-status-row" key={i}>
        <input disabled={!canManage} value={s.code} onChange={e=>patchStatus(i,"code",e.target.value.toUpperCase())} placeholder="CODE"/>
        <input disabled={!canManage} value={s.name} onChange={e=>patchStatus(i,"name",e.target.value)} placeholder="Name"/>
        <input disabled={!canManage} value={s.color} onChange={e=>patchStatus(i,"color",e.target.value)} placeholder="#3B82F6"/>
        <input disabled={!canManage} type="number" value={s.sortOrder} onChange={e=>patchStatus(i,"sortOrder",Number(e.target.value))}/>
        <label className="final-check"><input disabled={!canManage} type="checkbox" checked={s.isFinal} onChange={e=>patchStatus(i,"isFinal",e.target.checked)}/><span>Final</span></label>
        {canManage&&<button className="danger-icon" onClick={()=>removeStatus(i)}><Trash2 size={14}/></button>}
      </div>)}</div></section>
      <section><div className="config-head"><h3>Transitions</h3>{canManage&&codes.length>0&&<button className="secondary-button" onClick={()=>setData({...data,transitions:[...data.transitions,{fromCode:codes[0],toCode:codes[1]??codes[0]}]})}><Plus size={14}/>Add transition</button>}</div>
      <div className="config-list">{data.transitions.map((t,i)=><div className="workflow-transition-row" key={i}>
        <select disabled={!canManage} value={t.fromCode} onChange={e=>patchTransition(i,"fromCode",e.target.value)}>{codes.map(c=><option key={c}>{c}</option>)}</select><span>→</span><select disabled={!canManage} value={t.toCode} onChange={e=>patchTransition(i,"toCode",e.target.value)}>{codes.map(c=><option key={c}>{c}</option>)}</select>{canManage&&<button className="danger-icon" onClick={()=>setData({...data,transitions:data.transitions.filter((_,index)=>index!==i)})}><Trash2 size={14}/></button>}
      </div>)}</div></section>
    </div>
    {save.isSuccess&&<div className="save-state success">Workflow saved. Live Queue refreshed.</div>}{save.isError&&<div className="error-box">Unable to save workflow. A status may already be used by queue history or configuration may be invalid.</div>}
  </div>
}
