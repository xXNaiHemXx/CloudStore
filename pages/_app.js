import "../styles/globals.css";
import { SessionProvider, useSession } from "next-auth/react";
import { UserProvider } from "../context/UserContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { addLog, LOG_TYPES } from "../utils/logger";
import PageLoader from "../components/PageLoader";

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

// ==================== MAIN APP ====================
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // ✅ เริ่มต้น true
  const [isRouteChanging, setIsRouteChanging] = useState(false); // ✅ สำหรับเปลี่ยนหน้า

  // ✅ ตั้งค่า isLoading เป็น false เมื่อโหลดหน้าแรกเสร็จ
  useEffect(() => {
    // รอให้ component mount ก่อน
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // ให้ loader แสดงครบก่อน

    return () => clearTimeout(timer);
  }, []);

  // ✅ แสดง loader เมื่อเปลี่ยนหน้า
  useEffect(() => {
    const handleStart = () => {
      setIsRouteChanging(true);
    };
    
    const handleComplete = () => {
      setTimeout(() => {
        setIsRouteChanging(false);
      }, 400); // แสดง loader ระหว่างเปลี่ยนหน้า
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // ✅ Scroll restoration
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

  // ✅ แสดง loader ถ้ากำลังโหลดหน้าแรก หรือกำลังเปลี่ยนหน้า
  const showLoader = isLoading || isRouteChanging;

  return (
    <SessionProvider session={session}>
      <UserProvider>
        <ToastProvider>
          <ConfirmProvider>
            <SessionLogger>
              {showLoader ? (
                <PageLoader />
              ) : (
                <Component {...pageProps} />
              )}
            </SessionLogger>
          </ConfirmProvider>
        </ToastProvider>
      </UserProvider>
    </SessionProvider>
  );
}