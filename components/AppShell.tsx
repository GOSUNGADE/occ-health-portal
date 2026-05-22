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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      const response = await fetch(logoutAction, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Logout failed");
      const data = await response.json();
      router.push(data.redirectTo || "/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const sidebarContent = (
    <>
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
                onClick={closeSidebar}
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
          <div style={{ minWidth: 0 }}>
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
    </>
  );

  return (
    <>
      <style>{`
        .appshell-wrapper {
          display: flex;
          min-height: 100vh;
          background: #f4f7fb;
          font-family: Arial, sans-serif;
        }

        /* Desktop sidebar */
        .appshell-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #0d1526 0%, #101a2f 100%);
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 20px;
        }

        /* Mobile: sidebar becomes an overlay drawer */
        .appshell-mobile-backdrop {
          display: none;
        }

        .appshell-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .appshell-topbar {
          height: 60px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
        }

        .appshell-hamburger {
          display: none;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 6px;
          color: #334155;
          font-size: 22px;
          line-height: 1;
          flex-shrink: 0;
        }

        .appshell-topbar-label {
          margin: 0;
          color: #667085;
          font-size: 14px;
          font-weight: 500;
        }

        .appshell-content {
          padding: 24px;
          flex: 1;
        }

        @media (max-width: 768px) {
          .appshell-sidebar {
            /* Hidden off-screen on mobile — drawer approach */
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            width: 260px;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }

          .appshell-sidebar.open {
            transform: translateX(0);
          }

          .appshell-mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            z-index: 199;
          }

          .appshell-hamburger {
            display: block;
          }

          .appshell-content {
            padding: 16px;
          }

          .appshell-topbar {
            height: 56px;
            padding: 0 16px;
          }
        }
      `}</style>

      <div className="appshell-wrapper">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="appshell-mobile-backdrop"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`appshell-sidebar${sidebarOpen ? " open" : ""}`}
          style={styles.sidebarInner}
        >
          {sidebarContent}
        </aside>

        {/* Main area */}
        <div className="appshell-main">
          <header className="appshell-topbar">
            <button
              className="appshell-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <p className="appshell-topbar-label">{portalLabel}</p>
          </header>

          <main className="appshell-content">{children}</main>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebarInner: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
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
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.25,
    color: "#fff",
  },
  brandSubtitle: {
    margin: "6px 0 0 0",
    color: "#98a3b6",
    fontSize: "13px",
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
    padding: "14px 18px",
    borderRadius: "18px",
    color: "#9eabc0",
    textDecoration: "none",
    fontSize: "15px",
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
    overflow: "hidden",
  },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#1b2740",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  profileName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  profileEmail: {
    margin: "4px 0 0 0",
    color: "#8d98ab",
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
    fontSize: "15px",
    cursor: "pointer",
    textAlign: "left",
  },
  logoutButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
