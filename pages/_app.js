import "../styles/globals.css";
import { SessionProvider, useSession } from "next-auth/react";
import { UserProvider } from "../context/UserContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { addLog, LOG_TYPES } from "../utils/logger";

function SessionLogger({ children }) {
  const { data: session } = useSession();
  const router = useRouter();

  //  Log เมื่อ login
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
  }, [session?.user?.id]); //  ทำงานเฉพาะเมื่อ user id เปลี่ยน

  //  Log เมื่อเปลี่ยนหน้า
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

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handleRouteChange = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
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
              <Component {...pageProps} />
            </SessionLogger>
          </ConfirmProvider>
        </ToastProvider>
      </UserProvider>
    </SessionProvider>
  );
}