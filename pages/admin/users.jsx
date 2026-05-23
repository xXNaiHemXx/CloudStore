import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPoints, setEditPoints] = useState(0);
  const [proposedPoints, setProposedPoints] = useState(0);
  const [changeAmount, setChangeAmount] = useState(1);
  const [userProducts, setUserProducts] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/user/user");
      setUsers(res.data || []);
    } catch (err) {
      alert("โหลดข้อมูลผู้ใช้ล้มเหลว");
    }
  };

  const fetchUserProducts = async (userId) => {
    try {
      const res = await axios.get(`/api/user/fetch-products?userId=${userId}`);
      setUserProducts(res.data || []);
    } catch (err) {
      console.error("ไม่สามารถโหลดสินค้าผู้ใช้:", err);
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
  if (!confirm("คุณต้องการลบสินค้านี้ออกจากบัญชีผู้ใช่ใช่หรือไม่?")) return;

  try {
    const res = await axios.put("/api/user/remove-product", {
      userId: selectedUser.id,
      productId,
    });

    if (res.data.success) {
      // อัปเดตหน้าจอทันที
      setUserProducts((prev) => prev.filter(p => p.productId !== productId));
    }
  } catch (err) {
    alert("ลบสินค้าไม่สำเร็จ");
    console.error("REMOVE PRODUCT ERROR:", err);
  }
};

  const handleSavePoints = async () => {
    try {
      await axios.put("/api/user/points", {
        userId: selectedUser.id,
        points: Number(proposedPoints),
      });
      fetchUsers();
      setSelectedUser(null);
      setEditPoints(0);
      setProposedPoints(0);
      setChangeAmount(1);
    } catch (err) {
      alert("ไม่สามารถบันทึกแต้มได้");
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setEditPoints(user.points || 0);
    setProposedPoints(user.points || 0);
    setChangeAmount(1);
    await fetchUserProducts(user.id);
  };

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
        <h1 className="text-section-title">👥 ผู้ใช้ทั้งหมด</h1>

        <div className="user-grid">
          {users.map(user => (
            <div
              key={user.id}
              className="user-card"
              onClick={() => handleSelectUser(user)}
            >
              <div className="user-info-left">
                <div>
                  <h2 className="user-name">{user.name}</h2>
                  <p>{user.points} point</p>
                </div>
              </div>
              <div className="user-info-right">
                <p>{user.email}</p>
                <p className="user-detail-link">ดูข้อมูลเพิ่มเติม</p>
              </div>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content modal-500">
              <h2 className="modal-title">👤 ข้อมูลผู้ใช้</h2>
              <p><strong>ชื่อ:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Discord ID:</strong> {selectedUser.id}</p>
              <p><strong>แต้มปัจจุบัน:</strong> {selectedUser.points}</p>

              <div className="modal-row">
                <label>จำนวนที่ต้องการเพิ่มหรือลบ:</label>
                <input
                  type="number"
                  className="modal-input"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-green" onClick={() => applyPointChange("add")}>➕ เพิ่มแต้ม</button>
                <button className="btn-red" onClick={() => applyPointChange("subtract")}>➖ ลบแต้ม</button>
                <button className="btn-green" onClick={handleSavePoints}>✅ ยืนยัน</button>
                <button className="btn-gray" onClick={() => setSelectedUser(null)}>ปิด</button>
              </div>

              <p style={{ marginTop: '10px', color: '#60a5fa' }}>
                🧾 แต้มใหม่ที่จะบันทึก: <strong>{proposedPoints}</strong>
              </p>

              <hr style={{ margin: '20px 0', borderColor: '#ccc' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🛒 สินค้าที่เคยซื้อ</h3>
              {userProducts.length > 0 ? (
                <ul>
                  {userProducts.map((item, index) => (
                    <li key={index} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{item.name}</strong> - เวอร์ชัน {item.version} <br />
                          <small style={{ color: "#9ca3af" }}>
                            🗓 ซื้อเมื่อ: {new Date(item.purchaseDate).toLocaleString("th-TH", {
                              dateStyle: "long",
                              timeStyle: "short"
                            })}
                          </small><br />
                          <a href={item.fileUrl} target="_blank" style={{ color: "#3b82f6" }}>🔗 ดาวน์โหลด</a>
                        </div>

                        <button
                          className="btn-red"
                          onClick={() => handleRemoveProduct(item.productId)}
                          style={{ marginLeft: "12px" }}
                        >
                          🗑 ลบ
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>ไม่มีข้อมูลสินค้า</p>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
