import { useState, useEffect } from "react";
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
        await addLog(LOG_TYPES.PRODUCT_EDIT, "แก้ไขสินค้า", `แก้ไข "${itemsname}"`, session?.user?.name || "Admin").catch(() => {});
      } else {
        await axios.post("/api/items", payload);
        success("เพิ่มสินค้าสำเร็จ!");
        await addLog(LOG_TYPES.PRODUCT_ADD, "เพิ่มสินค้า", `เพิ่ม "${itemsname}"`, session?.user?.name || "Admin").catch(() => {});
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
  const { data: session } = useSession();
  const { userPoints, refreshPoints } = useUser();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

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
  const [logLimit] = useState(50);
  const [webhookConfig, setWebhookConfig] = useState({ discordWebhook: '', enabled: false, events: [] });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

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
  
  const handleEdit = (item) => { setEditingItem(item); setShowModal(true); };
  
  const handleDelete = async (id, productName) => {
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `คุณต้องการลบ "${productName}"?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" });
    if (!confirmed) return;
    try { 
      await axios.delete(`/api/items?id=${id}`); 
      success("ลบสินค้าสำเร็จ!"); 
      await addLog(LOG_TYPES.PRODUCT_DELETE, "ลบสินค้า", `ลบ "${productName}"`, session?.user?.name || "Admin").catch(() => {});
      fetchItems(); 
    } catch { error("ลบสินค้าไม่สำเร็จ"); }
  };
  
  const handleSaved = () => { setShowModal(false); setEditingItem(null); fetchItems(); };
  const handleVersionUpdate = (item) => { setSelectedProductForVersion(item); setShowVersionModal(true); };
  const handleVersionUpdated = () => { fetchItems(); };

  const fetchTopups = async () => { setLoadingTopups(true); try { const res = await axios.get("/api/admin/topups"); setTopups(res.data || []); } catch { error("โหลดประวัติเติมเงินไม่สำเร็จ"); } finally { setLoadingTopups(false); } };
  useEffect(() => { if (activeTab === "topups") fetchTopups(); }, [activeTab]);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case "success": return { class: "statusSuccess", text: "สำเร็จ", icon: "success" };
      case "pending": return { class: "statusPending", text: "รอตรวจสอบ", icon: "pending" };
      case "error": return { class: "statusFailed", text: "ล้มเหลว", icon: "error" };
      case "duplicate": return { class: "statusDuplicate", text: "ซ้ำ", icon: "warning" };
      default: return { class: "statusPending", text: "รอตรวจสอบ", icon: "pending" };
    }
  };

  const fetchImages = async () => { try { const res = await axios.get("/api/upload"); const files = res.data || []; setImages(files.map(file => typeof file === 'string' ? { url: file, fileName: file.split('/').pop() } : { url: file.url || '', fileName: file.fileName || '' })); } catch { setImages([]); } };
  useEffect(() => { if (activeTab === "uploads") fetchImages(); }, [activeTab]);
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData(); formData.append("file", selectedFile);
    setUploading(true);
    try { 
      await axios.post("/api/upload", formData); 
      success("อัปโหลดสำเร็จ"); 
      await addLog('file_upload', "อัปโหลดไฟล์", `อัปโหลด "${selectedFile.name}"`, session?.user?.name || "Admin").catch(() => {});
      setSelectedFile(null); fetchImages(); 
    } catch { error("เกิดข้อผิดพลาด"); } finally { setUploading(false); }
  };
  
  const handleDeleteFile = async (fileName) => {
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ต้องการลบ "${fileName}"?`, confirmText: "ลบ", cancelText: "ยกเลิก", type: "danger" });
    if (!confirmed) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName }) });
      const data = await res.json();
      if (res.ok) { 
        success("ลบไฟล์สำเร็จ!"); 
        await addLog('file_delete', "ลบไฟล์", `ลบ "${fileName}"`, session?.user?.name || "Admin").catch(() => {});
        fetchImages(); 
      } else throw new Error(data.error);
    } catch (err) { error(err.message); } finally { setDeletingFile(null); }
  };

  const fetchUsers = async () => { try { const res = await axios.get("/api/user/user"); setUsers(res.data || []); } catch { error("โหลดข้อมูลผู้ใช้ล้มเหลว"); } };
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab]);
  
  const fetchUserProducts = async (userId) => { try { const res = await axios.get(`/api/user/fetch-products?userId=${userId}`); setUserProducts(res.data || []); } catch { setUserProducts([]); } };
  
  const applyPointChange = (type) => { const current = Number(selectedUser.points || 0); const amount = Number(changeAmount || 0); if (isNaN(amount) || amount < 0) return error("กรุณากรอกจำนวนแต้มที่ถูกต้อง"); if (type === "add") setProposedPoints(current + amount); else setProposedPoints(Math.max(0, current - amount)); };
  
  const handleRemoveProduct = async (productId, index, productName) => { const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ลบ "${productName}"?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; setActionLoading(true); try { await axios.put("/api/user/remove-product", { userId: selectedUser.id, productId, index }); setUserProducts(prev => prev.filter((_, i) => i !== index)); success("ลบสินค้าสำเร็จ"); } catch (err) { error(err.response?.data?.error || "ลบไม่สำเร็จ"); } finally { setActionLoading(false); } };
  
  const handleSavePoints = async () => {
    setActionLoading(true);
    try { 
      await axios.put("/api/user/points", { userId: selectedUser.id, points: Number(proposedPoints) }); 
      success("บันทึกแต้มสำเร็จ!"); 
      await addLog('user_edit', "แก้ไขแต้มผู้ใช้", `ปรับแต้ม ${selectedUser.name} จาก ${selectedUser.points} เป็น ${proposedPoints}`, session?.user?.name || "Admin").catch(() => {});
      fetchUsers(); await refreshPoints(); setSelectedUser(null); setProposedPoints(0); setChangeAmount(1); 
    } catch (err) { error("ไม่สามารถบันทึกแต้มได้"); } finally { setActionLoading(false); }
  };
  
  const handleSelectUser = async (user) => { setSelectedUser(user); setProposedPoints(user.points || 0); setChangeAmount(1); await fetchUserProducts(user.id); };

  const fetchR2Files = async () => { setLoadingR2Files(true); try { const res = await axios.get("/api/admin/r2-files"); setR2Files(res.data.files || []); } catch { error("ไม่สามารถโหลดไฟล์จาก R2 ได้"); } finally { setLoadingR2Files(false); } };
  
  const handleDeleteR2File = async (fileKey) => { const fileName = fileKey.split('/').pop(); const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ลบ "${fileName}" จาก R2?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; setDeletingR2File(fileKey); try { await axios.delete(`/api/admin/r2-files?key=${encodeURIComponent(fileKey)}`); success("ลบไฟล์จาก R2 สำเร็จ!"); fetchR2Files(); } catch (err) { error("ลบไฟล์ไม่สำเร็จ"); } finally { setDeletingR2File(null); } };
  useEffect(() => { if (activeTab === "r2") fetchR2Files(); }, [activeTab]);

  const fetchLogs = async () => { setLoadingLogs(true); try { const res = await axios.get(`/api/admin/logs?type=${logFilter}&limit=${logLimit}`); setLogs(res.data.logs || []); } catch { error("โหลด logs ไม่สำเร็จ"); } finally { setLoadingLogs(false); } };
  
  const handleClearLogs = async () => { const confirmed = await confirm({ title: "ยืนยันการลบ", message: "ต้องการลบประวัติทั้งหมด?", confirmText: "ลบทั้งหมด", cancelText: "ยกเลิก", type: "danger" }); if (!confirmed) return; try { await axios.delete('/api/admin/logs'); success("ลบประวัติทั้งหมดแล้ว"); fetchLogs(); } catch { error("ลบไม่สำเร็จ"); } };
  
  const fetchWebhookConfig = async () => { try { const res = await axios.get('/api/admin/webhook'); setWebhookConfig(res.data); } catch {} };
  
  const handleSaveWebhook = async () => { setSavingWebhook(true); try { await axios.put('/api/admin/webhook', webhookConfig); success("บันทึก Webhook แล้ว!"); } catch { error("บันทึกไม่สำเร็จ"); } finally { setSavingWebhook(false); } };
  
  const handleTestWebhook = async () => { if (!webhookConfig.discordWebhook) return error("กรุณากรอก Discord Webhook URL"); setTestingWebhook(true); try { await axios.post(webhookConfig.discordWebhook, { embeds: [{ title: "🧪 ทดสอบ Webhook", description: "ข้อความทดสอบจาก xCloud Studio", color: 0x6366f1, timestamp: new Date().toISOString(), footer: { text: "xCloud Studio" } }] }); success("ส่งข้อความทดสอบไป Discord แล้ว!"); } catch (err) { error("ส่งไม่สำเร็จ: " + err.message); } finally { setTestingWebhook(false); } };
  useEffect(() => { if (activeTab === "logs") { fetchLogs(); fetchWebhookConfig(); } }, [activeTab, logFilter]);

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "orders", label: "Orders", icon: "order" },
    { key: "products", label: "Products", icon: "product" },
    { key: "topups", label: "เติมเงิน", icon: "money" },
    { key: "uploads", label: "Uploads", icon: "upload" },
    { key: "r2", label: "R2 Files", icon: "cloud" },
    { key: "logs", label: "Logs", icon: "history" },
    { key: "users", label: "Users", icon: "users" },
  ];

  return (
    <div className="main-container">
      <Head><title>xCloud Studio Admin</title></Head>
      <header className="header">
        <section className="headersc">
          <Link href="/" className="headersca"><img src="/favicon.ico" className="icon" alt="logo" /><strong className="uppercase"><span className="tuppercase">xCloud</span>Studio</strong></Link>
          <div className="header-links">{tabs.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`headertext ${activeTab === tab.key ? 'active' : ''}`}><Icon name={tab.icon} size="1rem" /><span style={{ marginLeft: "0.5rem" }}>{tab.label}</span></button>))}</div>
          <div className="profile-container">
            {session ? (<Link href="/profile" className="items-centerpics"><img src={session.user.image} alt="Profile" className="profile-pic" /><span className="profile-text">{userPoints?.toLocaleString() || 0} Point</span></Link>) : (<button onClick={() => signIn("discord")} className="header-discord-login"><img src="/images/discord.png" className="header-discord-icon" alt="discord" /><span className="discord-text-login">login</span></button>)}
          </div>
          <div className="header-menu-icon" onClick={() => document.querySelector('.header-links').classList.toggle('active')}><i className="fas fa-bars"></i></div>
        </section>
      </header>

      <main className={styles.container}>
        <div className={styles.adminTabs}>{tabs.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${styles.adminTab} ${activeTab === tab.key ? styles.adminTabActive : ''}`}><Icon name={tab.icon} size="1rem" /><span style={{ marginLeft: "0.5rem" }}>{tab.label}</span></button>))}</div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="dashboard" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>Admin Dashboard</span></h1></section>
          <div className={styles.statsRow}>{[{ icon: "product", value: stats.products, label: "Products" },{ icon: "order", value: stats.orders, label: "Orders" },{ icon: "users", value: stats.users, label: "Users" },{ icon: "money", value: `฿${stats.revenue.toLocaleString()}`, label: "Revenue" }].map((stat, i) => (<div key={i} className={styles.statCard}><div className={styles.statIcon}><Icon name={stat.icon} size="1.5rem" /></div><div className={styles.statInfo}><h3>{stat.value}</h3><p>{stat.label}</p></div></div>))}</div>
        </>)}

        {/* ORDERS */}
        {activeTab === "orders" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="order" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>รายการคำสั่งซื้อ</span></h1></section>
          <div className={styles.statsRow}>{[{ value: `฿${totalRevenue.toLocaleString()}`, label: "ยอดขายรวม", icon: "money" },{ value: `${totalOrders} รายการ`, label: "จำนวนคำสั่งซื้อ", icon: "order" },{ value: topMod, label: "Mod ขายดีที่สุด", icon: "winner", small: true }].map((s, i) => (<div key={i} className={styles.statCard}><div className={styles.statIcon}><Icon name={s.icon} size="1.5rem" /></div><div className={styles.statInfo}><h3 style={s.small ? { fontSize: '0.9rem' } : {}}>{s.value}</h3><p>{s.label}</p></div></div>))}</div>
          <div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th>สินค้า</th><th>ผู้ซื้อ</th><th>ราคา</th><th>วันที่</th></tr></thead><tbody>{orders.map((order, i) => (<tr key={i}><td>{order.productName || order.productId}</td><td>{order.buyerName || order.buyerId}</td><td>{order.price} ฿</td><td>{order.purchaseDate ? new Date(order.purchaseDate).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}</td></tr>))}</tbody></table></div>
        </>)}

        {/* TOPUPS */}
        {activeTab === "topups" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="money" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>ประวัติการเติมเงิน</span></h1></section>
          {loadingTopups ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>กำลังโหลด...</p></div> : topups.length === 0 ? <div className={styles.emptyState}><Icon name="history" size="3rem" /><p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p></div> : (<div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th>วันที่</th><th>ผู้ใช้</th><th>จำนวนเงิน</th><th>Reference</th><th>สลิป</th><th>สถานะ</th></tr></thead><tbody>{topups.map((topup) => { const statusInfo = getStatusBadge(topup.status); return (<tr key={topup._id}><td>{new Date(topup.createdAt).toLocaleString("th-TH")}</td><td><strong>{topup.userName}</strong><br /><small>ID: {topup.userId}</small></td><td>฿{topup.amount?.toLocaleString()}</td><td><small>{topup.transRef || "-"}</small></td><td>{topup.slipUrl ? <a href={topup.slipUrl} target="_blank" className={styles.slipLink}><Icon name="link" size="0.7rem" /> ดูสลิป</a> : <span style={{ color: "#6b7280" }}>ไม่มีสลิป</span>}</td><td><span className={`${styles.statusBadge} ${styles[statusInfo.class]}`}><Icon name={statusInfo.icon} size="0.7rem" /><span style={{ marginLeft: "0.3rem" }}>{statusInfo.text}</span></span></td></tr>); })}</tbody></table></div>)}
        </>)}

        {/* PRODUCTS */}
        {activeTab === "products" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="product" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>จัดการสินค้า (MOD)</span></h1><div className={styles.headerButtons}><button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.addButton}><Icon name="add" size="0.8rem" /><span>เพิ่มสินค้า</span></button></div></section>
          {showModal && <ProductModal editingItem={editingItem} onClose={() => { setShowModal(false); setEditingItem(null); }} onSaved={handleSaved} />}
          {showVersionModal && selectedProductForVersion && <VersionUpdateModal product={selectedProductForVersion} onClose={() => { setShowVersionModal(false); setSelectedProductForVersion(null); }} onUpdated={handleVersionUpdated} />}
          <div className={styles.productGrid}>{items.length === 0 ? <div className={styles.emptyState}><p>ยังไม่มีสินค้าในระบบ</p></div> : items.map((item) => (<div key={item._id} className={styles.productCard}><img src={item.itemsimage} alt={item.itemsname} className={styles.productImage} /><div className={styles.cardBody}><h3 className={styles.productName}>{item.itemsname}</h3><p className={styles.productTitle}>{item.itemstitle}</p><p className={styles.productDesc}>{item.itemsdesc}</p><div className={styles.productMeta}><span className={styles.productPrice}>฿{item.itemsprice}</span><span className={styles.productVersion}>v{item.itemsversion}</span></div>{item.discordRoleIds?.length > 0 && <div className={styles.productRoleId}><Icon name="role" size="0.7rem" /><small> Role IDs: {item.discordRoleIds.join(", ")}</small></div>}</div><div className={styles.cardActions}><button onClick={() => handleEdit(item)} className={styles.editBtn}><Icon name="edit" size="0.8rem" /><span>แก้ไข</span></button><button onClick={() => handleVersionUpdate(item)} className={styles.versionBtn}><Icon name="refresh" size="0.8rem" /><span>อัปเดต</span></button><button onClick={() => handleDelete(item._id, item.itemsname)} className={styles.deleteBtn}><Icon name="delete" size="0.8rem" /><span>ลบ</span></button></div></div>))}</div>
        </>)}

        {/* UPLOADS */}
        {activeTab === "uploads" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="upload" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>อัปโหลดไฟล์</span></h1></section>
          <div className={styles.uploadSection}>
            <label className={`custom-file-upload ${uploading ? 'uploading' : ''} ${selectedFile ? 'has-file' : ''}`}>
              {uploading ? <><span><Icon name="loading" size="0.8rem" /> กำลังอัปโหลด...</span><div className={styles.uploadProgressBar}><div className={styles.uploadProgressFill}></div></div></> : selectedFile ? <><span><Icon name="check" size="0.8rem" /> {selectedFile.name}</span><small>({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</small></> : <><span><Icon name="upload" size="0.8rem" /> คลิกเพื่อเลือกไฟล์</span><small>รองรับทุกประเภทไฟล์ (สูงสุด 2GB)</small></>}
              <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} disabled={uploading} />
            </label>
            {selectedFile && !uploading && <button onClick={() => setSelectedFile(null)} className={styles.cancelBtn}><Icon name="close" size="0.7rem" /> ยกเลิก</button>}
            <button onClick={handleUpload} disabled={!selectedFile || uploading} className={styles.addButton}>{uploading ? <><Icon name="loading" size="0.8rem" />...</> : <><Icon name="upload" size="0.8rem" /><span>อัปโหลด</span></>}</button>
          </div>
          {images.length > 0 && (<div className={styles.galleryContainer}>{groupFilesByCategory(images).map((category) => (<div key={category.key} className={styles.galleryCategory}><div className={styles.galleryCategoryHeader}><span className={styles.galleryCategoryIcon}>{category.icon}</span><span className={styles.galleryCategoryLabel}>{category.label}</span><span className={styles.galleryCategoryCount}>{category.files.length} ไฟล์</span></div><div className={styles.galleryGrid}>{category.files.map((file) => (<div key={file.url} className={styles.galleryItem}>{isImageFile(file.fileName) ? <div className={styles.galleryImageWrapper}><img src={file.url} alt={file.fileName} className={styles.galleryThumb} loading="lazy" /></div> : <div className={styles.galleryFileWrapper}><Icon name="file" size="1.5rem" /><span className={styles.galleryFileName}>{file.fileName}</span></div>}<div className={styles.galleryItemInfo}><input type="text" value={file.url} readOnly className={styles.galleryUrl} onClick={(e) => e.target.select()} /><div className={styles.galleryActions}><button onClick={() => { navigator.clipboard.writeText(file.url); success("คัดลอกลิงก์แล้ว!"); }} className={styles.galleryCopyBtn}><Icon name="copy" size="0.8rem" /></button><a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.galleryOpenBtn}><Icon name="link" size="0.8rem" /></a><button onClick={() => handleDeleteFile(file.fileName)} disabled={deletingFile === file.fileName} className={styles.galleryDeleteBtn}>{deletingFile === file.fileName ? <Icon name="loading" size="0.8rem" /> : <Icon name="delete" size="0.8rem" />}</button></div></div></div>))}</div></div>))}</div>)}
          {images.length === 0 && !uploading && <div className={styles.emptyState}><Icon name="file" size="3rem" /><p className={styles.emptyTitle}>ยังไม่มีไฟล์ที่อัปโหลด</p><p className={styles.emptyText}>เลือกไฟล์แล้วคลิกอัปโหลด</p></div>}
        </>)}

        {/* R2 FILES */}
        {activeTab === "r2" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="cloud" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>จัดการไฟล์ Cloudflare R2</span></h1></section>
          <div className={styles.r2UploadArea}><h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#e4e6f0' }}><Icon name="cloud" size="1rem" /> อัปโหลดไฟล์ไป R2</h3><R2Uploader onUploadComplete={() => { success("อัปโหลดไฟล์ไป R2 สำเร็จ!"); fetchR2Files(); }} accept="*/*" maxSize={5000} /><small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}><Icon name="info" size="0.6rem" /> รองรับทุกไฟล์ สูงสุด 5GB</small></div>
          <div className={styles.r2FilesSection}><div className={styles.r2FilesHeader}><h3><Icon name="cloud" size="1rem" /><span style={{ marginLeft: '0.5rem' }}>ไฟล์ใน R2 ({r2Files.length})</span></h3><button onClick={fetchR2Files} className={styles.r2RefreshBtn}><Icon name="refresh" size="0.8rem" /><span>รีเฟรช</span></button></div>
          {loadingR2Files ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>กำลังโหลด...</p></div> : r2Files.length === 0 ? <div className={styles.emptyState}><Icon name="cloud" size="3rem" /><p className={styles.emptyTitle}>ยังไม่มีไฟล์ใน R2</p><p className={styles.emptyText}>อัปโหลดไฟล์เพื่อเริ่มต้น</p></div> : (<div className={styles.r2FilesGrid}>{r2Files.map((file) => (<div key={file.key} className={styles.r2FileCard}>{isImageFile(file.fileName) ? <div className={styles.r2FilePreview}><img src={file.url} alt={file.fileName} className={styles.r2FileThumb} loading="lazy" /></div> : <div className={styles.r2FileIcon}><Icon name="file" size="2.5rem" /><span className={styles.r2FileType}>{file.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span></div>}<div className={styles.r2FileInfo}><p className={styles.r2FileName} title={file.fileName}>{file.fileName}</p><p className={styles.r2FileSize}>{file.sizeFormatted || 'Unknown'}</p>{file.lastModified && <p className={styles.r2FileDate}><Icon name="calendar" size="0.6rem" /> {new Date(file.lastModified).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p>}</div><div className={styles.r2FileActions}><button onClick={() => { navigator.clipboard.writeText(file.url); success("คัดลอกลิงก์แล้ว!"); }} className={styles.r2CopyBtn}><Icon name="copy" size="0.8rem" /></button><a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.r2OpenBtn}><Icon name="link" size="0.8rem" /></a><button onClick={() => handleDeleteR2File(file.key)} disabled={deletingR2File === file.key} className={styles.r2DeleteBtn}>{deletingR2File === file.key ? <Icon name="loading" size="0.8rem" /> : <Icon name="delete" size="0.8rem" />}</button></div></div>))}</div>)}</div>
        </>)}

        {/* USERS */}
        {activeTab === "users" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="users" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>ผู้ใช้ทั้งหมด</span></h1></section>
          <div className={styles.userGrid}>{users.map(user => (<div key={user.id} className={styles.userCard} onClick={() => handleSelectUser(user)}><div className={styles.userInfoLeft}><h2 className={styles.userNameCard}>{user.name}</h2><p><Icon name="coin" size="0.7rem" /> {user.points?.toLocaleString() || 0} point</p></div><div className={styles.userInfoRight}><p>{user.email}</p><p className={styles.userDetailLink}><Icon name="info" size="0.7rem" /> ดูข้อมูลเพิ่มเติม →</p></div></div>))}</div>
          {selectedUser && (<div className={styles.modalOverlay} onClick={() => !actionLoading && setSelectedUser(null)}><div className={styles.userDetailModal} onClick={(e) => e.stopPropagation()}><button className={styles.modalCloseBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}><Icon name="close" size="0.8rem" /></button><div className={styles.userDetailHeader}><div className={styles.userAvatarLarge}>{selectedUser.name?.charAt(0)?.toUpperCase() || '?'}</div><div><h2 className={styles.userDetailName}>{selectedUser.name}</h2><p className={styles.userDetailEmail}>{selectedUser.email}</p></div></div><div className={styles.userInfoCards}><div className={styles.userInfoCard}><Icon name="user" size="1.2rem" /><div><p className={styles.userInfoCardLabel}>Discord ID</p><p className={styles.userInfoCardValue}>{selectedUser.id}</p></div></div><div className={styles.userInfoCard}><Icon name="coin" size="1.2rem" /><div><p className={styles.userInfoCardLabel}>Points คงเหลือ</p><p className={styles.userInfoCardValueHighlight}>{selectedUser.points?.toLocaleString() || 0} Point</p></div></div></div><div className={styles.userDetailDivider}><span><Icon name="settings" size="0.7rem" /> จัดการแต้ม</span></div><div className={styles.pointAdjustSection}><div className={styles.pointAdjustInput}><label className={styles.pointAdjustLabel}>จำนวนที่ต้องการเพิ่ม/ลด</label><input type="number" className={styles.pointInput} value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} min="1" /></div><div className={styles.pointAdjustButtons}><button className={styles.pointAddBtn} onClick={() => applyPointChange("add")} disabled={actionLoading}><Icon name="add" size="0.8rem" /> เพิ่มแต้ม</button><button className={styles.pointSubtractBtn} onClick={() => applyPointChange("subtract")} disabled={actionLoading}><Icon name="remove" size="0.8rem" /> ลบแต้ม</button></div><div className={styles.pointPreview}><span className={styles.pointPreviewLabel}>แต้มใหม่</span><span className={styles.pointPreviewValue}>{proposedPoints?.toLocaleString() || 0} Point</span></div><div className={styles.pointActionButtons}><button className={styles.pointSaveBtn} onClick={handleSavePoints} disabled={actionLoading}>{actionLoading ? <Icon name="loading" size="0.8rem" /> : <Icon name="save" size="0.8rem" />}<span>{actionLoading ? "กำลังบันทึก..." : "ยืนยัน"}</span></button><button className={styles.pointCancelBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}>ยกเลิก</button></div></div><div className={styles.userDetailDivider}><span><Icon name="cart" size="0.7rem" /> สินค้าที่ซื้อ ({userProducts.length})</span></div><div className={styles.purchasedProducts}>{userProducts.length > 0 ? userProducts.map((item, index) => (<div key={index} className={styles.purchasedProductCard}><div className={styles.purchasedProductInfo}><h4 className={styles.purchasedProductName}>{item.name}</h4><div className={styles.purchasedProductMeta}><span className={styles.purchasedProductVersion}><Icon name="product" size="0.7rem" /> v{item.version}</span><span className={styles.purchasedProductDate}><Icon name="calendar" size="0.7rem" /> {new Date(item.purchaseDate).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}</span></div><div className={styles.purchasedProductLinks}><a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.purchasedProductDownload}><Icon name="download" size="0.8rem" /> ดาวน์โหลด</a>{item.discordRoleIds?.length > 0 && <span className={styles.purchasedProductRoles}><Icon name="role" size="0.7rem" /> Role: {item.discordRoleIds.join(", ")}</span>}</div></div><button className={styles.purchasedProductRemoveBtn} onClick={() => handleRemoveProduct(item.productId, index, item.name)} disabled={actionLoading}><Icon name="delete" size="0.8rem" /></button></div>)) : <div className={styles.noProducts}><Icon name="product" size="2rem" /><p>ยังไม่มีสินค้าที่ซื้อ</p></div>}</div></div></div>)}
        </>)}

        {/* LOGS + WEBHOOK */}
        {activeTab === "logs" && (<>
          <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="history" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>ประวัติการทำงาน (Logs)</span></h1></section>
          <div className={styles.logFilterBar}>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className={styles.logSelect}>
              <option value="all">ทั้งหมด</option>
              <option value="login"><Icon name="login" size="0.7rem" /> ล็อคอิน</option>
              <option value="logout"><Icon name="logout" size="0.7rem" /> ล็อคเอาท์</option>
              <option value="purchase"><Icon name="cart" size="0.7rem" /> ซื้อสินค้า</option>
              <option value="topup"><Icon name="money" size="0.7rem" /> เติมเงิน</option>
              <option value="product_add"><Icon name="add" size="0.7rem" /> เพิ่มสินค้า</option>
              <option value="product_edit"><Icon name="edit" size="0.7rem" /> แก้ไขสินค้า</option>
              <option value="product_delete"><Icon name="delete" size="0.7rem" /> ลบสินค้า</option>
              <option value="user_edit"><Icon name="user" size="0.7rem" /> แก้ไขผู้ใช้</option>
              <option value="file_upload"><Icon name="upload" size="0.7rem" /> อัปโหลดไฟล์</option>
              <option value="file_delete"><Icon name="delete" size="0.7rem" /> ลบไฟล์</option>
              <option value="error"><Icon name="error" size="0.7rem" /> ข้อผิดพลาด</option>
            </select>
            <button onClick={fetchLogs} className={styles.logRefreshBtn}><Icon name="refresh" size="0.8rem" /><span>รีเฟรช</span></button>
            <button onClick={handleClearLogs} className={styles.logClearBtn}><Icon name="delete" size="0.8rem" /><span>ล้างทั้งหมด</span></button>
          </div>
          {loadingLogs ? <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>กำลังโหลด...</p></div> : logs.length === 0 ? <div className={styles.emptyState}><Icon name="history" size="3rem" /><p className={styles.emptyTitle}>ยังไม่มีประวัติ</p></div> : (<div className={styles.tableWrapper}><table className={styles.dataTable}><thead><tr><th style={{ width: '140px' }}>วันที่</th><th style={{ width: '100px' }}>ประเภท</th><th>เรื่อง</th><th style={{ width: '120px' }}>ผู้ใช้</th></tr></thead><tbody>{logs.map((log) => (<tr key={log._id}><td style={{ fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</td><td><span className={styles.logBadge}>{log.type === 'login' ? <><Icon name="login" size="0.7rem" /> ล็อคอิน</> : log.type === 'logout' ? <><Icon name="logout" size="0.7rem" /> ล็อคเอาท์</> : log.type === 'purchase' ? <><Icon name="cart" size="0.7rem" /> ซื้อ</> : log.type === 'topup' ? <><Icon name="money" size="0.7rem" /> เติมเงิน</> : log.type === 'product_add' ? <><Icon name="add" size="0.7rem" /> เพิ่ม</> : log.type === 'product_edit' ? <><Icon name="edit" size="0.7rem" /> แก้ไข</> : log.type === 'product_delete' ? <><Icon name="delete" size="0.7rem" /> ลบ</> : log.type === 'user_edit' ? <><Icon name="user" size="0.7rem" /> ผู้ใช้</> : log.type === 'file_upload' ? <><Icon name="upload" size="0.7rem" /> อัปโหลด</> : log.type === 'file_delete' ? <><Icon name="delete" size="0.7rem" /> ลบไฟล์</> : log.type === 'error' ? <><Icon name="error" size="0.7rem" /> ผิดพลาด</> : log.type}</span></td><td><strong>{log.title}</strong>{log.message && <><br /><small style={{ color: '#9ca3af' }}>{log.message}</small></>}</td><td style={{ fontSize: '0.8rem' }}>{log.user}</td></tr>))}</tbody></table></div>)}
          <div style={{ marginTop: '2rem' }}>
            <section className={styles.header}><h1 className={styles.headerTitle}><Icon name="settings" size="1.2rem" /><span style={{ marginLeft: "0.5rem" }}>ตั้งค่า Discord Webhook</span></h1></section>
            <div className={styles.webhookForm}>
              <div className={styles.modalRow}><label className={styles.modalLabel}>Discord Webhook URL</label><input type="url" value={webhookConfig.discordWebhook} onChange={(e) => setWebhookConfig(prev => ({ ...prev, discordWebhook: e.target.value }))} className={styles.modalInput} placeholder="https://discord.com/api/webhooks/..." /></div>
              <div className={styles.modalRow}><label className={styles.modalLabel} style={{ display: 'flex', alignItems: 'center', textTransform: 'none' }}><input type="checkbox" checked={webhookConfig.enabled} onChange={(e) => setWebhookConfig(prev => ({ ...prev, enabled: e.target.checked }))} style={{ marginRight: '0.5rem', display: 'inline-block', width: 'auto' }} /> เปิดใช้งาน Webhook</label></div>
              <div className={styles.modalRow}><label className={styles.modalLabel}>แจ้งเตือนเมื่อเกิดเหตุการณ์:</label><div className={styles.webhookEvents}>{['login', 'logout', 'purchase', 'topup', 'product_add', 'product_edit', 'product_delete', 'user_edit', 'error'].map(key => (<label key={key} className={styles.webhookEventCheckbox}><input type="checkbox" checked={webhookConfig.events?.includes(key)} onChange={(e) => { const events = e.target.checked ? [...(webhookConfig.events || []), key] : (webhookConfig.events || []).filter(k => k !== key); setWebhookConfig(prev => ({ ...prev, events })); }} /><span>{key === 'login' ? <><Icon name="login" size="0.7rem" /> ล็อคอิน</> : key === 'logout' ? <><Icon name="logout" size="0.7rem" /> ล็อคเอาท์</> : key === 'purchase' ? <><Icon name="cart" size="0.7rem" /> ซื้อสินค้า</> : key === 'topup' ? <><Icon name="money" size="0.7rem" /> เติมเงิน</> : key === 'product_add' ? <><Icon name="add" size="0.7rem" /> เพิ่มสินค้า</> : key === 'product_edit' ? <><Icon name="edit" size="0.7rem" /> แก้ไขสินค้า</> : key === 'product_delete' ? <><Icon name="delete" size="0.7rem" /> ลบสินค้า</> : key === 'user_edit' ? <><Icon name="user" size="0.7rem" /> แก้ไขผู้ใช้</> : <><Icon name="error" size="0.7rem" /> ข้อผิดพลาด</>}</span></label>))}</div></div>
              <div className={styles.modalActions}><button onClick={handleTestWebhook} disabled={testingWebhook} className={styles.cancelBtn}>{testingWebhook ? <><Icon name="loading" size="0.8rem" />...</> : <><Icon name="bell" size="0.8rem" /> ทดสอบ</>}</button><button onClick={handleSaveWebhook} disabled={savingWebhook} className={styles.submitBtn}>{savingWebhook ? <><Icon name="loading" size="0.8rem" />...</> : <><Icon name="save" size="0.8rem" /> บันทึก</>}</button></div>
            </div>
          </div>
        </>)}
      </main>
    </div>
  );
}