import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const BUG_API = "https://localhost:8003";
const AUTH_API = "https://localhost:8001";

interface Bug {
  id: number; name: string; feature: string; submitter_id: number;
  assignee_id: number; creation_date: string; estimated_fixed_date: string;
  status: string; severity: number; project_id: number;
  archive_reason?: string | null; archived_date?: string | null;
}
interface Trail { id: number; bug_id: number; creation_date: string; description: string }
interface Comment { id: number; bug_id: number; description: string; type: string; creation_date: string }
interface User { id: number; name: string; email: string }

const inputCls = "w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
const primaryBtn = "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap";
const secondaryBtn = "px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-medium transition-colors cursor-pointer";

const statusColors: Record<string, string> = {
  activ: "bg-indigo-950 text-indigo-400",
  rezolvat: "bg-emerald-950 text-emerald-400",
  verificat: "bg-sky-950 text-sky-400",
  arhivat: "bg-zinc-800 text-zinc-500",
};

const severityLabel: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical", 5: "Blocker" };
const severityColor: Record<number, string> = {
  1: "text-zinc-400", 2: "text-yellow-400", 3: "text-orange-400", 4: "text-red-400", 5: "text-red-600",
};

function UserLabel({ userId, users }: { userId: number; users: User[] }) {
  const u = users.find((u) => u.id === userId);
  return <span className="font-mono text-zinc-300">{u ? u.email : `#${userId}`}</span>;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-3">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

export default function BugPage() {
  const { id } = useParams();
  const { token, userId } = useAuth();

  const [bug, setBug] = useState<Bug | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("comment");
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function load() {
    const [bugRes, trailRes, commentRes, userRes] = await Promise.all([
      fetch(`${BUG_API}/api/bug/${id}`, { headers }),
      fetch(`${BUG_API}/api/bug/${id}/trails`, { headers }),
      fetch(`${BUG_API}/api/bug/${id}/comments`, { headers }),
      fetch(`${AUTH_API}/api/users`, { headers }),
    ]);
    if (bugRes.ok) setBug(await bugRes.json());
    if (trailRes.ok) setTrails(await trailRes.json());
    if (commentRes.ok) setComments(await commentRes.json());
    if (userRes.ok) setUsers(await userRes.json());
  }

  useEffect(() => { load(); }, [id]);

  async function addComment() {
    if (!newComment.trim()) return;
    const res = await fetch(`${BUG_API}/api/bug/${id}/comments`, {
      method: "POST", headers,
      body: JSON.stringify({ description: newComment, type: commentType }),
    });
    if (!res.ok) { setError("Failed to add comment."); return; }
    setNewComment("");
    const commentRes = await fetch(`${BUG_API}/api/bug/${id}/comments`, { headers });
    if (commentRes.ok) setComments(await commentRes.json());
  }

  if (!bug) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/60 px-6 h-12 flex items-center gap-2">
        <Link to={`/projects/${bug.project_id}`} className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft size={15} />
          Project
        </Link>
        <span className="text-zinc-700 text-sm">/</span>
        <span className="text-zinc-300 text-sm font-mono">Bug #{bug.id}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-950/50 border border-red-900/60 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-5 flex items-center justify-between">
            <span>{error}</span>
            <button className="text-red-700 hover:text-red-400 ml-3 cursor-pointer" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Bug header */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-lg font-semibold text-zinc-100">{bug.name}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium tracking-wide ${statusColors[bug.status] ?? "bg-zinc-800 text-zinc-500"}`}>
              {bug.status}
            </span>
            <span className={`text-xs font-medium ${severityColor[bug.severity] ?? "text-zinc-400"}`}>
              {severityLabel[bug.severity] ?? "Unknown"} severity
            </span>
            <span className="text-zinc-700 text-xs font-mono ml-auto">#{bug.id}</span>
          </div>
          {bug.archive_reason && (
            <p className="text-amber-500/80 text-xs mb-3">
              Archived · {bug.archive_reason} · <span className="font-mono">{bug.archived_date?.slice(0, 10)}</span>
            </p>
          )}
        </div>

        {/* Details grid */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">Feature</span>
              <span className="text-zinc-300 font-mono">{bug.feature}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">Submitter</span>
              <UserLabel userId={bug.submitter_id} users={users} />
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">Assignee</span>
              {bug.assignee_id ? <UserLabel userId={bug.assignee_id} users={users} /> : <span className="text-zinc-600">Unassigned</span>}
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">Created</span>
              <span className="text-zinc-300 font-mono">{bug.creation_date?.slice(0, 10)}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">Est. fix date</span>
              <span className="text-zinc-300 font-mono">{bug.estimated_fixed_date?.slice(0, 10)}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">Project</span>
              <Link to={`/projects/${bug.project_id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-mono transition-colors">
                #{bug.project_id}
              </Link>
            </div>
          </div>
        </div>

        {/* Trails */}
        <SectionHeader title={`Trail · ${trails.length} events`} />
        {trails.length === 0 ? (
          <p className="text-zinc-600 text-sm">No trail entries yet.</p>
        ) : (
          <div className="relative pl-4 border-l border-zinc-800 space-y-4">
            {trails.map((t) => (
              <div key={t.id} className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-zinc-950" />
                <p className="text-zinc-300 text-sm">{t.description}</p>
                <p className="text-zinc-600 text-xs font-mono mt-0.5">{t.creation_date?.slice(0, 16).replace("T", " ")}</p>
              </div>
            ))}
          </div>
        )}

        {/* Comments */}
        <SectionHeader title={`Comments · ${comments.length}`} />
        {comments.length === 0 ? (
          <p className="text-zinc-600 text-sm mb-4">No comments yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-zinc-500 text-xs px-1.5 py-0.5 rounded bg-zinc-800">{c.type}</span>
                  <span className="text-zinc-600 text-xs font-mono">{c.creation_date?.slice(0, 16).replace("T", " ")}</span>
                </div>
                <p className="text-zinc-300 text-sm">{c.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        {!bug.archive_reason && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex gap-2 mb-2">
              <select className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                value={commentType} onChange={(e) => setCommentType(e.target.value)}>
                <option value="comment">Comment</option>
                <option value="progress">Progress</option>
                <option value="question">Question</option>
                <option value="resolution">Resolution</option>
              </select>
            </div>
            <textarea
              className={`${inputCls} resize-none`} rows={3}
              placeholder="Add a comment…"
              value={newComment} onChange={(e) => setNewComment(e.target.value)}
            />
            <button className={`${primaryBtn} mt-2`} onClick={addComment}>Add comment</button>
          </div>
        )}
      </div>
    </div>
  );
}
