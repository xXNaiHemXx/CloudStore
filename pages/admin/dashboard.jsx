// pages/admin/dashboard.jsx
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Head from "next/head";
export default function AdminDashboard() {
  const { data: session } = useSession();
  const [userPoints, setUserPoints] = useState(0); 
  useEffect(() => {
      if (session) {
          axios.get(`/api/user?discordId=${session.user.id}`)
              .then((res) => {
                  setUserPoints(res.data.points || 0);
              })
              .catch(() => {});
      }
  }, [session]);
  return (
    <div className="main-container">
     
       <header className="header">
                <section className="headersc">
                    <a aria-current="page" href="/" class="headersca">
                        <img src="/favicon.ico" class="icon"/>
                        <strong class="uppercase">
                            <span class="tuppercase">xCloud</span>
                            Studio
                        </strong>
                    </a>      
                    <div className="header-links">
                            <a href="/admin/dashboard" className="headertext">Dashboard</a>
                            <a href="/admin/products" className="headertext">Products</a>
                            <a href="/admin/uploads" className="headertext">Uploads</a>
                            <a href="/admin/users" className="headertext">Users</a>
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
                                    <span className="profile-text">{userPoints} Point</span> {/* แสดงจำนวน points */}
                                </Link>
                            </div>
                        ) : (
                            <button onClick={() => signIn("discord")} className="header-discord-login">
                                <img src="/images/discord.png"  className="header-discord-icon" />
                                <span className="discord-text-login">login</span>
                            </button>
                        )}
                    </div>    
                    <div className="header-menu-icon" onClick={() => document.querySelector('.header-links').classList.toggle('active')}>
                        <i className="fas fa-bars"></i>    
                    </div>                   
                </section>      
            </header>
      <main className="main-admin">
        <section className="main-one-al-profile">
            <div className="flex items-center gap-6">
                    
            </div>             
        </section>
        <h1 className="text-2xl font-bold mb-6">📊 Admin Dashboard</h1>
        <div className="admin-menu-grid">
          <Link href="/admin/products" className="admin-menu-button">🧱 จัดการสินค้า (MOD)</Link>
          <Link href="/admin/uploads" className="admin-menu-button">📁 จัดการรูปภาพ</Link>
          <Link href="/admin/categories" className="admin-menu-button">📁 หมวดหมู่</Link>
          <Link href="/admin/orders" className="admin-menu-button">🧾 คำสั่งซื้อ</Link>
          <Link href="/admin/users" className="admin-menu-button">👥 ผู้ใช้งาน</Link>
          <Link href="/admin/report" className="admin-menu-button">📈 รายงาน</Link>
        </div>
      </main>
    </div>
  );
}
