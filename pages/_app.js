import "../styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "../context/UserContext";
import { ToastProvider } from "../context/ToastContext";
import { ConfirmProvider } from "../context/ConfirmContext";  // ✅ เพิ่ม
import { useEffect } from "react";
import { useRouter } from "next/router";

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
          <ConfirmProvider>  {/* ✅ ครอบด้วย ConfirmProvider */}
            <Component {...pageProps} />
          </ConfirmProvider>
        </ToastProvider>
      </UserProvider>
    </SessionProvider>
  );
}