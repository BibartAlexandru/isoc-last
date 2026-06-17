import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  async function googleSuccess(response: any) {
    const res = await fetch("https://localhost:8001/api/login/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oauth_token: response.credential }),
    });
    const data = await res.json();
    login(data.auth_token);
    navigate("/projects");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97L13.75 4a2 2 0 00-3.5 0L3.25 16A2 2 0 005.07 19z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100">Bug Tracker</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <p className="text-zinc-400 text-sm text-center mb-4">Continue with your Google account</p>
          <div className="flex justify-center">
            <GoogleLogin onSuccess={googleSuccess} theme="filled_black" shape="pill" />
          </div>
        </div>
      </div>
    </div>
  );
}
