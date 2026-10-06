import { FormEvent, useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { useI18n } from "../../lib/i18n/i18n";
import { authSession } from "../auth/authSession";
import { useVisits } from "../visits/visits.api";
import { useCreateFollowUp, useFollowUps, useSetFollowUpStatus } from "./followUps.api";

const categories = ["All", "Today", "Upcoming", "Overdue", "Completed"] as const;

export function FollowUpsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const followUps = useFollowUps(search, category);
  const canManage = authSession.hasPermission("FollowUp_Manage");

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{t("CLINIC / FOLLOW-UPS","العيادة / المتابعات")}</span>
          <h1>{t("Follow-ups","المتابعات")}</h1>
          <p>{t("Due, upcoming and overdue clinical follow-up work.","متابعات اليوم والقادمة والمتأخرة.")}</p>
        </div>
        {canManage && <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={15} />{t("New follow-up","متابعة جديدة")}</button>}
      </header>

      <div className="card">
        <div className="follow-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Search patient or recommendation...","ابحث بالمريض أو التوصية...")} />
          </label>

          <div className="filter-chips">
            {categories.map(item => (
              <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{categoryLabel(item,t)}</button>
            ))}
          </div>
        </div>

        {followUps.isLoading && <div className="state-card">{t("Loading follow-ups...","جارٍ تحميل المتابعات...")}</div>}
        {followUps.isError && <div className="state-card error-box">{t("Unable to load follow-ups.","تعذر تحميل المتابعات.")}</div>}
        {followUps.data?.length === 0 && <div className="state-card">{t("No follow-ups found.","لا توجد متابعات.")}</div>}

        <div className="follow-list">
          {followUps.data?.map(item => <FollowUpCard key={item.id} item={item} canManage={canManage} />)}
        </div>
      </div>

      {createOpen && <CreateFollowUpModal onClose={() => setCreateOpen(false)} />}
    </section>
  );
}

function FollowUpCard({ item, canManage }: {
  item: {
    id: string;
    patientNumber: string;
    patientName: string;
    doctorName: string;
    recommendation: string;
    recommendedDate?: string | null;
    status: "Open" | "Completed" | "Cancelled";
    dueCategory: string;
  };
  canManage: boolean;
}) {
  const { t } = useI18n();
  const statusMutation = useSetFollowUpStatus();

  return (
    <article className="follow-card">
      <div className="follow-card-main">
        <div className="follow-avatar">{initials(item.patientName)}</div>
        <div>
          <div className="follow-title-row">
            <strong>{item.patientName}</strong>
            <span className={"due-pill " + item.dueCategory.toLowerCase()}>{categoryLabel(item.dueCategory,t)}</span>
          </div>
          <small><span dir="ltr">{item.patientNumber}</span> · {item.doctorName}</small>
          <p>{item.recommendation}</p>
        </div>
      </div>

      <div className="follow-card-side">
        <span className="follow-date" dir="ltr">{item.recommendedDate ?? t("No date","بدون تاريخ")}</span>
        {canManage && item.status === "Open" && (
          <div className="follow-card-actions">
            <button className="complete" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ followUpId: item.id, status: "Completed" })}>
              <Check size={13} />{t("Complete","إكمال")}
            </button>
            <button className="cancel" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ followUpId: item.id, status: "Cancelled" })}>
              <X size={13} />{t("Cancel","إلغاء")}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function CreateFollowUpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const visits = useVisits();
  const create = useCreateFollowUp();
  const [visitId, setVisitId] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [recommendedDate, setRecommendedDate] = useState("");

  const selectedVisit = useMemo(
    () => visits.data?.find(visit => visit.id === visitId),
    [visitId, visits.data]
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedVisit) return;

    await create.mutateAsync({
      patientId: selectedVisit.patientId,
      visitId: selectedVisit.id,
      doctorId: selectedVisit.doctorId,
      recommendation,
      recommendedDate: recommendedDate || null
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal compact-modal" onSubmit={submit}>
        <header className="modal-head">
          <div><h2>{t("New follow-up","متابعة جديدة")}</h2><p>{t("Create follow-up work from an existing visit.","أنشئ متابعة مرتبطة بزيارة موجودة.")}</p></div>
        </header>

        <div className="modal-body form-grid">
          <label className="field full-span">{t("Visit","الزيارة")}
            <select required value={visitId} onChange={event => setVisitId(event.target.value)}>
              <option value="">{t("Select visit","اختر الزيارة")}</option>
              {visits.data?.map(visit => (
                <option key={visit.id} value={visit.id}>
                  {visit.patientName} · {visit.doctorName} · {new Date(visit.entryAtUtc).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>

          <label className="field full-span">{t("Recommendation","التوصية")}
            <textarea required value={recommendation} onChange={event => setRecommendation(event.target.value)} />
          </label>

          <label className="field full-span">{t("Recommended date","التاريخ المقترح")}
            <input type="date" required value={recommendedDate} onChange={event => setRecommendedDate(event.target.value)} />
          </label>

          {create.isError && <div className="error-box full-span">{t("Unable to create follow-up.","تعذر إنشاء المتابعة.")}</div>}
        </div>

        <footer className="modal-foot">
          <button type="button" className="secondary-button" onClick={onClose}>{t("Cancel","إلغاء")}</button>
          <button className="primary-button" disabled={create.isPending || !selectedVisit}>
            {create.isPending ? t("Creating...","جارٍ الإنشاء...") : t("Create follow-up","إنشاء المتابعة")}
          </button>
        </footer>
      </form>
    </div>
  );
}

function categoryLabel(value:string,t:(english:string,arabic:string)=>string){
  if(value==="All")return t("All","الكل");
  if(value==="Today")return t("Today","اليوم");
  if(value==="Upcoming")return t("Upcoming","قادمة");
  if(value==="Overdue")return t("Overdue","متأخرة");
  if(value==="Completed")return t("Completed","مكتملة");
  if(value==="Cancelled")return t("Cancelled","ملغاة");
  if(value==="Open")return t("Open","مفتوحة");
  return value;
}

function initials(value: string) {
  return value.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
