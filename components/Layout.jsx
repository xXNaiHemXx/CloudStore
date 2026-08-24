import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import styles from "../styles/Layout.module.css";
import Icon from "./Icon";

export default function Layout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (path) => {
    return router.pathname === path;
  };

  // Detect scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.layout}>
        
        {/* ===== HEADER - Liquid Glass ===== */}
        <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
          <div className={styles.headerWrap}>
            
            {/* Logo/Brand */}
            <Link href="/" className={styles.brand}>
              <div className={styles.brandIcon}>
                <img 
                  src="/logo.png" 
                  alt="xCloud" 
                  className={styles.brandLogo}
                  onError={(e) => {
                    e.target.src = '/favicon.ico';
                  }}
                />
              </div>
              <span className={styles.brandName}>
                xCloud <span>Studio</span>
              </span>
            </Link>

            {/* Navigation - Desktop */}
            <nav className={styles.navLinks}>
              <Link 
                href="/" 
                className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
              >
                <Icon name="home" size="0.9rem" />
                <span>Main</span>
              </Link>
              <Link 
                href="/shop" 
                className={`${styles.navLink} ${isActive('/shop') ? styles.navLinkActive : ''}`}
              >
                <Icon name="product" size="0.9rem" />
                <span>Products</span>
              </Link>
              <Link 
                href="/legal" 
                className={`${styles.navLink} ${isActive('/legal') ? styles.navLinkActive : ''}`}
              >
                <Icon name="file" size="0.9rem" />
                <span>Terms &amp; Privacy</span>
              </Link>
              <a 
                href="https://discord.gg/ntGypaUBNG" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`${styles.navLink} ${styles.navLinkDiscord}`}
              >
                <Icon name="discord" size="0.9rem" color="#818cf8" />
                <span>Discord</span>
              </a>
            </nav>

            {/* CTA */}
            <div className={styles.navCta}>
              {session ? (
                <Link href="/profile" className={styles.userBtn}>
                  <img 
                    src={session.user.image} 
                    alt={session.user.name} 
                    className={styles.userAvatar}
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                  <span className={styles.userName}>{session.user.name}</span>
                </Link>
              ) : (
                <button onClick={() => signIn("discord")} className={styles.loginBtn}>
                  <Icon name="login" size="0.9rem" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle - Glass */}
            <button 
              className={styles.mobileToggle} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`${styles.mobileToggleBar} ${mobileMenuOpen ? styles.mobileToggleBarActive : ''}`} />
              <span className={`${styles.mobileToggleBar} ${mobileMenuOpen ? styles.mobileToggleBarActive : ''}`} />
              <span className={`${styles.mobileToggleBar} ${mobileMenuOpen ? styles.mobileToggleBarActive : ''}`} />
            </button>
          </div>

          {/* Mobile Menu Overlay - Glass */}
          <div className={`${styles.mobileOverlay} ${mobileMenuOpen ? styles.mobileOverlayOpen : ''}`}>
            <nav className={styles.mobileNav}>
              <Link 
                href="/" 
                className={`${styles.mobileNavLink} ${isActive('/') ? styles.mobileNavLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="home" size="1rem" />
                <span>Main</span>
              </Link>
              <Link 
                href="/shop" 
                className={`${styles.mobileNavLink} ${isActive('/shop') ? styles.mobileNavLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="product" size="1rem" />
                <span>Products</span>
              </Link>
              <Link 
                href="/legal" 
                className={`${styles.mobileNavLink} ${isActive('/legal') ? styles.mobileNavLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="file" size="1rem" />
                <span>Terms &amp; Privacy</span>
              </Link>
              <a 
                href="https://discord.gg/ntGypaUBNG" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="discord" size="1rem" color="#818cf8" />
                <span>Discord</span>
              </a>
              {session ? (
                <Link 
                  href="/profile" 
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon name="user" size="1rem" />
                  <span>Profile</span>
                </Link>
              ) : (
                <button 
                  onClick={() => { 
                    signIn("discord"); 
                    setMobileMenuOpen(false); 
                  }} 
                  className={styles.mobileLoginBtn}
                >
                  <Icon name="login" size="1rem" />
                  <span>Login</span>
                </button>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          {children}
        </main>

        {/* ===== FOOTER - Liquid Glass ===== */}
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
                <a 
                  href="https://www.youtube.com/@hemgarage542" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className={styles.footerSocialLink}
                >
                  <Icon name="youtube" size="1.2rem" color="#ff0000" />
                </a>
                <a 
                  href="https://discord.gg/ntGypaUBNG" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className={styles.footerSocialLink}
                >
                  <Icon name="discord" size="1.2rem" color="#818cf8" />
                </a>
                <a 
                  href="https://github.com/xcloudstudio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className={styles.footerSocialLink}
                >
                  <Icon name="github" size="1.2rem" color="#6b7280" />
                </a>
              </div>
            </div>

            <div className={styles.footerRight}>
              <div className={styles.footerLinks}>
                <Link href="/legal#terms" className={styles.footerLink}>Terms</Link>
                <span className={styles.footerLinkDivider}>|</span>
                <Link href="/legal#privacy" className={styles.footerLink}>Privacy</Link>
                <span className={styles.footerLinkDivider}>|</span>
                <Link href="/support" className={styles.footerLink}>Support</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}