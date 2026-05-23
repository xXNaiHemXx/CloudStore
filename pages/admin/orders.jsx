import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import Head from "next/head";
export default function AdminOrders() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topMod, setTopMod] = useState("-");
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/user/purchase");
      const data = res.data || [];

      setOrders(data);
      setTotalOrders(data.length);
      setTotalRevenue(data.reduce((sum, o) => sum + (o.price || 0), 0));

      // ✅ แก้ปัญหา Invalid Date และจัดรูปแบบวันล่าสุด
      const modStats = {}; // { name: { count, lastPurchased: Date } }

      data.forEach((order) => {
        const name = order.productName || "unknown";
        const rawDate = order.purchaseDate;
        const date = rawDate ? new Date(rawDate) : null;

        if (!modStats[name]) {
          modStats[name] = {
            count: 1,
            lastPurchased: date,
          };
        } else {
          modStats[name].count += 1;
          if (date && modStats[name].lastPurchased && date > modStats[name].lastPurchased) {
            modStats[name].lastPurchased = date;
          }
        }
      });


      const sortedMods = Object.entries(modStats).sort((a, b) => b[1].count - a[1].count);

      if (sortedMods.length > 0) {
        const [name, stat] = sortedMods[0];

        const formattedDate =
          stat.lastPurchased instanceof Date && !isNaN(stat.lastPurchased)
            ? stat.lastPurchased.toLocaleString("th-TH", {
                dateStyle: "long",
                timeStyle: "short",
              })
            : "-";

        setTopMod(`${name} (ล่าสุด: ${formattedDate})`);
      } else {
        setTopMod("-");
      }

    } catch (err) {
      console.error("โหลดคำสั่งซื้อไม่สำเร็จ:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="main-container">
      <header className="header">
                <section className="headersc">
                    <a aria-current="page" href="/" class="headersca">
                        <img src="/favicon.ico" class="icon"/>
                        <strong class="uppercase">
                            <span class="tuppercase">xCloud</span>
                            Store
                        </strong>
                    </a>      
                    <div className="header-links">
                            <a href="/admin/dashboard" className="headertext">Dashboard</a>
                            <a href="/admin/products" className="headertext">Products</a>
                            <a href="/admin/uploads" className="headertext">Uploads</a>
                            <a href="/admin/users" className="headertext">Users</a>
                    </div>  
                       
                    <div className="header-menu-icon" onClick={() => document.querySelector('.header-links').classList.toggle('active')}>
                        <i className="fas fa-bars"></i>    
                    </div>                   
                </section>      
            </header>

      <main className="main-admin">
        <section className="main-one-al-profile" />
        <h1 className="text-2xl font-bold mb-4">🧾 รายการคำสั่งซื้อ</h1>

        {/* 🔹 Section: Summary */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded shadow">
            <p className="text-gray-600">💰 ยอดขายรวม</p>
            <h2 className="text-xl font-bold text-green-700">
              {totalRevenue.toLocaleString()} ฿
            </h2>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <p className="text-gray-600">📦 จำนวนคำสั่งซื้อ</p>
            <h2 className="text-xl font-bold">{totalOrders} รายการ</h2>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <p className="text-gray-600">🏆 Mod ที่ขายดีที่สุด</p>
            <h2 className="text-xl font-bold text-blue-600">{topMod}</h2>
          </div>
        </div>

        {/* 🔹 Section: Orders Table */}
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">สินค้า</th>
              <th className="p-2">ผู้ซื้อ</th>
              <th className="p-2">ราคา</th>
              <th className="p-2">วันที่</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{order.productName || order.productId}</td>
                <td className="p-2">{order.buyerName || order.buyerId}</td>
                <td className="p-2">{order.price} ฿</td>
                <td className="p-2">
                  {order.purchaseDate
                    ? new Date(order.purchaseDate).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
