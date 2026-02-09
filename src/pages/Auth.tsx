import React, { useMemo, useState } from "react";
import { postJSON } from "../lib/api";

type RegisterResp = { token: string };
type Setup2FAResp = { qrDataUrl: string; otpauthUrl: string };
type Enable2FAResp = { ok: true };
type LoginResp = { token: string } | { requires2FA: true; tempToken: string };
type Verify2FAResp = { token: string };

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // auth session
  const [authToken, setAuthToken] = useState<string | null>(null);

  // signup → 2fa setup
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [otpEnableCode, setOtpEnableCode] = useState("");

  // login → 2fa verify
  const [step, setStep] = useState<"creds" | "otp">("creds");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otpVerifyCode, setOtpVerifyCode] = useState("");

  const [error, setError] = useState<string | null>(null);

  const canSubmitCreds = useMemo(() => username.trim() && password.trim(), [username, password]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setQrDataUrl(null);

    try {
      const resp = await postJSON<RegisterResp>("/api/register", { username, password });
      setAuthToken(resp.token);
      // After signup, prompt 2FA setup
      const setup = await postJSON<Setup2FAResp>("/api/2fa/setup", {}, resp.token);
      setQrDataUrl(setup.qrDataUrl);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!authToken) return setError("Missing session token. Please sign up again.");

    try {
      await postJSON<Enable2FAResp>("/api/2fa/enable", { code: String(otpEnableCode) }, authToken);
      // Done: you can redirect or auto-login
      localStorage.setItem("authToken", authToken);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("creds");
    setTempToken(null);

    try {
      const resp = await postJSON<LoginResp>("/api/login", { username, password });

      if ("requires2FA" in resp) {
        setTempToken(resp.tempToken);
        setStep("otp");
      } else {
        localStorage.setItem("authToken", resp.token);
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tempToken) return setError("Missing temp token. Please login again.");

    try {
      const resp = await postJSON<Verify2FAResp>(
        "/api/2fa/verify",
        { code: String(otpVerifyCode) },
        tempToken
      );
      localStorage.setItem("authToken", resp.token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "64px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>{mode === "login" ? "Login" : "Create Account"}</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button onClick={() => { setMode("login"); setStep("creds"); setError(null); }}
          style={{ padding: "8px 10px", opacity: mode === "login" ? 1 : 0.6 }}>
          Login
        </button>
        <button onClick={() => { setMode("signup"); setStep("creds"); setError(null); }}
          style={{ padding: "8px 10px", opacity: mode === "signup" ? 1 : 0.6 }}>
          Sign up
        </button>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* LOGIN */}
      {mode === "login" && (
        <>
          {step === "creds" ? (
            <form onSubmit={handleLogin}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={{ width: "100%", padding: 10, marginBottom: 10 }}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                style={{ width: "100%", padding: 10, marginBottom: 10 }}
              />
              <button disabled={!canSubmitCreds} style={{ width: "100%", padding: 10 }}>
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA}>
              <p style={{ marginTop: 0 }}>
                Enter the 6-digit code from your authenticator.
              </p>
              <input
                value={otpVerifyCode}
                onChange={(e) => setOtpVerifyCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                style={{ width: "100%", padding: 10, marginBottom: 10, letterSpacing: 4 }}
              />
              <button style={{ width: "100%", padding: 10 }}>Verify</button>
              <button
                type="button"
                onClick={() => { setStep("creds"); setTempToken(null); setOtpVerifyCode(""); }}
                style={{ width: "100%", padding: 10, marginTop: 8, opacity: 0.7 }}
              >
                Back
              </button>
            </form>
          )}
        </>
      )}

      {/* SIGNUP */}
      {mode === "signup" && (
        <>
          <form onSubmit={handleSignup}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              style={{ width: "100%", padding: 10, marginBottom: 10 }}
            />
            <button disabled={!canSubmitCreds} style={{ width: "100%", padding: 10 }}>
              Create account
            </button>
          </form>

          {qrDataUrl && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: "10px 0" }}>Set up 2FA</h3>
              <p style={{ marginTop: 0 }}>
                Scan this QR code in Google Authenticator/Authy, then enter the 6-digit code below.
              </p>
              <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                <img src={qrDataUrl} alt="2FA QR" style={{ width: 220, height: 220 }} />
              </div>

              <form onSubmit={handleEnable2FA}>
                <input
                  value={otpEnableCode}
                  onChange={(e) => setOtpEnableCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  style={{ width: "100%", padding: 10, marginBottom: 10, letterSpacing: 4 }}
                />
                <button style={{ width: "100%", padding: 10 }}>
                  Enable 2FA & Finish
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
