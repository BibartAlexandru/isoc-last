import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const PROJECT_API = "https://localhost:8002";
const BUG_API = "https://localhost:8003";

interface Member { user_id: number; role: string }
interface Project {
  id: number; owner_id: number; name: string; description: string;
  status: string; archive_reason: string | null; archived_date: string | null;
  members: Member[];
}
interface Bug {
  id: number; name: string; feature: string; submitter_id: number;
  assignee_id: number; creation_date: string; estimated_fixed_date: string;
  status: string; project_id: number; archive_reason?: string | null;
}

// --- Shared styles ---
const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const primaryBtn = "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer";
const secondaryBtn = "px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer";
const dangerBtn = "px-3 py-1.5 bg-zinc-900 hover:bg-red-950 text-red-400 border border-zinc-800 hover:border-red-900 rounded-lg text-sm font-medium transition-colors cursor-pointer";
const ghostBtn = "px-2.5 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md text-xs transition-colors cursor-pointer";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    activ: "bg-emerald-950 text-emerald-400 border border-emerald-900",
    incheiat: "bg-amber-950 text-amber-400 border border-amber-900",
    arhivat: "bg-zinc-800 text-zinc-400 border border-zinc-700",
    rezolvat: "bg-sky-950 text-sky-400 border border-sky-900",
    verificat: "bg-violet-950 text-violet-400 border border-violet-900",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-zinc-800 text-zinc-400"}`}>
      {status}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

const emptyBugForm = { name: "", feature: "", assignee_id: "", estimated_fixed_date: "", status: "activ" };

