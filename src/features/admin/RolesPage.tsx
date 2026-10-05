import { useMemo } from "react";
import { usePermissions,useRoles } from "./admin.api";

export function RolesPage(){
  const roles=useRoles();const permissions=usePermissions();
  const groups=useMemo(()=>[...new Set((permissions.data??[]).map(p=>p.group))],[permissions.data]);

  return <section className="page">
    <header className="page-heading"><div><span className="eyebrow">SYSTEM / RBAC</span><h1>Roles & Permissions</h1><p>System roles are static. This matrix documents the effective permission catalog.</p></div></header>
    {(roles.isLoading||permissions.isLoading)&&<div className="state-card">Loading RBAC catalog...</div>}
    {(roles.isError||permissions.isError)&&<div className="state-card error-box">Unable to load RBAC catalog.</div>}
    {roles.data&&permissions.data&&<div className="rbac-grid">
      {roles.data.map(role=><article className="card role-card" key={role.code}>
        <header><div><span className="role-code">{role.code}</span><h2>{role.name}</h2></div><span>{role.permissions.length} permissions</span></header>
        <div className="role-groups">{groups.map(group=>{
          const items=permissions.data!.filter(p=>p.group===group);
          const enabled=items.filter(p=>role.permissions.includes(p.key));
          if(enabled.length===0)return null;
          return <section key={group}><h3>{group}</h3><div>{enabled.map(p=><span key={p.key} title={p.key}>{p.descriptions.en??p.key}</span>)}</div></section>
        })}</div>
      </article>)}
    </div>}
  </section>
}
