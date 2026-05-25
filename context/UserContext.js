import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const UserContext = createContext();

export function UserProvider({ children }) {
  const { data: session } = useSession();
  const [userPoints, setUserPoints] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProducts, setUserProducts] = useState([]); //  เพิ่ม state สำหรับสินค้าผู้ใช้

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id && !session?.user?.discordId) {
      setUserPoints(null);
      setUserProducts([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const discordId = session.user.discordId || session.user.id;
      const res = await axios.get(`/api/user?discordId=${discordId}`);
      setUserPoints(res.data.points || 0);
      setUserProducts(res.data.products || []); //  ดึง products จาก API
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserPoints(0);
      setUserProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const refreshPoints = useCallback(async () => {
    setIsLoading(true);
    await fetchUserData();
  }, [fetchUserData]);
  
  // Save user to DB + fetch data
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
      await fetchUserData();
    })();
  }, [session, fetchUserData]);

  return (
    <UserContext.Provider value={{ 
      userPoints, 
      isLoading, 
      refreshPoints, 
      setUserPoints,
      userProducts, //  ส่ง products ออกไป
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}