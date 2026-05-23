import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";
import styles from "../styles/Admin.module.css";

// ==================== PRODUCT MODAL ====================
function ProductModal({ editingItem, onClose, onSaved }) {
  const isEdit = !!editingItem;
  const [itemsname, setItemsname] = useState("");
  const [itemsprice, setItemsprice] = useState("");
  const [itemsimage, setItemsimage] = useState("");
  const [itemsimages, setItemsimages] = useState([""]);
  const [itemsdesc, setItemsdesc] = useState("");
  const [itemstitle, setItemstitle] = useState("");
  const [itemsfile, setItemsfile] = useState("");
  const [itemsurlyoutube, setItemsurlyoutube] = useState("");
  const [itemsversion, setItemsversion] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setItemsname(editingItem.itemsname || "");
      setItemsprice(editingItem.itemsprice || "");
      setItemsimage(editingItem.itemsimage || "");
      setItemsimages(editingItem.itemsimages?.length ? editingItem.itemsimages : [""]);
      setItemsdesc(editingItem.itemsdesc || "");
      setItemstitle(editingItem.itemstitle || "");
      setItemsfile(editingItem.itemsfile || "");
      setItemsurlyoutube(editingItem.itemsurlyoutube || "");
      setItemsversion(editingItem.itemsversion || "");
      setPreviewImage(editingItem.itemsimage || "");
    }
  }, [editingItem]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok) {
        setItemsimage(result.url);
        setPreviewImage(result.url);
      } else {
        alert("Upload failed");
      }
    } catch {
      alert("Upload error");
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...itemsimages];
    newImages[index] = value.trim();
    const filtered = newImages.filter((url) => url !== "");
    if (!filtered.includes("")) filtered.push("");
    setItemsimages(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemsname || !itemsprice) {
      alert("กรุณากรอกชื่อสินค้าและราคาก่อนบันทึก!");
      return;
    }
    setSaving(true);
    try {
      const filteredImages = itemsimages.filter((img) => img.trim() !== "");
      const payload = {
        itemsname,
        itemsprice: parseFloat(itemsprice),
        itemsimage,
        itemsimages: filteredImages,
        itemsdesc,
        itemstitle,
        itemsfile,
        itemsurlyoutube: itemsurlyoutube.trim() || "",
        itemsversion,
      };

      if (isEdit) {
        await axios.put("/api/items", { id: editingItem._id, ...payload });
        alert("แก้ไขสินค้าสำเร็จ!");
      } else {
        await axios.post("/api/items", payload);
        alert("เพิ่มสินค้าสำเร็จ!");
      }
      onSaved();
    } catch (error) {
      console.error("Save error:", error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{isEdit ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ชื่อสินค้า *</label>
            <input value={itemsname} onChange={(e) => setItemsname(e.target.value)} className={styles.modalInput} type="text" required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>หัวข้อสินค้า *</label>
            <input value={itemstitle} onChange={(e) => setItemstitle(e.target.value)} className={styles.modalInput} type="text" required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>เวอร์ชัน *</label>
            <input value={itemsversion} onChange={(e) => setItemsversion(e.target.value)} className={styles.modalInput} type="text" required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ลิ้งค์รูปภาพหลัก *</label>
            <input value={itemsimage} onChange={(e) => { setItemsimage(e.target.value); setPreviewImage(e.target.value); }} className={styles.modalInput} type="text" required />
          </div>
          <input type="file" accept="image/*" onChange={handleUpload} />
          {previewImage && <img src={previewImage} alt="preview" className={styles.previewImage} />}
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ลิ้งค์รูปเพิ่มเติม</label>
            <div className={styles.modalImages}>
              {itemsimages.map((img, index) => (
                <div key={index} className={styles.imageInputContainer}>
                  <input value={img} onChange={(e) => handleImageChange(index, e.target.value)} className={styles.modalInput} type="text" placeholder={`ลิ้งค์รูปที่ ${index + 1}`} />
                  {img && <img src={img} alt={`เพิ่มเติม ${index + 1}`} className={styles.previewImage} />}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>รายละเอียด *</label>
            <textarea value={itemsdesc} onChange={(e) => setItemsdesc(e.target.value)} className={styles.modalTextarea} required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>YouTube Video ID</label>
            <input value={itemsurlyoutube} onChange={(e) => setItemsurlyoutube(e.target.value.trim())} className={styles.modalInput} type="text" />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ลิ้งไฟล์ *</label>
            <input value={itemsfile} onChange={(e) => setItemsfile(e.target.value)} className={styles.modalInput} type="text" required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ราคาสินค้า *</label>
            <input value={itemsprice} onChange={(e) => setItemsprice(e.target.value)} className={styles.modalInput} type="number" required />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Close</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
export default function Admin() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userPoints, setUserPoints] = useState(0);

  // --- Dashboard State ---
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });

  // --- Orders State ---
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [topMod, setTopMod] = useState("-");

  // --- Products State ---
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- Uploads State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  // --- Users State ---
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPoints, setEditPoints] = useState(0);
  const [proposedPoints, setProposedPoints] = useState(0);
  const [changeAmount, setChangeAmount] = useState(1);
  const [userProducts, setUserProducts] = useState([]);

  // --- Fetch User Points ---
  useEffect(() => {
    if (session) {
      axios.get(`/api/user?discordId=${session.user.id}`)
        .then((res) => setUserPoints(res.data.points || 0))
        .catch(() => {});
    }
  }, [session]);

  // --- Fetch Dashboard Stats ---
  useEffect(() => {
    if (!session || activeTab !== "dashboard") return;
    Promise.all([
      axios.get("/api/items"),
      axios.get("/api/user/count"),
      axios.get("/api/user/purchase"),
    ]).then(([itemsRes, usersRes, ordersRes]) => {
      const items = itemsRes.data || [];
      const orders = ordersRes.data || [];
      setStats({
        products: items.length,
        users: usersRes.data.count || 0,
        orders: orders.length,
        revenue: orders.reduce((sum, o) => sum + (o.price || 0), 0),
      });
    }).catch(console.error);
  }, [session, activeTab]);

  // --- Fetch Orders ---
  useEffect(() => {
    if (!session || activeTab !== "orders") return;
    axios.get("/api/user/purchase").then((res) => {
      const data = res.data || [];
      setOrders(data);
      setTotalOrders(data.length);
      setTotalRevenue(data.reduce((sum, o) => sum + (o.price || 0), 0));

      const modStats = {};
      data.forEach((order) => {
        const name = order.productName || "unknown";
        if (!modStats[name]) modStats[name] = { count: 1, lastPurchased: order.purchaseDate ? new Date(order.purchaseDate) : null };
        else {
          modStats[name].count += 1;
          const date = order.purchaseDate ? new Date(order.purchaseDate) : null;
          if (date && modStats[name].lastPurchased && date > modStats[name].lastPurchased) {
            modStats[name].lastPurchased = date;
          }
        }
      });

      const sorted = Object.entries(modStats).sort((a, b) => b[1].count - a[1].count);
      if (sorted.length > 0) {
        const [name, stat] = sorted[0];
        const formatted = stat.lastPurchased instanceof Date && !isNaN(stat.lastPurchased)
          ? stat.lastPurchased.toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })
          : "-";
        setTopMod(`${name} (ล่าสุด: ${formatted})`);
      }
    }).catch(console.error);
  }, [session, activeTab]);

  // --- Fetch Products ---
  const fetchItems = async () => {
    const res = await axios.get("/api/items");
    setItems(res.data || []);
  };
  useEffect(() => {
    if (activeTab === "products") fetchItems();
  }, [activeTab]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!confirm("ยืนยันการลบสินค้า?")) return;
    await axios.delete(`/api/items?id=${id}`);
    fetchItems();
  };
  const handleSaved = () => {
    setShowModal(false);
    setEditingItem(null);
    fetchItems();
  };

  // --- Fetch Uploads ---
  const fetchImages = async () => {
    try {
      const res = await axios.get("/api/uploads");
      setImages(res.data || []);
    } catch { alert("ไม่สามารถโหลดรูปภาพได้"); }
  };
  useEffect(() => {
    if (activeTab === "uploads") fetchImages();
  }, [activeTab]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    setUploading(true);
    try {
      await axios.post("/api/upload", formData);
      alert("อัปโหลดสำเร็จ");
      setSelectedFile(null);
      fetchImages();
    } catch { alert("เกิดข้อผิดพลาดในการอัปโหลดรูป"); }
    finally { setUploading(false); }
  };

  // --- Fetch Users ---
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/user/user");
      setUsers(res.data || []);
    } catch { alert("โหลดข้อมูลผู้ใช้ล้มเหลว"); }
  };
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  const fetchUserProducts = async (userId) => {
    try {
      const res = await axios.get(`/api/user/fetch-products?userId=${userId}`);
      setUserProducts(res.data || []);
    } catch { setUserProducts([]); }
  };

  const applyPointChange = (type) => {
    const current = Number(selectedUser.points || 0);
    const amount = Number(changeAmount || 0);
    if (isNaN(amount) || amount < 0) return alert("กรุณากรอกจำนวนแต้มที่ถูกต้อง");
    if (type === "add") setProposedPoints(current + amount);
    else setProposedPoints(Math.max(0, current - amount));
  };

  const handleRemoveProduct = async (productId) => {
    if (!confirm("คุณต้องการลบสินค้านี้ออกจากบัญชีผู้ใช้ใช่หรือไม่?")) return;
    try {
      await axios.put("/api/user/remove-product", { userId: selectedUser.id, productId });
      setUserProducts((prev) => prev.filter(p => p.productId !== productId));
    } catch { alert("ลบสินค้าไม่สำเร็จ"); }
  };

  const handleSavePoints = async () => {
    try {
      await axios.put("/api/user/points", { userId: selectedUser.id, points: Number(proposedPoints) });
      fetchUsers();
      setSelectedUser(null);
      setChangeAmount(1);
    } catch { alert("ไม่สามารถบันทึกแต้มได้"); }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setEditPoints(user.points || 0);
    setProposedPoints(user.points || 0);
    setChangeAmount(1);
    await fetchUserProducts(user.id);
  };

  // --- Tabs Config ---
  const tabs = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "orders", label: "🧾 Orders" },
    { key: "products", label: "🧱 Products" },
    { key: "uploads", label: "🖼 Uploads" },
    { key: "users", label: "👥 Users" },
  ];

  return (
    <div className="main-container">
      <Head>
        <title>xCloud Store Admin</title>
      </Head>

      {/* ========== HEADER ========== */}
      <header className="header">
        <section className="headersc">
          <Link href="/" className="headersca">
            <img src="/favicon.ico" className="icon" alt="logo" />
            <strong className="uppercase">
              <span className="tuppercase">xCloud</span> Store
            </strong>
          </Link>
          <div className="header-links">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`headertext ${activeTab === tab.key ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab.key ? '#818cf8' : '#d1d5db' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="profile-container">
            {session ? (
              <Link href="/profile" className="items-centerpics">
                <img src={session.user.image} alt="Profile" className="profile-pic" />
                <span className="profile-text">{userPoints} Point</span>
              </Link>
            ) : (
              <button onClick={() => signIn("discord")} className="header-discord-login">
                <img src="/images/discord.png" className="header-discord-icon" alt="discord" />
                <span className="discord-text-login">login</span>
              </button>
            )}
          </div>
          <div className="header-menu-icon" onClick={() => document.querySelector('.header-links').classList.toggle('active')}>
            <i className="fas fa-bars"></i>
          </div>
        </section>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className={styles.container}>

        {/* Tab Navigation (Desktop) */}
        <div className={styles.adminTabs}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.adminTab} ${activeTab === tab.key ? styles.adminTabActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>📊 Admin Dashboard</h1>
            </section>

            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconProducts}`}>📦</div>
                <div className={styles.statInfo}>
                  <h3>{stats.products}</h3>
                  <p>Products</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconOrders || ''}`}>🧾</div>
                <div className={styles.statInfo}>
                  <h3>{stats.orders}</h3>
                  <p>Orders</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconRevenue || ''}`}>👥</div>
                <div className={styles.statInfo}>
                  <h3>{stats.users}</h3>
                  <p>Users</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconRevenue || ''}`}>💰</div>
                <div className={styles.statInfo}>
                  <h3>฿{stats.revenue.toLocaleString()}</h3>
                  <p>Revenue</p>
                </div>
              </div>
            </div>

            <div className={styles.adminMenuGrid}>
              <button onClick={() => setActiveTab("products")} className={styles.adminMenuBtn}>🧱 จัดการสินค้า (MOD)</button>
              <button onClick={() => setActiveTab("uploads")} className={styles.adminMenuBtn}>🖼 จัดการรูปภาพ</button>
              <button onClick={() => setActiveTab("orders")} className={styles.adminMenuBtn}>🧾 คำสั่งซื้อ</button>
              <button onClick={() => setActiveTab("users")} className={styles.adminMenuBtn}>👥 ผู้ใช้งาน</button>
            </div>
          </>
        )}

        {/* ==================== ORDERS ==================== */}
        {activeTab === "orders" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>🧾 รายการคำสั่งซื้อ</h1>
            </section>

            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <h3>฿{totalRevenue.toLocaleString()}</h3>
                  <p>💰 ยอดขายรวม</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <h3>{totalOrders} รายการ</h3>
                  <p>📦 จำนวนคำสั่งซื้อ</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statInfo}>
                  <h3 style={{ fontSize: '1rem' }}>{topMod}</h3>
                  <p>🏆 Mod ขายดีที่สุด</p>
                </div>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th>ผู้ซื้อ</th>
                    <th>ราคา</th>
                    <th>วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={i}>
                      <td>{order.productName || order.productId}</td>
                      <td>{order.buyerName || order.buyerId}</td>
                      <td>{order.price} ฿</td>
                      <td>
                        {order.purchaseDate
                          ? new Date(order.purchaseDate).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================== PRODUCTS ==================== */}
        {activeTab === "products" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>🧱 จัดการสินค้า (MOD)</h1>
              <button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.addButton}>
                + เพิ่มสินค้า
              </button>
            </section>

            {showModal && (
              <ProductModal editingItem={editingItem} onClose={() => { setShowModal(false); setEditingItem(null); }} onSaved={handleSaved} />
            )}

            <div className={styles.productGrid}>
              {items.length === 0 ? (
                <div className={styles.emptyState}><p>ยังไม่มีสินค้าในระบบ</p></div>
              ) : (
                items.map((item) => (
                  <div key={item._id} className={styles.productCard}>
                    <img src={item.itemsimage} alt={item.itemsname} className={styles.productImage} />
                    <div className={styles.cardBody}>
                      <h3 className={styles.productName}>{item.itemsname}</h3>
                      <p className={styles.productTitle}>{item.itemstitle}</p>
                      <p className={styles.productDesc}>{item.itemsdesc}</p>
                      <div className={styles.productMeta}>
                        <span className={styles.productPrice}>฿{item.itemsprice}</span>
                        <span className={styles.productVersion}>v{item.itemsversion}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button onClick={() => handleEdit(item)} className={styles.editBtn}>✏️ แก้ไข</button>
                      <button onClick={() => handleDelete(item._id)} className={styles.deleteBtn}>🗑️ ลบ</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ==================== UPLOADS ==================== */}
        {activeTab === "uploads" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>🖼 อัปโหลดรูป / ไฟล์</h1>
            </section>

            <div className={styles.uploadSection}>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <button onClick={handleUpload} disabled={uploading} className={styles.addButton}>
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
              </button>
            </div>

            <div className={styles.galleryGrid}>
              {images.map((url) => (
                <div key={url} className={styles.galleryItem}>
                  <img src={url} alt="uploaded" className={styles.galleryThumb} />
                  <input type="text" value={url} readOnly className={styles.galleryUrl} onClick={(e) => e.target.select()} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== USERS ==================== */}
        {activeTab === "users" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>👥 ผู้ใช้ทั้งหมด</h1>
            </section>

            <div className={styles.userGrid}>
              {users.map(user => (
                <div key={user.id} className={styles.userCard} onClick={() => handleSelectUser(user)}>
                  <div className={styles.userInfoLeft}>
                    <div>
                      <h2 className={styles.userName}>{user.name}</h2>
                      <p>{user.points} point</p>
                    </div>
                  </div>
                  <div className={styles.userInfoRight}>
                    <p>{user.email}</p>
                    <p className={styles.userDetailLink}>ดูข้อมูลเพิ่มเติม</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedUser && (
              <div className={styles.modalOverlay}>
                <div className={`${styles.modalContent} ${styles.modalWide}`}>
                  <h2 className={styles.modalTitle}>👤 ข้อมูลผู้ใช้</h2>
                  <p><strong>ชื่อ:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Discord ID:</strong> {selectedUser.id}</p>
                  <p><strong>แต้มปัจจุบัน:</strong> {selectedUser.points}</p>

                  <div className={styles.modalRow}>
                    <label>จำนวนที่ต้องการเพิ่มหรือลบ:</label>
                    <input type="number" className={styles.modalInput} value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} />
                  </div>

                  <div className={styles.modalActions}>
                    <button className={styles.editBtn} onClick={() => applyPointChange("add")}>➕ เพิ่มแต้ม</button>
                    <button className={styles.deleteBtn} onClick={() => applyPointChange("subtract")}>➖ ลบแต้ม</button>
                    <button className={styles.submitBtn} onClick={handleSavePoints}>✅ ยืนยัน</button>
                    <button className={styles.cancelBtn} onClick={() => setSelectedUser(null)}>ปิด</button>
                  </div>

                  <p style={{ marginTop: '10px', color: '#60a5fa' }}>
                    🧾 แต้มใหม่: <strong>{proposedPoints}</strong>
                  </p>

                  <hr />
                  <h3>🛒 สินค้าที่เคยซื้อ</h3>
                  {userProducts.length > 0 ? (
                    <ul>
                      {userProducts.map((item, index) => (
                        <li key={index} style={{ marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong>{item.name}</strong> - v{item.version}<br />
                              <small>🗓 {new Date(item.purchaseDate).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}</small><br />
                              <a href={item.fileUrl} target="_blank" style={{ color: "#3b82f6" }}>🔗 ดาวน์โหลด</a>
                            </div>
                            <button className={styles.deleteBtn} onClick={() => handleRemoveProduct(item.productId)}>🗑 ลบ</button>
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
          </>
        )}

      </main>
    </div>
  );
}