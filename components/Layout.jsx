import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Head from "next/head";
import styles from "../styles/Layout.module.css";
import Icon from "./Icon";

const NAV = [
  { href: "/", label: "Main", icon: "home" },
  { href: "/shop", label: "Products", icon: "product" },
  { href: "/legal", label: "Terms & Privacy", icon: "file" },
  { href: "/support", label: "Support", icon: "help" },
];

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Layout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef(null);

  const activeHref = NAV.find((n) => n.href === router.pathname)?.href
    ?? (router.pathname.startsWith("/products") ? "/shop" : null);

  // header หดเป็นแคปซูลเมื่อเลื่อน และซ่อนตอนเลื่อนลงเร็วๆ
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setHidden(y > 240 && y > lastY + 4);
      if (y < lastY - 4) setHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // หยดแก้วที่ไหลไปอยู่ใต้เมนูที่ active / ที่ hover
  const moveIndicatorTo = (el) => {
    if (!el || !navRef.current) return setIndicator((p) => ({ ...p, opacity: 0 }));
    const nav = navRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({ left: r.left - nav.left, width: r.width, opacity: 1 });
  };

  const resetIndicator = () => {
    moveIndicatorTo(navRef.current?.querySelector(`[data-active="true"]`));
  };

  useIsoLayoutEffect(() => {
    resetIndicator();
    window.addEventListener("resize", resetIndicator);
    return () => window.removeEventListener("resize", resetIndicator);
  }, [activeHref, scrolled]);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.layout}>
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""} ${hidden && !mobileMenuOpen ? styles.headerHidden : ""}`}>
          <div className={styles.headerWrap}>
            <Link href="/" className={styles.brand}>
              <div className={styles.brandIcon}>
                <img src="/favicon.ico" alt="xCloud" className={styles.brandLogo} />
              </div>
              <span className={styles.brandName}>
                xCloud <span>Studio</span>
              </span>
            </Link>

            <nav className={styles.navLinks} ref={navRef} onMouseLeave={resetIndicator}>
              <span
                className={styles.navIndicator}
                style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width, opacity: indicator.opacity }}
              />
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={activeHref === item.href}
                  onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
                  className={`${styles.navLink} ${activeHref === item.href ? styles.navLinkActive : ""}`}
                >
                  <Icon name={item.icon} size="0.9rem" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <a
                href="https://discord.gg/ntGypaUBNG"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
                className={`${styles.navLink} ${styles.navLinkDiscord}`}
              >
                <Icon name="discord" size="0.9rem" color="#818cf8" />
                <span>Discord</span>
              </a>
            </nav>

            <div className={styles.navCta}>
              {session ? (
                <Link href="/profile" className={styles.userBtn}>
                  <span className={styles.userAvatarRing}>
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className={styles.userAvatar}
                      onError={(e) => { e.target.src = "/images/profile.png"; }}
                    />
                  </span>
                  <span className={styles.userName}>{session.user.name}</span>
                </Link>
              ) : (
                <button onClick={() => signIn("discord")} className={styles.loginBtn}>
                  <Icon name="discord" size="0.95rem" />
                  <span>Login</span>
                </button>
              )}
            </div>

            <button
              className={`${styles.mobileToggle} ${mobileMenuOpen ? styles.mobileToggleOpen : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={styles.mobileToggleBar} />
              <span className={styles.mobileToggleBar} />
              <span className={styles.mobileToggleBar} />
            </button>
          </div>
        </header>

        {/* ===== Mobile sheet ===== */}
        <div
          className={`${styles.mobileOverlay} ${mobileMenuOpen ? styles.mobileOverlayOpen : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav className={styles.mobileNav} onClick={(e) => e.stopPropagation()}>
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ transitionDelay: mobileMenuOpen ? `${80 + i * 50}ms` : "0ms" }}
                className={`${styles.mobileNavLink} ${activeHref === item.href ? styles.mobileNavLinkActive : ""}`}
              >
                <Icon name={item.icon} size="1rem" />
                <span>{item.label}</span>
              </Link>
            ))}
            <a
              href="https://discord.gg/ntGypaUBNG"
              target="_blank"
              rel="noopener noreferrer"
              style={{ transitionDelay: mobileMenuOpen ? `${80 + NAV.length * 50}ms` : "0ms" }}
              className={styles.mobileNavLink}
            >
              <Icon name="discord" size="1rem" color="#818cf8" />
              <span>Discord</span>
            </a>
            {session ? (
              <Link
                href="/profile"
                style={{ transitionDelay: mobileMenuOpen ? `${130 + NAV.length * 50}ms` : "0ms" }}
                className={styles.mobileNavLink}
              >
                <Icon name="user" size="1rem" />
                <span>Profile</span>
              </Link>
            ) : (
              <button
                onClick={() => { signIn("discord"); setMobileMenuOpen(false); }}
                style={{ transitionDelay: mobileMenuOpen ? `${130 + NAV.length * 50}ms` : "0ms" }}
                className={styles.mobileLoginBtn}
              >
                <Icon name="discord" size="1rem" />
                <span>Login with Discord</span>
              </button>
            )}
          </nav>
        </div>

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerWrap}>
            <div className={styles.footerLeft}>
              <span className={styles.footerCopy}>
                © 2026 xCloud Developer
                <span className={styles.footerCopyTail}> All rights reserved.</span>
              </span>
            </div>

            <div className={styles.footerCenter}>
              <div className={styles.footerSocials}>
                <a href="https://www.youtube.com/@hemgarage542" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={styles.footerSocialLink}>
                  <Icon name="youtube" size="1.15rem" color="#ff4d4d" />
                </a>
                <a href="https://discord.gg/ntGypaUBNG" target="_blank" rel="noopener noreferrer" aria-label="Discord" className={styles.footerSocialLink}>
                  <Icon name="discord" size="1.15rem" color="#818cf8" />
                </a>
                <a href="https://github.com/xcloudstudio" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={styles.footerSocialLink}>
                  <Icon name="github" size="1.15rem" color="#cbd5e1" />
                </a>
              </div>
            </div>

            <div className={styles.footerRight}>
              <div className={styles.footerLinks}>
                <Link href="/legal#terms" className={styles.footerLink}>Terms</Link>
                <span className={styles.footerLinkDivider} />
                <Link href="/legal#privacy" className={styles.footerLink}>Privacy</Link>
                <span className={styles.footerLinkDivider} />
                <Link href="/support" className={styles.footerLink}>Support</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
