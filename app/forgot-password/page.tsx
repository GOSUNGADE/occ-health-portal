"use client";

import Link from "next/link";
import { useState } from "react";
import { BRANDING } from "@/lib/branding";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          font-family: Arial, sans-serif;
          background: #f5f7fb;
        }
        .left-panel {
          position: relative;
          background: linear-gradient(135deg, #0b1220 0%, #11203d 55%, #119ee8 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          overflow: hidden;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 30%),
            radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 25%);
        }
        .left-content { position: relative; z-index: 1; max-width: 520px; }
        .logo-row { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; }
        .logo { width: 60px; height: 60px; border-radius: 16px; background: #1fb6ff; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; box-shadow: 0 12px 30px rgba(0,0,0,0.2); flex-shrink: 0; }
        .brand-title { margin: 0; font-size: 26px; font-weight: 700; }
        .brand-subtitle { margin: 6px 0 0 0; color: rgba(255,255,255,0.75); font-size: 15px; }
        .hero-title { font-size: 44px; line-height: 1.15; margin: 0 0 18px; font-weight: 700; }
        .hero-text { margin: 0; font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.82); }
        .right-panel { display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .card { width: 100%; max-width: 460px; background: #fff; border-radius: 24px; padding: 36px; box-shadow: 0 20px 50px rgba(16,24,40,0.10); border: 1px solid #e9eef5; }
        .form-title { margin: 0; font-size: 32px; font-weight: 700; color: #101828; }
        .form-subtitle { margin: 8px 0 0; color: #667085; font-size: 15px; }
        .form { margin-top: 28px; display: grid; gap: 18px; }
        .label { font-size: 14px; font-weight: 600; color: #344054; display: block; margin-bottom: 8px; }
        .input { width: 100%; padding: 14px 16px; border-radius: 14px; border: 1px solid #d0d5dd; font-size: 16px; outline: none; background: #fff; box-sizing: border-box; color: #101828; }
        .input:focus { border-color: #119ee8; box-shadow: 0 0 0 3px rgba(17,158,232,0.12); }
        .button { width: 100%; padding: 15px 18px; border-radius: 14px; border: none; background: #119ee8; color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; min-height: 52px; }
        .button:disabled { opacity: 0.7; cursor: not-allowed; }
        .error { margin: 0; color: #d92d20; background: #fef3f2; border: 1px solid #fecdca; padding: 12px 14px; border-radius: 12px; font-size: 14px; }
        .footer-text { margin-top: 22px; margin-bottom: 0; text-align: center; color: #667085; font-size: 14px; }
        .footer-link { color: #119ee8; text-decoration: none; font-weight: 600; }
        .success-icon { font-size: 48px; margin-bottom: 16px; }
        .success-title { margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #101828; }
        .success-text { margin: 0; font-size: 15px; line-height: 1.7; color: #475569; }
        @media (max-width: 900px) {
          .page { grid-template-columns: 1fr 1fr; }
          .left-panel { padding: 32px 24px; }
          .brand-title { font-size: 20px; }
          .hero-title { font-size: 32px; }
          .logo-row { margin-bottom: 32px; }
        }
        @media (max-width: 640px) {
          .page { grid-template-columns: 1fr; }
          .left-panel { padding: 28px 20px; align-items: flex-start; }
          .hero-text-wrap { display: none; }
          .logo-row { margin-bottom: 0; }
          .logo { width: 44px; height: 44px; font-size: 20px; border-radius: 12px; }
          .brand-title { font-size: 17px; }
          .right-panel { padding: 24px 16px 40px; align-items: flex-start; }
          .card { border-radius: 16px; padding: 24px 20px; }
          .form-title { font-size: 24px; }
        }
      `}</style>

      <main className="page">
        <div className="left-panel">
          <div className="overlay" />
          <div className="left-content">
            <div className="logo-row">
              <div className="logo">{BRANDING.logoLetter}</div>
              <div>
                <h1 className="brand-title">{BRANDING.appName}</h1>
                <p className="brand-subtitle">Occupational Health Portal</p>
              </div>
            </div>
            <div className="hero-text-wrap">
              <h2 className="hero-title">Forgot your password?</h2>
              <p className="hero-text">
                No problem. Enter your email and we'll send you a link to reset it.
                The link expires after 1 hour.
              </p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            {submitted ? (
              <>
                <div className="success-icon">📬</div>
                <h2 className="success-title">Check your email</h2>
                <p className="success-text">
                  If an account exists for <strong>{email}</strong>, you'll
                  receive a password reset link shortly. Check your spam folder
                  if it doesn't arrive within a few minutes.
                </p>
                <p className="footer-text" style={{ marginTop: "28px" }}>
                  <Link href="/login" className="footer-link">← Back to sign in</Link>
                </p>
              </>
            ) : (
              <>
                <h2 className="form-title">Reset password</h2>
                <p className="form-subtitle">We'll email you a reset link</p>

                <form onSubmit={handleSubmit} className="form">
                  <div>
                    <label htmlFor="email" className="label">Work Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="input"
                    />
                  </div>

                  {error && <p className="error">{error}</p>}

                  <button type="submit" disabled={loading} className="button">
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <p className="footer-text">
                  <Link href="/login" className="footer-link">← Back to sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}