export default function Project() {
  const { id } = useParams();
  const { token, userId } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [bugSearch, setBugSearch] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "" });
  const [showArchiveProject, setShowArchiveProject] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Member");

  const [showCreateBug, setShowCreateBug] = useState(false);
  const [bugForm, setBugForm] = useState(emptyBugForm);
  const [editingBugId, setEditingBugId] = useState<number | null>(null);
  const [bugEditForm, setBugEditForm] = useState({ name: "", feature: "", assignee_id: "", status: "" });
  const [archivingBugId, setArchivingBugId] = useState<number | null>(null);
  const [bugArchiveReason, setBugArchiveReason] = useState("");

  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const isOwner = project?.owner_id === userId;
  const isArchived = !!project?.archive_reason;

  async function loadProject() {
    const res = await fetch(`${PROJECT_API}/api/project/${id}`, { headers });
    if (res.ok) {
      const data: Project = await res.json();
      setProject(data);
      setEditForm({ name: data.name, description: data.description, status: data.status });
    }
  }

  async function loadBugs(extraFilter: object = {}) {
    const res = await fetch(`${BUG_API}/api/bug/search`, {
      method: "POST", headers,
      body: JSON.stringify({ project_id: parseInt(id!), ...extraFilter }),
    });
    if (res.ok) setBugs(await res.json());
  }

  useEffect(() => { loadProject(); loadBugs(); }, [id]);

  // Project actions
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

  // Members
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

  // Bug actions
  async function createBug() {
    if (!bugForm.name.trim() || !bugForm.feature.trim() || !bugForm.estimated_fixed_date) {
      setError("Name, feature and estimated date are required."); return;
    }
    const res = await fetch(`${BUG_API}/api/bug`, {
      method: "POST", headers,
      body: JSON.stringify({
        name: bugForm.name, feature: bugForm.feature,
        submitter_id: userId,
        assignee_id: bugForm.assignee_id ? parseInt(bugForm.assignee_id, 10) : null,
        creation_date: new Date().toISOString(),
        estimated_fixed_date: new Date(bugForm.estimated_fixed_date).toISOString(),
        status: bugForm.status, project_id: parseInt(id!),
      }),
    });
    if (!res.ok) { setError("Failed to create bug."); return; }
    setBugForm(emptyBugForm); setShowCreateBug(false); loadBugs();
  }

  async function saveBugEdit(bugId: number) {
    const payload: any = { name: bugEditForm.name, feature: bugEditForm.feature, status: bugEditForm.status };
    if (bugEditForm.assignee_id) payload.assignee_id = parseInt(bugEditForm.assignee_id, 10);
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
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <Link to="/projects" className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Projects
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300 text-sm font-medium">{project.name}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-950 border border-red-900 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
            <button className="ml-2 text-red-600 hover:text-red-400" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Project header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-zinc-100">{project.name}</h1>
                <StatusBadge status={project.status} />
                <span className="text-zinc-600 text-xs">#{project.id}</span>
              </div>
              <p className="text-zinc-400 text-sm mt-1">{project.description}</p>
              {isArchived && (
                <p className="text-amber-400 text-xs mt-2">
                  Archived: {project.archive_reason} · {project.archived_date?.slice(0, 10)}
                </p>
              )}
            </div>
            {isOwner && !isArchived && (
              <div className="flex gap-2 flex-shrink-0">
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
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Name</label>
                  <input className={inputCls} value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Status</label>
                  <select className={inputCls} value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="activ">Activ</option>
                    <option value="incheiat">Incheiat</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Description</label>
                <input className={inputCls} value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <button className={primaryBtn} onClick={saveProjectEdit}>Save Changes</button>
            </div>
          )}

          {/* Archive form */}
          {showArchiveProject && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <label className="text-zinc-400 text-xs mb-1 block">Reason for archiving</label>
              <div className="flex gap-2">
                <input className={inputCls} placeholder="Enter reason…"
                  value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} />
                <button className={dangerBtn} onClick={archiveProject}>Confirm</button>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <Section title="Members">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {project.members.length === 0 ? (
              <p className="text-zinc-500 text-sm px-4 py-3">No members.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {project.members.map((m) => (
                  <li key={m.user_id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-medium">
                        #{m.user_id}
                      </div>
                      <span className="text-zinc-200 text-sm">User #{m.user_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">{m.role}</span>
                      {isOwner && !isArchived && m.user_id !== project.owner_id && (
                        <button className={ghostBtn} onClick={() => removeMember(m.user_id)}>Remove</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isOwner && !isArchived && (
              <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
                <input className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="User ID" value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} />
                <select className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                  value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
                  <option value="Member">Member</option>
                  <option value="Owner">Owner</option>
                </select>
                <button className={primaryBtn} onClick={addMember}>Add</button>
              </div>
            )}
          </div>
        </Section>

        {/* Bugs */}
        <Section title="Bugs">
          <div className="flex items-center gap-3 mb-3">
            <input
              className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search bugs by name or ID…"
              value={bugSearch} onChange={(e) => handleBugSearch(e.target.value)} />
            {!isArchived && (
              <button className={primaryBtn} onClick={() => { setShowCreateBug((v) => !v); setError(""); }}>
                {showCreateBug ? "Cancel" : "+ New Bug"}
              </button>
            )}
          </div>

          {/* Create bug form */}
          {showCreateBug && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
              <h3 className="text-zinc-100 text-sm font-medium mb-3">New Bug</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Name</label>
                  <input className={inputCls} placeholder="Bug name"
                    value={bugForm.name} onChange={(e) => setBugForm({ ...bugForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Feature / Component</label>
                  <input className={inputCls} placeholder="Affected area"
                    value={bugForm.feature} onChange={(e) => setBugForm({ ...bugForm, feature: e.target.value })} />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Assignee ID</label>
                  <input className={inputCls} placeholder="User ID"
                    value={bugForm.assignee_id} onChange={(e) => setBugForm({ ...bugForm, assignee_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Estimated fix date</label>
                  <input className={inputCls} type="datetime-local"
                    value={bugForm.estimated_fixed_date} onChange={(e) => setBugForm({ ...bugForm, estimated_fixed_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Status</label>
                  <select className={inputCls} value={bugForm.status}
                    onChange={(e) => setBugForm({ ...bugForm, status: e.target.value })}>
                    <option value="activ">Activ</option>
                    <option value="rezolvat">Rezolvat</option>
                    <option value="verificat">Verificat</option>
                  </select>
                </div>
              </div>
              <button className={primaryBtn} onClick={createBug}>Create Bug</button>
            </div>
          )}

          {/* Bug list */}
          {bugs.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">No bugs found.</p>
          ) : (
            <div className="space-y-2">
              {bugs.map((bug) => (
                <div key={bug.id}
                  className={`bg-zinc-900 border rounded-xl p-4 ${bug.archive_reason ? "border-zinc-800 opacity-60" : "border-zinc-800"}`}>
                  {editingBugId === bug.id ? (
                    <div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-zinc-400 text-xs mb-1 block">Name</label>
                          <input className={inputCls} value={bugEditForm.name}
                            onChange={(e) => setBugEditForm({ ...bugEditForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-xs mb-1 block">Feature</label>
                          <input className={inputCls} value={bugEditForm.feature}
                            onChange={(e) => setBugEditForm({ ...bugEditForm, feature: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-xs mb-1 block">Assignee ID</label>
                          <input className={inputCls} value={bugEditForm.assignee_id}
                            onChange={(e) => setBugEditForm({ ...bugEditForm, assignee_id: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-zinc-400 text-xs mb-1 block">Status</label>
                          <select className={inputCls} value={bugEditForm.status}
                            onChange={(e) => setBugEditForm({ ...bugEditForm, status: e.target.value })}>
                            <option value="activ">Activ</option>
                            <option value="rezolvat">Rezolvat</option>
                            <option value="verificat">Verificat</option>
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-zinc-100 font-medium text-sm">{bug.name}</span>
                          <StatusBadge status={bug.status} />
                          {bug.archive_reason && (
                            <span className="text-xs text-zinc-500">archived</span>
                          )}
                        </div>
                        <span className="text-zinc-600 text-xs flex-shrink-0">#{bug.id}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span>Feature: <span className="text-zinc-400">{bug.feature}</span></span>
                        <span>Assignee: <span className="text-zinc-400">#{bug.assignee_id}</span></span>
                        <span>Submitter: <span className="text-zinc-400">#{bug.submitter_id}</span></span>
                        <span>Created: <span className="text-zinc-400">{bug.creation_date?.slice(0, 10)}</span></span>
                        <span>Est. fix: <span className="text-zinc-400">{bug.estimated_fixed_date?.slice(0, 10)}</span></span>
                      </div>
                      {!bug.archive_reason && (
                        <div className="mt-3 flex items-center gap-2">
                          <button className={ghostBtn} onClick={() => {
                            setEditingBugId(bug.id);
                            setBugEditForm({ name: bug.name, feature: bug.feature, assignee_id: String(bug.assignee_id), status: bug.status });
                            setError("");
                          }}>Edit</button>
                          {bug.submitter_id === userId && (
                            archivingBugId === bug.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                                  placeholder="Reason…" value={bugArchiveReason}
                                  onChange={(e) => setBugArchiveReason(e.target.value)} />
                                <button className={dangerBtn} onClick={() => archiveBug(bug.id)}>Confirm</button>
                                <button className={ghostBtn} onClick={() => setArchivingBugId(null)}>Cancel</button>
                              </div>
                            ) : (
                              <button className={dangerBtn} onClick={() => {
                                setArchivingBugId(bug.id); setBugArchiveReason(""); setError("");
                              }}>Archive</button>
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
        </Section>
      </div>
    </div>
  );
}
