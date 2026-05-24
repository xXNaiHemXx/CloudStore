import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";
import styles from "../styles/Admin.module.css";
import { useUser } from "../context/UserContext";

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
  const [discordRoleIdsText, setDiscordRoleIdsText] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [saving, setSaving] = useState(false);
  const roleIds = discordRoleIdsText
    .split(/[ ,\n]+/)
    .filter(r => r && r.trim() !== "")
    .map(r => r.trim());

  const payload = {
    // ... fields อื่นๆ
    discordRoleIds: roleIds, // ✅ ส่งเป็น Array
  };
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
      setDiscordRoleIdsText(editingItem.discordRoleIds?.join(", ") || "");
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
      
      // ✅ แปลงข้อความ Role IDs เป็น Array
      const roleIds = discordRoleIdsText
        .split(/[ ,\n]+/)
        .filter(r => r && r.trim() !== "")
        .map(r => r.trim());
      
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
        discordRoleIds: roleIds,
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
          
          {/* ✅ ฟิลด์ Discord Role IDs (ใส่หลายตัวได้) */}
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>Discord Role IDs (สำหรับ Auto Role)</label>
            <textarea 
              value={discordRoleIdsText} 
              onChange={(e) => setDiscordRoleIdsText(e.target.value)} 
              className={styles.modalTextarea} 
              rows="3"
              placeholder="ใส่ Role IDs โดยคั่นด้วยคอมม่า หรือเว้นวรรค
