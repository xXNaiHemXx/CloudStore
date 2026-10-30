import "../styles/globals.css";
import { SessionProvider, useSession } from "next-auth/react";
import { UserProvider } from "../context/UserContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { addLog, LOG_TYPES } from "../utils/logger";
import PageLoader from "../components/PageLoader";
import LiquidBackground from "../components/LiquidBackground";
import LiquidFx from "../components/LiquidFx";

// ==================== SESSION LOGGER ====================
function SessionLogger({ children }) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      addLog(
        LOG_TYPES.LOGIN,
        "ล็อคอิน",
        `${session.user.name} เข้าสู่ระบบ`,
        session.user.name,
        {
          discordId: session.user.id,
          email: session.user.email,
        }
      ).catch(() => {});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleRouteChange = (url) => {
      if (session?.user && !url.includes('/admin') && !url.includes('/api')) {
        const importantPages = ['/shop', '/profile', '/products'];
        if (importantPages.some(p => url.startsWith(p))) {
          addLog(
            'page_view',
            'ดูหน้าเว็บ',
            `${session.user.name} ดูหน้า ${url}`,
            session.user.name,
            { url }
          ).catch(() => {});
        }
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [session, router]);

  return children;
}

// ==================== ROUTE TRANSITION ====================
// แถบไล่สีด้านบน + เบลอแก้วระหว่างเปลี่ยนหน้า (ไม่ unmount หน้าเดิมทิ้งเหมือนเดิมแล้ว)
function RouteTransition() {
  const router = useRouter();
  const [state, setState] = useState("idle");

  useEffect(() => {
    let doneTimer;
    const start = (url) => {
      if (url === router.asPath) return;
      clearTimeout(doneTimer);
      setState("loading");
    };
    const done = () => {
      setState("done");
      doneTimer = setTimeout(() => setState("idle"), 600);
    };
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      clearTimeout(doneTimer);
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router]);

  return (
    <>
      <div className="lg-route-bar" data-state={state} />
      <div className="lg-wipe" data-active={state === "loading"} />
    </>
  );
}

// ==================== MAIN APP ====================
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  // ✅ Scroll restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleRouteChange = () => {
      window.scrollTo({ top: 0, behavior: "instant" });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router]);

  return (
    <SessionProvider session={session}>
      <UserProvider>
        <ToastProvider>
          <ConfirmProvider>
            <SessionLogger>
              <LiquidBackground />
              <LiquidFx />
              <RouteTransition />
              <PageLoader />
              <div className="lg-page" key={router.pathname}>
                <Component {...pageProps} />
              </div>
            </SessionLogger>
          </ConfirmProvider>
        </ToastProvider>
      </UserProvider>
    </SessionProvider>
  );
}
