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

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const primaryBtn = "px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer";
const secondaryBtn = "px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-sm font-medium transition-colors cursor-pointer";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    activ: "bg-emerald-950 text-emerald-400 border border-emerald-900",
    incheiat: "bg-amber-950 text-amber-400 border border-amber-900",
    arhivat: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-zinc-800 text-zinc-400"}`}>
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
    <div className="min-h-screen bg-zinc-950">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97L13.75 4a2 2 0 00-3.5 0L3.25 16A2 2 0 005.07 19z" />
            </svg>
          </div>
          <span className="text-zinc-100 font-semibold text-sm">Bug Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          {userName && <span className="text-zinc-500 text-sm">{userName}</span>}
          <button onClick={() => { logout(); navigate("/login"); }}
            className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors cursor-pointer">
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-semibold text-zinc-100 flex-1">Projects</h1>
          <input
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56"
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button className={primaryBtn} onClick={() => { setShowCreate((v) => !v); setError(""); }}>
            {showCreate ? "Cancel" : "+ New Project"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
            <h2 className="text-zinc-100 font-medium mb-4 text-base">New Project</h2>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Name</label>
                <input className={inputCls} placeholder="Project name"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Description</label>
                <input className={inputCls} placeholder="Short description"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Status</label>
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
          <div className="text-center py-16 text-zinc-500">
            <p className="text-sm">No projects found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link to={`/projects/${p.id}`} key={p.id} className="block group">
                <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-100 font-medium group-hover:text-indigo-400 transition-colors">
                      {p.name}
                    </span>
                    <StatusBadge status={p.status} />
                    <span className="text-zinc-600 text-xs ml-auto">#{p.id}</span>
                  </div>
                  <p className="text-zinc-500 text-sm mt-1 truncate">{p.description}</p>
                  <p className="text-zinc-600 text-xs mt-2">{p.members.length} member{p.members.length !== 1 ? "s" : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
