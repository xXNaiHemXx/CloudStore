import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AdminGuard({ children, requiredRole = "admin" }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    const checkAccess = async () => {
      try {
        const res = await fetch(`/api/admin/check-admin?discordId=${session.user.id}`);
        const data = await res.json();

        if (data.isAdmin) {
          // ตรวจสอบ role
          if (requiredRole === "head" && data.role !== "head") {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        // Fallback: เช็ค Env
        const envAdminIds = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || "").split(",").map(id => id.trim());
        if (envAdminIds.includes(session.user.id)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [session, status, requiredRole, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <div>Access Denied</div>;
  }

  return children;
}