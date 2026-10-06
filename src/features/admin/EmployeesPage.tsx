import { FormEvent,useMemo,useState } from "react";
import { Plus,Search } from "lucide-react";
import { useI18n } from "../../lib/i18n/i18n";
import { authSession } from "../auth/authSession";
import { useCreateUser,useRoles,useSetUserRoles,useSetUserStatus,useUsers,type ClinicUser } from "./admin.api";

export function EmployeesPage(){
  const { t }=useI18n();
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
      <div><span className="eyebrow">{t("MANAGEMENT / EMPLOYEES","الإدارة / الموظفون")}</span><h1>{t("Employees","الموظفون")}</h1><p>{t("Clinic users, account state and static role assignments.","مستخدمو العيادة وحالة الحسابات وتعيين الأدوار الثابتة.")}</p></div>
      {canManage&&canRoles&&<button className="primary-button" onClick={()=>setCreateOpen(true)}><Plus size={15}/>{t("New employee","موظف جديد")}</button>}
    </header>
    <div className="card">
      <div className="toolbar"><label className="search-field"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search employee, email, or role...","ابحث بالموظف أو البريد أو الدور...")}/></label><span className="count-pill">{filtered.length} {t("users","مستخدم")}</span></div>
      {users.isLoading&&<div className="state-card">{t("Loading employees...","جارٍ تحميل الموظفين...")}</div>}
      {users.isError&&<div className="state-card error-box">{t("Unable to load employees.","تعذر تحميل الموظفين.")}</div>}
      {users.data&&<div className="table-scroll"><table><thead><tr><th>{t("Employee","الموظف")}</th><th>{t("Email","البريد الإلكتروني")}</th><th>{t("Roles","الأدوار")}</th><th>{t("Status","الحالة")}</th><th>{t("Actions","الإجراءات")}</th></tr></thead><tbody>
        {filtered.map(u=><tr key={u.id}>
          <td><strong>{u.fullName}</strong>{u.isSuperUser&&<small className="table-subline">{t("Super User","مستخدم رئيسي")}</small>}</td>
          <td>{u.email??"—"}</td>
          <td><div className="role-tags">{u.roles.map(r=><span key={r}>{roleLabel(r,t)}</span>)}</div></td>
          <td><span className={"status-pill "+(u.isActive?"active-user":"inactive-user")}>{u.isActive?t("Active","نشط"):t("Inactive","غير نشط")}</span></td>
          <td><div className="row-actions">
            {canRoles&&<button onClick={()=>setEditing(u)}>{t("Roles","الأدوار")}</button>}
            {canManage&&!u.isSuperUser&&<button onClick={()=>statusMutation.mutate({userId:u.id,isActive:!u.isActive})}>{u.isActive?t("Deactivate","تعطيل"):t("Activate","تفعيل")}</button>}
          </div></td>
        </tr>)}
      </tbody></table></div>}
    </div>
    {createOpen&&roles.data&&<CreateEmployeeModal roles={roles.data.map(r=>r.code)} onClose={()=>setCreateOpen(false)}/>}
    {editing&&roles.data&&<EditRolesModal user={editing} roles={roles.data.map(r=>r.code)} onClose={()=>setEditing(null)}/>}
  </section>
}

function CreateEmployeeModal({roles,onClose}:{roles:string[];onClose:()=>void}){
  const { t }=useI18n();
  const create=useCreateUser();
  const [fullName,setFullName]=useState("");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[phone,setPhone]=useState("");const[selected,setSelected]=useState<string[]>([]);
  async function submit(e:FormEvent){e.preventDefault();await create.mutateAsync({fullName,email,password,phone:phone||null,isSuperUser:false,roles:selected});onClose();}
  return <div className="modal-backdrop"><form className="modal compact-modal" onSubmit={submit}><header className="modal-head"><div><h2>{t("New employee","موظف جديد")}</h2><p>{t("Create clinic account and assign static roles.","أنشئ حسابًا للعيادة وحدد الأدوار المناسبة.")}</p></div></header><div className="modal-body form-grid">
    <label className="field">{t("Full name","الاسم الكامل")}<input required value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
    <label className="field">{t("Email","البريد الإلكتروني")}<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label className="field">{t("Password","كلمة المرور")}<input required type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label className="field">{t("Phone","الهاتف")}<input value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    <RoleChecks roles={roles} selected={selected} setSelected={setSelected}/>
    {create.isError&&<div className="error-box full-span">{t("Unable to create employee.","تعذر إنشاء الموظف.")}</div>}
  </div><footer className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>{t("Cancel","إلغاء")}</button><button className="primary-button" disabled={create.isPending||selected.length===0}>{create.isPending?t("Creating...","جارٍ الإنشاء..."):t("Create","إنشاء")}</button></footer></form></div>
}

function EditRolesModal({user,roles,onClose}:{user:ClinicUser;roles:string[];onClose:()=>void}){
  const { t }=useI18n();
  const mutation=useSetUserRoles();const[selected,setSelected]=useState<string[]>(user.roles);
  async function submit(e:FormEvent){e.preventDefault();await mutation.mutateAsync({userId:user.id,roles:selected});onClose();}
  return <div className="modal-backdrop"><form className="modal compact-modal" onSubmit={submit}><header className="modal-head"><div><h2>{user.fullName}</h2><p>{t("Replace assigned static roles.","حدّث الأدوار الثابتة المعيّنة للمستخدم.")}</p></div></header><div className="modal-body"><RoleChecks roles={roles} selected={selected} setSelected={setSelected}/>{mutation.isError&&<div className="error-box">{t("Unable to update roles.","تعذر تحديث الأدوار.")}</div>}</div><footer className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>{t("Cancel","إلغاء")}</button><button className="primary-button" disabled={mutation.isPending||selected.length===0}>{t("Save roles","حفظ الأدوار")}</button></footer></form></div>
}

function RoleChecks({roles,selected,setSelected}:{roles:string[];selected:string[];setSelected:(v:string[])=>void}){
  const { t }=useI18n();
  return <div className="role-checks full-span">{roles.map(role=><label key={role}><input type="checkbox" checked={selected.includes(role)} onChange={e=>setSelected(e.target.checked?[...selected,role]:selected.filter(x=>x!==role))}/><span>{roleLabel(role,t)}</span></label>)}</div>
}

function roleLabel(role:string,t:(english:string,arabic:string)=>string){
  if(role==="ADMIN")return t("Admin","مدير");
  if(role==="RECEPTIONIST")return t("Receptionist","استقبال");
  if(role==="DOCTOR")return t("Doctor","طبيب");
  if(role==="NURSE")return t("Nurse","تمريض");
  return role;
}
