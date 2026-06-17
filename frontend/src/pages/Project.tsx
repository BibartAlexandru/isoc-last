import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const PROJECT_API = "https://localhost:8002";
const BUG_API = "https://localhost:8003";

interface Member { user_id: number; role: string; }
interface Project {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  status: string;
  archive_reason: string | null;
  archived_date: string | null;
  members: Member[];
}
interface Bug {
  id: number;
  name: string;
  feature: string;
  submitter_id: number;
  assignee_id: number;
  creation_date: string;
  estimated_fixed_date: string;
  status: string;
  project_id: number;
  archive_reason?: string | null;
}

const emptyBugForm = {
  name: "",
  feature: "",
  assignee_id: "",
  estimated_fixed_date: "",
  status: "activ",
};

export default function Project() {
  const { id } = useParams();
  const { token, userId } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [bugSearch, setBugSearch] = useState("");

  // project edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "" });

  // archive project state
  const [archiveReason, setArchiveReason] = useState("");
  const [showArchive, setShowArchive] = useState(false);

  // members state
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Member");

  // bug create state
  const [showCreateBug, setShowCreateBug] = useState(false);
  const [bugForm, setBugForm] = useState(emptyBugForm);

  // bug edit state
  const [editingBugId, setEditingBugId] = useState<number | null>(null);
  const [bugEditForm, setBugEditForm] = useState({ name: "", feature: "", assignee_id: "", status: "" });

  const [bugArchiveReason, setBugArchiveReason] = useState("");
  const [archivingBugId, setArchivingBugId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

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

  async function loadBugs() {
    const res = await fetch(`${BUG_API}/api/bug/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ project_id: parseInt(id!) }),
    });
    if (res.ok) setBugs(await res.json());
  }

  useEffect(() => {
    loadProject();
    loadBugs();
  }, [id]);

  // --- Project actions ---

  async function saveProjectEdit() {
    const res = await fetch(`${PROJECT_API}/api/project/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(editForm),
    });
    if (!res.ok) { setError("Failed to update project."); return; }
    setEditing(false);
    loadProject();
  }

  async function archiveProject() {
    if (!archiveReason.trim()) { setError("Archive reason is required."); return; }
    const res = await fetch(`${PROJECT_API}/api/project/archive/${id}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ archive_reason: archiveReason }),
    });
    if (!res.ok) { setError("Failed to archive project."); return; }
    setShowArchive(false);
    setArchiveReason("");
    loadProject();
  }

  // --- Members ---

  async function addMember() {
    const uid = parseInt(newMemberId, 10);
    if (isNaN(uid)) { setError("Invalid user ID."); return; }
    const res = await fetch(`${PROJECT_API}/api/project/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ members_add: [{ user_id: uid, role: newMemberRole }] }),
    });
    if (!res.ok) { setError("Failed to add member."); return; }
    setNewMemberId("");
    loadProject();
  }

  async function removeMember(uid: number) {
    const res = await fetch(`${PROJECT_API}/api/project/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ members_remove: [uid] }),
    });
    if (res.ok) loadProject();
  }

  // --- Bug actions ---

  async function createBug() {
    if (!bugForm.name.trim() || !bugForm.feature.trim() || !bugForm.estimated_fixed_date) {
      setError("Name, feature and estimated date are required.");
      return;
    }
    const res = await fetch(`${BUG_API}/api/bug`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: bugForm.name,
        feature: bugForm.feature,
        submitter_id: userId,
        assignee_id: bugForm.assignee_id ? parseInt(bugForm.assignee_id, 10) : null,
        creation_date: new Date().toISOString(),
        estimated_fixed_date: new Date(bugForm.estimated_fixed_date).toISOString(),
        status: bugForm.status,
        project_id: parseInt(id!),
      }),
    });
    if (!res.ok) { setError("Failed to create bug."); return; }
    setBugForm(emptyBugForm);
    setShowCreateBug(false);
    loadBugs();
  }

  async function saveBugEdit(bugId: number) {
    const payload: any = {
      name: bugEditForm.name,
      feature: bugEditForm.feature,
      status: bugEditForm.status,
    };
    if (bugEditForm.assignee_id) payload.assignee_id = parseInt(bugEditForm.assignee_id, 10);
    const res = await fetch(`${BUG_API}/api/bug/${bugId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) { setError("Failed to update bug."); return; }
    setEditingBugId(null);
    loadBugs();
  }

  async function archiveBug(bugId: number) {
    if (!bugArchiveReason.trim()) { setError("Archive reason is required."); return; }
    const res = await fetch(`${BUG_API}/api/bug/archive/${bugId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        archiver_id: userId,
        archive_reason: bugArchiveReason,
        archived_date: new Date().toISOString(),
      }),
    });
    if (!res.ok) { setError("Failed to archive bug."); return; }
    setArchivingBugId(null);
    setBugArchiveReason("");
    loadBugs();
  }

  async function handleBugSearch(value: string) {
    setBugSearch(value);
    if (!value.trim()) { loadBugs(); return; }
    const body: any = { project_id: parseInt(id!) };
    const asInt = parseInt(value, 10);
    if (!isNaN(asInt) && String(asInt) === value.trim()) {
      body.id = asInt;
    } else {
      body.name = value;
    }
    const res = await fetch(`${BUG_API}/api/bug/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) setBugs(await res.json());
  }

  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <Link to="/projects">← Back to Projects</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* --- Project Header --- */}
      <h1>
        [{project.id}] {project.name}
        <span style={{ marginLeft: 8, fontSize: "0.7em", color: "#666" }}>{project.status}</span>
      </h1>
      {isArchived && (
        <p style={{ color: "orange" }}>
          Archived: {project.archive_reason} ({project.archived_date?.slice(0, 10)})
        </p>
      )}
      <p>{project.description}</p>

      {/* --- Edit Project (owner only) --- */}
      {isOwner && !isArchived && (
        <div>
          <button onClick={() => { setEditing((v) => !v); setError(""); }}>
            {editing ? "Cancel Edit" : "Edit Project"}
          </button>
          {editing && (
            <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 8 }}>
              <div>
                <label>Name: </label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label>Description: </label>
                <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label>Status: </label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="activ">Activ</option>
                  <option value="incheiat">Incheiat</option>
                </select>
              </div>
              <button onClick={saveProjectEdit}>Save</button>
            </div>
          )}
        </div>
      )}

      {/* --- Archive Project (owner only) --- */}
      {isOwner && !isArchived && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => { setShowArchive((v) => !v); setError(""); }}>
            {showArchive ? "Cancel" : "Archive Project"}
          </button>
          {showArchive && (
            <div>
              <input
                placeholder="Reason for archiving"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
              />
              <button onClick={archiveProject}>Confirm Archive</button>
            </div>
          )}
        </div>
      )}

      {/* --- Members --- */}
      <h2>Members</h2>
      <ul>
        {project.members.map((m) => (
          <li key={m.user_id}>
            User #{m.user_id} — {m.role}
            {isOwner && !isArchived && m.user_id !== project.owner_id && (
              <button onClick={() => removeMember(m.user_id)} style={{ marginLeft: 8 }}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && !isArchived && (
        <div>
          <input
            placeholder="User ID"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
            style={{ width: 80 }}
          />
          <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
            <option value="Member">Member</option>
            <option value="Owner">Owner</option>
          </select>
          <button onClick={addMember}>Add Member</button>
        </div>
      )}

      {/* --- Bugs --- */}
      <h2>Bugs</h2>
      <input
        placeholder="Search bugs by name or ID"
        value={bugSearch}
        onChange={(e) => handleBugSearch(e.target.value)}
      />
      {!isArchived && (
        <button onClick={() => { setShowCreateBug((v) => !v); setError(""); }} style={{ marginLeft: 8 }}>
          {showCreateBug ? "Cancel" : "+ New Bug"}
        </button>
      )}

      {showCreateBug && (
        <div style={{ border: "1px solid #ccc", padding: 12, margin: "8px 0" }}>
          <h3>Create Bug</h3>
          <div><label>Name: </label><input value={bugForm.name} onChange={(e) => setBugForm({ ...bugForm, name: e.target.value })} /></div>
          <div><label>Feature: </label><input value={bugForm.feature} onChange={(e) => setBugForm({ ...bugForm, feature: e.target.value })} /></div>
          <div><label>Assignee ID: </label><input value={bugForm.assignee_id} onChange={(e) => setBugForm({ ...bugForm, assignee_id: e.target.value })} /></div>
          <div><label>Est. fix date: </label><input type="datetime-local" value={bugForm.estimated_fixed_date} onChange={(e) => setBugForm({ ...bugForm, estimated_fixed_date: e.target.value })} /></div>
          <div>
            <label>Status: </label>
            <select value={bugForm.status} onChange={(e) => setBugForm({ ...bugForm, status: e.target.value })}>
              <option value="activ">Activ</option>
              <option value="rezolvat">Rezolvat</option>
              <option value="verificat">Verificat</option>
            </select>
          </div>
          <button onClick={createBug}>Create</button>
        </div>
      )}

      {bugs.length === 0 && <p>No bugs found.</p>}

      {bugs.map((bug) => (
        <div key={bug.id} style={{ border: "1px solid #eee", padding: 8, margin: "8px 0" }}>
          {editingBugId === bug.id ? (
            <div>
              <div><label>Name: </label><input value={bugEditForm.name} onChange={(e) => setBugEditForm({ ...bugEditForm, name: e.target.value })} /></div>
              <div><label>Feature: </label><input value={bugEditForm.feature} onChange={(e) => setBugEditForm({ ...bugEditForm, feature: e.target.value })} /></div>
              <div><label>Assignee ID: </label><input value={bugEditForm.assignee_id} onChange={(e) => setBugEditForm({ ...bugEditForm, assignee_id: e.target.value })} /></div>
              <div>
                <label>Status: </label>
                <select value={bugEditForm.status} onChange={(e) => setBugEditForm({ ...bugEditForm, status: e.target.value })}>
                  <option value="activ">Activ</option>
                  <option value="rezolvat">Rezolvat</option>
                  <option value="verificat">Verificat</option>
                </select>
              </div>
              <button onClick={() => saveBugEdit(bug.id)}>Save</button>
              <button onClick={() => setEditingBugId(null)}>Cancel</button>
            </div>
          ) : (
            <div>
              <strong>[#{bug.id}] {bug.name}</strong>
              <span style={{ marginLeft: 8, color: "#666" }}>{bug.status}</span>
              {bug.archive_reason && <span style={{ color: "orange", marginLeft: 8 }}>(archived)</span>}
              <p>Feature: {bug.feature} | Assignee: #{bug.assignee_id} | Submitter: #{bug.submitter_id}</p>
              <p>Created: {bug.creation_date?.slice(0, 10)} | Est. fix: {bug.estimated_fixed_date?.slice(0, 10)}</p>

              {!bug.archive_reason && (
                <>
                  <button onClick={() => {
                    setEditingBugId(bug.id);
                    setBugEditForm({
                      name: bug.name,
                      feature: bug.feature,
                      assignee_id: String(bug.assignee_id),
                      status: bug.status,
                    });
                    setError("");
                  }}>
                    Edit
                  </button>

                  {bug.submitter_id === userId && (
                    archivingBugId === bug.id ? (
                      <span style={{ marginLeft: 8 }}>
                        <input
                          placeholder="Reason"
                          value={bugArchiveReason}
                          onChange={(e) => setBugArchiveReason(e.target.value)}
                        />
                        <button onClick={() => archiveBug(bug.id)}>Confirm</button>
                        <button onClick={() => setArchivingBugId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setArchivingBugId(bug.id); setBugArchiveReason(""); setError(""); }}
                        style={{ marginLeft: 8 }}
                      >
                        Archive
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
