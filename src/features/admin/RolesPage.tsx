import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/i18n";
import { usePermissions,useRoles } from "./admin.api";

export function RolesPage(){
  const { locale,t }=useI18n();
  const roles=useRoles();const permissions=usePermissions();
  const groups=useMemo(()=>[...new Set((permissions.data??[]).map(p=>p.group))],[permissions.data]);

  return <section className="page">
    <header className="page-heading"><div><span className="eyebrow">{t("SYSTEM / RBAC","النظام / الأدوار والصلاحيات")}</span><h1>{t("Roles & Permissions","الأدوار والصلاحيات")}</h1><p>{t("System roles are static. This matrix documents the effective permission catalog.","أدوار النظام ثابتة، وهذه المصفوفة تعرض الصلاحيات الفعلية لكل دور.")}</p></div></header>
    {(roles.isLoading||permissions.isLoading)&&<div className="state-card">{t("Loading RBAC catalog...","جارٍ تحميل الأدوار والصلاحيات...")}</div>}
    {(roles.isError||permissions.isError)&&<div className="state-card error-box">{t("Unable to load RBAC catalog.","تعذر تحميل الأدوار والصلاحيات.")}</div>}
    {roles.data&&permissions.data&&<div className="rbac-grid">
      {roles.data.map(role=><article className="card role-card" key={role.code}>
        <header><div><span className="role-code">{role.code}</span><h2>{roleName(role.code,role.name,t)}</h2></div><span>{role.permissions.length} {t("permissions","صلاحية")}</span></header>
        <div className="role-groups">{groups.map(group=>{
          const items=permissions.data!.filter(p=>p.group===group);
          const enabled=items.filter(p=>role.permissions.includes(p.key));
          if(enabled.length===0)return null;
          return <section key={group}><h3>{groupLabel(group,t)}</h3><div>{enabled.map(p=><span key={p.key} title={p.key}>{p.descriptions[locale]??p.descriptions.en??p.key}</span>)}</div></section>
        })}</div>
      </article>)}
    </div>}
  </section>
}

function roleName(code:string,fallback:string,t:(english:string,arabic:string)=>string){
  if(code==="ADMIN")return t("Admin","مدير");
  if(code==="RECEPTIONIST")return t("Receptionist","استقبال");
  if(code==="DOCTOR")return t("Doctor","طبيب");
  if(code==="NURSE")return t("Nurse","تمريض");
  return fallback;
}

function groupLabel(group:string,t:(english:string,arabic:string)=>string){
  const map:Record<string,[string,string]>={
    Dashboard:["Dashboard","لوحة التحكم"],
    Audit:["Audit","التدقيق"],
    Patient:["Patients","المرضى"],
    Users:["Users","المستخدمون"],
    RBAC:["Roles & Permissions","الأدوار والصلاحيات"],
    Queue:["Queue","قائمة الانتظار"],
    Visit:["Visits","الزيارات"],
    MedicalProfile:["Medical profile","الملف الطبي"],
    FollowUp:["Follow-ups","المتابعات"],
    Reports:["Reports","التقارير"],
    Settings:["Settings","الإعدادات"],
    Files:["Files","الملفات"],
    Attendance:["Attendance","الحضور"]
  };
  const value=map[group];
  return value?t(value[0],value[1]):group;
}