เช่น: 123456789012345678, 876543210987654321
หรือ: 123456789012345678 876543210987654321"
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              💡 ใส่ Role IDs หลายตัวได้ (คั่นด้วยคอมม่า หรือเว้นวรรค) ระบบจะเพิ่ม Role อัตโนมัติเมื่อซื้อสินค้า
            </small>
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
  const { userPoints, refreshPoints } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");

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
  const [proposedPoints, setProposedPoints] = useState(0);
  const [changeAmount, setChangeAmount] = useState(1);
  const [userProducts, setUserProducts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleRemoveProduct = async (
  productId,
  index
) => {

  if (
    !confirm(
      "คุณต้องการลบสินค้านี้ออกจากบัญชีผู้ใช้ใช่หรือไม่?"
    )
  ) {
    return;
  }

  try {

    setActionLoading(true);

    const response = await axios.put(
      "/api/user/remove-product",
      {
        userId: selectedUser.id,
        productId,
        index,
      }
    );

    setUserProducts((prev) =>
      prev.filter((_, i) => i !== index)
    );

    alert("✅ ลบสินค้าสำเร็จ");

    console.log(response.data);

  } catch (error) {

    console.error(error);

    alert(
      error.response?.data?.error ||
      "ลบสินค้าไม่สำเร็จ"
    );

  } finally {

    setActionLoading(false);

  }
};

  const handleSavePoints = async () => {
    setActionLoading(true);
    try {
      await axios.put("/api/user/points", {
        userId: selectedUser.id,
        points: Number(proposedPoints),
      });
      
      alert("✅ บันทึกแต้มสำเร็จ!");
      fetchUsers();
      await refreshPoints();
      
      setSelectedUser(null);
      setProposedPoints(0);
      setChangeAmount(1);
    } catch (err) {
      console.error("Save points error:", err);
      alert("❌ ไม่สามารถบันทึกแต้มได้: " + (err.response?.data?.error || err.message));
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
                <span className="profile-text">{userPoints?.toLocaleString() || 0} Point</span>
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
                      {item.discordRoleIds && item.discordRoleIds.length > 0 && (
                        <div className={styles.productRoleId}>
                          <small>🎭 Role IDs: {item.discordRoleIds.join(", ")}</small>
                        </div>
                      )}
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
                <div
                  key={user.id}
                  className={styles.userCard}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className={styles.userInfoLeft}>
                    <div>
                      <h2 className={styles.userName}>{user.name}</h2>
                      <p>💎 {user.points?.toLocaleString() || 0} point</p>
                    </div>
                  </div>
                  <div className={styles.userInfoRight}>
                    <p>{user.email}</p>
                    <p className={styles.userDetailLink}>📋 ดูข้อมูลเพิ่มเติม →</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ========== USER DETAIL MODAL ========== */}
            {selectedUser && (
              <div className={styles.modalOverlay} onClick={() => !actionLoading && setSelectedUser(null)}>
                <div className={styles.userDetailModal} onClick={(e) => e.stopPropagation()}>
                  
                  {/* Close Button */}
                  <button 
                    className={styles.modalCloseBtn}
                    onClick={() => setSelectedUser(null)}
                    disabled={actionLoading}
                  >
                    ✕
                  </button>

                  {/* User Avatar & Name */}
                  <div className={styles.userDetailHeader}>
                    <div className={styles.userAvatarLarge}>
                      {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className={styles.userDetailName}>{selectedUser.name}</h2>
                      <p className={styles.userDetailEmail}>{selectedUser.email}</p>
                    </div>
                  </div>

                  {/* User Info Cards */}
                  <div className={styles.userInfoCards}>
                    <div className={styles.userInfoCard}>
                      <span className={styles.userInfoCardIcon}>🆔</span>
                      <div>
                        <p className={styles.userInfoCardLabel}>Discord ID</p>
                        <p className={styles.userInfoCardValue}>{selectedUser.id}</p>
                      </div>
                    </div>
                    <div className={styles.userInfoCard}>
                      <span className={styles.userInfoCardIcon}>💎</span>
                      <div>
                        <p className={styles.userInfoCardLabel}>Points คงเหลือ</p>
                        <p className={styles.userInfoCardValueHighlight}>
                          {selectedUser.points?.toLocaleString() || 0} Point
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={styles.userDetailDivider}>
                    <span>⚙️ จัดการแต้ม</span>
                  </div>

                  {/* Point Adjustment */}
                  <div className={styles.pointAdjustSection}>
                    <div className={styles.pointAdjustInput}>
                      <label className={styles.pointAdjustLabel}>จำนวนที่ต้องการเพิ่ม/ลด</label>
                      <input
                        type="number"
                        className={styles.pointInput}
                        value={changeAmount}
                        onChange={(e) => setChangeAmount(e.target.value)}
                        min="1"
                        placeholder="ระบุจำนวน Point"
                      />
                    </div>

                    <div className={styles.pointAdjustButtons}>
                      <button 
                        className={styles.pointAddBtn}
                        onClick={() => applyPointChange("add")}
                        disabled={actionLoading}
                      >
                        <span>➕</span> เพิ่มแต้ม
                      </button>
                      <button 
                        className={styles.pointSubtractBtn}
                        onClick={() => applyPointChange("subtract")}
                        disabled={actionLoading}
                      >
                        <span>➖</span> ลบแต้ม
                      </button>
                    </div>

                    {/* Preview New Points */}
                    <div className={styles.pointPreview}>
                      <span className={styles.pointPreviewLabel}>แต้มใหม่</span>
                      <span className={styles.pointPreviewValue}>
                        {proposedPoints?.toLocaleString() || 0} Point
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.pointActionButtons}>
                      <button 
                        className={styles.pointSaveBtn}
                        onClick={handleSavePoints}
                        disabled={actionLoading}
                      >
                        {actionLoading ? '⏳ กำลังบันทึก...' : '✅ ยืนยันการเปลี่ยนแปลง'}
                      </button>
                      <button 
                        className={styles.pointCancelBtn}
                        onClick={() => setSelectedUser(null)}
                        disabled={actionLoading}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={styles.userDetailDivider}>
                    <span>🛒 สินค้าที่ซื้อ ({userProducts.length})</span>
                  </div>

                  {/* Purchased Products */}
                  <div className={styles.purchasedProducts}>
                    {userProducts.length > 0 ? (
                      userProducts.map((item, index) => (
                        <div key={index} className={styles.purchasedProductCard}>
                          <div className={styles.purchasedProductInfo}>
                            <h4 className={styles.purchasedProductName}>{item.name}</h4>
                            <div className={styles.purchasedProductMeta}>
                              <span className={styles.purchasedProductVersion}>📌 v{item.version}</span>
                              <span className={styles.purchasedProductDate}>
                                🗓 {new Date(item.purchaseDate).toLocaleString("th-TH", {
                                  dateStyle: "long",
                                  timeStyle: "short"
                                })}
                              </span>
                            </div>
                            <div className={styles.purchasedProductLinks}>
                              <a 
                                href={item.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={styles.purchasedProductDownload}
                              >
                                📥 ดาวน์โหลด
                              </a>
                              {item.discordRoleIds && item.discordRoleIds.length > 0 && (
                                <span className={styles.purchasedProductRoles}>
                                  🎭 Role: {item.discordRoleIds.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className={styles.purchasedProductRemoveBtn}
                            onClick={() => handleRemoveProduct(item.productId, index)}
                            disabled={actionLoading}
                            title="ลบสินค้านี้"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noProducts}>
                        <span className={styles.noProductsIcon}>📦</span>
                        <p>ยังไม่มีสินค้าที่ซื้อ</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}