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

export default function Projects() {
  const { token, logout } = useAuth();
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

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSearch(value: string) {
    setSearch(value);
    if (!value.trim()) {
      loadAll();
      return;
    }
    const body: any = {};
    const asInt = parseInt(value, 10);
    if (!isNaN(asInt) && String(asInt) === value.trim()) {
      body.id = asInt;
    } else {
      body.name = value;
    }
    const res = await fetch(`${PROJECT_API}/api/project/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) setProjects(await res.json());
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.description.trim()) {
      setError("Name and description are required.");
      return;
    }
    const res = await fetch(`${PROJECT_API}/api/project`, {
      method: "POST",
      headers,
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
    <div>
      <h1>Projects</h1>

      <input
        placeholder="Search by name or ID"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <button onClick={() => { setShowCreate((v) => !v); setError(""); }}>
        {showCreate ? "Cancel" : "+ New Project"}
      </button>
      <button onClick={() => { logout(); navigate("/login"); }} style={{ marginLeft: 8 }}>
        Logout
      </button>

      {showCreate && (
        <div style={{ border: "1px solid #ccc", padding: 12, margin: "12px 0" }}>
          <h2>Create Project</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div>
            <label>Name: </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label>Description: </label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label>Status: </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="activ">Activ</option>
              <option value="incheiat">Incheiat</option>
            </select>
          </div>
          <button onClick={handleCreate}>Create</button>
        </div>
      )}

      {projects.length === 0 && <p>No projects found.</p>}

      {projects.map((p) => (
        <div key={p.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
          <Link to={`/projects/${p.id}`}>
            <strong>[{p.id}] {p.name}</strong>
          </Link>
          <span style={{ marginLeft: 8, color: "#666" }}>{p.status}</span>
          <p style={{ margin: "2px 0" }}>{p.description}</p>
        </div>
      ))}
    </div>
  );
}
