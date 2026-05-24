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
  // ใน ProductModal function
  const [uploadingFile, setUploadingFile] = useState(false);
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
// ฟังก์ชันอัปโหลดไฟล์ Mod
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ ตรวจสอบขนาดไฟล์ (500MB สำหรับ Mod)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`❌ ไฟล์ใหญ่เกินไป!\n\nขนาดไฟล์: ${fileSizeMB}MB\nขนาดสูงสุด: 500MB\n\n💡 แนะนำ:\n- แบ่งไฟล์เป็นส่วนๆ\n- บีบอัดไฟล์ให้เล็กลง\n- ใช้ลิงก์ภายนอกแทน (Google Drive, Dropbox)`);
      return;
    }

    // ✅ แสดง progress
    setUploadingFile(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/admin/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // ✅ 5 นาที timeout
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 อัปโหลด: ${percent}%`);
          // คุณสามารถเพิ่ม progress bar ได้ที่นี่
        },
      });

      if (res.data.success) {
        setItemsfile(res.data.url);
        alert("✅ อัปโหลดไฟล์สำเร็จ!");
      }
    } catch (error) {
      console.error(error);
      
      if (error.code === 'ECONNABORTED') {
        alert("❌ การอัปโหลดใช้เวลานานเกินไป (เกิน 5 นาที)\n\n💡 แนะนำ: ใช้ลิงก์ภายนอกแทน");
      } else {
        alert("❌ อัปโหลดไม่สำเร็จ: " + (error.response?.data?.error || error.message));
      }
    } finally {
      setUploadingFile(false);
    }
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
          <input type="file" accept="image/*" onChange={handleUpload} className={styles.modalFileInput} />
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
          {/* ✅ เพิ่มส่วนอัปโหลดไฟล์ */}
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>หรืออัปโหลดไฟล์ (zip, rar, 7z)</label>
            <input 
              type="file" 
              accept=".zip,.rar,.7z,.exe,.msi" 
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className={styles.modalFileInput}
            />
            {uploadingFile && (
              <div style={{ marginTop: "8px", color: "#f59e0b" }}>
                ⏳ กำลังอัปโหลด... กรุณารอสักครู่
              </div>
            )}
            {itemsfile && !uploadingFile && (
              <div style={{ marginTop: "8px", fontSize: "0.8rem", color: "#10b981" }}>
                ✅ ไฟล์อัปโหลดแล้ว: <a href={itemsfile} target="_blank" rel="noopener noreferrer">ดูไฟล์</a>
              </div>
            )}
            <small style={{ color: "#6b7280", fontSize: "0.7rem", display: "block", marginTop: "4px" }}>
              💡 รองรับไฟล์ .zip, .rar, .7z ขนาดสูงสุด 100MB
            </small>
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ราคาสินค้า *</label>
            <input value={itemsprice} onChange={(e) => setItemsprice(e.target.value)} className={styles.modalInput} type="number" required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>Discord Role IDs (สำหรับ Auto Role)</label>
            <textarea 
              value={discordRoleIdsText} 
              onChange={(e) => setDiscordRoleIdsText(e.target.value)} 
              className={styles.modalTextarea} 
              rows="3"
              placeholder="ใส่ Role IDs โดยคั่นด้วยคอมม่า หรือเว้นวรรค"
            />
            <small className={styles.modalHint}>
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

// ==================== VERSION UPDATE MODAL ====================
function VersionUpdateModal({ product, onClose, onUpdated }) {
  const [newVersion, setNewVersion] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newVersion || !newFileUrl) {
      alert("กรุณากรอกเวอร์ชันใหม่และลิงก์ไฟล์");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/update-version", {
        productId: product._id,
        newVersion,
        newFileUrl,
        changelog
      });
      if (res.data.success) {
        alert(`✅ อัปเดตเวอร์ชันสำเร็จ! แจ้งเตือนผู้ใช้ ${res.data.notifiedUsers} คน`);
        onUpdated();
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("อัปเดตไม่สำเร็จ: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>📦 อัปเดตเวอร์ชัน: {product.itemsname}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>เวอร์ชันปัจจุบัน</label>
            <input type="text" value={product.itemsversion} disabled className={styles.modalInput} />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>เวอร์ชันใหม่ *</label>
            <input type="text" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className={styles.modalInput} placeholder="เช่น 2.0.0" required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ลิงก์ไฟล์ใหม่ *</label>
            <input type="url" value={newFileUrl} onChange={(e) => setNewFileUrl(e.target.value)} className={styles.modalInput} placeholder="https://..." required />
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>รายการอัปเดต (Changelog)</label>
            <textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} className={styles.modalTextarea} rows="4" placeholder="- แก้ไขบัค XYZ&#10;- เพิ่มฟีเจอร์ใหม่" />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "กำลังอัปเดต..." : "📤 อัปเดตเวอร์ชัน"}
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
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedProductForVersion, setSelectedProductForVersion] = useState(null);

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
  const handleVersionUpdate = (item) => {
    setSelectedProductForVersion(item);
    setShowVersionModal(true);
  };
  const handleVersionUpdated = () => {
    fetchItems();
  };
  // --- Topups State ---
  const [topups, setTopups] = useState([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  // --- Fetch Topups History ---
  const fetchTopups = async () => {
    setLoadingTopups(true);
    try {
      const res = await axios.get("/api/admin/topups");
      setTopups(res.data || []);
    } catch (error) {
      console.error("Error fetching topups:", error);
      alert("โหลดประวัติเติมเงินไม่สำเร็จ");
    } finally {
      setLoadingTopups(false);
    }
  };

  useEffect(() => {
    if (activeTab === "topups") {
      fetchTopups();
    }
  }, [activeTab]);
  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
        return { class: "statusSuccess", text: "✅ สำเร็จ" };
      case "pending":
        return { class: "statusPending", text: "⏳ รอตรวจสอบ" };
      case "error":
        return { class: "statusFailed", text: "❌ ล้มเหลว" };
      case "duplicate":
        return { class: "statusDuplicate", text: "⚠️ ซ้ำ" };
      default:
        return { class: "statusPending", text: "⏳ รอตรวจสอบ" };
    }
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

  const handleRemoveProduct = async (productId, index) => {
    if (!confirm("คุณต้องการลบสินค้านี้ออกจากบัญชีผู้ใช้ใช่หรือไม่?")) return;
    setActionLoading(true);
    try {
      await axios.put("/api/user/remove-product", { userId: selectedUser.id, productId, index });
      setUserProducts((prev) => prev.filter((_, i) => i !== index));
      alert("✅ ลบสินค้าสำเร็จ");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "ลบสินค้าไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePoints = async () => {
    setActionLoading(true);
    try {
      await axios.put("/api/user/points", { userId: selectedUser.id, points: Number(proposedPoints) });
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

  const tabs = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "orders", label: "🧾 Orders" },
    { key: "products", label: "🧱 Products" },
    { key: "topups", label: "💰 เติมเงิน" },  // ✅ เพิ่ม Tab ใหม่
    { key: "uploads", label: "📁 Uploads" },
    { key: "users", label: "👥 Users" },
  ];

  return (
    <div className="main-container">
      <Head>
        <title>xCloud Studio Admin</title>
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

        {/* Tab Navigation */}
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
              {[
                { icon: "📦", value: stats.products, label: "Products", className: styles.statIconProducts },
                { icon: "🧾", value: stats.orders, label: "Orders", className: styles.statIconOrders },
                { icon: "👥", value: stats.users, label: "Users", className: styles.statIconRevenue },
                { icon: "💰", value: `฿${stats.revenue.toLocaleString()}`, label: "Revenue", className: styles.statIconRevenue },
              ].map((stat, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={`${styles.statIcon} ${stat.className}`}>{stat.icon}</div>
                  <div className={styles.statInfo}>
                    <h3>{stat.value}</h3>
                    <p>{stat.label}</p>
                  </div>
                </div>
              ))}
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
              {[
                { value: `฿${totalRevenue.toLocaleString()}`, label: "💰 ยอดขายรวม" },
                { value: `${totalOrders} รายการ`, label: "📦 จำนวนคำสั่งซื้อ" },
                { value: topMod, label: "🏆 Mod ขายดีที่สุด", small: true },
              ].map((s, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statInfo}>
                    <h3 style={s.small ? { fontSize: '0.9rem' } : {}}>{s.value}</h3>
                    <p>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr><th>สินค้า</th><th>ผู้ซื้อ</th><th>ราคา</th><th>วันที่</th></tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={i}>
                      <td>{order.productName || order.productId}</td>
                      <td>{order.buyerName || order.buyerId}</td>
                      <td>{order.price} ฿</td>
                      <td>{order.purchaseDate ? new Date(order.purchaseDate).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {/* ==================== TOPUPS HISTORY ==================== */}
        {activeTab === "topups" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>💰 ประวัติการเติมเงิน</h1>
            </section>

            {loadingTopups ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>กำลังโหลด...</p>
              </div>
            ) : topups.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>ผู้ใช้</th>
                      <th>จำนวนเงิน</th>
                      <th>Reference</th>
                      <th>สลิป</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topups.map((topup) => {
                      const statusInfo = getStatusBadge(topup.status);
                      return (
                        <tr key={topup._id}>
                          <td>
                            {new Date(topup.createdAt).toLocaleString("th-TH", {
                              dateStyle: "medium",
                              timeStyle: "short"
                            })}
                          </td>
                          <td>
                            <strong>{topup.userName}</strong>
                            <br />
                            <small style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                              ID: {topup.userId}
                            </small>
                          </td>
                          <td>฿{topup.amount?.toLocaleString()}</td>
                          <td>
                            <small style={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
                              {topup.transRef || "-"}
                            </small>
                          </td>
                          <td>
                            {topup.slipUrl ? (
                              <a 
                                href={topup.slipUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.slipLink}
                              >
                                🔗 ดูสลิป
                              </a>
                            ) : (
                              <span style={{ color: "#6b7280" }}>ไม่มีสลิป</span>
                            )}
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[statusInfo.class]}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {/* ==================== PRODUCTS ==================== */}
        {activeTab === "products" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>🧱 จัดการสินค้า (MOD)</h1>
              <div className={styles.headerButtons}>
                <button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.addButton}>
                  + เพิ่มสินค้า
                </button>
              </div>
            </section>

            {showModal && (
              <ProductModal editingItem={editingItem} onClose={() => { setShowModal(false); setEditingItem(null); }} onSaved={handleSaved} />
            )}
            {showVersionModal && selectedProductForVersion && (
              <VersionUpdateModal 
                product={selectedProductForVersion} 
                onClose={() => { setShowVersionModal(false); setSelectedProductForVersion(null); }} 
                onUpdated={handleVersionUpdated} 
              />
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
                      <button onClick={() => handleVersionUpdate(item)} className={styles.versionBtn}>📦 อัปเดต</button>
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

            {/* Upload Area */}
            <div className={styles.uploadArea}>
              
              {/* Upload Box */}
              <div className={styles.uploadBoxContainer}>
                <label className={`${styles.uploadDropZone} ${uploading ? styles.uploading : ''} ${selectedFile ? styles.hasFile : ''}`}>
                  {uploading ? (
                    <>
                      <span className={styles.uploadIcon}>⏳</span>
                      <span className={styles.uploadText}>กำลังอัปโหลด...</span>
                      <div className={styles.uploadProgressBar}>
                        <div className={styles.uploadProgressFill}></div>
                      </div>
                    </>
                  ) : selectedFile ? (
                    <>
                      <span className={styles.uploadIcon}>✅</span>
                      <span className={styles.uploadText}>ไฟล์พร้อมอัปโหลด</span>
                      <span className={styles.uploadFileName}>{selectedFile.name}</span>
                      <span className={styles.uploadFileSize}>
                        ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={styles.uploadIcon}>📤</span>
                      <span className={styles.uploadText}>ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</span>
                      <span className={styles.uploadHint}>รองรับไฟล์รูปภาพ, zip, rar, 7z (สูงสุด 500MB)</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    disabled={uploading}
                    accept="image/*,.zip,.rar,.7z,.exe,.msi"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className={styles.uploadActions}>
                <button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading} 
                  className={styles.uploadBtn}
                >
                  {uploading ? '⏳ กำลังอัปโหลด...' : '🚀 อัปโหลดไฟล์'}
                </button>
                
                {selectedFile && !uploading && (
                  <button 
                    onClick={() => setSelectedFile(null)} 
                    className={styles.uploadCancelBtn}
                  >
                    ✕ ยกเลิก
                  </button>
                )}
              </div>

              {/* Upload Info */}
              <div className={styles.uploadInfo}>
                <span>💡 <strong>เคล็ดลับ:</strong> สำหรับไฟล์ขนาดใหญ่ (&gt;500MB) แนะนำให้ใช้ลิงก์ภายนอก เช่น Google Drive, Dropbox, MEGA</span>
              </div>
            </div>

            {/* Gallery Grid */}
            {images.length > 0 && (
              <>
                <div className={styles.sectionDivider}>
                  <span>📁 ไฟล์ที่อัปโหลด ({images.length})</span>
                </div>
                
                <div className={styles.galleryGrid}>
                  {images.map((url) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                    const fileName = url.split('/').pop();
                    
                    return (
                      <div key={url} className={styles.galleryItem}>
                        {isImage ? (
                          <div className={styles.galleryImageWrapper}>
                            <img src={url} alt={fileName} className={styles.galleryThumb} loading="lazy" />
                          </div>
                        ) : (
                          <div className={styles.galleryFileWrapper}>
                            <span className={styles.galleryFileIcon}>📦</span>
                            <span className={styles.galleryFileName}>{fileName}</span>
                          </div>
                        )}
                        
                        <div className={styles.galleryItemInfo}>
                          <input 
                            type="text" 
                            value={url} 
                            readOnly 
                            className={styles.galleryUrl} 
                            onClick={(e) => e.target.select()} 
                          />
                          <div className={styles.galleryActions}>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                alert('✅ คัดลอกลิงก์แล้ว!');
                              }}
                              className={styles.galleryCopyBtn}
                              title="คัดลอกลิงก์"
                            >
                              📋
                            </button>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={styles.galleryOpenBtn}
                              title="เปิดในแท็บใหม่"
                            >
                              🔗
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty State */}
            {images.length === 0 && !uploading && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📁</span>
                <p className={styles.emptyTitle}>ยังไม่มีไฟล์ที่อัปโหลด</p>
                <p className={styles.emptyText}>เลือกไฟล์แล้วคลิกอัปโหลดเพื่อเริ่มต้น</p>
              </div>
            )}
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
                    <h2 className={styles.userNameCard}>{user.name}</h2>
                    <p>💎 {user.points?.toLocaleString() || 0} point</p>
                  </div>
                  <div className={styles.userInfoRight}>
                    <p>{user.email}</p>
                    <p className={styles.userDetailLink}>📋 ดูข้อมูลเพิ่มเติม →</p>
                  </div>
                </div>
              ))}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
              <div className={styles.modalOverlay} onClick={() => !actionLoading && setSelectedUser(null)}>
                <div className={styles.userDetailModal} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.modalCloseBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}>✕</button>
                  
                  <div className={styles.userDetailHeader}>
                    <div className={styles.userAvatarLarge}>{selectedUser.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <h2 className={styles.userDetailName}>{selectedUser.name}</h2>
                      <p className={styles.userDetailEmail}>{selectedUser.email}</p>
                    </div>
                  </div>

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
                        <p className={styles.userInfoCardValueHighlight}>{selectedUser.points?.toLocaleString() || 0} Point</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.userDetailDivider}><span>⚙️ จัดการแต้ม</span></div>
                  
                  <div className={styles.pointAdjustSection}>
                    <div className={styles.pointAdjustInput}>
                      <label className={styles.pointAdjustLabel}>จำนวนที่ต้องการเพิ่ม/ลด</label>
                      <input type="number" className={styles.pointInput} value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} min="1" />
                    </div>
                    <div className={styles.pointAdjustButtons}>
                      <button className={styles.pointAddBtn} onClick={() => applyPointChange("add")} disabled={actionLoading}>➕ เพิ่มแต้ม</button>
                      <button className={styles.pointSubtractBtn} onClick={() => applyPointChange("subtract")} disabled={actionLoading}>➖ ลบแต้ม</button>
                    </div>
                    <div className={styles.pointPreview}>
                      <span className={styles.pointPreviewLabel}>แต้มใหม่</span>
                      <span className={styles.pointPreviewValue}>{proposedPoints?.toLocaleString() || 0} Point</span>
                    </div>
                    <div className={styles.pointActionButtons}>
                      <button className={styles.pointSaveBtn} onClick={handleSavePoints} disabled={actionLoading}>
                        {actionLoading ? '⏳ กำลังบันทึก...' : '✅ ยืนยัน'}
                      </button>
                      <button className={styles.pointCancelBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}>ยกเลิก</button>
                    </div>
                  </div>

                  <div className={styles.userDetailDivider}><span>🛒 สินค้าที่ซื้อ ({userProducts.length})</span></div>
                  
                  <div className={styles.purchasedProducts}>
                    {userProducts.length > 0 ? (
                      userProducts.map((item, index) => (
                        <div key={index} className={styles.purchasedProductCard}>
                          <div className={styles.purchasedProductInfo}>
                            <h4 className={styles.purchasedProductName}>{item.name}</h4>
                            <div className={styles.purchasedProductMeta}>
                              <span className={styles.purchasedProductVersion}>📌 v{item.version}</span>
                              <span className={styles.purchasedProductDate}>
                                🗓 {new Date(item.purchaseDate).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}
                              </span>
                            </div>
                            <div className={styles.purchasedProductLinks}>
                              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.purchasedProductDownload}>📥 ดาวน์โหลด</a>
                              {item.discordRoleIds && item.discordRoleIds.length > 0 && (
                                <span className={styles.purchasedProductRoles}>🎭 Role: {item.discordRoleIds.join(", ")}</span>
                              )}
                            </div>
                          </div>
                          <button className={styles.purchasedProductRemoveBtn} onClick={() => handleRemoveProduct(item.productId, index)} disabled={actionLoading}>🗑️</button>
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