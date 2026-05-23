import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [proposedPoints, setProposedPoints] = useState(0);
  const [changeAmount, setChangeAmount] = useState(1);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/user/user");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("โหลดข้อมูลผู้ใช้ล้มเหลว: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async (userId) => {
    try {
      const res = await axios.get(`/api/user/fetch-products?userId=${userId}`);
      setUserProducts(res.data || []);
    } catch (err) {
      console.error("ไม่สามารถโหลดสินค้าผู้ใช้:", err);
      alert("โหลดสินค้าผู้ใช้ล้มเหลว: " + (err.response?.data?.error || err.message));
      setUserProducts([]);
    }
  };
  
  const applyPointChange = (type) => {
    const current = Number(selectedUser.points || 0);
    const amount = Number(changeAmount || 0);
    if (isNaN(amount) || amount < 0) return alert("กรุณากรอกจำนวนแต้มที่ถูกต้อง");

    if (type === "add") {
      setProposedPoints(current + amount);
    } else if (type === "subtract") {
      setProposedPoints(Math.max(0, current - amount));
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!confirm("คุณต้องการลบสินค้านี้ออกจากบัญชีผู้ใช้ใช่หรือไม่?")) return;

    setActionLoading(true);
    try {
      console.log("📌 Sending remove request:", { userId: selectedUser.id, productId });
      
      const res = await axios.put("/api/user/remove-product", {
        userId: selectedUser.id,
        productId,
      });

      console.log("📌 Remove response:", res.data);

      if (res.data.success) {
        // อัปเดตหน้าจอทันที
        setUserProducts((prev) => prev.filter(p => p.productId !== productId));
        
        // อัปเดตสินค้าใน selectedUser ด้วย
        setSelectedUser(prev => ({
          ...prev,
          points: prev.points,
          products: prev.products?.filter(p => p.productId !== productId) || []
        }));
        
        alert("✅ ลบสินค้าสำเร็จ!");
      } else {
        alert("❌ ลบสินค้าไม่สำเร็จ: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("REMOVE PRODUCT ERROR:", err);
      const errorMsg = err.response?.data?.error || err.message;
      alert("❌ ลบสินค้าไม่สำเร็จ: " + errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePoints = async () => {
    setActionLoading(true);
    try {
      console.log("📌 Sending points update:", { userId: selectedUser.id, points: proposedPoints });
      
      const res = await axios.put("/api/user/points", {
        userId: selectedUser.id,
        points: Number(proposedPoints),
      });
      
      console.log("📌 Points update response:", res.data);
      
      if (res.data.success) {
        alert("✅ บันทึกแต้มสำเร็จ!");
        
        // อัปเดตใน users list
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, points: proposedPoints }
            : u
        ));
        
        // อัปเดต selectedUser
        setSelectedUser(prev => ({
          ...prev,
          points: proposedPoints
        }));
        
        // ปิด modal หลังจาก成功
        setTimeout(() => {
          setSelectedUser(null);
          setProposedPoints(0);
          setChangeAmount(1);
        }, 1000);
      } else {
        alert("❌ บันทึกแต้มไม่สำเร็จ: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save points error:", err);
      const errorMsg = err.response?.data?.error || err.message;
      alert("❌ ไม่สามารถบันทึกแต้มได้: " + errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setProposedPoints(user.points || 0);
    setChangeAmount(1);
    await fetchUserProducts(user.id);
  };

  return (
    <div className="main-container">
      <header className="header">
        <section className="headersc">
          <a aria-current="page" href="/" className="headersca">
            <img src="/favicon.ico" className="icon" alt="logo"/>
            <strong className="uppercase">
              <span className="tuppercase">xCloud</span>
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
        <h1 className="text-section-title">👥 ผู้ใช้ทั้งหมด</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>⏳ กำลังโหลด...</div>
        ) : (
          <div className="user-grid">
            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>ไม่มีข้อมูลผู้ใช้</div>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  className="user-card"
                  onClick={() => handleSelectUser(user)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="user-info-left">
                    <div>
                      <h2 className="user-name">{user.name}</h2>
                      <p>💎 {user.points?.toLocaleString() || 0} point</p>
                    </div>
                  </div>
                  <div className="user-info-right">
                    <p>{user.email}</p>
                    <p className="user-detail-link">📋 ดูข้อมูลเพิ่มเติม →</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedUser && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content modal-500" style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h2 className="modal-title">👤 ข้อมูลผู้ใช้</h2>
              <p><strong>ชื่อ:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Discord ID:</strong> {selectedUser.id}</p>
              <p><strong>💎 แต้มปัจจุบัน:</strong> {selectedUser.points?.toLocaleString() || 0} point</p>

              <div className="modal-row">
                <label>จำนวนที่ต้องการเพิ่มหรือลบ:</label>
                <input
                  type="number"
                  className="modal-input"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  min="1"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-green" 
                  onClick={() => applyPointChange("add")}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                >
                  ➕ เพิ่มแต้ม
                </button>
                <button 
                  className="btn-red" 
                  onClick={() => applyPointChange("subtract")}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                >
                  ➖ ลบแต้ม
                </button>
                <button 
                  className="btn-green" 
                  onClick={handleSavePoints}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                >
                  {actionLoading ? '⏳ กำลังบันทึก...' : '✅ ยืนยัน'}
                </button>
                <button 
                  className="btn-gray" 
                  onClick={() => setSelectedUser(null)}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                >
                  ปิด
                </button>
              </div>

              <p style={{ marginTop: '10px', color: '#60a5fa' }}>
                🧾 แต้มใหม่ที่จะบันทึก: <strong>{proposedPoints?.toLocaleString() || 0}</strong>
              </p>

              <hr style={{ margin: '20px 0', borderColor: '#ccc' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🛒 สินค้าที่เคยซื้อ</h3>
              {userProducts.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {userProducts.map((item, index) => (
                    <li key={index} style={{ marginBottom: "12px", borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: 'wrap' }}>
                        <div>
                          <strong>{item.name}</strong> - เวอร์ชัน {item.version} <br />
                          <small style={{ color: "#9ca3af" }}>
                            🗓 ซื้อเมื่อ: {new Date(item.purchaseDate).toLocaleString("th-TH", {
                              dateStyle: "long",
                              timeStyle: "short"
                            })}
                          </small><br />
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>🔗 ดาวน์โหลด</a>
                        </div>
                        <button
                          className="btn-red"
                          onClick={() => handleRemoveProduct(item.productId)}
                          disabled={actionLoading}
                          style={{ marginLeft: "12px", padding: '5px 10px', cursor: 'pointer' }}
                        >
                          {actionLoading ? '⏳' : '🗑 ลบ'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#9ca3af' }}>ไม่มีข้อมูลสินค้า</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}