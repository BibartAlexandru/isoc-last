import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const PROJECT_API = "https://localhost:8002";

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  owner_id: number;
  members: { user_id: number; role: string }[];
}

const emptyForm = { name: "", description: "", status: "activ" };

const inputCls = "w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
const primaryBtn = "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap";
const secondaryBtn = "px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-medium transition-colors cursor-pointer";

const statusBorder: Record<string, string> = {
  activ: "border-l-indigo-500",
  incheiat: "border-l-amber-500",
  arhivat: "border-l-zinc-600",
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
  const { token, userName, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function loadAll() {
    const res = await fetch(`${PROJECT_API}/api/project`, { headers });
    if (res.status === 401) { logout(); navigate("/login"); return; }
    if (res.ok) setProjects(await res.json());
  }

  useEffect(() => { loadAll(); }, []);

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
    if (!form.name.trim() || !form.description.trim()) {
      setError("Name and description are required.");
      return;
    }
    const res = await fetch(`${PROJECT_API}/api/project`, {
      method: "POST", headers,
      body: JSON.stringify({ ...form, members: [] }),
    });
    if (!res.ok) { setError("Failed to create project."); return; }
    const created: Project = await res.json();
    setProjects((prev) => [created, ...prev]);
    setShowCreate(false);
    setForm(emptyForm);
    setError("");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/60 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold tracking-tight select-none">
            BT
          </div>
          <span className="text-zinc-200 font-medium text-sm">Bug Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-zinc-500 text-xs font-mono">{userName}</span>
          )}
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-lg font-semibold text-zinc-100 flex-1">Projects</h1>
          <input
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors w-52"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button className={primaryBtn} onClick={() => { setShowCreate((v) => !v); setError(""); }}>
            {showCreate ? "Cancel" : "New project"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
            <h2 className="text-sm font-medium text-zinc-100 mb-4">New project</h2>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
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
                <select className={inputCls} value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
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

        {/* Project list */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-600 text-sm">No projects yet.</p>
            <p className="text-zinc-700 text-xs mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {projects.map((p) => (
              <Link to={`/projects/${p.id}`} key={p.id} className="block group">
                <div className={`bg-zinc-900 border border-zinc-800 border-l-2 ${statusBorder[p.status] ?? "border-l-zinc-700"} hover:border-zinc-700 rounded-xl px-4 py-3.5 transition-all`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-100 text-sm font-medium group-hover:text-indigo-400 transition-colors flex-1 truncate">
                      {p.name}
                    </span>
                    <StatusBadge status={p.status} />
                    <span className="text-zinc-700 text-xs font-mono">#{p.id}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-zinc-500 text-xs truncate flex-1">{p.description}</p>
                    <span className="text-zinc-700 text-xs flex-shrink-0">
                      {p.members.length} {p.members.length === 1 ? "member" : "members"}
                    </span>
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
