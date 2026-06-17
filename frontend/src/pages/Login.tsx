import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "../auth/AuthProvider";

import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();

  async function googleSuccess(response: any) {
    // Asta arata foarte naspa
    const res = await fetch("https://localhost:8001/api/login/google", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        oauth_token: response.credential,
      }),
    });

    const data = await res.json();

    login(data.auth_token);

    navigate("/projects");
  }

  return (
    <div>
      <h1>Bug Tracker Login</h1>
      <GoogleLogin onSuccess={googleSuccess} />
    </div>
  );
}
