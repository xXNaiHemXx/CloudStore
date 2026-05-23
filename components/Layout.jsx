import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import Head from "next/head";

export default function Layout({ children }) {
  const { data: session } = useSession();
  const [userPoints, setUserPoints] = useState(0);

  const fetchUserPoints = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await axios.get(`/api/user?discordId=${session.user.id}`);
      setUserPoints(res.data.points || 0);
    } catch {
      // silently ignore
    }
  }, [session]);

  // Save user to DB + fetch points on session change
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        if (session?.user?.id) {
          await axios.post("/api/user", {
            discordId: session.user.id,
            name: session.user.name,
            email: session.user.email,
          });
        }
      } catch (err) {
        console.error("Save user error:", err);
      }
      await fetchUserPoints();
    })();
  }, [session, fetchUserPoints]);

  const toggleMenu = () => {
    const links = document.querySelector(".header-links");
    if (links) links.classList.toggle("active");
  };

  return (
    <div className="main-container">
      <Head>
        <title>xCloud Store - Mod ETS2</title>
      </Head>

      {/* ===== HEADER ===== */}
      <header className="header">
        <section className="headersc">
          <Link href="/" className="headersca">
            <img src="/favicon.ico" className="icon" alt="icon" />
            <strong className="uppercase">
              <span className="tuppercase">xCloud</span>
              Store
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
                  <span className="profile-text">{userPoints} Point</span>
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
        <p className="footer-bn">© 2025 xCloud Store. All rights reserved.</p>
      </footer>
    </div>
  );
}
