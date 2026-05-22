"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(data.redirectTo || "/employer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .register-page {
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
          font-size: 30px;
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

        .card-header {
          margin-bottom: 28px;
        }

        .form-title {
          margin: 0;
          font-size: 32px;
          color: #101828;
        }

        .form-subtitle {
          margin: 8px 0 0 0;
          color: #667085;
          font-size: 15px;
        }

        .form {
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
          font-size: 15px;
          outline: none;
          background: #fff;
          box-sizing: border-box;
          /* Prevent iOS zoom on focus (font-size must be >= 16px on iOS) */
          font-size: 16px;
        }

        .button {
          margin-top: 8px;
          width: 100%;
          padding: 15px 18px;
          border-radius: 14px;
          border: none;
          background: #119ee8;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          /* Larger tap target */
          min-height: 52px;
        }

        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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

        /* ── Tablet (≤ 900px): shrink left panel ── */
        @media (max-width: 900px) {
          .register-page {
            grid-template-columns: 1fr 1fr;
          }

          .left-panel {
            padding: 32px 24px;
          }

          .brand-title {
            font-size: 22px;
          }

          .hero-title {
            font-size: 32px;
          }

          .logo-row {
            margin-bottom: 32px;
          }
        }

        /* ── Mobile (≤ 640px): stack vertically ── */
        @media (max-width: 640px) {
          .register-page {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }

          .left-panel {
            padding: 28px 20px;
            align-items: flex-start;
          }

          /* Hide hero text on mobile — just show logo/brand */
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
            font-size: 18px;
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

          .form-subtitle {
            font-size: 14px;
          }
        }
      `}</style>

      <main className="register-page">
        <div className="left-panel">
          <div className="overlay" />
          <div className="left-content">
            <div className="logo-row">
              <div className="logo">M</div>
              <div>
                <h1 className="brand-title">Primo Medical Clinic</h1>
                <p className="brand-subtitle">Occupational Health Employer Portal</p>
              </div>
            </div>

            <div className="hero-text-wrap">
              <h2 className="hero-title">Create your employer account</h2>
              <p className="hero-text">
                Register your business to manage candidates, create bookings,
                track assessments, and receive occupational health outcomes in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            <div className="card-header">
              <h2 className="form-title">Register</h2>
              <p className="form-subtitle">Set up your employer portal account</p>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <div className="field-group">
                <label htmlFor="fullName" className="label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <div className="field-group">
                <label htmlFor="companyName" className="label">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <div className="field-group">
                <label htmlFor="email" className="label">Work Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                />
              </div>

              <div className="field-group">
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                />
              </div>

              {error ? <p className="error">{error}</p> : null}

              <button type="submit" disabled={loading} className="button">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="footer-text">
              Already have an account?{" "}
              <Link href="/login" className="footer-link">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
