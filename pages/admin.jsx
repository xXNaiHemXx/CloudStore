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
  const { confirm } = useConfirm();
  const { success, error, warning } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

    if (file.size > 10 * 1024 * 1024) {
      error("ไฟล์รูปใหญ่เกินไป (สูงสุด 10MB)");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok) {
        setItemsimage(result.url);
        setPreviewImage(result.url);
        success("อัปโหลดรูปสำเร็จ!");
      } else {
        error("อัปโหลดรูปไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Upload error:", err);
      error("เกิดข้อผิดพลาดในการอัปโหลดรูป");
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
      error("กรุณากรอกชื่อสินค้าและราคาก่อนบันทึก!");
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
        success("แก้ไขสินค้าสำเร็จ!");
      } else {
        await axios.post("/api/items", payload);
        success("เพิ่มสินค้าสำเร็จ!");
      }
      onSaved();
    } catch (err) {
      console.error("Save error:", err);
      error(`เกิดข้อผิดพลาด: ${err.response?.data?.error || err.message}`);
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
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>หรืออัปโหลดไฟล์จากเครื่อง (R2)</label>
            <R2Uploader
              onUploadComplete={(publicUrl) => {
                setItemsfile(publicUrl);
                success("อัปโหลดไฟล์ไป R2 สำเร็จ!");
              }}
              accept=".zip,.rar,.7z,.scs,.exe,.msi"
              maxSize={2000}
            />
            {itemsfile && !uploadingFile && (
              <small style={{ color: '#10b981', marginTop: '4px', display: 'block' }}>
                ✅ ไฟล์พร้อมให้ดาวน์โหลดจาก R2
              </small>
            )}
            <small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
              💡 รองรับ .zip, .rar, .7z, .scs, .exe, .msi | อัปโหลดตรงไป Cloudflare R2
            </small>
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ราคาสินค้า *</label>
            <input 
              value={itemsprice} 
              onChange={(e) => setItemsprice(e.target.value)} 
              className={styles.modalInput} 
              type="number" 
              required 
              min="0"
              step="1"
            />
            <small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
              💰 ราคาในหน่วย Point
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { success, error } = useToast();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 2000 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      error(`ไฟล์ใหญ่เกินไป (สูงสุด 2GB)`);
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/admin/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30 * 60 * 1000,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
          console.log(`📤 Upload progress: ${percent}%`);
        },
      });

      if (res.data.success) {
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}${res.data.url}`;
        setNewFileUrl(fullUrl);
        success(`อัปโหลดสำเร็จ! (${res.data.sizeMB}MB)`);
      }
    } catch (err) {
      console.error(err);
      error("อัปโหลดไม่สำเร็จ: " + (err.response?.data?.error || err.message));
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleFileUrlChange = (value) => {
    if (value.startsWith('/uploads/')) {
      const baseUrl = window.location.origin;
      setNewFileUrl(`${baseUrl}${value}`);
    } else {
      setNewFileUrl(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalUrl = newFileUrl;
    if (finalUrl.startsWith('/uploads/')) {
      const baseUrl = window.location.origin;
      finalUrl = `${baseUrl}${finalUrl}`;
    }
    if (!newVersion || !finalUrl) {
      error("กรุณากรอกเวอร์ชันใหม่และลิงก์ไฟล์");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/update-version", {
        productId: product._id,
        newVersion,
        newFileUrl: finalUrl,
        changelog
      });
      if (res.data.success) {
        success(`อัปเดตเวอร์ชันสำเร็จ! แจ้งเตือนผู้ใช้ ${res.data.notifiedUsers} คน`);
        onUpdated();
        onClose();
      }
    } catch (err) {
      console.error(err);
      error("อัปเดตไม่สำเร็จ: " + (err.response?.data?.error || err.message));
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
            <label className={styles.modalLabel}>อัปโหลดไฟล์ใหม่ (Cloudflare R2)</label>

            <R2Uploader
              onUploadComplete={(publicUrl) => {
                setNewFileUrl(publicUrl);
                success("อัปโหลดไฟล์ไป R2 สำเร็จ!");
              }}
              accept=".zip,.rar,.7z,.scs,.exe,.msi"
              maxSize={5000}
            />

            {newFileUrl && (
              <small
                style={{
                  color: "#10b981",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                ✅ ไฟล์ใหม่พร้อมดาวน์โหลดแล้ว
              </small>
            )}

            <small
              style={{
                color: "#6b7280",
                fontSize: "0.7rem",
                marginTop: "4px",
                display: "block",
              }}
            >
              💡 อัปโหลดตรงไป Cloudflare R2 รองรับไฟล์ใหญ่หลาย GB
            </small>
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>ลิงก์ไฟล์ใหม่ *</label>
            <input 
              type="text" 
              value={newFileUrl} 
              onChange={(e) => handleFileUrlChange(e.target.value)} 
              className={styles.modalInput} 
              placeholder="https://yourdomain.com/uploads/ไฟล์.scs หรือ /uploads/ชื่อไฟล์.scs"
            />
            <small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
              💡 ใส่ URL แบบเต็ม หรือ /uploads/ชื่อไฟล์.scs (ระบบจะแปลงให้อัตโนมัติ)
            </small>
          </div>
          <div className={styles.modalRow}>
            <label className={styles.modalLabel}>รายการอัปเดต (Changelog)</label>
            <textarea 
              value={changelog} 
              onChange={(e) => setChangelog(e.target.value)} 
              className={styles.modalTextarea} 
              rows="4" 
              placeholder="- แก้ไขบัค XYZ&#10;- เพิ่มฟีเจอร์ใหม่" 
            />
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
  
  const handleDelete = async (id, productName) => {
    const confirmed = await confirm({
      title: "ยืนยันการลบ",
      message: `คุณต้องการลบสินค้า "${productName}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถกู้คืนได้`,
      confirmText: "ลบเลย",
      cancelText: "ยกเลิก",
      type: "danger",
    });
    if (!confirmed) return;
    try {
      await axios.delete(`/api/items?id=${id}`);
      success("ลบสินค้าสำเร็จ!");
      fetchItems();
    } catch (err) {
      error("ลบสินค้าไม่สำเร็จ");
    }
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
  
  const fetchTopups = async () => {
    setLoadingTopups(true);
    try {
      const res = await axios.get("/api/admin/topups");
      setTopups(res.data || []);
    } catch (err) {
      console.error("Error fetching topups:", err);
      error("โหลดประวัติเติมเงินไม่สำเร็จ");
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
      case "success": return { class: "statusSuccess", text: "สำเร็จ", icon: "success" };
      case "pending": return { class: "statusPending", text: "รอตรวจสอบ", icon: "pending" };
      case "error": return { class: "statusFailed", text: "ล้มเหลว", icon: "error" };
      case "duplicate": return { class: "statusDuplicate", text: "ซ้ำ", icon: "warning" };
      default: return { class: "statusPending", text: "รอตรวจสอบ", icon: "pending" };
    }
  };
  
  const fetchImages = async () => {
    try {
      const res = await axios.get("/api/upload"); // ✅ ใช้ /api/upload (GET)
      setImages(res.data || []);
    } catch (err) { 
      console.error("ไม่สามารถโหลดรูปภาพได้:", err);
      error("ไม่สามารถโหลดรูปภาพได้"); 
    }
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
      success("อัปโหลดสำเร็จ");
      setSelectedFile(null);
      fetchImages();
    } catch { error("เกิดข้อผิดพลาดในการอัปโหลดรูป"); }
    finally { setUploading(false); }
  };
  
  const handleDeleteFile = async (fileName) => {
    const confirmed = await confirm({
      title: "ยืนยันการลบ",
      message: `ต้องการลบ "${fileName}"?`,
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
      type: "danger",
    });
    if (!confirmed) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      const data = await res.json();
      if (res.ok) {
        success("ลบไฟล์สำเร็จ!");
        fetchImages();
      } else {
        throw new Error(data.error || 'ลบไม่สำเร็จ');
      }
    } catch (err) {
      error(err.message);
    } finally {
      setDeletingFile(null);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/user/user");
      setUsers(res.data || []);
    } catch { error("โหลดข้อมูลผู้ใช้ล้มเหลว"); }
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
    if (isNaN(amount) || amount < 0) return error("กรุณากรอกจำนวนแต้มที่ถูกต้อง");
    if (type === "add") setProposedPoints(current + amount);
    else setProposedPoints(Math.max(0, current - amount));
  };

  const handleRemoveProduct = async (productId, index, productName) => {
    const confirmed = await confirm({
      title: "ยืนยันการลบ",
      message: `คุณต้องการลบสินค้า "${productName}" ออกจากบัญชีผู้ใช้ใช่หรือไม่?`,
      confirmText: "ลบเลย",
      cancelText: "ยกเลิก",
      type: "danger",
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await axios.put("/api/user/remove-product", { userId: selectedUser.id, productId, index });
      setUserProducts((prev) => prev.filter((_, i) => i !== index));
      success("ลบสินค้าสำเร็จ");
    } catch (err) {
      console.error(err);
      error(err.response?.data?.error || "ลบสินค้าไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePoints = async () => {
    setActionLoading(true);
    try {
      await axios.put("/api/user/points", { userId: selectedUser.id, points: Number(proposedPoints) });
      success("บันทึกแต้มสำเร็จ!");
      fetchUsers();
      await refreshPoints();
      setSelectedUser(null);
      setProposedPoints(0);
      setChangeAmount(1);
    } catch (err) {
      console.error("Save points error:", err);
      error("ไม่สามารถบันทึกแต้มได้: " + (err.response?.data?.error || err.message));
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
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "orders", label: "Orders", icon: "order" },
    { key: "products", label: "Products", icon: "product" },
    { key: "topups", label: "เติมเงิน", icon: "money" },
    { key: "uploads", label: "Uploads", icon: "upload" },
    { key: "users", label: "Users", icon: "users" },
  ];

  return (
    <div className="main-container">
      <Head>
        <title>xCloud Studio Admin</title>
      </Head>

      <header className="header">
        <section className="headersc">
          <Link href="/" className="headersca">
            <img src="/favicon.ico" className="icon" alt="logo" />
            <strong className="uppercase"><span className="tuppercase">xCloud</span>Studio</strong>
          </Link>
          <div className="header-links">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`headertext ${activeTab === tab.key ? 'active' : ''}`}>
                <Icon name={tab.icon} size="1rem" />
                <span style={{ marginLeft: "0.5rem" }}>{tab.label}</span>
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

      <main className={styles.container}>
        <div className={styles.adminTabs}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${styles.adminTab} ${activeTab === tab.key ? styles.adminTabActive : ''}`}>
              <Icon name={tab.icon} size="1rem" />
              <span style={{ marginLeft: "0.5rem" }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>
                <Icon name="dashboard" size="1.2rem" />
                <span style={{ marginLeft: "0.5rem" }}>Admin Dashboard</span>
              </h1>
            </section>
            <div className={styles.statsRow}> 
              {[
                { icon: "product", value: stats.products, label: "Products" },
                { icon: "order", value: stats.orders, label: "Orders" },
                { icon: "users", value: stats.users, label: "Users" },
                { icon: "money", value: `฿${stats.revenue.toLocaleString()}`, label: "Revenue" },
              ].map((stat, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Icon name={stat.icon} size="1.5rem" />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{stat.value}</h3>
                    <p>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>
                <Icon name="order" size="1.2rem" />
                <span style={{ marginLeft: "0.5rem" }}>รายการคำสั่งซื้อ</span>
              </h1>
            </section>
            <div className={styles.statsRow}>
              {[
                { value: `฿${totalRevenue.toLocaleString()}`, label: "ยอดขายรวม", icon: "money" },
                { value: `${totalOrders} รายการ`, label: "จำนวนคำสั่งซื้อ", icon: "order" },
                { value: topMod, label: "Mod ขายดีที่สุด", icon: "winner", small: true },
              ].map((s, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Icon name={s.icon} size="1.5rem" />
                  </div>
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
        
        {/* TOPUPS HISTORY */}
        {activeTab === "topups" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>
                <Icon name="money" size="1.2rem" />
                <span style={{ marginLeft: "0.5rem" }}>ประวัติการเติมเงิน</span>
              </h1>
            </section>
            {loadingTopups ? (
              <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>กำลังโหลด...</p></div>
            ) : topups.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon name="history" size="3rem" />
                <p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr><th>วันที่</th><th>ผู้ใช้</th><th>จำนวนเงิน</th><th>Reference</th><th>สลิป</th><th>สถานะ</th></tr>
                  </thead>
                  <tbody>
                    {topups.map((topup) => {
                      const statusInfo = getStatusBadge(topup.status);
                      return (
                        <tr key={topup._id}>
                          <td>{new Date(topup.createdAt).toLocaleString("th-TH")}</td>
                          <td><strong>{topup.userName}</strong><br /><small>ID: {topup.userId}</small></td>
                          <td>฿{topup.amount?.toLocaleString()}</td>
                          <td><small>{topup.transRef || "-"}</small></td>
                          <td>{topup.slipUrl ? <a href={topup.slipUrl} target="_blank" className={styles.slipLink}>ดูสลิป</a> : <span style={{ color: "#6b7280" }}>ไม่มีสลิป</span>}</td>
                          <td><span className={`${styles.statusBadge} ${styles[statusInfo.class]}`}>
                            <Icon name={statusInfo.icon} size="0.7rem" />
                            <span style={{ marginLeft: "0.3rem" }}>{statusInfo.text}</span>
                          </span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        
        {/* PRODUCTS */}
        {activeTab === "products" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>
                <Icon name="product" size="1.2rem" />
                <span style={{ marginLeft: "0.5rem" }}>จัดการสินค้า (MOD)</span>
              </h1>
              <div className={styles.headerButtons}>
                <button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.addButton}>
                  <Icon name="add" size="0.8rem" />
                  <span>เพิ่มสินค้า</span>
                </button>
              </div>
            </section>
            {showModal && <ProductModal editingItem={editingItem} onClose={() => { setShowModal(false); setEditingItem(null); }} onSaved={handleSaved} />}
            {showVersionModal && selectedProductForVersion && (
              <VersionUpdateModal product={selectedProductForVersion} onClose={() => { setShowVersionModal(false); setSelectedProductForVersion(null); }} onUpdated={handleVersionUpdated} />
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
                          <Icon name="role" size="0.7rem" />
                          <small> Role IDs: {item.discordRoleIds.join(", ")}</small>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      <button onClick={() => handleEdit(item)} className={styles.editBtn}>
                        <Icon name="edit" size="0.8rem" />
                        <span>แก้ไข</span>
                      </button>
                      <button onClick={() => handleVersionUpdate(item)} className={styles.versionBtn}>
                        <Icon name="refresh" size="0.8rem" />
                        <span>อัปเดต</span>
                      </button>
                      <button onClick={() => handleDelete(item._id, item.itemsname)} className={styles.deleteBtn}>
                        <Icon name="delete" size="0.8rem" />
                        <span>ลบ</span>
                      </button>
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
              <h1 className={styles.headerTitle}>
                <Icon name="upload" size="1.2rem" />
                <span style={{ marginLeft: "0.5rem" }}>อัปโหลดไฟล์</span>
              </h1>
            </section>

            {/* ✅ ใช้ R2Uploader แทนการอัปโหลดแบบเดิม */}
            <div className={styles.uploadSection}>
              <R2Uploader
                onUploadComplete={(publicUrl) => {
                  success("อัปโหลดไฟล์ไป R2 สำเร็จ!");
                  fetchImages(); // รีเฟรชรายการ
                }}
                accept="*/*"
                maxSize={5000}
              />
              
              <small style={{ color: '#6b7280', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                💡 รองรับทุกประเภทไฟล์ อัปโหลดตรงไป Cloudflare R2 (สูงสุด 5GB)
              </small>
            </div>

            {/* Gallery - จัดหมวดหมู่ */}
            {images.length > 0 && (
              <div className={styles.galleryContainer}>
                {groupFilesByCategory(images).map((category) => (
                  <div key={category.key} className={styles.galleryCategory}>
                    <div className={styles.galleryCategoryHeader}>
                      <span className={styles.galleryCategoryIcon}>{category.icon}</span>
                      <span className={styles.galleryCategoryLabel}>{category.label}</span>
                      <span className={styles.galleryCategoryCount}>{category.files.length} ไฟล์</span>
                    </div>
                    
                    <div className={styles.galleryGrid}>
                      {category.files.map((file) => (
                        <div key={file.url} className={styles.galleryItem}>
                          {isImageFile(file.fileName) ? (
                            <div className={styles.galleryImageWrapper}>
                              <img src={file.url} alt={file.fileName} className={styles.galleryThumb} loading="lazy" />
                            </div>
                          ) : (
                            <div className={styles.galleryFileWrapper}>
                              <Icon name="file" size="2rem" />
                              <span className={styles.galleryFileName}>{file.fileName}</span>
                            </div>
                          )}
                          
                          <div className={styles.galleryItemInfo}>
                            <input 
                              type="text" 
                              value={file.url} 
                              readOnly 
                              className={styles.galleryUrl} 
                              onClick={(e) => e.target.select()} 
                            />
                            <div className={styles.galleryActions}>
                              <button 
                                onClick={() => { 
                                  navigator.clipboard.writeText(file.url); 
                                  success("คัดลอกลิงก์แล้ว!"); 
                                }}
                                className={styles.galleryCopyBtn}
                                title="คัดลอกลิงก์"
                              >
                                <Icon name="copy" size="0.8rem" />
                              </button>
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={styles.galleryOpenBtn}
                                title="เปิดในแท็บใหม่"
                              >
                                <Icon name="link" size="0.8rem" />
                              </a>
                              <button 
                                onClick={() => handleDeleteFile(file.fileName)}
                                disabled={deletingFile === file.fileName}
                                className={styles.galleryDeleteBtn}
                                title="ลบไฟล์"
                              >
                                {deletingFile === file.fileName ? '⏳' : '🗑️'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {images.length === 0 && (
              <div className={styles.emptyState}>
                <Icon name="file" size="3rem" />
                <p className={styles.emptyTitle}>ยังไม่มีไฟล์ที่อัปโหลด</p>
                <p className={styles.emptyText}>เลือกไฟล์แล้วอัปโหลดผ่าน R2</p>
              </div>
            )}
          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <section className={styles.header}>
              <h1 className={styles.headerTitle}>
                <Icon name="users" size="1.2rem" />
                <span style={{ marginLeft: "0.5rem" }}>ผู้ใช้ทั้งหมด</span>
              </h1>
            </section>
            <div className={styles.userGrid}>
              {users.map(user => (
                <div key={user.id} className={styles.userCard} onClick={() => handleSelectUser(user)}>
                  <div className={styles.userInfoLeft}>
                    <h2 className={styles.userNameCard}>{user.name}</h2>
                    <p><Icon name="coin" size="0.7rem" /> {user.points?.toLocaleString() || 0} point</p>
                  </div>
                  <div className={styles.userInfoRight}>
                    <p>{user.email}</p>
                    <p className={styles.userDetailLink}>📋 ดูข้อมูลเพิ่มเติม →</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedUser && (
              <div className={styles.modalOverlay} onClick={() => !actionLoading && setSelectedUser(null)}>
                <div className={styles.userDetailModal} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.modalCloseBtn} onClick={() => setSelectedUser(null)} disabled={actionLoading}>✕</button>
                  <div className={styles.userDetailHeader}>
                    <div className={styles.userAvatarLarge}>{selectedUser.name?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div><h2 className={styles.userDetailName}>{selectedUser.name}</h2><p className={styles.userDetailEmail}>{selectedUser.email}</p></div>
                  </div>
                  <div className={styles.userInfoCards}>
                    <div className={styles.userInfoCard}>
                      <Icon name="user" size="1.2rem" />
                      <div><p className={styles.userInfoCardLabel}>Discord ID</p><p className={styles.userInfoCardValue}>{selectedUser.id}</p></div>
                    </div>
                    <div className={styles.userInfoCard}>
                      <Icon name="coin" size="1.2rem" />
                      <div><p className={styles.userInfoCardLabel}>Points คงเหลือ</p><p className={styles.userInfoCardValueHighlight}>{selectedUser.points?.toLocaleString() || 0} Point</p></div>
                    </div>
                  </div>
                  <div className={styles.userDetailDivider}><span>⚙️ จัดการแต้ม</span></div>
                  <div className={styles.pointAdjustSection}>
                    <div className={styles.pointAdjustInput}><label className={styles.pointAdjustLabel}>จำนวนที่ต้องการเพิ่ม/ลด</label><input type="number" className={styles.pointInput} value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} min="1" /></div>
                    <div className={styles.pointAdjustButtons}>
                      <button className={styles.pointAddBtn} onClick={() => applyPointChange("add")} disabled={actionLoading}><Icon name="add" size="0.8rem" /> เพิ่มแต้ม</button>
                      <button className={styles.pointSubtractBtn} onClick={() => applyPointChange("subtract")} disabled={actionLoading}><Icon name="remove" size="0.8rem" /> ลบแต้ม</button>
                    </div>
                    <div className={styles.pointPreview}><span className={styles.pointPreviewLabel}>แต้มใหม่</span><span className={styles.pointPreviewValue}>{proposedPoints?.toLocaleString() || 0} Point</span></div>
                    <div className={styles.pointActionButtons}>
                      <button className={styles.pointSaveBtn} onClick={handleSavePoints} disabled={actionLoading}>
                        {actionLoading ? <Icon name="loading" size="0.8rem" /> : <Icon name="save" size="0.8rem" />}
                        <span>{actionLoading ? "กำลังบันทึก..." : "ยืนยัน"}</span>
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
                              <span className={styles.purchasedProductVersion}>
                                <Icon name="product" size="0.7rem" /> v{item.version}
                              </span>
                              <span className={styles.purchasedProductDate}>
                                <Icon name="calendar" size="0.7rem" /> {new Date(item.purchaseDate).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}
                              </span>
                            </div>
                            <div className={styles.purchasedProductLinks}>
                              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.purchasedProductDownload}>
                                <Icon name="download" size="0.8rem" /> ดาวน์โหลด
                              </a>
                              {item.discordRoleIds && item.discordRoleIds.length > 0 && (
                                <span className={styles.purchasedProductRoles}>
                                  <Icon name="role" size="0.7rem" /> Role: {item.discordRoleIds.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <button className={styles.purchasedProductRemoveBtn} onClick={() => handleRemoveProduct(item.productId, index, item.name)} disabled={actionLoading}>
                            <Icon name="delete" size="0.8rem" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noProducts}>
                        <Icon name="product" size="2rem" />
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