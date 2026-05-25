import { useSession, signIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useUser } from "../context/UserContext";
import { addLog, LOG_TYPES } from "../utils/logger";
import { useToast } from "../context/ToastContext";

export default function Layout({ children }) {
  const { data: session } = useSession();
  const { userPoints, isLoading } = useUser();
  const { success } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    const links = document.querySelector(".header-links");
    if (links) links.classList.toggle("active");
  };

  // ✅ Custom Logout พร้อม Log
  const handleLogout = async () => {
    if (session?.user) {
      await addLog(
        LOG_TYPES.LOGOUT,
        "ล็อคเอาท์",
        `${session.user.name} ออกจากระบบ`,
        session.user.name
      ).catch(() => {});
    }
    nextAuthSignOut({ callbackUrl: "/" });
  };

  return (
    <div className="main-container">
      <Head>
        <title>xCloud Studio - Mod ETS2</title>
      </Head>

      {/* ===== HEADER ===== */}
      <header className="header">
        <section className="headersc">
          <Link href="/" className="headersca">
            <img src="/favicon.ico" className="icon" alt="icon" />
            <strong className="uppercase">
              <span className="tuppercase">xCloud</span>
              Studio
            </strong>
          </Link>

          <div className="header-links">
            <Link href="/" className="headertext">Main</Link>
            <Link href="/shop" className="headertext">Products</Link>
            <a href="https://discord.gg/G6Up8VDa5t" className="headertext" target="_blank" rel="noopener noreferrer">Discord</a>
          </div>

          {/* ✅ Profile + Arrow */}
          <div className="profile-container">
            {session ? (
              <div className="profile-wrapper">
                <Link href="/profile" className="profile-link-wrapper">
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="profile-pic"
                  />
                  <span className="profile-text">
                    {isLoading ? (
                      <span className="animate-pulse">⏳</span>
                    ) : (
                      `${userPoints?.toLocaleString() || 0} Point`
                    )}
                  </span>
                </Link>

                {/* ✅ ลูกศรชี้เตือนให้เติมพ้อยท์ */}
                {(userPoints || 0) < 100 && (
                  <Link href="/profile?tab=topup" className="topup-arrow">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="arrow-icon" 
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
                      />
                    </svg>
                    <span>เติมพ้อยท์</span>
                  </Link>
                )}
              </div>
            ) : (
              <button onClick={() => signIn("discord")} className="header-discord-login">
                <img src="/images/discord.png" className="header-discord-icon" alt="discord" />
                <span className="discord-text-login">login</span>
              </button>
            )}
          </div>

          <div className="header-menu-icon" onClick={toggleMenu}>
            <i className="fas fa-bars"></i>
          </div>
        </section>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main">{children}</main>

      {/* ===== FOOTER ===== */}
      <footer className="footer-b">
        <div className="footer-divider"></div>
        <p className="footer-bn">2025 xCloud Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}