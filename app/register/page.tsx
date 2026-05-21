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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push(data.redirectTo || "/employer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.leftPanel}>
        <div style={styles.overlay} />
        <div style={styles.leftContent}>
          <div style={styles.logoRow}>
            <div style={styles.logo}>M</div>
            <div>
              <h1 style={styles.brandTitle}>Primo Medical Clinic</h1>
              <p style={styles.brandSubtitle}>Occupational Health Employer Portal</p>
            </div>
          </div>

          <div style={styles.heroTextWrap}>
            <h2 style={styles.heroTitle}>
              Create your employer account
            </h2>
            <p style={styles.heroText}>
              Register your business to manage candidates, create bookings,
              track assessments, and receive occupational health outcomes in one place.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.formTitle}>Register</h2>
            <p style={styles.formSubtitle}>
              Set up your employer portal account
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label htmlFor="fullName" style={styles.label}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="companyName" style={styles.label}>
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>
                Work Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    fontFamily: "Arial, sans-serif",
    background: "#f5f7fb",
  },
  leftPanel: {
    position: "relative",
    background:
      "linear-gradient(135deg, #0b1220 0%, #11203d 55%, #119ee8 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 30%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 25%)",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "520px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "48px",
  },
  logo: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#1fb6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: 700,
    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
  },
  brandTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },
  brandSubtitle: {
    margin: "6px 0 0 0",
    color: "rgba(255,255,255,0.75)",
    fontSize: "15px",
  },
  heroTextWrap: {
    marginTop: "18px",
  },
  heroTitle: {
    fontSize: "44px",
    lineHeight: 1.15,
    margin: 0,
    marginBottom: "18px",
    fontWeight: 700,
  },
  heroText: {
    margin: 0,
    fontSize: "17px",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)",
  },
  rightPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#fff",
    borderRadius: "24px",
    padding: "36px",
    boxShadow: "0 20px 50px rgba(16, 24, 40, 0.10)",
    border: "1px solid #e9eef5",
  },
  cardHeader: {
    marginBottom: "28px",
  },
  formTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#101828",
  },
  formSubtitle: {
    margin: "8px 0 0 0",
    color: "#667085",
    fontSize: "15px",
  },
  form: {
    display: "grid",
    gap: "18px",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#344054",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d0d5dd",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  },
  button: {
    marginTop: "8px",
    width: "100%",
    padding: "15px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#119ee8",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    margin: 0,
    color: "#d92d20",
    background: "#fef3f2",
    border: "1px solid #fecdca",
    padding: "12px 14px",
    borderRadius: "12px",
    fontSize: "14px",
  },
  footerText: {
    marginTop: "22px",
    marginBottom: 0,
    textAlign: "center",
    color: "#667085",
    fontSize: "14px",
  },
  link: {
    color: "#119ee8",
    textDecoration: "none",
    fontWeight: 600,
  },
};