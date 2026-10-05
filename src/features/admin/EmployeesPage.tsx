import { FormEvent,useMemo,useState } from "react";
import { Plus,Search } from "lucide-react";
import { authSession } from "../auth/authSession";
import { useCreateUser,useRoles,useSetUserRoles,useSetUserStatus,useUsers,type ClinicUser } from "./admin.api";

export function EmployeesPage(){
  const users=useUsers();
  const roles=useRoles();
  const [search,setSearch]=useState("");
  const [createOpen,setCreateOpen]=useState(false);
  const [editing,setEditing]=useState<ClinicUser|null>(null);
  const canManage=authSession.hasPermission("Users_Manage");
  const canRoles=authSession.hasPermission("RBAC_Manage");
  const statusMutation=useSetUserStatus();

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return (users.data??[]).filter(u=>!q||u.fullName.toLowerCase().includes(q)||(u.email??"").toLowerCase().includes(q)||u.roles.some(r=>r.toLowerCase().includes(q)));
  },[search,users.data]);

  return <section className="page">
    <header className="page-heading">
      <div><span className="eyebrow">MANAGEMENT / EMPLOYEES</span><h1>Employees</h1><p>Clinic users, account state and static role assignments.</p></div>
      {canManage&&canRoles&&<button className="primary-button" onClick={()=>setCreateOpen(true)}><Plus size={15}/>New employee</button>}
    </header>
    <div className="card">
      <div className="toolbar"><label className="search-field"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee, email, or role..."/></label><span className="count-pill">{filtered.length} users</span></div>
      {users.isLoading&&<div className="state-card">Loading employees...</div>}
      {users.isError&&<div className="state-card error-box">Unable to load employees.</div>}
      {users.data&&<div className="table-scroll"><table><thead><tr><th>Employee</th><th>Email</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filtered.map(u=><tr key={u.id}>
          <td><strong>{u.fullName}</strong>{u.isSuperUser&&<small className="table-subline">Super User</small>}</td>
          <td>{u.email??"—"}</td>
          <td><div className="role-tags">{u.roles.map(r=><span key={r}>{r}</span>)}</div></td>
          <td><span className={"status-pill "+(u.isActive?"active-user":"inactive-user")}>{u.isActive?"Active":"Inactive"}</span></td>
          <td><div className="row-actions">
            {canRoles&&<button onClick={()=>setEditing(u)}>Roles</button>}
            {canManage&&!u.isSuperUser&&<button onClick={()=>statusMutation.mutate({userId:u.id,isActive:!u.isActive})}>{u.isActive?"Deactivate":"Activate"}</button>}
          </div></td>
        </tr>)}
      </tbody></table></div>}
    </div>
    {createOpen&&roles.data&&<CreateEmployeeModal roles={roles.data.map(r=>r.code)} onClose={()=>setCreateOpen(false)}/>}
    {editing&&roles.data&&<EditRolesModal user={editing} roles={roles.data.map(r=>r.code)} onClose={()=>setEditing(null)}/>}
  </section>
}

function CreateEmployeeModal({roles,onClose}:{roles:string[];onClose:()=>void}){
  const create=useCreateUser();
  const [fullName,setFullName]=useState("");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[phone,setPhone]=useState("");const[selected,setSelected]=useState<string[]>([]);
  async function submit(e:FormEvent){e.preventDefault();await create.mutateAsync({fullName,email,password,phone:phone||null,isSuperUser:false,roles:selected});onClose();}
  return <div className="modal-backdrop"><form className="modal compact-modal" onSubmit={submit}><header className="modal-head"><div><h2>New employee</h2><p>Create clinic account and assign static roles.</p></div></header><div className="modal-body form-grid">
    <label className="field">Full name<input required value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
    <label className="field">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label className="field">Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label className="field">Phone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    <RoleChecks roles={roles} selected={selected} setSelected={setSelected}/>
    {create.isError&&<div className="error-box full-span">Unable to create employee.</div>}
  </div><footer className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={create.isPending||selected.length===0}>{create.isPending?"Creating...":"Create"}</button></footer></form></div>
}

function EditRolesModal({user,roles,onClose}:{user:ClinicUser;roles:string[];onClose:()=>void}){
  const mutation=useSetUserRoles();const[selected,setSelected]=useState<string[]>(user.roles);
  async function submit(e:FormEvent){e.preventDefault();await mutation.mutateAsync({userId:user.id,roles:selected});onClose();}
  return <div className="modal-backdrop"><form className="modal compact-modal" onSubmit={submit}><header className="modal-head"><div><h2>{user.fullName}</h2><p>Replace assigned static roles.</p></div></header><div className="modal-body"><RoleChecks roles={roles} selected={selected} setSelected={setSelected}/>{mutation.isError&&<div className="error-box">Unable to update roles.</div>}</div><footer className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={mutation.isPending||selected.length===0}>Save roles</button></footer></form></div>
}

function RoleChecks({roles,selected,setSelected}:{roles:string[];selected:string[];setSelected:(v:string[])=>void}){
  return <div className="role-checks full-span">{roles.map(role=><label key={role}><input type="checkbox" checked={selected.includes(role)} onChange={e=>setSelected(e.target.checked?[...selected,role]:selected.filter(x=>x!==role))}/><span>{role}</span></label>)}</div>
}
