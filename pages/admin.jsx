import { useState, useEffect } from "react";
import { useRouter } from "next/router"; 
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";
import styles from "../styles/Admin.module.css";
import { useUser } from "../context/UserContext";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { groupFilesByCategory, isImageFile } from "../utils/fileCategories";
import { addLog, LOG_TYPES } from "../utils/logger";
import Icon from "../components/Icon";
import R2Uploader from "../components/R2Uploader";

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
  const { data: session } = useSession();
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
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
    if (file.size > 10 * 1024 * 1024) { error("ไฟล์รูปใหญ่เกินไป (สูงสุด 10MB)"); return; }
    const formData = new FormData(); formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok) { setItemsimage(result.url); setPreviewImage(result.url); success("อัปโหลดรูปสำเร็จ!"); }
      else { error("อัปโหลดรูปไม่สำเร็จ"); }
    } catch (err) { error("เกิดข้อผิดพลาดในการอัปโหลดรูป"); }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...itemsimages]; newImages[index] = value.trim();
    const filtered = newImages.filter((url) => url !== "");
    if (!filtered.includes("")) filtered.push(""); setItemsimages(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemsname || !itemsprice) { error("กรุณากรอกชื่อสินค้าและราคาก่อนบันทึก!"); return; }
    setSaving(true);
    try {
      const filteredImages = itemsimages.filter((img) => img.trim() !== "");
      const roleIds = discordRoleIdsText.split(/[ ,\n]+/).filter(r => r && r.trim() !== "").map(r => r.trim());
      const payload = { itemsname, itemsprice: parseFloat(itemsprice), itemsimage, itemsimages: filteredImages, itemsdesc, itemstitle, itemsfile, itemsurlyoutube: itemsurlyoutube.trim() || "", itemsversion, discordRoleIds: roleIds };
      
      if (isEdit) {
        await axios.put("/api/items", { id: editingItem._id, ...payload });
        success("แก้ไขสินค้าสำเร็จ!");
        await addLog(LOG_TYPES.PRODUCT_EDIT, "แก้ไขสินค้า", `แก้ไข "${itemsname}"`, session?.user?.name || "Admin", {
          productName: itemsname, price: parseFloat(itemsprice), version: itemsversion, roleIds: roleIds,
        }).catch(() => {});
      } else {
        await axios.post("/api/items", payload);
        success("เพิ่มสินค้าสำเร็จ!");
        await addLog(LOG_TYPES.PRODUCT_ADD, "เพิ่มสินค้า", `เพิ่ม "${itemsname}"`, session?.user?.name || "Admin", {
          productName: itemsname, price: parseFloat(itemsprice), version: itemsversion, roleIds: roleIds,
        }).catch(() => {});
      }
      onSaved();
    } catch (err) { error(`เกิดข้อผิดพลาด: ${err.response?.data?.error || err.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{isEdit ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalRow}><label className={styles.modalLabel}>ชื่อสินค้า *</label><input value={itemsname} onChange={(e) => setItemsname(e.target.value)} className={styles.modalInput} type="text" required /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>หัวข้อสินค้า *</label><input value={itemstitle} onChange={(e) => setItemstitle(e.target.value)} className={styles.modalInput} type="text" required /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>เวอร์ชัน *</label><input value={itemsversion} onChange={(e) => setItemsversion(e.target.value)} className={styles.modalInput} type="text" required /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>ลิ้งค์รูปภาพหลัก *</label><input value={itemsimage} onChange={(e) => { setItemsimage(e.target.value); setPreviewImage(e.target.value); }} className={styles.modalInput} type="text" required /></div>
          <input type="file" accept="image/*" onChange={handleUpload} className={styles.modalFileInput} />
          {previewImage && <img src={previewImage} alt="preview" className={styles.previewImage} />}
          <div className={styles.modalRow}><label className={styles.modalLabel}>ลิ้งค์รูปเพิ่มเติม</label><div className={styles.modalImages}>{itemsimages.map((img, index) => (<div key={index} className={styles.imageInputContainer}><input value={img} onChange={(e) => handleImageChange(index, e.target.value)} className={styles.modalInput} type="text" placeholder={`ลิ้งค์รูปที่ ${index + 1}`} />{img && <img src={img} alt={`เพิ่มเติม ${index + 1}`} className={styles.previewImage} />}</div>))}</div></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>รายละเอียด *</label><textarea value={itemsdesc} onChange={(e) => setItemsdesc(e.target.value)} className={styles.modalTextarea} required /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>YouTube Video ID</label><input value={itemsurlyoutube} onChange={(e) => setItemsurlyoutube(e.target.value.trim())} className={styles.modalInput} type="text" /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>ลิ้งไฟล์ *</label><input value={itemsfile} onChange={(e) => setItemsfile(e.target.value)} className={styles.modalInput} type="text" required /></div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>หรืออัปโหลดไฟล์จากเครื่อง (R2)</label>
            <R2Uploader onUploadComplete={(publicUrl) => { setItemsfile(`${publicUrl}?v=${itemsversion || new Date().toISOString().slice(0,10)}`); success("อัปโหลดไฟล์ไป R2 สำเร็จ!"); }} accept=".zip,.rar,.7z,.scs,.exe,.msi" maxSize={2000} />
            {itemsfile && !uploadingFile && <small style={{ color: '#10b981', marginTop: '4px', display: 'block' }}><Icon name="check" size="0.7rem" /> ไฟล์พร้อมให้ดาวน์โหลดจาก R2</small>}
            <small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}><Icon name="info" size="0.6rem" /> รองรับ .zip, .rar, .7z, .scs, .exe, .msi | อัปโหลดตรงไป Cloudflare R2</small>
          </div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>ราคาสินค้า *</label><input value={itemsprice} onChange={(e) => setItemsprice(e.target.value)} className={styles.modalInput} type="number" required min="0" step="1" /><small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}><Icon name="coin" size="0.6rem" /> ราคาในหน่วย Point</small></div>
          <div className={styles.modalActions}><button type="button" className={styles.cancelBtn} onClick={onClose}>Close</button><button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save" : "Add Product"}</button></div>
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
  const { data: session } = useSession();
  const { success, error } = useToast();

  const handleFileUrlChange = (value) => {
    if (value.startsWith('/uploads/')) { const baseUrl = window.location.origin; setNewFileUrl(`${baseUrl}${value}`); }
    else { setNewFileUrl(value); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalUrl = newFileUrl;
    if (finalUrl.startsWith('/uploads/')) { const baseUrl = window.location.origin; finalUrl = `${baseUrl}${finalUrl}`; }
    if (!newVersion || !finalUrl) { error("กรุณากรอกเวอร์ชันใหม่และลิงก์ไฟล์"); return; }
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/update-version", { productId: product._id, newVersion, newFileUrl: finalUrl, changelog });
      if (res.data.success) {
        success(`อัปเดตเวอร์ชันสำเร็จ! แจ้งเตือนผู้ใช้ ${res.data.notifiedUsers} คน`);
        await addLog('product_update', "อัปเดตเวอร์ชัน", `อัปเดต "${product.itemsname}" เป็น v${newVersion}`, session?.user?.name || "Admin").catch(() => {});
        onUpdated(); onClose();
      }
    } catch (err) { error("อัปเดตไม่สำเร็จ: " + (err.response?.data?.error || err.message)); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}><Icon name="product" size="1rem" /> อัปเดตเวอร์ชัน: {product.itemsname}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalRow}><label className={styles.modalLabel}>เวอร์ชันปัจจุบัน</label><input type="text" value={product.itemsversion} disabled className={styles.modalInput} /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>เวอร์ชันใหม่ *</label><input type="text" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className={styles.modalInput} placeholder="เช่น 2.0.0" required /></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>อัปโหลดไฟล์ใหม่ (Cloudflare R2)</label><R2Uploader onUploadComplete={(publicUrl) => { setNewFileUrl(publicUrl); success("อัปโหลดไฟล์ไป R2 สำเร็จ!"); }} accept=".zip,.rar,.7z,.scs,.exe,.msi" maxSize={5000} />{newFileUrl && <small style={{ color: "#10b981", marginTop: "4px", display: "block" }}><Icon name="check" size="0.7rem" /> ไฟล์ใหม่พร้อมดาวน์โหลดแล้ว</small>}<small style={{ color: "#6b7280", fontSize: "0.7rem", marginTop: "4px", display: "block" }}><Icon name="info" size="0.6rem" /> อัปโหลดตรงไป Cloudflare R2 รองรับไฟล์ใหญ่หลาย GB</small></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>ลิงก์ไฟล์ใหม่ *</label><input type="text" value={newFileUrl} onChange={(e) => handleFileUrlChange(e.target.value)} className={styles.modalInput} placeholder="https://yourdomain.com/uploads/ไฟล์.scs" /><small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}><Icon name="info" size="0.6rem" /> ใส่ URL แบบเต็ม หรือ /uploads/ชื่อไฟล์.scs</small></div>
          <div className={styles.modalRow}><label className={styles.modalLabel}>รายการอัปเดต (Changelog)</label><textarea value={changelog} onChange={(e) => setChangelog(e.target.value)} className={styles.modalTextarea} rows="4" placeholder="- แก้ไขบัค XYZ&#10;- เพิ่มฟีเจอร์ใหม่" /></div>
          <div className={styles.modalActions}><button type="button" className={styles.cancelBtn} onClick={onClose}>ยกเลิก</button><button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? "กำลังอัปเดต..." : <><Icon name="upload" size="0.8rem" /> อัปเดตเวอร์ชัน</>}</button></div>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
export default function Admin() {
  const router = useRouter(); // ✅ เพิ่มบรรทัดนี้
  const { data: session } = useSession();
  const { userPoints, refreshPoints } = useUser();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- All States ---
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [topMod, setTopMod] = useState("-");
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedProductForVersion, setSelectedProductForVersion] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [deletingFile, setDeletingFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [proposedPoints, setProposedPoints] = useState(0);
  const [changeAmount, setChangeAmount] = useState(1);
  const [userProducts, setUserProducts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [topups, setTopups] = useState([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  const [r2Files, setR2Files] = useState([]);
  const [loadingR2Files, setLoadingR2Files] = useState(false);
  const [deletingR2File, setDeletingR2File] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logPage, setLogPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [webhookConfig, setWebhookConfig] = useState({ enabled: false, webhooks: {} });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({ 
    code: '', description: '', discountType: 'percentage', discountValue: '', 
    minPurchase: 0, maxUsage: 0, expiresAt: '', 
    productRestriction: 'all', allowedProductIds: [] 
  });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  // --- Sidebar Tabs ---
  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard", color: "#6366f1" },
    { key: "orders", label: "Orders", icon: "order", color: "#f59e0b" },
    { key: "products", label: "Products", icon: "product", color: "#10b981" },
    { key: "topups", label: "Topups", icon: "money", color: "#3b82f6" },
    { key: "uploads", label: "Uploads", icon: "upload", color: "#8b5cf6" },
    { key: "r2", label: "R2 Files", icon: "cloud", color: "#06b6d4" },
    { key: "logs", label: "Logs & Webhook", icon: "history", color: "#f43f5e" },
    { key: "coupons", label: "Coupons", icon: "discount", color: "#ec4899" },
    { key: "users", label: "Users", icon: "users", color: "#14b8a6" },
    { key: "admins", label: "Admins", icon: "users", color: "#f43f5e" },
  ];

  // --- Effects ---  
  useEffect(() => {
    if (showCouponModal) {
      axios.get("/api/items").then(res => setAllProducts(res.data || [])).catch(() => {});
    }
  }, [showCouponModal]);

  useEffect(() => {
    if (!session || activeTab !== "dashboard") return;
    Promise.all([axios.get("/api/items"), axios.get("/api/user/count"), axios.get("/api/user/purchase")])
      .then(([itemsRes, usersRes, ordersRes]) => {
        const items = itemsRes.data || []; const orders = ordersRes.data || [];
        setStats({ products: items.length, users: usersRes.data.count || 0, orders: orders.length, revenue: orders.reduce((sum, o) => sum + (o.price || 0), 0) });
      }).catch(console.error);
  }, [session, activeTab]);

  useEffect(() => {
    if (!session || activeTab !== "orders") return;
    axios.get("/api/user/purchase").then((res) => {
      const data = res.data || []; setOrders(data); setTotalOrders(data.length); setTotalRevenue(data.reduce((sum, o) => sum + (o.price || 0), 0));
      const modStats = {};
      data.forEach((order) => {
        const name = order.productName || "unknown";
        if (!modStats[name]) modStats[name] = { count: 1, lastPurchased: order.purchaseDate ? new Date(order.purchaseDate) : null };
        else { modStats[name].count += 1; const date = order.purchaseDate ? new Date(order.purchaseDate) : null; if (date && modStats[name].lastPurchased && date > modStats[name].lastPurchased) modStats[name].lastPurchased = date; }
      });
      const sorted = Object.entries(modStats).sort((a, b) => b[1].count - a[1].count);
      if (sorted.length > 0) { const [name, stat] = sorted[0]; const formatted = stat.lastPurchased instanceof Date && !isNaN(stat.lastPurchased) ? stat.lastPurchased.toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" }) : "-"; setTopMod(`${name} (ล่าสุด: ${formatted})`); }
    }).catch(console.error);
  }, [session, activeTab]);

  const fetchItems = async () => { const res = await axios.get("/api/items"); setItems(res.data || []); };
  useEffect(() => { if (activeTab === "products") fetchItems(); }, [activeTab]);

  const fetchTopups = async () => { setLoadingTopups(true); try { const res = await axios.get("/api/admin/topups"); setTopups(res.data || []); } catch { error("โหลดประวัติเติมเงินไม่สำเร็จ"); } finally { setLoadingTopups(false); } };
  useEffect(() => { if (activeTab === "topups") fetchTopups(); }, [activeTab]);

  const fetchImages = async () => { try { const res = await axios.get("/api/upload"); const files = res.data || []; setImages(files.map(file => typeof file === 'string' ? { url: file, fileName: file.split('/').pop() } : { url: file.url || '', fileName: file.fileName || '' })); } catch { setImages([]); } };
  useEffect(() => { if (activeTab === "uploads") fetchImages(); }, [activeTab]);

  const fetchUsers = async () => { try { const res = await axios.get("/api/user/user"); setUsers(res.data || []); } catch { error("โหลดข้อมูลผู้ใช้ล้มเหลว"); } };
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab]);

  const fetchR2Files = async () => { setLoadingR2Files(true); try { const res = await axios.get("/api/admin/r2-files"); setR2Files(res.data.files || []); } catch { error("ไม่สามารถโหลดไฟล์จาก R2 ได้"); } finally { setLoadingR2Files(false); } };
  useEffect(() => { if (activeTab === "r2") fetchR2Files(); }, [activeTab]);

  const fetchLogs = async () => { setLoadingLogs(true); try { const res = await axios.get(`/api/admin/logs?type=${logFilter}&limit=1000`); setLogs(res.data.logs || []); setLogPage(1); } catch { error("โหลด logs ไม่สำเร็จ"); } finally { setLoadingLogs(false); } };
  const fetchWebhookConfig = async () => { try { const res = await axios.get('/api/admin/webhook'); setWebhookConfig(res.data); } catch {} };
  useEffect(() => { if (activeTab === "logs") { fetchLogs(); fetchWebhookConfig(); } }, [activeTab, logFilter]);

  const fetchCoupons = async () => { setLoadingCoupons(true); try { const res = await axios.get('/api/admin/coupons'); setCoupons(res.data.coupons || []); } catch { error("โหลดคูปองไม่สำเร็จ"); } finally { setLoadingCoupons(false); } };
  useEffect(() => { if (activeTab === "coupons") fetchCoupons(); }, [activeTab]);

  // --- Handlers ---
  const handleEdit = (item) => { setEditingItem(item); setShowModal(true); };
  const handleDelete = async (id, productName) => {
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `คุณต้องการลบ "${productName}"?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" });
    if (!confirmed) return;
    try { await axios.delete(`/api/items?id=${id}`); success("ลบสินค้าสำเร็จ!"); await addLog(LOG_TYPES.PRODUCT_DELETE, "ลบสินค้า", `ลบ "${productName}"`, session?.user?.name || "Admin").catch(() => {}); fetchItems(); } catch { error("ลบสินค้าไม่สำเร็จ"); }
  };
  const handleSaved = () => { setShowModal(false); setEditingItem(null); fetchItems(); };
  const handleVersionUpdate = (item) => { setSelectedProductForVersion(item); setShowVersionModal(true); };
  const handleVersionUpdated = () => { fetchItems(); };

  const getStatusBadge = (status) => {
    switch (status) {
      case "success": return { class: "statusSuccess", text: "สำเร็จ", icon: "success" };
      case "pending": return { class: "statusPending", text: "รอตรวจสอบ", icon: "pending" };
      case "error": return { class: "statusFailed", text: "ล้มเหลว", icon: "error" };
      case "duplicate": return { class: "statusDuplicate", text: "ซ้ำ", icon: "warning" };
      default: return { class: "statusPending", text: "รอตรวจสอบ", icon: "pending" };
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData(); formData.append("file", selectedFile);
    setUploading(true);
    try { await axios.post("/api/upload", formData); success("อัปโหลดสำเร็จ"); await addLog('file_upload', "อัปโหลดไฟล์", `อัปโหลด "${selectedFile.name}"`, session?.user?.name || "Admin").catch(() => {}); setSelectedFile(null); fetchImages(); } catch { error("เกิดข้อผิดพลาด"); } finally { setUploading(false); }
  };

  const handleDeleteFile = async (fileName) => {
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ต้องการลบ "${fileName}"?`, confirmText: "ลบ", cancelText: "ยกเลิก", type: "danger" });
    if (!confirmed) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName }) });
      const data = await res.json();
      if (res.ok) { success("ลบไฟล์สำเร็จ!"); await addLog('file_delete', "ลบไฟล์", `ลบ "${fileName}"`, session?.user?.name || "Admin").catch(() => {}); fetchImages(); } else throw new Error(data.error);
    } catch (err) { error(err.message); } finally { setDeletingFile(null); }
  };

  const fetchUserProducts = async (userId) => { try { const res = await axios.get(`/api/user/fetch-products?userId=${userId}`); setUserProducts(res.data || []); } catch { setUserProducts([]); } };
  const applyPointChange = (type) => { const current = Number(selectedUser.points || 0); const amount = Number(changeAmount || 0); if (isNaN(amount) || amount < 0) return error("กรุณากรอกจำนวนแต้มที่ถูกต้อง"); if (type === "add") setProposedPoints(current + amount); else setProposedPoints(Math.max(0, current - amount)); };
  const handleRemoveProduct = async (productId, index, productName) => { const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ลบ "${productName}"?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; setActionLoading(true); try { await axios.put("/api/user/remove-product", { userId: selectedUser.id, productId, index }); setUserProducts(prev => prev.filter((_, i) => i !== index)); success("ลบสินค้าสำเร็จ"); } catch (err) { error(err.response?.data?.error || "ลบไม่สำเร็จ"); } finally { setActionLoading(false); } };
  const handleSavePoints = async () => {
    setActionLoading(true);
    try { await axios.put("/api/user/points", { userId: selectedUser.id, points: Number(proposedPoints) }); success("บันทึกแต้มสำเร็จ!"); await addLog(LOG_TYPES.USER_EDIT, "แก้ไขแต้มผู้ใช้", `ปรับแต้ม ${selectedUser.name}`, session?.user?.name || "Admin", { discordId: selectedUser.id, oldPoints: selectedUser.points, newPoints: proposedPoints, email: selectedUser.email }).catch(() => {}); fetchUsers(); await refreshPoints(); setSelectedUser(null); setProposedPoints(0); setChangeAmount(1); } catch (err) { error("ไม่สามารถบันทึกแต้มได้"); } finally { setActionLoading(false); }
  };
  const handleSelectUser = async (user) => { setSelectedUser(user); setProposedPoints(user.points || 0); setChangeAmount(1); await fetchUserProducts(user.id); };

  const handleDeleteR2File = async (fileKey) => { const fileName = fileKey.split('/').pop(); const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ลบ "${fileName}" จาก R2?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; setDeletingR2File(fileKey); try { await axios.delete(`/api/admin/r2-files?key=${encodeURIComponent(fileKey)}`); success("ลบไฟล์จาก R2 สำเร็จ!"); fetchR2Files(); } catch (err) { error("ลบไฟล์ไม่สำเร็จ"); } finally { setDeletingR2File(null); } };

  const handleClearLogs = async () => { const confirmed = await confirm({ title: "ยืนยันการลบ", message: "ต้องการลบประวัติทั้งหมด?", confirmText: "ลบทั้งหมด", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; try { await axios.delete('/api/admin/logs'); success("ลบประวัติทั้งหมดแล้ว"); fetchLogs(); } catch { error("ลบไม่สำเร็จ"); } };
  const handleSaveWebhook = async () => { setSavingWebhook(true); try { await axios.put('/api/admin/webhook', webhookConfig); success("บันทึก Webhook แล้ว!"); } catch { error("บันทึกไม่สำเร็จ"); } finally { setSavingWebhook(false); } };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) { error("กรุณากรอกโค้ดและส่วนลด"); return; }
    setSavingCoupon(true);
    try {
      const payload = { ...couponForm };
      if (editingCoupon) { await axios.put('/api/admin/coupons', { id: editingCoupon._id, ...payload }); success("แก้ไขคูปองสำเร็จ!"); }
      else { await axios.post('/api/admin/coupons', payload); success("เพิ่มคูปองสำเร็จ!"); }
      setShowCouponModal(false); setEditingCoupon(null); 
      setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); 
      fetchCoupons();
    } catch (err) { error(err.response?.data?.error || "บันทึกไม่สำเร็จ"); } finally { setSavingCoupon(false); }
  };
  
  const handleDeleteCoupon = async (id) => { const confirmed = await confirm({ title: "ยืนยันการลบ", message: "ต้องการลบคูปองนี้?", confirmText: "ลบ", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; try { await axios.delete(`/api/admin/coupons?id=${id}`); success("ลบคูปองสำเร็จ!"); fetchCoupons(); } catch { error("ลบไม่สำเร็จ"); } };
  
  const handleEditCoupon = (coupon) => { 
    setEditingCoupon(coupon); 
    setCouponForm({ 
      code: coupon.code, description: coupon.description || '', 
      discountType: coupon.discountType, discountValue: coupon.discountValue, 
      minPurchase: coupon.minPurchase || 0, maxUsage: coupon.maxUsage || 0, 
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
      productRestriction: coupon.productRestriction || "all",
      allowedProductIds: coupon.allowedProductIds?.map(p => p._id || p) || [],
    }); 
    setShowCouponModal(true); 
  };
  const [adminRole, setAdminRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminList, setAdminList] = useState([]);
  // --- Pagination ---
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const paginatedLogs = logs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);
  useEffect(() => {
    if (session?.user?.id) {
      checkAdminStatus();
      if (activeTab === "admins") fetchAdmins();
    }
  }, [session, activeTab]);

  const checkAdminStatus = async () => {
    try {
      // ✅ เช็คจาก Database ก่อน
      const res = await axios.get(`/api/admin/check-admin?discordId=${session.user.id}`);
      
      if (res.data.isAdmin) {
        setIsAdmin(true);
        setAdminRole(res.data.role);
        return;
      }
      
      // ✅ Fallback: เช็คจาก .env (สำหรับ Head Admin ที่ยังไม่ได้ init)
      const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
      if (envAdminIds.includes(session.user.id)) {
        setIsAdmin(true);
        setAdminRole("head");
        return;
      }
      
      // ❌ ไม่ใช่ Admin
      setIsAdmin(false);
      setAdminRole(null);
      error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      router.push("/");
      
    } catch (err) {
      // ✅ Fallback: ถ้า API error → เช็คจาก .env
      const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
      if (envAdminIds.includes(session.user.id)) {
        setIsAdmin(true);
        setAdminRole("head");
      } else {
        router.push("/");
      }
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get("/api/admin/admins");
      setAdminList(res.data.admins || []);
    } catch {}
  };
  // ✅ ฟังก์ชันแก้ไข Admin
  const handleEditAdmin = async (admin) => {
    const newRole = admin.role === "admin" ? "moderator" : "admin";
    const confirmed = await confirm({
      title: "เปลี่ยน Role",
      message: `เปลี่ยน ${admin.name} จาก ${admin.role} เป็น ${newRole}?`,
      confirmText: "เปลี่ยน",
      cancelText: "ยกเลิก",
      type: "info",
    });
    if (!confirmed) return;

    try {
      await axios.put("/api/admin/admins", {
        id: admin._id,
        role: newRole,
        headId: session.user.id,
      });
      success("เปลี่ยน Role สำเร็จ!");
      fetchAdmins();
    } catch (err) { error(err.response?.data?.error || "เปลี่ยนไม่สำเร็จ"); }
  };

  // ✅ ฟังก์ชันลบ Admin
  const handleDeleteAdmin = async (adminId) => {
    const confirmed = await confirm({
      title: "ยืนยันการลบ",
      message: "ต้องการลบ Admin คนนี้?",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/admin/admins?id=${adminId}&headId=${session.user.id}`);
      success("ลบ Admin สำเร็จ!");
      fetchAdmins();
    } catch (err) { error(err.response?.data?.error || "ลบไม่สำเร็จ"); }
  };
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ discordId: '', name: '', role: 'admin' });
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.discordId) { error("กรุณากรอก Discord ID"); return; }
    
    try {
      await axios.post("/api/admin/admins", {
        ...adminForm,
        headId: session.user.id,
        addedBy: session.user.name,
      });
      success("เพิ่ม Admin สำเร็จ!");
      setShowAdminModal(false);
      setAdminForm({ discordId: '', name: '', role: 'admin' });
      fetchAdmins();
    } catch (err) { error(err.response?.data?.error || "เพิ่มไม่สำเร็จ"); }
  };
  return (
    <div className={styles.adminLayout}>
      <Head><title>xCloud Studio Admin</title></Head>

      {/* ========== SIDEBAR ========== */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo}>
            <img src="/favicon.ico" alt="logo" className={styles.sidebarLogoImg} />
            {sidebarOpen && <span><span className={styles.sidebarLogoAccent}>xCloud</span> Studio</span>}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={styles.sidebarToggle}>
            <Icon name={sidebarOpen ? "arrow-left" : "arrow-right"} size="1rem" />
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${styles.sidebarItem} ${activeTab === tab.key ? styles.sidebarItemActive : ''}`}>
              <Icon name={tab.icon} size="1.1rem" color={activeTab === tab.key ? tab.color : undefined} />
              {sidebarOpen && <span>{tab.label}</span>}
              {activeTab === tab.key && <span className={styles.sidebarItemDot} style={{ background: tab.color }} />}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          {session ? (
            <Link href="/profile" className={styles.sidebarUser}>
              <img src={session.user.image} alt="Profile" className={styles.sidebarAvatar} />
              {sidebarOpen && (
                <div className={styles.sidebarUserInfo}>
                  <span className={styles.sidebarUserName}>{session.user.name}</span>
                  <span className={styles.sidebarUserPoints}><Icon name="coin" size="0.7rem" /> {userPoints?.toLocaleString() || 0}</span>
                </div>
              )}
            </Link>
          ) : (
            <button onClick={() => signIn("discord")} className={styles.sidebarLoginBtn}><Icon name="discord" size="1rem" />{sidebarOpen && <span>Login</span>}</button>
          )}
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={styles.topBarMenuBtn}><Icon name="menu" size="1.2rem" /></button>
            <h1 className={styles.topBarTitle}>{tabs.find(t => t.key === activeTab)?.label || 'Dashboard'}</h1>
          </div>
          <div className={styles.topBarRight}>
            <button onClick={() => { setActiveTab("products"); setEditingItem(null); setShowModal(true); }} className={styles.topBarAction}><Icon name="add" size="0.8rem" /><span>Add Product</span></button>
            <button onClick={() => { setActiveTab("coupons"); setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); setShowCouponModal(true); }} className={styles.topBarAction}><Icon name="discount" size="0.8rem" /><span>Add Coupon</span></button>
          </div>
        </header>

        <main className={styles.mainContent}>
          
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className={styles.dashboardGrid}>
              <div className={styles.statsGrid}>
                {[
                  { icon: "product", value: stats.products, label: "Total Products", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
                  { icon: "order", value: stats.orders, label: "Total Orders", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
                  { icon: "users", value: stats.users, label: "Total Users", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
                  { icon: "money", value: `฿${stats.revenue.toLocaleString()}`, label: "Revenue", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                ].map((stat, i) => (
                  <div key={i} className={styles.statsCard}>
                    <div className={styles.statsCardIcon} style={{ background: stat.bg, color: stat.color }}><Icon name={stat.icon} size="1.5rem" /></div>
                    <div className={styles.statsCardInfo}><h3>{stat.value}</h3><p>{stat.label}</p></div>
                  </div>
                ))}
              </div>
              <div className={styles.quickActions}>
                <h3 className={styles.sectionTitle}>Quick Actions</h3>
                <div className={styles.quickActionsGrid}>
                  {[
                    { icon: "add", label: "Add Product", color: "#10b981", action: () => { setActiveTab("products"); setEditingItem(null); setShowModal(true); } },
                    { icon: "upload", label: "Upload Files", color: "#8b5cf6", action: () => setActiveTab("uploads") },
                    { icon: "discount", label: "Create Coupon", color: "#ec4899", action: () => { setActiveTab("coupons"); setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); setShowCouponModal(true); } },
                    { icon: "users", label: "Manage Users", color: "#14b8a6", action: () => setActiveTab("users") },
                    { icon: "order", label: "View Orders", color: "#f59e0b", action: () => setActiveTab("orders") },
                    { icon: "history", label: "View Logs", color: "#f43f5e", action: () => setActiveTab("logs") },
                  ].map((action, i) => (
                    <button key={i} onClick={action.action} className={styles.quickActionBtn}>
                      <Icon name={action.icon} size="1.5rem" color={action.color} />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div className={styles.tabContent}>
              <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
                {[
                  { value: `฿${totalRevenue.toLocaleString()}`, label: "Total Revenue" },
                  { value: `${totalOrders} Orders`, label: "Total Orders" },
                  { value: topMod, label: "Best Seller" },
                ].map((s, i) => (
                  <div key={i} className={styles.statsCard}>
                    <div className={styles.statsCardInfo}><h3 style={{ fontSize: s.value.length > 15 ? '0.85rem' : '1.5rem' }}>{s.value}</h3><p>{s.label}</p></div>
                  </div>
                ))}
              </div>
              <div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th>Product</th><th>Buyer</th><th>Price</th><th>Date</th></tr></thead><tbody>{orders.map((order, i) => (<tr key={i}><td>{order.productName || order.productId}</td><td>{order.buyerName || order.buyerId}</td><td>{order.price} ฿</td><td>{order.purchaseDate ? new Date(order.purchaseDate).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}</td></tr>))}</tbody></table></div>
            </div>
          )}

          {/* TOPUPS */}
          {activeTab === "topups" && (
            <div className={styles.tabContent}>
              {loadingTopups ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading...</p></div> : topups.length === 0 ? <div className={styles.emptyState}><Icon name="history" size="3rem" /><p className={styles.emptyTitle}>No topup history</p></div> : (
                <div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th>Date</th><th>User</th><th>Amount</th><th>Ref</th><th>Slip</th><th>Status</th></tr></thead><tbody>{topups.map((topup) => { const s = getStatusBadge(topup.status); return (<tr key={topup._id}><td>{new Date(topup.createdAt).toLocaleString("th-TH")}</td><td><strong>{topup.userName}</strong><br /><small>ID: {topup.userId}</small></td><td>฿{topup.amount?.toLocaleString()}</td><td><small>{topup.transRef || "-"}</small></td><td>{topup.slipUrl ? <a href={topup.slipUrl} target="_blank" className={styles.slipLink}><Icon name="link" size="0.7rem" /> View</a> : <span style={{ color: "#6b7280" }}>None</span>}</td><td><span className={`${styles.statusBadge} ${styles[s.class]}`}><Icon name={s.icon} size="0.7rem" /> {s.text}</span></td></tr>); })}</tbody></table></div>
              )}
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === "products" && (
            <div className={styles.tabContent}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.addButton}><Icon name="add" size="0.8rem" /> Add Product</button>
              </div>
              {showModal && <ProductModal editingItem={editingItem} onClose={() => { setShowModal(false); setEditingItem(null); }} onSaved={handleSaved} />}
              {showVersionModal && selectedProductForVersion && <VersionUpdateModal product={selectedProductForVersion} onClose={() => { setShowVersionModal(false); setSelectedProductForVersion(null); }} onUpdated={handleVersionUpdated} />}
              <div className={styles.productGrid}>{items.length === 0 ? <div className={styles.emptyState}><p>No products yet</p></div> : items.map((item) => (<div key={item._id} className={styles.productCard}><img src={item.itemsimage} alt={item.itemsname} className={styles.productImage} /><div className={styles.cardBody}><h3 className={styles.productName}>{item.itemsname}</h3><p className={styles.productTitle}>{item.itemstitle}</p><p className={styles.productDesc}>{item.itemsdesc}</p><div className={styles.productMeta}><span className={styles.productPrice}>฿{item.itemsprice}</span><span className={styles.productVersion}>v{item.itemsversion}</span></div>{item.discordRoleIds?.length > 0 && <div className={styles.productRoleId}><Icon name="role" size="0.7rem" /><small> {item.discordRoleIds.join(", ")}</small></div>}</div><div className={styles.cardActions}><button onClick={() => handleEdit(item)} className={styles.editBtn}><Icon name="edit" size="0.8rem" /> Edit</button><button onClick={() => handleVersionUpdate(item)} className={styles.versionBtn}><Icon name="refresh" size="0.8rem" /> Update</button><button onClick={() => handleDelete(item._id, item.itemsname)} className={styles.deleteBtn}><Icon name="delete" size="0.8rem" /> Delete</button></div></div>))}</div>
            </div>
          )}

          {/* UPLOADS */}
          {activeTab === "uploads" && (
            <div className={styles.tabContent}>
              <div className={styles.uploadSection}>
                <label className={`custom-file-upload ${uploading ? 'uploading' : ''} ${selectedFile ? 'has-file' : ''}`}>
                  {uploading ? <span><Icon name="loading" size="0.8rem" /> Uploading...</span> : selectedFile ? <span><Icon name="check" size="0.8rem" /> {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span> : <span><Icon name="upload" size="0.8rem" /> Choose File (Max 2GB)</span>}
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} disabled={uploading} />
                </label>
                {selectedFile && !uploading && <button onClick={() => setSelectedFile(null)} className={styles.cancelBtn}><Icon name="close" size="0.7rem" /></button>}
                <button onClick={handleUpload} disabled={!selectedFile || uploading} className={styles.addButton}>{uploading ? <Icon name="loading" size="0.8rem" /> : <><Icon name="upload" size="0.8rem" /> Upload</>}</button>
              </div>
              {images.length > 0 && (
                <div className={styles.galleryContainer}>{groupFilesByCategory(images).map((category) => (<div key={category.key} className={styles.galleryCategory}><div className={styles.galleryCategoryHeader}><span className={styles.galleryCategoryIcon}>{category.icon}</span><span className={styles.galleryCategoryLabel}>{category.label}</span><span className={styles.galleryCategoryCount}>{category.files.length} files</span></div><div className={styles.galleryGrid}>{category.files.map((file) => (<div key={file.url} className={styles.galleryItem}>{isImageFile(file.fileName) ? <div className={styles.galleryImageWrapper}><img src={file.url} alt={file.fileName} className={styles.galleryThumb} loading="lazy" /></div> : <div className={styles.galleryFileWrapper}><Icon name="file" size="1.5rem" /><span className={styles.galleryFileName}>{file.fileName}</span></div>}<div className={styles.galleryItemInfo}><input type="text" value={file.url} readOnly className={styles.galleryUrl} onClick={(e) => e.target.select()} /><div className={styles.galleryActions}><button onClick={() => { navigator.clipboard.writeText(file.url); success("Copied!"); }} className={styles.galleryCopyBtn}><Icon name="copy" size="0.8rem" /></button><a href={file.url} target="_blank" className={styles.galleryOpenBtn}><Icon name="link" size="0.8rem" /></a><button onClick={() => handleDeleteFile(file.fileName)} disabled={deletingFile === file.fileName} className={styles.galleryDeleteBtn}>{deletingFile === file.fileName ? <Icon name="loading" size="0.8rem" /> : <Icon name="delete" size="0.8rem" />}</button></div></div></div>))}</div></div>))}</div>)}
              {images.length === 0 && !uploading && <div className={styles.emptyState}><Icon name="file" size="3rem" /><p className={styles.emptyTitle}>No files uploaded</p></div>}
            </div>
          )}

          {/* R2 FILES */}
          {activeTab === "r2" && (
            <div className={styles.tabContent}>
              <div className={styles.r2UploadArea}><h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#e4e6f0' }}><Icon name="cloud" size="1rem" /> Upload to R2</h3><R2Uploader onUploadComplete={() => { success("Uploaded to R2!"); fetchR2Files(); }} accept="*/*" maxSize={5000} /><small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}><Icon name="info" size="0.6rem" /> All file types, max 5GB</small></div>
              <div className={styles.r2FilesSection}><div className={styles.r2FilesHeader}><h3><Icon name="cloud" size="1rem" /> R2 Files ({r2Files.length})</h3><button onClick={fetchR2Files} className={styles.r2RefreshBtn}><Icon name="refresh" size="0.8rem" /> Refresh</button></div>
              {loadingR2Files ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading...</p></div> : r2Files.length === 0 ? <div className={styles.emptyState}><Icon name="cloud" size="3rem" /><p className={styles.emptyTitle}>No files in R2</p></div> : (<div className={styles.r2FilesGrid}>{r2Files.map((file) => (<div key={file.key} className={styles.r2FileCard}>{isImageFile(file.fileName) ? <div className={styles.r2FilePreview}><img src={file.url} alt={file.fileName} className={styles.r2FileThumb} loading="lazy" /></div> : <div className={styles.r2FileIcon}><Icon name="file" size="2.5rem" /><span className={styles.r2FileType}>{file.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span></div>}<div className={styles.r2FileInfo}><p className={styles.r2FileName}>{file.fileName}</p><p className={styles.r2FileSize}>{file.sizeFormatted || 'Unknown'}</p>{file.lastModified && <p className={styles.r2FileDate}><Icon name="calendar" size="0.6rem" /> {new Date(file.lastModified).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p>}</div><div className={styles.r2FileActions}><button onClick={() => { navigator.clipboard.writeText(file.url); success("Copied!"); }} className={styles.r2CopyBtn}><Icon name="copy" size="0.8rem" /></button><a href={file.url} target="_blank" className={styles.r2OpenBtn}><Icon name="link" size="0.8rem" /></a><button onClick={() => handleDeleteR2File(file.key)} disabled={deletingR2File === file.key} className={styles.r2DeleteBtn}>{deletingR2File === file.key ? <Icon name="loading" size="0.8rem" /> : <Icon name="delete" size="0.8rem" />}</button></div></div>))}</div>)}</div>
            </div>
          )}

          {/* USERS */}
          {activeTab === "users" && (
            <div className={styles.tabContent}>
              <div className={styles.userGrid}>{users.map(user => (<div key={user.id} className={styles.userCard} onClick={() => handleSelectUser(user)}><div className={styles.userInfoLeft}><h2 className={styles.userNameCard}>{user.name}</h2><p><Icon name="coin" size="0.7rem" /> {user.points?.toLocaleString() || 0} points</p></div><div className={styles.userInfoRight}><p>{user.email}</p><p className={styles.userDetailLink}><Icon name="info" size="0.7rem" /> View Details →</p></div></div>))}</div>
              {selectedUser && (
                <div className={styles.modalOverlay} onClick={() => !actionLoading && setSelectedUser(null)}>
                  <div className={styles.userDetailModal} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.modalCloseBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}><Icon name="close" size="0.8rem" /></button>
                    <div className={styles.userDetailHeader}><div className={styles.userAvatarLarge}>{selectedUser.name?.charAt(0)?.toUpperCase() || '?'}</div><div><h2 className={styles.userDetailName}>{selectedUser.name}</h2><p className={styles.userDetailEmail}>{selectedUser.email}</p></div></div>
                    <div className={styles.userInfoCards}><div className={styles.userInfoCard}><Icon name="user" size="1.2rem" /><div><p className={styles.userInfoCardLabel}>Discord ID</p><p className={styles.userInfoCardValue}>{selectedUser.id}</p></div></div><div className={styles.userInfoCard}><Icon name="coin" size="1.2rem" /><div><p className={styles.userInfoCardLabel}>Points</p><p className={styles.userInfoCardValueHighlight}>{selectedUser.points?.toLocaleString() || 0} Point</p></div></div></div>
                    <div className={styles.userDetailDivider}><span><Icon name="settings" size="0.7rem" /> Manage Points</span></div>
                    <div className={styles.pointAdjustSection}>
                      <div className={styles.pointAdjustInput}><label className={styles.pointAdjustLabel}>Amount</label><input type="number" className={styles.pointInput} value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} min="1" /></div>
                      <div className={styles.pointAdjustButtons}><button className={styles.pointAddBtn} onClick={() => applyPointChange("add")} disabled={actionLoading}><Icon name="add" size="0.8rem" /> Add</button><button className={styles.pointSubtractBtn} onClick={() => applyPointChange("subtract")} disabled={actionLoading}><Icon name="remove" size="0.8rem" /> Subtract</button></div>
                      <div className={styles.pointPreview}><span className={styles.pointPreviewLabel}>New Points</span><span className={styles.pointPreviewValue}>{proposedPoints?.toLocaleString() || 0} Point</span></div>
                      <div className={styles.pointActionButtons}><button className={styles.pointSaveBtn} onClick={handleSavePoints} disabled={actionLoading}>{actionLoading ? <Icon name="loading" size="0.8rem" /> : <Icon name="save" size="0.8rem" />} {actionLoading ? "Saving..." : "Confirm"}</button><button className={styles.pointCancelBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}>Cancel</button></div>
                    </div>
                    <div className={styles.userDetailDivider}><span><Icon name="cart" size="0.7rem" /> Purchased ({userProducts.length})</span></div>
                    <div className={styles.purchasedProducts}>{userProducts.length > 0 ? userProducts.map((item, index) => (<div key={index} className={styles.purchasedProductCard}><div className={styles.purchasedProductInfo}><h4 className={styles.purchasedProductName}>{item.name}</h4><div className={styles.purchasedProductMeta}><span className={styles.purchasedProductVersion}><Icon name="product" size="0.7rem" /> v{item.version}</span><span className={styles.purchasedProductDate}><Icon name="calendar" size="0.7rem" /> {new Date(item.purchaseDate).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}</span></div><div className={styles.purchasedProductLinks}><a href={item.fileUrl} target="_blank" className={styles.purchasedProductDownload}><Icon name="download" size="0.8rem" /> Download</a>{item.discordRoleIds?.length > 0 && <span className={styles.purchasedProductRoles}><Icon name="role" size="0.7rem" /> {item.discordRoleIds.join(", ")}</span>}</div></div><button className={styles.purchasedProductRemoveBtn} onClick={() => handleRemoveProduct(item.productId, index, item.name)} disabled={actionLoading}><Icon name="delete" size="0.8rem" /></button></div>)) : <div className={styles.noProducts}><Icon name="product" size="2rem" /><p>No purchases</p></div>}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COUPONS */}
          {activeTab === "coupons" && (
            <div className={styles.tabContent}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); setShowCouponModal(true); }} className={styles.addButton}><Icon name="add" size="0.8rem" /> Add Coupon</button>
              </div>
              {loadingCoupons ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading...</p></div> : coupons.length === 0 ? <div className={styles.emptyState}><Icon name="discount" size="3rem" /><p className={styles.emptyTitle}>No coupons yet</p></div> : (
                <div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th>Code</th><th>Discount</th><th>Type</th><th>Used</th><th>Expires</th><th>Products</th><th>Status</th><th></th></tr></thead><tbody>{coupons.map((coupon) => { const now = new Date(); const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now; const isMaxedOut = coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage; const isValid = coupon.isActive && !isExpired && !isMaxedOut; return (<tr key={coupon._id}><td><strong>{coupon.code}</strong></td><td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue?.toLocaleString() || 0} Point`}</td><td>{coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed'}</td><td>{coupon.usedCount || 0} / {coupon.maxUsage > 0 ? coupon.maxUsage : '∞'}</td><td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("th-TH") : 'Unlimited'}</td><td>{coupon.productRestriction === "all" ? <span style={{ color: '#10b981', fontSize: '0.75rem' }}>All Products</span> : coupon.allowedProductIds?.length > 0 ? <span style={{ fontSize: '0.7rem' }}>{coupon.allowedProductIds.map(p => p.itemsname || p).join(", ")}</span> : <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>None set</span>}</td><td><span className={`${styles.statusBadge} ${isValid ? styles.statusSuccess : styles.statusFailed}`}>{!coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : isMaxedOut ? 'Full' : 'Active'}</span></td><td><button onClick={() => handleEditCoupon(coupon)} className={styles.editBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}><Icon name="edit" size="0.7rem" /></button><button onClick={() => handleDeleteCoupon(coupon._id)} className={styles.deleteBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}><Icon name="delete" size="0.7rem" /></button></td></tr>); })}</tbody></table></div>
              )}
              {showCouponModal && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
                    <h2 className={styles.modalTitle}><Icon name="discount" size="1rem" /> {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
                    <form onSubmit={handleSaveCoupon} className={styles.modalForm}>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Code *</label><input value={couponForm.code} onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className={styles.modalInput} required /></div>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Description</label><input value={couponForm.description} onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))} className={styles.modalInput} /></div>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Type</label><select value={couponForm.discountType} onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))} className={styles.modalInput}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (Point)</option></select></div>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Discount *</label><input value={couponForm.discountValue} onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))} className={styles.modalInput} type="number" required /></div>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Min Purchase (Point)</label><input value={couponForm.minPurchase} onChange={(e) => setCouponForm(prev => ({ ...prev, minPurchase: e.target.value }))} className={styles.modalInput} type="number" /></div>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Max Usage</label><input value={couponForm.maxUsage} onChange={(e) => setCouponForm(prev => ({ ...prev, maxUsage: e.target.value }))} className={styles.modalInput} type="number" /></div>
                      <div className={styles.modalRow}><label className={styles.modalLabel}>Expiry Date</label><input value={couponForm.expiresAt} onChange={(e) => setCouponForm(prev => ({ ...prev, expiresAt: e.target.value }))} className={styles.modalInput} type="date" /></div>
                      
                      {/* Product Restriction */}
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Use With</label>
                        <select value={couponForm.productRestriction || "all"} onChange={(e) => setCouponForm(prev => ({ ...prev, productRestriction: e.target.value, allowedProductIds: e.target.value === "all" ? [] : (prev.allowedProductIds || []) }))} className={styles.modalInput}>
                          <option value="all">All Products</option>
                          <option value="specific">Specific Products</option>
                        </select>
                      </div>

                      {couponForm.productRestriction === "specific" && (
                        <div className={styles.modalRow}>
                          <label className={styles.modalLabel}>Select Products</label>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#0f1119', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem' }}>
                            {allProducts.length === 0 ? (
                              <p style={{ color: '#52525b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Loading products...</p>
                            ) : (
                              allProducts.map(product => (
                                <label key={product._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', color: '#d1d5db' }}>
                                  <input type="checkbox" checked={(couponForm.allowedProductIds || []).includes(product._id)} onChange={(e) => { const newIds = e.target.checked ? [...(couponForm.allowedProductIds || []), product._id] : (couponForm.allowedProductIds || []).filter(id => id !== product._id); setCouponForm(prev => ({ ...prev, allowedProductIds: newIds })); }} style={{ display: 'inline-block', width: 'auto' }} />
                                  <img src={product.itemsimage} alt="" style={{ width: '30px', height: '20px', objectFit: 'cover', borderRadius: '4px' }} />
                                  <span style={{ flex: 1 }}>{product.itemsname}</span>
                                  <span style={{ color: '#52525b', fontSize: '0.7rem' }}>฿{product.itemsprice}</span>
                                </label>
                              ))
                            )}
                          </div>
                          <small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px' }}>Select at least 1 product, or choose "All Products"</small>
                        </div>
                      )}

                      <div className={styles.modalActions}><button type="button" className={styles.cancelBtn} onClick={() => { setShowCouponModal(false); setEditingCoupon(null); }}>Cancel</button><button type="submit" className={styles.submitBtn} disabled={savingCoupon}>{savingCoupon ? <Icon name="loading" size="0.8rem" /> : <Icon name="save" size="0.8rem" />} {editingCoupon ? 'Save' : 'Add'}</button></div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* LOGS & WEBHOOK */}
          {activeTab === "logs" && (
            <div className={styles.tabContent}>
              <div className={styles.logFilterBar}>
                <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className={styles.logSelect}>
                  <option value="all">All</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="purchase">Purchase</option>
                  <option value="topup">Topup</option>
                  <option value="product_add">Add Product</option>
                  <option value="product_edit">Edit Product</option>
                  <option value="product_delete">Delete Product</option>
                  <option value="user_edit">Edit User</option>
                  <option value="file_upload">Upload File</option>
                  <option value="file_delete">Delete File</option>
                  <option value="error">Error</option>
                </select>
                <button onClick={fetchLogs} className={styles.logRefreshBtn}><Icon name="refresh" size="0.8rem" /> Refresh</button>
                <button onClick={handleClearLogs} className={styles.logClearBtn}><Icon name="delete" size="0.8rem" /> Clear All</button>
              </div>
              {loadingLogs ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>Loading...</p></div> : logs.length === 0 ? <div className={styles.emptyState}><Icon name="history" size="3rem" /><p className={styles.emptyTitle}>No logs</p></div> : (
                <>
                  <div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th style={{ width: '140px' }}>Date</th><th style={{ width: '100px' }}>Type</th><th>Details</th><th style={{ width: '120px' }}>User</th></tr></thead><tbody>{paginatedLogs.map((log) => (<tr key={log._id}><td style={{ fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</td><td><span className={styles.logBadge}>{log.type}</span></td><td><strong>{log.title}</strong>{log.message && <><br /><small style={{ color: '#9ca3af' }}>{log.message}</small></>}</td><td style={{ fontSize: '0.8rem' }}>{log.user}</td></tr>))}</tbody></table></div>
                  {totalPages > 1 && (
                    <div className={styles.logPagination}>
                      <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} className={styles.logPageBtn}><Icon name="arrow-left" size="0.8rem" /> Prev</button>
                      <span className={styles.logPageInfo}>Page {logPage} / {totalPages} ({logs.length} total)</span>
                      <button onClick={() => setLogPage(p => Math.min(totalPages, p + 1))} disabled={logPage === totalPages} className={styles.logPageBtn}>Next <Icon name="arrow-right" size="0.8rem" /></button>
                    </div>
                  )}
                </>
              )}
              <div style={{ marginTop: '2rem' }}>
                <h3 className={styles.sectionTitle}><Icon name="settings" size="1rem" /> Webhook Settings</h3>
                <div className={styles.webhookForm}>
                  <div className={styles.modalRow}>
                    <label className={styles.modalLabel} style={{ display: 'flex', alignItems: 'center', textTransform: 'none' }}>
                      <input type="checkbox" checked={webhookConfig.enabled} onChange={(e) => setWebhookConfig(prev => ({ ...prev, enabled: e.target.checked }))} style={{ marginRight: '0.5rem', display: 'inline-block', width: 'auto' }} /> Enable All Webhooks
                    </label>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {['login', 'logout', 'purchase', 'topup', 'product_add', 'product_edit', 'product_delete', 'product_update', 'user_edit', 'file_upload', 'file_delete', 'error'].map(key => (
                      <div key={key} className={styles.webhookEventRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px' }}>
                          <input type="checkbox" checked={webhookConfig.webhooks?.[key]?.enabled || false} onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhooks: { ...prev.webhooks, [key]: { ...prev.webhooks?.[key], enabled: e.target.checked } } }))} style={{ display: 'inline-block', width: 'auto' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                        </div>
                        <input type="url" value={webhookConfig.webhooks?.[key]?.url || ''} onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhooks: { ...prev.webhooks, [key]: { ...prev.webhooks?.[key], url: e.target.value, enabled: true } } }))} className={styles.modalInput} placeholder="Discord Webhook URL" style={{ flex: 1 }} />
                      </div>
                    ))}
                  </div>
                  <div className={styles.modalActions} style={{ marginTop: '1rem' }}>
                    <button onClick={handleSaveWebhook} disabled={savingWebhook} className={styles.submitBtn}>{savingWebhook ? <Icon name="loading" size="0.8rem" /> : <Icon name="save" size="0.8rem" />} Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "admins" && (
            <div className={styles.tabContent}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                {adminRole === "head" && (
                  <button onClick={() => setShowAdminModal(true)} className={styles.addButton}>
                    <Icon name="add" size="0.8rem" /> Add Admin
                  </button>
                )}
              </div>
              {showAdminModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
      <h2 className={styles.modalTitle}><Icon name="users" size="1rem" /> Add Admin</h2>
      <form onSubmit={handleAddAdmin} className={styles.modalForm}>
        <div className={styles.modalRow}>
          <label className={styles.modalLabel}>Discord ID *</label>
          <input value={adminForm.discordId} onChange={(e) => setAdminForm(prev => ({ ...prev, discordId: e.target.value }))} className={styles.modalInput} placeholder="123456789012345678" required />
        </div>
        <div className={styles.modalRow}>
          <label className={styles.modalLabel}>Name</label>
          <input value={adminForm.name} onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))} className={styles.modalInput} placeholder="ชื่อ Admin" />
        </div>
        <div className={styles.modalRow}>
          <label className={styles.modalLabel}>Role</label>
          <select value={adminForm.role} onChange={(e) => setAdminForm(prev => ({ ...prev, role: e.target.value }))} className={styles.modalInput}>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => setShowAdminModal(false)}>Cancel</button>
          <button type="submit" className={styles.submitBtn}>Add Admin</button>
        </div>
      </form>
    </div>
  </div>
)}
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Discord ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Added By</th>
                      <th>Status</th>
                      {adminRole === "head" && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {adminList.map(admin => (
                      <tr key={admin._id}>
                        <td><small style={{ fontFamily: 'monospace' }}>{admin.discordId}</small></td>
                        <td>{admin.name}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${
                            admin.role === "head" ? styles.statusSuccess : 
                            admin.role === "admin" ? styles.statusPending : 
                            styles.statusDuplicate
                          }`}>
                            {admin.role}
                          </span>
                        </td>
                        <td>{admin.addedBy}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${admin.isActive ? styles.statusSuccess : styles.statusFailed}`}>
                            {admin.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {adminRole === "head" && admin.role !== "head" && (
                          <td>
                            <button onClick={() => handleEditAdmin(admin)} className={styles.editBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                              <Icon name="edit" size="0.7rem" />
                            </button>
                            <button onClick={() => handleDeleteAdmin(admin._id)} className={styles.deleteBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                              <Icon name="delete" size="0.7rem" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}