import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { NotificationPanel, useNotifications } from "../components/NotificationBox";

const PROJECT_API = "https://localhost:8002";
const BUG_API = "https://localhost:8003";
const AUTH_API = "https://localhost:8001";

interface Member { user_id: number; role: string }
interface Project {
  id: number; owner_id: number; name: string; description: string;
  status: string; archive_reason: string | null; archived_date: string | null;
  members: Member[];
}
interface Bug {
  id: number; name: string; feature: string; submitter_id: number;
  assignee_id: number | null; creation_date: string; estimated_fixed_date: string;
  status: string; severity: number; project_id: number; archive_reason?: string | null;
}
interface User { id: number; name: string; email: string }

const inputCls = "w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
const primaryBtn = "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap";
const secondaryBtn = "px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-medium transition-colors cursor-pointer";
const dangerBtn = "px-3 py-1.5 bg-zinc-950 hover:bg-red-950 text-red-500 border border-zinc-800 hover:border-red-900 rounded-lg text-sm font-medium transition-colors cursor-pointer";
const ghostBtn = "px-2 py-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md text-xs transition-colors cursor-pointer";

const bugStatusBorder: Record<string, string> = {
  activ: "border-l-red-500",
  rezolvat: "border-l-emerald-500",
  verificat: "border-l-sky-500",
  arhivat: "border-l-zinc-700",
};

