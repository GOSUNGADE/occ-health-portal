"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BRANDING } from "@/lib/branding";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      router.push(data.redirectTo || "/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .login-page {
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

        .left-content {
          position: relative;
          z-index: 1;
          max-width: 520px;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
        }

        .logo {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: #1fb6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 700;
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
          flex-shrink: 0;
        }

        .brand-title {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
        }

        .brand-subtitle {
          margin: 6px 0 0 0;
          color: rgba(255,255,255,0.75);
          font-size: 15px;
        }

        .hero-title {
          font-size: 44px;
          line-height: 1.15;
          margin: 0 0 18px 0;
          font-weight: 700;
        }

        .hero-text {
          margin: 0;
          font-size: 17px;
          line-height: 1.7;
          color: rgba(255,255,255,0.82);
        }

        .right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .card {
          width: 100%;
          max-width: 460px;
          background: #fff;
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 20px 50px rgba(16, 24, 40, 0.10);
          border: 1px solid #e9eef5;
        }

        .form-title {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          color: #101828;
        }

        .form-subtitle {
          margin: 8px 0 0 0;
          color: #667085;
          font-size: 15px;
        }

        .form {
          margin-top: 28px;
          display: grid;
          gap: 18px;
        }

        .field-group {
          display: grid;
          gap: 8px;
        }

        .label {
          font-size: 14px;
          font-weight: 600;
          color: #344054;
        }

        .input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #d0d5dd;
          font-size: 16px;
          outline: none;
          background: #fff;
          box-sizing: border-box;
          color: #101828;
        }

        .input:focus {
          border-color: #119ee8;
          box-shadow: 0 0 0 3px rgba(17,158,232,0.12);
        }

        .error {
          margin: 0;
          color: #d92d20;
          background: #fef3f2;
          border: 1px solid #fecdca;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 14px;
        }

        .button {
          width: 100%;
          padding: 15px 18px;
          border-radius: 14px;
          border: none;
          background: #119ee8;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          min-height: 52px;
          margin-top: 4px;
        }

        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .footer-text {
          margin-top: 22px;
          margin-bottom: 0;
          text-align: center;
          color: #667085;
          font-size: 14px;
        }

        .footer-link {
          color: #119ee8;
          text-decoration: none;
          font-weight: 600;
        }

        /* ── Tablet ── */
        @media (max-width: 900px) {
          .login-page {
            grid-template-columns: 1fr 1fr;
          }
          .left-panel {
            padding: 32px 24px;
          }
          .brand-title {
            font-size: 20px;
          }
          .hero-title {
            font-size: 32px;
          }
          .logo-row {
            margin-bottom: 32px;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .login-page {
            grid-template-columns: 1fr;
          }
          .left-panel {
            padding: 28px 20px;
            align-items: flex-start;
          }
          .hero-text-wrap {
            display: none;
          }
          .logo-row {
            margin-bottom: 0;
          }
          .logo {
            width: 44px;
            height: 44px;
            font-size: 20px;
            border-radius: 12px;
          }
          .brand-title {
            font-size: 17px;
          }
          .brand-subtitle {
            font-size: 13px;
          }
          .right-panel {
            padding: 24px 16px 40px;
            align-items: flex-start;
          }
          .card {
            border-radius: 16px;
            padding: 24px 20px;
            box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
          }
          .form-title {
            font-size: 24px;
          }
        }
      `}</style>

      <main className="login-page">
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
              <h2 className="hero-title">Welcome back</h2>
              <p className="hero-text">
                Sign in to manage your candidates, bookings, and occupational
                health assessments — all in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            <h2 className="form-title">Sign in</h2>
            <p className="form-subtitle">Access your employer portal account</p>

            <form onSubmit={handleSubmit} className="form">
              <div className="field-group">
                <label htmlFor="email" className="label">
                  Work Email
                </label>
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

              <div className="field-group">
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                />
              </div>

              {error ? <p className="error">{error}</p> : null}

              <button type="submit" disabled={loading} className="button">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="footer-text">
              Don&apos;t have an employer account?{" "}
              <Link href="/register" className="footer-link">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
