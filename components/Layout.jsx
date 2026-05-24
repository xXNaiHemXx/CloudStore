import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useUser } from "../context/UserContext"; // ✅ import useUser

export default function Layout({ children }) {
  const { data: session } = useSession();
  const { userPoints, isLoading } = useUser(); // ✅ ใช้ points จาก Context
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    const links = document.querySelector(".header-links");
    if (links) links.classList.toggle("active");
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

          <div className="profile-container">
            {session ? (
              <div className="items-centerpics">
                <Link href="/profile">
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="profile-pic"
                  />
                  <span className="profile-text">
                    {isLoading ? (
                      <span className="animate-pulse" style={{ opacity: 0.5 }}>⏳</span>
                    ) : (
                      `${userPoints?.toLocaleString() || 0} Point`
                    )}
                  </span>
                </Link>
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
        <p className="footer-bn">© 2025 xCloud Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}