const severityLabel: Record<number, string> = { 1: "Low", 2: "Med", 3: "High", 4: "Crit", 5: "Blkr" };
const severityColor: Record<number, string> = {
  1: "text-zinc-500", 2: "text-yellow-500", 3: "text-orange-400", 4: "text-red-400", 5: "text-red-600",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    activ: "bg-indigo-950 text-indigo-400",
    incheiat: "bg-amber-950 text-amber-400",
    arhivat: "bg-zinc-800 text-zinc-500",
    rezolvat: "bg-emerald-950 text-emerald-400",
    verificat: "bg-sky-950 text-sky-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium tracking-wide ${styles[status] ?? "bg-zinc-800 text-zinc-500"}`}>
      {status}
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-3">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

const emptyBugForm = { name: "", feature: "", assigneeEmail: "", estimated_fixed_date: "", status: "activ", severity: 1 };

async function resolveEmail(email: string, headers: Record<string, string>): Promise<number | null> {
  if (!email.trim()) return null;
  const res = await fetch(`${AUTH_API}/api/user/by-email?email=${encodeURIComponent(email.trim())}`, { headers });
  if (!res.ok) return undefined as any;
  const u: User = await res.json();
  return u.id;
}

export default function Project() {
  const { id } = useParams();
  const { token, userId, userName } = useAuth();
  const { notifications } = useNotifications();

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bugSearch, setBugSearch] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "" });
  const [showArchiveProject, setShowArchiveProject] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Member");

  const [showCreateBug, setShowCreateBug] = useState(false);
  const [bugForm, setBugForm] = useState(emptyBugForm);
  const [bugFormEmailError, setBugFormEmailError] = useState("");
  const [editingBugId, setEditingBugId] = useState<number | null>(null);
  const [bugEditForm, setBugEditForm] = useState({ name: "", feature: "", assigneeEmail: "", status: "", severity: 1 });
  const [bugEditEmailError, setBugEditEmailError] = useState("");
  const [archivingBugId, setArchivingBugId] = useState<number | null>(null);
  const [bugArchiveReason, setBugArchiveReason] = useState("");

  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const isOwner = project?.owner_id === userId;
  const isArchived = !!project?.archive_reason;

  function userEmail(uid: number | null) {
    if (uid == null) return null;
    return users.find((u) => u.id === uid)?.email ?? `#${uid}`;
  }

  async function loadProject() {
    const [projRes, userRes] = await Promise.all([
      fetch(`${PROJECT_API}/api/project/${id}`, { headers }),
      fetch(`${AUTH_API}/api/users`, { headers }),
    ]);
    if (projRes.ok) {
      const data: Project = await projRes.json();
      setProject(data);
      setEditForm({ name: data.name, description: data.description, status: data.status });
    }
    if (userRes.ok) setUsers(await userRes.json());
  }

  async function loadBugs(extraFilter: object = {}) {
    const res = await fetch(`${BUG_API}/api/bug/search`, {
      method: "POST", headers,
      body: JSON.stringify({ project_id: parseInt(id!), ...extraFilter }),
    });
    if (res.ok) setBugs(await res.json());
  }

  useEffect(() => { loadProject(); loadBugs(); }, [id]);

  async function saveProjectEdit() {
    const res = await fetch(`${PROJECT_API}/api/project/${id}`, {
      method: "PUT", headers, body: JSON.stringify(editForm),
    });
    if (!res.ok) { setError("Failed to update project."); return; }
    setEditing(false); loadProject();
  }

  async function archiveProject() {
    if (!archiveReason.trim()) { setError("Archive reason is required."); return; }
    const res = await fetch(`${PROJECT_API}/api/project/archive/${id}`, {
      method: "POST", headers, body: JSON.stringify({ archive_reason: archiveReason }),
    });
    if (!res.ok) { setError("Failed to archive project."); return; }
    setShowArchiveProject(false); setArchiveReason(""); loadProject();
  }

  async function addMember() {
    const uid = parseInt(newMemberId, 10);
    if (isNaN(uid)) { setError("Invalid user ID."); return; }
    const res = await fetch(`${PROJECT_API}/api/project/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ members_add: [{ user_id: uid, role: newMemberRole }] }),
    });
    if (!res.ok) { setError("Failed to add member."); return; }
    setNewMemberId(""); loadProject();
  }

  async function removeMember(uid: number) {
    await fetch(`${PROJECT_API}/api/project/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ members_remove: [uid] }),
    });
    loadProject();
  }

  async function createBug() {
    setBugFormEmailError("");
    if (!bugForm.name.trim() || !bugForm.feature.trim() || !bugForm.estimated_fixed_date) {
      setError("Name, feature and estimated date are required."); return;
    }
    const assignee_id = await resolveEmail(bugForm.assigneeEmail, headers);
    if (assignee_id === undefined) { setBugFormEmailError("User not found with that email."); return; }
    const res = await fetch(`${BUG_API}/api/bug`, {
      method: "POST", headers,
      body: JSON.stringify({
        name: bugForm.name, feature: bugForm.feature, submitter_id: userId,
        assignee_id,
        creation_date: new Date().toISOString(),
        estimated_fixed_date: new Date(bugForm.estimated_fixed_date).toISOString(),
        status: bugForm.status, severity: bugForm.severity,
        project_id: parseInt(id!),
      }),
    });
    if (!res.ok) { setError("Failed to create bug."); return; }
    setBugForm(emptyBugForm); setShowCreateBug(false); loadBugs();
  }

  async function saveBugEdit(bugId: number) {
    setBugEditEmailError("");
    const assignee_id = await resolveEmail(bugEditForm.assigneeEmail, headers);
    if (assignee_id === undefined) { setBugEditEmailError("User not found with that email."); return; }
    const payload: any = {
      name: bugEditForm.name, feature: bugEditForm.feature,
      status: bugEditForm.status, severity: bugEditForm.severity,
    };
    if (assignee_id !== null) payload.assignee_id = assignee_id;
    const res = await fetch(`${BUG_API}/api/bug/${bugId}`, {
      method: "PUT", headers, body: JSON.stringify(payload),
    });
    if (!res.ok) { setError("Failed to update bug."); return; }
    setEditingBugId(null); loadBugs();
  }

  async function archiveBug(bugId: number) {
    if (!bugArchiveReason.trim()) { setError("Archive reason is required."); return; }
    const res = await fetch(`${BUG_API}/api/bug/archive/${bugId}`, {
      method: "POST", headers,
      body: JSON.stringify({ archiver_id: userId, archive_reason: bugArchiveReason, archived_date: new Date().toISOString() }),
    });
    if (!res.ok) { setError("Failed to archive bug."); return; }
    setArchivingBugId(null); setBugArchiveReason(""); loadBugs();
  }

  async function handleBugSearch(value: string) {
    setBugSearch(value);
    if (!value.trim()) { loadBugs(); return; }
    const body: any = {};
    const asInt = parseInt(value, 10);
    if (!isNaN(asInt) && String(asInt) === value.trim()) body.id = asInt;
    else body.name = value;
    loadBugs(body);
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/60 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/projects" className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 text-sm">
            <ChevronLeft size={15} />
            Projects
          </Link>
          <span className="text-zinc-700 text-sm">/</span>
          <span className="text-zinc-300 text-sm font-medium truncate max-w-xs">{project.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationPanel notifications={notifications} />
          {userName && <span className="text-zinc-500 text-xs font-mono hidden sm:block">{userName}</span>}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-950/50 border border-red-900/60 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-5 flex items-center justify-between">
            <span>{error}</span>
            <button className="text-red-700 hover:text-red-400 ml-3 cursor-pointer" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Project header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-semibold text-zinc-100">{project.name}</h1>
              <StatusBadge status={project.status} />
              <span className="text-zinc-700 text-xs font-mono">#{project.id}</span>
            </div>
            <p className="text-zinc-500 text-sm mt-1">{project.description}</p>
            {isArchived && (
              <p className="text-amber-500/80 text-xs mt-2">
                Archived · {project.archive_reason} · <span className="font-mono">{project.archived_date?.slice(0, 10)}</span>
              </p>
            )}
          </div>
          {isOwner && !isArchived && (
            <div className="flex gap-2 flex-shrink-0 mt-0.5">
              <button className={secondaryBtn} onClick={() => { setEditing((v) => !v); setError(""); }}>
                {editing ? "Cancel" : "Edit"}
              </button>
              <button className={dangerBtn} onClick={() => { setShowArchiveProject((v) => !v); setError(""); }}>
                Archive
              </button>
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Name</label>
                <input className={inputCls} value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Status</label>
                <select className={inputCls} value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="activ">Activ</option>
                  <option value="incheiat">Incheiat</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Description</label>
              <input className={inputCls} value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <button className={primaryBtn} onClick={saveProjectEdit}>Save changes</button>
          </div>
        )}

        {/* Archive form */}
        {showArchiveProject && (
          <div className="mt-3 p-4 bg-zinc-900 border border-red-900/40 rounded-xl">
            <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Reason for archiving</label>
            <div className="flex gap-2">
              <input className={inputCls} placeholder="e.g. Project completed"
                value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} />
              <button className={dangerBtn} onClick={archiveProject}>Confirm</button>
            </div>
          </div>
        )}

        {/* Members */}
        <SectionHeader title="Members" />
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {project.members.length === 0 ? (
            <p className="text-zinc-600 text-sm px-4 py-3">No members.</p>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {project.members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <span className="text-zinc-400 text-xs">@</span>
                    </div>
                    <span className="text-zinc-300 text-sm font-mono">
                      {userEmail(m.user_id) ?? `#${m.user_id}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 text-xs">{m.role}</span>
                    {isOwner && !isArchived && m.user_id !== project.owner_id && (
                      <button className={ghostBtn} onClick={() => removeMember(m.user_id)}>Remove</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isOwner && !isArchived && (
            <div className="px-4 py-3 border-t border-zinc-800/60 flex gap-2">
              <input
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                placeholder="User ID"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
              />
              <select
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Owner">Owner</option>
              </select>
              <button className={primaryBtn} onClick={addMember}>Add</button>
            </div>
          )}
        </div>

        {/* Bugs */}
        <SectionHeader title="Bugs" />
        <div className="flex items-center gap-2 mb-3">
          <input
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Search bugs by name or ID…"
            value={bugSearch}
            onChange={(e) => handleBugSearch(e.target.value)}
          />
          {!isArchived && (
            <button className={primaryBtn} onClick={() => { setShowCreateBug((v) => !v); setError(""); }}>
              {showCreateBug ? "Cancel" : "New bug"}
            </button>
          )}
        </div>

        {/* Create bug form */}
        {showCreateBug && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
            <h3 className="text-sm font-medium text-zinc-200 mb-3">New bug</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Name</label>
                <input className={inputCls} placeholder="Brief description"
                  value={bugForm.name} onChange={(e) => setBugForm({ ...bugForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Feature</label>
                <input className={inputCls} placeholder="e.g. auth, payment"
                  value={bugForm.feature} onChange={(e) => setBugForm({ ...bugForm, feature: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Assignee email</label>
                <input className={inputCls} placeholder="user@email.com"
                  value={bugForm.assigneeEmail} onChange={(e) => setBugForm({ ...bugForm, assigneeEmail: e.target.value })} />
                {bugFormEmailError && <p className="text-red-400 text-xs mt-1">{bugFormEmailError}</p>}
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Est. fix date</label>
                <input className={inputCls} type="datetime-local"
                  value={bugForm.estimated_fixed_date} onChange={(e) => setBugForm({ ...bugForm, estimated_fixed_date: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Status</label>
                <select className={inputCls} value={bugForm.status}
                  onChange={(e) => setBugForm({ ...bugForm, status: e.target.value })}>
                  <option value="activ">Activ</option>
                  <option value="rezolvat">Rezolvat</option>
                  <option value="verificat">Verificat</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Severity</label>
                <select className={inputCls} value={bugForm.severity}
                  onChange={(e) => setBugForm({ ...bugForm, severity: parseInt(e.target.value) })}>
                  <option value={1}>1 — Low</option>
                  <option value={2}>2 — Medium</option>
                  <option value={3}>3 — High</option>
                  <option value={4}>4 — Critical</option>
                  <option value={5}>5 — Blocker</option>
                </select>
              </div>
            </div>
            <button className={primaryBtn} onClick={createBug}>Create bug</button>
          </div>
        )}

        {/* Bug list */}
        {bugs.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-10">No bugs found.</p>
        ) : (
          <div className="space-y-1.5">
            {bugs.map((bug) => (
              <div key={bug.id}
                className={`bg-zinc-900 border border-zinc-800 border-l-2 ${bug.archive_reason ? "border-l-zinc-700 opacity-50" : bugStatusBorder[bug.status] ?? "border-l-zinc-700"} rounded-xl px-4 py-3 transition-all`}>
                {editingBugId === bug.id ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Name</label>
                        <input className={inputCls} value={bugEditForm.name}
                          onChange={(e) => setBugEditForm({ ...bugEditForm, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Feature</label>
                        <input className={inputCls} value={bugEditForm.feature}
                          onChange={(e) => setBugEditForm({ ...bugEditForm, feature: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Assignee email</label>
                        <input className={inputCls} placeholder="user@email.com" value={bugEditForm.assigneeEmail}
                          onChange={(e) => setBugEditForm({ ...bugEditForm, assigneeEmail: e.target.value })} />
                        {bugEditEmailError && <p className="text-red-400 text-xs mt-1">{bugEditEmailError}</p>}
                      </div>
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Status</label>
                        <select className={inputCls} value={bugEditForm.status}
                          onChange={(e) => setBugEditForm({ ...bugEditForm, status: e.target.value })}>
                          <option value="activ">Activ</option>
                          <option value="rezolvat">Rezolvat</option>
                          <option value="verificat">Verificat</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Severity</label>
                        <select className={inputCls} value={bugEditForm.severity}
                          onChange={(e) => setBugEditForm({ ...bugEditForm, severity: parseInt(e.target.value) })}>
                          <option value={1}>1 — Low</option>
                          <option value={2}>2 — Medium</option>
                          <option value={3}>3 — High</option>
                          <option value={4}>4 — Critical</option>
                          <option value={5}>5 — Blocker</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className={primaryBtn} onClick={() => saveBugEdit(bug.id)}>Save</button>
                      <button className={secondaryBtn} onClick={() => setEditingBugId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Link to={`/bugs/${bug.id}`} className="block group">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-100 text-sm font-medium flex-1 truncate group-hover:text-indigo-400 transition-colors">{bug.name}</span>
                        <StatusBadge status={bug.status} />
                        {bug.severity && (
                          <span className={`text-xs font-mono ${severityColor[bug.severity] ?? "text-zinc-500"}`}>
                            {severityLabel[bug.severity]}
                          </span>
                        )}
                        <span className="text-zinc-700 text-xs font-mono">#{bug.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-zinc-600 font-mono">
                        <span>feat: {bug.feature}</span>
                        {bug.assignee_id != null && (
                          <span>→ {userEmail(bug.assignee_id) ?? `#${bug.assignee_id}`}</span>
                        )}
                        <span>by {userEmail(bug.submitter_id) ?? `#${bug.submitter_id}`}</span>
                        <span>due {bug.estimated_fixed_date?.slice(0, 10)}</span>
                      </div>
                    </Link>
                    {!bug.archive_reason && (
                      <div className="flex items-center gap-2 mt-2">
                        <button className={ghostBtn} onClick={() => {
                          setEditingBugId(bug.id);
                          const currentEmail = userEmail(bug.assignee_id) ?? "";
                          setBugEditForm({
                            name: bug.name, feature: bug.feature,
                            assigneeEmail: currentEmail.startsWith("#") ? "" : currentEmail,
                            status: bug.status, severity: bug.severity ?? 1,
                          });
                          setBugEditEmailError(""); setError("");
                        }}>Edit</button>
                        {bug.submitter_id === userId && (
                          archivingBugId === bug.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="Reason for archiving…"
                                value={bugArchiveReason}
                                onChange={(e) => setBugArchiveReason(e.target.value)}
                              />
                              <button className={dangerBtn} onClick={() => archiveBug(bug.id)}>Confirm</button>
                              <button className={ghostBtn} onClick={() => setArchivingBugId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <button className={dangerBtn} onClick={() => { setArchivingBugId(bug.id); setBugArchiveReason(""); setError(""); }}>
                              Archive
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
