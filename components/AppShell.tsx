"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { BRANDING } from "@/lib/branding";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type AppShellProps = {
  portalLabel: string;
  user: {
    email: string;
  };
  navItems: NavItem[];
  logoutAction: string;
  children: ReactNode;
};

export default function AppShell({
  portalLabel,
  user,
  navItems,
  logoutAction,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = user.email.split("@")[0];
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const response = await fetch(logoutAction, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      const data = await response.json();
      router.push(data.redirectTo || "/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandBox}>
            <div style={styles.logo}>{BRANDING.logoLetter}</div>
            <div>
              <h3 style={styles.brandTitle}>{BRANDING.appName}</h3>
              <p style={styles.brandSubtitle}>{portalLabel}</p>
            </div>
          </div>

          <nav style={styles.nav}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                  }}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.profileBox}>
            <div style={styles.avatar}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={styles.profileName}>{displayName}</p>
              <p style={styles.profileEmail}>{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleLogout}>
            <button
              type="submit"
              style={{
                ...styles.logoutButton,
                ...(isLoggingOut ? styles.logoutButtonDisabled : {}),
              }}
              disabled={isLoggingOut}
            >
              <span style={styles.navIcon}>↪</span>
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </form>
        </div>
      </aside>

      <div style={styles.mainArea}>
        <header style={styles.topBar}>
          <p style={styles.topBarText}>{portalLabel}</p>
        </header>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "280px",
    background: "linear-gradient(180deg, #0d1526 0%, #101a2f 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 20px",
  },
  brandBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "30px",
  },
  logo: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    background: "#21a8f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "22px",
    color: "#fff",
    flexShrink: 0,
  },
  brandTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: 1.25,
    color: "#fff",
  },
  brandSubtitle: {
    margin: "6px 0 0 0",
    color: "#98a3b6",
    fontSize: "14px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px 18px",
    borderRadius: "18px",
    color: "#9eabc0",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: 600,
  },
  navItemActive: {
    background: "#1ea7f0",
    color: "#fff",
  },
  navIcon: {
    fontSize: "18px",
    minWidth: "22px",
    display: "inline-block",
  },
  sidebarFooter: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "20px",
  },
  profileBox: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "18px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#1b2740",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
  },
  profileName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#fff",
  },
  profileEmail: {
    margin: "4px 0 0 0",
    color: "#8d98ab",
    fontSize: "14px",
    wordBreak: "break-word",
  },
  logoutButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "transparent",
    border: "none",
    color: "#c0cad9",
    padding: "14px 10px",
    fontSize: "16px",
    cursor: "pointer",
    textAlign: "left",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  topBar: {
    height: "72px",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    padding: "0 28px",
  },
  topBarText: {
    margin: 0,
    color: "#667085",
    fontSize: "14px",
    fontWeight: 500,
  },
  content: {
    padding: "28px",
  },
};