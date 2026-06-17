import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { NotificationPanel, useNotifications } from "../components/NotificationBox";

const PROJECT_API = "https://localhost:8002";
const AUTH_API = "https://localhost:8001";
const BUG_API = "https://localhost:8003";

interface Project {
  id: number; name: string; description: string; status: string;
  owner_id: number; members: { user_id: number; role: string }[];
}
interface User { id: number; name: string; email: string }

const emptyForm = { name: "", description: "", status: "activ" };
const emptyBugForm = { name: "", feature: "", assigneeEmail: "", estimated_fixed_date: "", status: "activ", severity: 1, project_id: 0 };

const inputCls = "w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
const primaryBtn = "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap";
const secondaryBtn = "px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-medium transition-colors cursor-pointer";

const statusBorder: Record<string, string> = {
  activ: "border-l-indigo-500", incheiat: "border-l-amber-500", arhivat: "border-l-zinc-600",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    activ: "bg-indigo-950 text-indigo-400",
    incheiat: "bg-amber-950 text-amber-400",
    arhivat: "bg-zinc-800 text-zinc-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium tracking-wide ${styles[status] ?? "bg-zinc-800 text-zinc-500"}`}>
      {status}
    </span>
  );
}

export default function Projects() {
  const { token, userId, userName, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateBug, setShowCreateBug] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [bugForm, setBugForm] = useState(emptyBugForm);
  const [bugEmailError, setBugEmailError] = useState("");
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function loadAll() {
    const [projRes, userRes] = await Promise.all([
      fetch(`${PROJECT_API}/api/project`, { headers }),
      fetch(`${AUTH_API}/api/users`, { headers }),
    ]);
    if (projRes.status === 401) { logout(); navigate("/login"); return; }
    if (projRes.ok) setProjects(await projRes.json());
    if (userRes.ok) setUsers(await userRes.json());
  }

  useEffect(() => { loadAll(); }, []);

  function ownerEmail(owner_id: number) {
    return users.find((u) => u.id === owner_id)?.email ?? `#${owner_id}`;
  }

  async function handleSearch(value: string) {
    setSearch(value);
    if (!value.trim()) { loadAll(); return; }
    const body: any = {};
    const asInt = parseInt(value, 10);
    if (!isNaN(asInt) && String(asInt) === value.trim()) body.id = asInt;
    else body.name = value;
    const res = await fetch(`${PROJECT_API}/api/project/search`, {
      method: "POST", headers, body: JSON.stringify(body),
    });
    if (res.ok) setProjects(await res.json());
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.description.trim()) { setError("Name and description are required."); return; }
    const res = await fetch(`${PROJECT_API}/api/project`, {
      method: "POST", headers, body: JSON.stringify({ ...form, members: [] }),
    });
    if (!res.ok) { setError("Failed to create project."); return; }
    const created: Project = await res.json();
    setProjects((prev) => [created, ...prev]);
    setShowCreate(false); setForm(emptyForm); setError("");
  }

  async function handleCreateBug() {
    setBugEmailError("");
    if (!bugForm.name.trim() || !bugForm.feature.trim() || !bugForm.estimated_fixed_date || !bugForm.project_id) {
      setError("All bug fields are required."); return;
    }
    let assignee_id: number | null = null;
    if (bugForm.assigneeEmail.trim()) {
      const userRes = await fetch(`${AUTH_API}/api/user/by-email?email=${encodeURIComponent(bugForm.assigneeEmail)}`, { headers });
      if (!userRes.ok) { setBugEmailError("User not found with that email."); return; }
      const u: User = await userRes.json();
      assignee_id = u.id;
    }
    const res = await fetch(`${BUG_API}/api/bug`, {
      method: "POST", headers,
      body: JSON.stringify({
        name: bugForm.name, feature: bugForm.feature,
        submitter_id: userId, assignee_id,
        creation_date: new Date().toISOString(),
        estimated_fixed_date: new Date(bugForm.estimated_fixed_date).toISOString(),
        status: bugForm.status, severity: bugForm.severity,
        project_id: bugForm.project_id,
      }),
    });
    if (!res.ok) { setError("Failed to create bug."); return; }
    setShowCreateBug(false); setBugForm(emptyBugForm); setError("");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/60 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold select-none">BT</div>
          <span className="text-zinc-200 font-medium text-sm">Bug Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationPanel notifications={notifications} />
          {userName && (
            <span className="text-zinc-500 text-xs font-mono hidden sm:block">
              {userName}
              {userId != null && <span className="text-zinc-700 ml-1">#{userId}</span>}
            </span>
          )}
          <button onClick={() => { logout(); navigate("/login"); }}
            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors cursor-pointer">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-lg font-semibold text-zinc-100 flex-1">Projects</h1>
          <input
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors w-52"
            placeholder="Search by name or ID…"
            value={search} onChange={(e) => handleSearch(e.target.value)}
          />
          <button className={primaryBtn} onClick={() => { setShowCreateBug(false); setShowCreate((v) => !v); setError(""); }}>
            {showCreate ? "Cancel" : "New project"}
          </button>
          <button className={secondaryBtn} onClick={() => { setShowCreate(false); setShowCreateBug((v) => !v); setError(""); }}>
            {showCreateBug ? "Cancel" : "New bug"}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        {/* Create project form */}
        {showCreate && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
            <h2 className="text-sm font-medium text-zinc-100 mb-4">New project</h2>
            <div className="space-y-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Name</label>
                <input className={inputCls} placeholder="e.g. Backend API"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Description</label>
                <input className={inputCls} placeholder="What is this project about?"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="activ">Activ</option>
                  <option value="incheiat">Incheiat</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button className={primaryBtn} onClick={handleCreate}>Create</button>
                <button className={secondaryBtn} onClick={() => { setShowCreate(false); setError(""); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Create bug form */}
        {showCreateBug && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
            <h2 className="text-sm font-medium text-zinc-100 mb-4">New bug</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Project</label>
                <select className={inputCls} value={bugForm.project_id}
                  onChange={(e) => setBugForm({ ...bugForm, project_id: parseInt(e.target.value) })}>
                  <option value={0} disabled>Select project…</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
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
                {bugEmailError && <p className="text-red-400 text-xs mt-1">{bugEmailError}</p>}
              </div>
              <div>
                <label className="text-zinc-500 text-xs uppercase tracking-wider mb-1.5 block">Est. fix date</label>
                <input className={inputCls} type="datetime-local"
                  value={bugForm.estimated_fixed_date} onChange={(e) => setBugForm({ ...bugForm, estimated_fixed_date: e.target.value })} />
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
            <div className="flex gap-2">
              <button className={primaryBtn} onClick={handleCreateBug}>Create bug</button>
              <button className={secondaryBtn} onClick={() => { setShowCreateBug(false); setError(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Project list */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-600 text-sm">No projects yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {projects.map((p) => (
              <Link to={`/projects/${p.id}`} key={p.id} className="block group">
                <div className={`bg-zinc-900 border border-zinc-800 border-l-2 ${statusBorder[p.status] ?? "border-l-zinc-700"} hover:border-zinc-700 rounded-xl px-4 py-3.5 transition-all`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-100 text-sm font-medium group-hover:text-indigo-400 transition-colors flex-1 truncate">{p.name}</span>
                    <StatusBadge status={p.status} />
                    <span className="text-zinc-700 text-xs font-mono">#{p.id}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-zinc-500 text-xs truncate flex-1">{p.description}</p>
                    <span className="text-zinc-600 text-xs font-mono flex-shrink-0">{ownerEmail(p.owner_id)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
