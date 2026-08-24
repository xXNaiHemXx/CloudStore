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

// ==================== LOADING SCREEN ====================
function AdminLoading() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinnerLarge}></div>
      <p className={styles.loadingText}>Loading Admin Dashboard...</p>
    </div>
  );
}

// ==================== ACCESS DENIED ====================
function AccessDenied() {
  const router = useRouter();
  return (
    <div className={styles.accessDenied}>
      <div className={styles.accessDeniedIcon}>
        <Icon name="lock" size="3rem" />
      </div>
      <h1 className={styles.accessDeniedTitle}>Access Denied</h1>
      <p className={styles.accessDeniedText}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      <button onClick={() => router.push("/")} className={styles.accessDeniedBtn}>
        <Icon name="home" size="0.8rem" />
        กลับหน้าหลัก
      </button>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("basic");

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
    <div className={styles.modalOverlay} onClick={() => !saving && onClose()}>
      <div className={styles.modalContentPremium} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className={styles.modalHeaderPremium}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}>
              <Icon name={isEdit ? "edit" : "add"} size="1.2rem" color="#10b981" />
            </div>
            <div>
              <h2 className={styles.modalTitlePremium}>
                {isEdit ? "Edit Product" : "Add New Product"}
              </h2>
              <p className={styles.modalSubtitle}>
                {isEdit ? `Editing "${editingItem?.itemsname}"` : "Fill in the details to create a new product"}
              </p>
            </div>
          </div>
          <button className={styles.modalClosePremium} onClick={() => !saving && onClose()}>
            <Icon name="close" size="1.2rem" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.modalTabs}>
          <button 
            className={`${styles.modalTab} ${activeTab === 'basic' ? styles.modalTabActive : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <Icon name="product" size="0.7rem" />
            Basic Info
          </button>
          <button 
            className={`${styles.modalTab} ${activeTab === 'media' ? styles.modalTabActive : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <Icon name="image" size="0.7rem" />
            Media
          </button>
          <button 
            className={`${styles.modalTab} ${activeTab === 'advanced' ? styles.modalTabActive : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Icon name="settings" size="0.7rem" />
            Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalFormPremium}>
          {/* ===== BASIC TAB ===== */}
          {activeTab === 'basic' && (
            <div className={styles.modalTabContent}>
              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Product Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>What is the name of your product?</span>
                </div>
                <div className={styles.modalRowRight}>
                  <input 
                    value={itemsname} 
                    onChange={(e) => setItemsname(e.target.value)} 
                    className={styles.modalInputPremium} 
                    type="text" 
                    placeholder="e.g. Ultimate Plugin Pro"
                    required 
                  />
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Title <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>Short headline for your product</span>
                </div>
                <div className={styles.modalRowRight}>
                  <input 
                    value={itemstitle} 
                    onChange={(e) => setItemstitle(e.target.value)} 
                    className={styles.modalInputPremium} 
                    type="text" 
                    placeholder="e.g. The Ultimate Solution"
                    required 
                  />
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Description <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>Detailed description of your product</span>
                </div>
                <div className={styles.modalRowRight}>
                  <textarea 
                    value={itemsdesc} 
                    onChange={(e) => setItemsdesc(e.target.value)} 
                    className={styles.modalTextareaPremium} 
                    placeholder="Describe your product features, benefits, and specifications..."
                    required 
                  />
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Version <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>Current version of your product</span>
                </div>
                <div className={styles.modalRowRight}>
                  <input 
                    value={itemsversion} 
                    onChange={(e) => setItemsversion(e.target.value)} 
                    className={styles.modalInputPremium} 
                    type="text" 
                    placeholder="1.0.0"
                    required 
                  />
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Price <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>Price in points</span>
                </div>
                <div className={styles.modalRowRight}>
                  <div className={styles.modalInputGroup}>
                    <span className={styles.modalInputGroupAddon}>
                      <Icon name="coin" size="0.8rem" color="#10b981" />
                    </span>
                    <input 
                      value={itemsprice} 
                      onChange={(e) => setItemsprice(e.target.value)} 
                      className={styles.modalInputPremium} 
                      type="number" 
                      required 
                      min="0" 
                      step="1"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Discord Role IDs
                  </label>
                  <span className={styles.modalLabelHint}>Roles to assign to purchasers</span>
                </div>
                <div className={styles.modalRowRight}>
                  <textarea 
                    value={discordRoleIdsText} 
                    onChange={(e) => setDiscordRoleIdsText(e.target.value)} 
                    className={styles.modalTextareaPremium} 
                    rows="2"
                    placeholder="123456789012345678, 876543210987654321"
                  />
                  <span className={styles.modalInputHint}>
                    <Icon name="info" size="0.6rem" />
                    Separate multiple IDs with commas or spaces
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===== MEDIA TAB ===== */}
          {activeTab === 'media' && (
            <div className={styles.modalTabContent}>
              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Main Image <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>URL or upload from device</span>
                </div>
                <div className={styles.modalRowRight}>
                  <div className={styles.modalImageUploadArea}>
                    <input 
                      value={itemsimage} 
                      onChange={(e) => { setItemsimage(e.target.value); setPreviewImage(e.target.value); }} 
                      className={styles.modalInputPremium} 
                      type="text" 
                      placeholder="https://example.com/image.jpg"
                      required 
                    />
                    <div className={styles.modalUploadDivider}>
                      <span>or</span>
                    </div>
                    <label className={styles.modalUploadBtn}>
                      <Icon name="upload" size="0.8rem" />
                      Upload Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUpload} 
                        className={styles.modalFileInputHidden}
                      />
                    </label>
                    {previewImage && (
                      <div className={styles.modalImagePreviewContainer}>
                        <img src={previewImage} alt="preview" className={styles.modalImagePreview} />
                        <button 
                          type="button" 
                          className={styles.modalImagePreviewRemove}
                          onClick={() => { setItemsimage(''); setPreviewImage(''); }}
                        >
                          <Icon name="close" size="0.6rem" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Additional Images
                  </label>
                  <span className={styles.modalLabelHint}>Extra product images (optional)</span>
                </div>
                <div className={styles.modalRowRight}>
                  <div className={styles.modalAdditionalImages}>
                    {itemsimages.map((img, index) => (
                      <div key={index} className={styles.modalAdditionalImageItem}>
                        <input 
                          value={img} 
                          onChange={(e) => handleImageChange(index, e.target.value)} 
                          className={styles.modalInputPremium} 
                          type="text" 
                          placeholder={`Image ${index + 1} URL`} 
                        />
                        {img && (
                          <div className={styles.modalAdditionalImagePreview}>
                            <img src={img} alt={`เพิ่มเติม ${index + 1}`} />
                            <button 
                              type="button" 
                              className={styles.modalAdditionalImageRemove}
                              onClick={() => handleImageChange(index, '')}
                            >
                              <Icon name="close" size="0.5rem" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button" 
                      className={styles.modalAddImageBtn}
                      onClick={() => setItemsimages([...itemsimages, ''])}
                    >
                      <Icon name="add" size="0.8rem" />
                      Add Image
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    YouTube Video ID
                  </label>
                  <span className={styles.modalLabelHint}>Promotional video (optional)</span>
                </div>
                <div className={styles.modalRowRight}>
                  <div className={styles.modalInputGroup}>
                    <span className={styles.modalInputGroupAddon}>
                      <Icon name="youtube" size="0.8rem" color="#ff0000" />
                    </span>
                    <input 
                      value={itemsurlyoutube} 
                      onChange={(e) => setItemsurlyoutube(e.target.value.trim())} 
                      className={styles.modalInputPremium} 
                      type="text" 
                      placeholder="dQw4w9WgXcQ"
                    />
                  </div>
                  <span className={styles.modalInputHint}>
                    <Icon name="info" size="0.6rem" />
                    Enter the video ID from YouTube URL
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===== ADVANCED TAB ===== */}
          {activeTab === 'advanced' && (
            <div className={styles.modalTabContent}>
              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    File URL <span className={styles.requiredStar}>*</span>
                  </label>
                  <span className={styles.modalLabelHint}>Direct download link for the product</span>
                </div>
                <div className={styles.modalRowRight}>
                  <input 
                    value={itemsfile} 
                    onChange={(e) => setItemsfile(e.target.value)} 
                    className={styles.modalInputPremium} 
                    type="text" 
                    placeholder="https://example.com/product.zip"
                    required 
                  />
                </div>
              </div>

              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Upload to R2
                  </label>
                  <span className={styles.modalLabelHint}>Upload file directly to Cloudflare R2</span>
                </div>
                <div className={styles.modalRowRight}>
                  <div className={styles.modalR2UploadArea}>
                    <R2Uploader 
                      onUploadComplete={(publicUrl) => { 
                        setItemsfile(`${publicUrl}?v=${itemsversion || new Date().toISOString().slice(0,10)}`); 
                        success("อัปโหลดไฟล์ไป R2 สำเร็จ!"); 
                      }} 
                      accept=".zip,.rar,.7z,.scs,.exe,.msi" 
                      maxSize={2000} 
                    />
                    {itemsfile && (
                      <div className={styles.modalR2Success}>
                        <Icon name="check-circle" size="0.8rem" color="#10b981" />
                        <span>File uploaded to R2 successfully</span>
                      </div>
                    )}
                    <span className={styles.modalInputHint}>
                      <Icon name="info" size="0.6rem" />
                      Supports .zip, .rar, .7z, .scs, .exe, .msi | Max 2GB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.modalActionsPremium}>
            <button 
              type="button" 
              className={styles.modalCancelBtnPremium} 
              onClick={() => !saving && onClose()}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.modalSubmitBtnPremium} 
              disabled={saving}
            >
              {saving ? (
                <>
                  <Icon name="loading" size="0.8rem" className={styles.spinning} />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="check" size="0.8rem" />
                  {isEdit ? "Save Changes" : "Create Product"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== VERSION UPDATE MODAL - PREMIUM ====================
function VersionUpdateModal({ product, onClose, onUpdated }) {
  const [newVersion, setNewVersion] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("url"); // 'url' | 'r2'
  const { data: session } = useSession();
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newVersion || !newFileUrl) { 
      error("กรุณากรอกเวอร์ชันใหม่และลิงก์ไฟล์"); 
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
        success(`อัปเดตเวอร์ชันสำเร็จ! แจ้งเตือนผู้ใช้ ${res.data.notifiedUsers} คน`);
        await addLog('product_update', "อัปเดตเวอร์ชัน", `อัปเดต "${product.itemsname}" เป็น v${newVersion}`, session?.user?.name || "Admin").catch(() => {});
        onUpdated(); 
        onClose();
      }
    } catch (err) { 
      error("อัปเดตไม่สำเร็จ: " + (err.response?.data?.error || err.message)); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => !loading && onClose()}>
      <div className={styles.modalContentPremium} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className={styles.modalHeaderPremium}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background: 'rgba(59,130,246,0.1)' }}>
              <Icon name="refresh" size="1.2rem" color="#3b82f6" />
            </div>
            <div>
              <h2 className={styles.modalTitlePremium}>
                Update Version
              </h2>
              <p className={styles.modalSubtitle}>
                Updating: <strong>{product.itemsname}</strong>
              </p>
            </div>
          </div>
          <button className={styles.modalClosePremium} onClick={() => !loading && onClose()}>
            <Icon name="close" size="1.2rem" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalFormPremium}>
          <div className={styles.modalTabContent}>

            {/* Product Info Card */}
            <div className={styles.versionProductInfo}>
              <div className={styles.versionProductIcon}>
                <img 
                  src={product.itemsimage || '/images/placeholder.png'} 
                  alt={product.itemsname}
                  onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                />
              </div>
              <div className={styles.versionProductDetails}>
                <span className={styles.versionProductName}>{product.itemsname}</span>
                <div className={styles.versionProductMeta}>
                  <span className={styles.versionProductVersion}>
                    <Icon name="version" size="0.6rem" />
                    Current: v{product.itemsversion}
                  </span>
                  <span className={styles.versionProductPrice}>
                    <Icon name="coin" size="0.6rem" color="#10b981" />
                    {product.itemsprice} Points
                  </span>
                </div>
              </div>
            </div>

            {/* Version Input */}
            <div className={styles.modalRowPremium}>
              <div className={styles.modalRowLeft}>
                <label className={styles.modalLabelPremium}>
                  New Version <span className={styles.requiredStar}>*</span>
                </label>
                <span className={styles.modalLabelHint}>Semantic version format</span>
              </div>
              <div className={styles.modalRowRight}>
                <div className={styles.modalInputGroup}>
                  <span className={styles.modalInputGroupAddon}>
                    <Icon name="version" size="0.8rem" color="#818cf8" />
                  </span>
                  <input 
                    type="text" 
                    value={newVersion} 
                    onChange={(e) => setNewVersion(e.target.value)} 
                    className={styles.modalInputPremium} 
                    placeholder="2.0.0"
                    required 
                  />
                </div>
                <span className={styles.modalInputHint}>
                  <Icon name="info" size="0.6rem" />
                  Use semantic versioning: major.minor.patch
                </span>
              </div>
            </div>

            {/* Upload Method Toggle */}
            <div className={styles.modalRowPremium}>
              <div className={styles.modalRowLeft}>
                <label className={styles.modalLabelPremium}>
                  Upload Method
                </label>
                <span className={styles.modalLabelHint}>Choose how to upload the file</span>
              </div>
              <div className={styles.modalRowRight}>
                <div className={styles.versionUploadToggle}>
                  <button 
                    type="button"
                    className={`${styles.versionToggleBtn} ${uploadMethod === 'url' ? styles.versionToggleBtnActive : ''}`}
                    onClick={() => setUploadMethod('url')}
                  >
                    <Icon name="link" size="0.7rem" />
                    URL
                  </button>
                  <button 
                    type="button"
                    className={`${styles.versionToggleBtn} ${uploadMethod === 'r2' ? styles.versionToggleBtnActive : ''}`}
                    onClick={() => setUploadMethod('r2')}
                  >
                    <Icon name="cloud" size="0.7rem" />
                    R2 Upload
                  </button>
                </div>
              </div>
            </div>

            {/* R2 Upload */}
            {uploadMethod === 'r2' && (
              <div className={styles.modalRowPremium}>
                <div className={styles.modalRowLeft}>
                  <label className={styles.modalLabelPremium}>
                    Upload to R2
                  </label>
                  <span className={styles.modalLabelHint}>Cloudflare R2 storage</span>
                </div>
                <div className={styles.modalRowRight}>
                  <div className={styles.modalR2UploadArea}>
                    <R2Uploader 
                      onUploadComplete={(publicUrl) => { 
                        setNewFileUrl(publicUrl); 
                        success("อัปโหลดไฟล์ไป R2 สำเร็จ!"); 
                      }} 
                      accept=".zip,.rar,.7z,.scs,.exe,.msi" 
                      maxSize={5000} 
                    />
                    {newFileUrl && (
                      <div className={styles.modalR2Success}>
                        <Icon name="check-circle" size="0.8rem" color="#10b981" />
                        <span>File uploaded to R2 successfully</span>
                      </div>
                    )}
                    <span className={styles.modalInputHint}>
                      <Icon name="info" size="0.6rem" />
                      Supports .zip, .rar, .7z, .scs, .exe, .msi | Max 5GB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* File URL */}
            <div className={styles.modalRowPremium}>
              <div className={styles.modalRowLeft}>
                <label className={styles.modalLabelPremium}>
                  File URL <span className={styles.requiredStar}>*</span>
                </label>
                <span className={styles.modalLabelHint}>Direct download link</span>
              </div>
              <div className={styles.modalRowRight}>
                <div className={styles.modalInputGroup}>
                  <span className={styles.modalInputGroupAddon}>
                    <Icon name="file" size="0.8rem" color="#10b981" />
                  </span>
                  <input 
                    type="text" 
                    value={newFileUrl} 
                    onChange={(e) => setNewFileUrl(e.target.value)} 
                    className={styles.modalInputPremium} 
                    placeholder="https://yourdomain.com/uploads/file.zip"
                    required 
                  />
                </div>
                <span className={styles.modalInputHint}>
                  <Icon name="info" size="0.6rem" />
                  Users will download the file from this URL
                </span>
              </div>
            </div>

            {/* Changelog */}
            <div className={styles.modalRowPremium}>
              <div className={styles.modalRowLeft}>
                <label className={styles.modalLabelPremium}>
                  Changelog
                </label>
                <span className={styles.modalLabelHint}>What's new in this version?</span>
              </div>
              <div className={styles.modalRowRight}>
                <textarea 
                  value={changelog} 
                  onChange={(e) => setChangelog(e.target.value)} 
                  className={styles.modalTextareaPremium} 
                  rows="4" 
                  placeholder="• Fixed issue with XYZ&#10;• Added new feature ABC&#10;• Improved performance"
                />
                <span className={styles.modalInputHint}>
                  <Icon name="info" size="0.6rem" />
                  This will be shown to users when they update
                </span>
              </div>
            </div>

            {/* Update Preview */}
            <div className={styles.versionUpdatePreview}>
              <div className={styles.versionPreviewHeader}>
                <Icon name="eye" size="0.7rem" color="#6b7280" />
                <span>Update Preview</span>
              </div>
              <div className={styles.versionPreviewContent}>
                <div className={styles.versionPreviewItem}>
                  <span className={styles.versionPreviewLabel}>Product</span>
                  <span className={styles.versionPreviewValue}>{product.itemsname}</span>
                </div>
                <div className={styles.versionPreviewItem}>
                  <span className={styles.versionPreviewLabel}>Current Version</span>
                  <span className={styles.versionPreviewValue}>v{product.itemsversion}</span>
                </div>
                <div className={styles.versionPreviewItem}>
                  <span className={styles.versionPreviewLabel}>New Version</span>
                  <span className={styles.versionPreviewValue} style={{ color: '#10b981', fontWeight: '700' }}>
                    {newVersion || 'v?.?.?'}
                  </span>
                </div>
                {changelog && (
                  <div className={styles.versionPreviewItem}>
                    <span className={styles.versionPreviewLabel}>Changelog</span>
                    <span className={styles.versionPreviewValue} style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {changelog}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.modalActionsPremium}>
              <button 
                type="button" 
                className={styles.modalCancelBtnPremium} 
                onClick={() => !loading && onClose()}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.modalSubmitBtnPremium} 
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                {loading ? (
                  <>
                    <Icon name="loading" size="0.8rem" className={styles.spinning} />
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon name="upload" size="0.8rem" />
                    Update Version
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
export default function Admin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userPoints, refreshPoints } = useUser();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
   const [searchTerm, setSearchTerm] = useState("");
  // ==================== STATE ====================
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  // เพิ่มใน Admin component
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // เพิ่มใน Admin component


  // --- Data States ---
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
  const [adminList, setAdminList] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ discordId: '', name: '', role: 'admin' });
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // สร้าง filteredOrders
  const filteredOrders = orders.filter(order => {
    // Search filter
    const searchMatch = 
      order.productName?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.buyerName?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.buyerId?.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    if (!searchMatch) return false;
    
    // Date filter
    if (orderFilter === 'today') {
      const today = new Date();
      const orderDate = new Date(order.purchaseDate);
      return orderDate.toDateString() === today.toDateString();
    }
    if (orderFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(order.purchaseDate) >= weekAgo;
    }
    if (orderFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(order.purchaseDate) >= monthAgo;
    }
    
    return true;
  });

  // Pagination
  const orderTotalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * ordersPerPage,
    orderPage * ordersPerPage
  );
  // เพิ่มใน Admin component
  const [topupSearchTerm, setTopupSearchTerm] = useState("");
  const [topupFilter, setTopupFilter] = useState("all");
  const [topupMethodFilter, setTopupMethodFilter] = useState("all");
  const [topupPage, setTopupPage] = useState(1);
  const [topupsPerPage] = useState(10);

  // สร้าง filteredTopups
  const filteredTopups = topups.filter(topup => {
    // Search filter
    const searchMatch = 
      topup.userName?.toLowerCase().includes(topupSearchTerm.toLowerCase()) ||
      topup.userId?.toLowerCase().includes(topupSearchTerm.toLowerCase()) ||
      topup.transRef?.toLowerCase().includes(topupSearchTerm.toLowerCase()) ||
      topup.voucherCode?.toLowerCase().includes(topupSearchTerm.toLowerCase());
    
    if (!searchMatch) return false;
    
    // Status filter
    if (topupFilter !== 'all' && topup.status !== topupFilter) {
      return false;
    }
    
    // Method filter
    if (topupMethodFilter !== 'all' && topup.method !== topupMethodFilter) {
      return false;
    }
    
    return true;
  });

  // Pagination
  const topupTotalPages = Math.ceil(filteredTopups.length / topupsPerPage);
  const paginatedTopups = filteredTopups.slice(
    (topupPage - 1) * topupsPerPage,
    topupPage * topupsPerPage
  );
  // ==================== TABS ====================
  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard", color: "#6366f1" },
    { key: "orders", label: "Orders", icon: "order", color: "#f59e0b" },
    { key: "products", label: "Products", icon: "product", color: "#10b981" },
    { key: "topups", label: "Topups", icon: "money", color: "#3b82f6" },
    { key: "uploads", label: "Uploads", icon: "upload", color: "#8b5cf6" },
    { key: "r2", label: "R2 Files", icon: "cloud", color: "#06b6d4" },
    { key: "logs", label: "Logs", icon: "history", color: "#f43f5e" },
    { key: "coupons", label: "Coupons", icon: "ticket", color: "#ec4899" },
    { key: "users", label: "Users", icon: "users", color: "#14b8a6" },
    { key: "admins", label: "Admins", icon: "role", color: "#8b5cf6" },
  ];

  // ==================== AUTH CHECK ====================
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    if (status === "loading") return;
    
    if (!session) {
      setLoading(false);
      return;
    }

    checkAdminStatus();
  }, [session, status, isMounted]);

  const checkAdminStatus = async () => {
    try {
      // Check from database first
      const res = await axios.get(`/api/admin/check-admin?discordId=${session.user.id}`);
      
      if (res.data.isAdmin) {
        setIsAdmin(true);
        setAdminRole(res.data.role || "admin");
        setLoading(false);
        return;
      }
      
      // Fallback: check from .env
      const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
      if (envAdminIds.includes(session.user.id)) {
        setIsAdmin(true);
        setAdminRole("head");
        setLoading(false);
        return;
      }
      
      // Not admin
      setIsAdmin(false);
      setAdminRole(null);
      setLoading(false);
      
    } catch (err) {
      // Fallback: if API error, check .env
      const envAdminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
      if (envAdminIds.includes(session.user.id)) {
        setIsAdmin(true);
        setAdminRole("head");
      } else {
        setIsAdmin(false);
        setAdminRole(null);
      }
      setLoading(false);
    }
  };

  // ==================== FETCH FUNCTIONS ====================
  const fetchItems = async () => { 
    try {
      const res = await axios.get("/api/items"); 
      setItems(res.data || []); 
    } catch { error("โหลดสินค้าไม่สำเร็จ"); }
  };

  const fetchTopups = async () => { 
    setLoadingTopups(true); 
    try { 
      const res = await axios.get("/api/admin/topups"); 
      setTopups(res.data || []); 
    } catch { error("โหลดประวัติเติมเงินไม่สำเร็จ"); } 
    finally { setLoadingTopups(false); } 
  };
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // สร้าง filteredProducts
  const filteredProducts = items.filter(item =>
    item.itemsname?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    item.itemstitle?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    item.itemsdesc?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );
  const fetchImages = async () => { 
    try { 
      const res = await axios.get("/api/upload"); 
      const files = res.data || []; 
      setImages(files.map(file => typeof file === 'string' ? { url: file, fileName: file.split('/').pop() } : { url: file.url || '', fileName: file.fileName || '' })); 
    } catch { setImages([]); } 
  };

  const fetchUsers = async () => { 
    try { 
      const res = await axios.get("/api/user/user"); 
      setUsers(res.data || []); 
    } catch { error("โหลดข้อมูลผู้ใช้ล้มเหลว"); } 
  };

  const fetchR2Files = async () => { 
    setLoadingR2Files(true); 
    try { 
      const res = await axios.get("/api/admin/r2-files"); 
      setR2Files(res.data.files || []); 
    } catch { error("ไม่สามารถโหลดไฟล์จาก R2 ได้"); } 
    finally { setLoadingR2Files(false); } 
  };

  const fetchLogs = async () => { 
    setLoadingLogs(true); 
    try { 
      const res = await axios.get(`/api/admin/logs?type=${logFilter}&limit=1000`); 
      setLogs(res.data.logs || []); 
      setLogPage(1); 
    } catch { error("โหลด logs ไม่สำเร็จ"); } 
    finally { setLoadingLogs(false); } 
  };

  const fetchWebhookConfig = async () => { 
    try { 
      const res = await axios.get('/api/admin/webhook'); 
      setWebhookConfig(res.data); 
    } catch {} 
  };

  const fetchCoupons = async () => { 
    setLoadingCoupons(true); 
    try { 
      const res = await axios.get('/api/admin/coupons'); 
      setCoupons(res.data.coupons || []); 
    } catch { error("โหลดคูปองไม่สำเร็จ"); } 
    finally { setLoadingCoupons(false); } 
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get("/api/admin/admins");
      setAdminList(res.data.admins || []);
    } catch {}
  };

  const fetchUserProducts = async (userId) => { 
    try { 
      const res = await axios.get(`/api/user/fetch-products?userId=${userId}`); 
      setUserProducts(res.data || []); 
    } catch { setUserProducts([]); } 
  };

  // ==================== EFFECTS FOR TAB CHANGES ====================
  useEffect(() => {
    if (!isAdmin || !session) return;

    // Dashboard
    if (activeTab === "dashboard") {
      Promise.all([
        axios.get("/api/items"), 
        axios.get("/api/user/count"), 
        axios.get("/api/user/purchase")
      ])
        .then(([itemsRes, usersRes, ordersRes]) => {
          const items = itemsRes.data || []; 
          const orders = ordersRes.data || [];
          setStats({ 
            products: items.length, 
            users: usersRes.data.count || 0, 
            orders: orders.length, 
            revenue: orders.reduce((sum, o) => sum + (o.price || 0), 0) 
          });
        }).catch(console.error);
    }

    // Orders
    if (activeTab === "orders") {
      axios.get("/api/user/purchase").then((res) => {
        const data = res.data || []; 
        setOrders(data); 
        setTotalOrders(data.length); 
        setTotalRevenue(data.reduce((sum, o) => sum + (o.price || 0), 0));
        const modStats = {};
        data.forEach((order) => {
          const name = order.productName || "unknown";
          if (!modStats[name]) modStats[name] = { count: 1, lastPurchased: order.purchaseDate ? new Date(order.purchaseDate) : null };
          else { modStats[name].count += 1; const date = order.purchaseDate ? new Date(order.purchaseDate) : null; if (date && modStats[name].lastPurchased && date > modStats[name].lastPurchased) modStats[name].lastPurchased = date; }
        });
        const sorted = Object.entries(modStats).sort((a, b) => b[1].count - a[1].count);
        if (sorted.length > 0) { const [name, stat] = sorted[0]; const formatted = stat.lastPurchased instanceof Date && !isNaN(stat.lastPurchased) ? stat.lastPurchased.toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" }) : "-"; setTopMod(`${name} (ล่าสุด: ${formatted})`); }
      }).catch(console.error);
    }

    // Products
    if (activeTab === "products") {
      fetchItems();
    }

    // Topups
    if (activeTab === "topups") {
      fetchTopups();
    }

    // Uploads
    if (activeTab === "uploads") {
      fetchImages();
    }

    // Users
    if (activeTab === "users") {
      fetchUsers();
    }

    // R2
    if (activeTab === "r2") {
      fetchR2Files();
    }

    // Logs
    if (activeTab === "logs") {
      fetchLogs();
      fetchWebhookConfig();
    }

    // Coupons
    if (activeTab === "coupons") {
      fetchCoupons();
    }

    // Admins
    if (activeTab === "admins") {
      fetchAdmins();
    }

    // Products for coupon modal
    if (showCouponModal) {
      axios.get("/api/items").then(res => setAllProducts(res.data || [])).catch(() => {});
    }

  }, [activeTab, session, isAdmin, showCouponModal, logFilter]);

  // ==================== HANDLERS ====================
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "success": return { class: "statusSuccess", text: "สำเร็จ", icon: "check" };
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
    try { 
      await axios.post("/api/upload", formData); 
      success("อัปโหลดสำเร็จ"); 
      await addLog('file_upload', "อัปโหลดไฟล์", `อัปโหลด "${selectedFile.name}"`, session?.user?.name || "Admin").catch(() => {}); 
      setSelectedFile(null); 
      fetchImages(); 
    } catch { error("เกิดข้อผิดพลาด"); } 
    finally { setUploading(false); }
  };

  const handleDeleteFile = async (fileName) => {
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ต้องการลบ "${fileName}"?`, confirmText: "ลบ", cancelText: "ยกเลิก", type: "danger" });
    if (!confirmed) return;
    setDeletingFile(fileName);
    try {
      const res = await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName }) });
      const data = await res.json();
      if (res.ok) { success("ลบไฟล์สำเร็จ!"); await addLog('file_delete', "ลบไฟล์", `ลบ "${fileName}"`, session?.user?.name || "Admin").catch(() => {}); fetchImages(); } 
      else throw new Error(data.error);
    } catch (err) { error(err.message); } 
    finally { setDeletingFile(null); }
  };

  const applyPointChange = (type) => { 
    const current = Number(selectedUser.points || 0); 
    const amount = Number(changeAmount || 0); 
    if (isNaN(amount) || amount < 0) return error("กรุณากรอกจำนวนแต้มที่ถูกต้อง"); 
    if (type === "add") setProposedPoints(current + amount); 
    else setProposedPoints(Math.max(0, current - amount)); 
  };

  const handleRemoveProduct = async (productId, index, productName) => { 
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ลบ "${productName}"?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" }); 
    if (!confirmed) return; 
    setActionLoading(true); 
    try { 
      await axios.put("/api/user/remove-product", { userId: selectedUser.id, productId, index }); 
      setUserProducts(prev => prev.filter((_, i) => i !== index)); 
      success("ลบสินค้าสำเร็จ"); 
    } catch (err) { error(err.response?.data?.error || "ลบไม่สำเร็จ"); } 
    finally { setActionLoading(false); } 
  };

  const handleSavePoints = async () => {
    setActionLoading(true);
    try { 
      await axios.put("/api/user/points", { userId: selectedUser.id, points: Number(proposedPoints) }); 
      success("บันทึกแต้มสำเร็จ!"); 
      await addLog(LOG_TYPES.USER_EDIT, "แก้ไขแต้มผู้ใช้", `ปรับแต้ม ${selectedUser.name}`, session?.user?.name || "Admin", { discordId: selectedUser.id, oldPoints: selectedUser.points, newPoints: proposedPoints, email: selectedUser.email }).catch(() => {}); 
      fetchUsers(); 
      await refreshPoints(); 
      setSelectedUser(null); 
      setProposedPoints(0); 
      setChangeAmount(1); 
    } catch (err) { error("ไม่สามารถบันทึกแต้มได้"); } 
    finally { setActionLoading(false); }
  };

  const handleSelectUser = async (user) => { 
    setSelectedUser(user); 
    setProposedPoints(user.points || 0); 
    setChangeAmount(1); 
    await fetchUserProducts(user.id); 
  };

  const handleDeleteR2File = async (fileKey) => { 
    const fileName = fileKey.split('/').pop(); 
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: `ลบ "${fileName}" จาก R2?`, confirmText: "ลบเลย", cancelText: "ยกเลิก", type: "danger" }); 
    if (!confirmed) return; 
    setDeletingR2File(fileKey); 
    try { 
      await axios.delete(`/api/admin/r2-files?key=${encodeURIComponent(fileKey)}`); 
      success("ลบไฟล์จาก R2 สำเร็จ!"); 
      fetchR2Files(); 
    } catch (err) { error("ลบไฟล์ไม่สำเร็จ"); } 
    finally { setDeletingR2File(null); } 
  };

  const handleClearLogs = async () => { 
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: "ต้องการลบประวัติทั้งหมด?", confirmText: "ลบทั้งหมด", cancelText: "ยกเลิก", type: "danger" }); 
    if (!confirmed) return; 
    try { 
      await axios.delete('/api/admin/logs'); 
      success("ลบประวัติทั้งหมดแล้ว"); 
      fetchLogs(); 
    } catch { error("ลบไม่สำเร็จ"); } 
  };

  const handleSaveWebhook = async () => { 
    setSavingWebhook(true); 
    try { 
      await axios.put('/api/admin/webhook', webhookConfig); 
      success("บันทึก Webhook แล้ว!"); 
    } catch { error("บันทึกไม่สำเร็จ"); } 
    finally { setSavingWebhook(false); } 
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) { error("กรุณากรอกโค้ดและส่วนลด"); return; }
    setSavingCoupon(true);
    try {
      const payload = { ...couponForm };
      if (editingCoupon) { 
        await axios.put('/api/admin/coupons', { id: editingCoupon._id, ...payload }); 
        success("แก้ไขคูปองสำเร็จ!"); 
      } else { 
        await axios.post('/api/admin/coupons', payload); 
        success("เพิ่มคูปองสำเร็จ!"); 
      }
      setShowCouponModal(false); 
      setEditingCoupon(null); 
      setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); 
      fetchCoupons();
    } catch (err) { error(err.response?.data?.error || "บันทึกไม่สำเร็จ"); } 
    finally { setSavingCoupon(false); }
  };

  const handleDeleteCoupon = async (id) => { 
    const confirmed = await confirm({ title: "ยืนยันการลบ", message: "ต้องการลบคูปองนี้?", confirmText: "ลบ", cancelText: "ยกเลิก", type: "danger" }); 
    if (!confirmed) return; 
    try { 
      await axios.delete(`/api/admin/coupons?id=${id}`); 
      success("ลบคูปองสำเร็จ!"); 
      fetchCoupons(); 
    } catch { error("ลบไม่สำเร็จ"); } 
  };

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
      await axios.put("/api/admin/admins", { id: admin._id, role: newRole, headId: session.user.id });
      success("เปลี่ยน Role สำเร็จ!");
      fetchAdmins();
    } catch (err) { error(err.response?.data?.error || "เปลี่ยนไม่สำเร็จ"); }
  };

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

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.discordId) { error("กรุณากรอก Discord ID"); return; }
    try {
      await axios.post("/api/admin/admins", { ...adminForm, headId: session.user.id, addedBy: session.user.name });
      success("เพิ่ม Admin สำเร็จ!");
      setShowAdminModal(false);
      setAdminForm({ discordId: '', name: '', role: 'admin' });
      fetchAdmins();
    } catch (err) { error(err.response?.data?.error || "เพิ่มไม่สำเร็จ"); }
  };

  // ==================== PAGINATION ====================
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const paginatedLogs = logs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  // ==================== RENDER ====================
  if (!isMounted || status === "loading" || loading) {
    return <AdminLoading />;
  }

  if (!session || !isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className={styles.adminLayout}>
      <Head>
        <title>xCloud Studio Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

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
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)} 
              className={`${styles.sidebarItem} ${activeTab === tab.key ? styles.sidebarItemActive : ''}`}
            >
              <Icon name={tab.icon} size="1.1rem" color={activeTab === tab.key ? tab.color : undefined} />
              {sidebarOpen && <span>{tab.label}</span>}
              {activeTab === tab.key && <span className={styles.sidebarItemDot} style={{ background: tab.color }} />}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/profile" className={styles.sidebarUser}>
            <img src={session.user.image} alt="Profile" className={styles.sidebarAvatar} />
            {sidebarOpen && (
              <div className={styles.sidebarUserInfo}>
                <span className={styles.sidebarUserName}>{session.user.name}</span>
                <span className={styles.sidebarUserPoints}>
                  <Icon name="coin" size="0.7rem" /> {userPoints?.toLocaleString() || 0}
                </span>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={styles.topBarMenuBtn}>
              <Icon name="menu" size="1.2rem" />
            </button>
            <h1 className={styles.topBarTitle}>{tabs.find(t => t.key === activeTab)?.label || 'Dashboard'}</h1>
            {adminRole && (
              <span className={styles.adminRoleBadge}>
                <Icon name="role" size="0.6rem" />
                {adminRole}
              </span>
            )}
          </div>
          <div className={styles.topBarRight}>
            <button 
              onClick={() => { setActiveTab("products"); setEditingItem(null); setShowModal(true); }} 
              className={styles.topBarAction}
            >
              <Icon name="add" size="0.8rem" /><span>Add Product</span>
            </button>
            <button 
              onClick={() => { setActiveTab("coupons"); setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); setShowCouponModal(true); }} 
              className={styles.topBarAction}
            >
              <Icon name="ticket" size="0.8rem" /><span>Add Coupon</span>
            </button>
          </div>
        </header>

        <main className={styles.mainContent}>
          
         
          {activeTab === "dashboard" && (
            <div className={styles.dashboardContainer}>
              
              {/* Welcome Section */}
              <div className={styles.welcomeSection}>
                <div className={styles.welcomeLeft}>
                  <div className={styles.welcomeBadge}>
                    <Icon name="crown" size="0.8rem" />
                    {adminRole === "head" ? "Head Admin" : "Admin"}
                  </div>
                  <h1 className={styles.welcomeTitle}>
                    Welcome back, <span className={styles.welcomeHighlight}>{session?.user?.name}</span>
                  </h1>
                  <p className={styles.welcomeSubtitle}>
                    Here's what's happening with your store today
                  </p>
                  <div className={styles.welcomeStats}>
                    <div className={styles.welcomeStat}>
                      <span className={styles.welcomeStatValue}>{stats.products}</span>
                      <span className={styles.welcomeStatLabel}>Products</span>
                    </div>
                    <div className={styles.welcomeStatDivider}></div>
                    <div className={styles.welcomeStat}>
                      <span className={styles.welcomeStatValue}>{stats.users}</span>
                      <span className={styles.welcomeStatLabel}>Users</span>
                    </div>
                    <div className={styles.welcomeStatDivider}></div>
                    <div className={styles.welcomeStat}>
                      <span className={styles.welcomeStatValue}>{stats.orders}</span>
                      <span className={styles.welcomeStatLabel}>Orders</span>
                    </div>
                  </div>
                </div>
                <div className={styles.welcomeRight}>
                  <div className={styles.welcomeGraphic}>
                    <div className={styles.graphicOrb}></div>
                    <div className={styles.graphicOrb2}></div>
                    <div className={styles.graphicIcon}>
                      <Icon name="dashboard" size="3rem" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid - Premium Cards */}
              <div className={styles.statsGridPremium}>
                <div className={styles.statCardPremium} style={{ '--accent': '#6366f1' }}>
                  <div className={styles.statCardIcon}>
                    <Icon name="product" size="1.5rem" />
                  </div>
                  <div className={styles.statCardInfo}>
                    <span className={styles.statCardLabel}>Total Products</span>
                    <span className={styles.statCardValue}>{stats.products}</span>
                  </div>
                  <div className={styles.statCardTrend}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>12%</span>
                  </div>
                  <div className={styles.statCardProgress} style={{ width: `${Math.min(stats.products * 2, 100)}%` }}></div>
                </div>

                <div className={styles.statCardPremium} style={{ '--accent': '#10b981' }}>
                  <div className={styles.statCardIcon}>
                    <Icon name="users" size="1.5rem" />
                  </div>
                  <div className={styles.statCardInfo}>
                    <span className={styles.statCardLabel}>Total Users</span>
                    <span className={styles.statCardValue}>{stats.users}</span>
                  </div>
                  <div className={styles.statCardTrend}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>8%</span>
                  </div>
                  <div className={styles.statCardProgress} style={{ width: `${Math.min(stats.users * 1.5, 100)}%` }}></div>
                </div>

                <div className={styles.statCardPremium} style={{ '--accent': '#f59e0b' }}>
                  <div className={styles.statCardIcon}>
                    <Icon name="order" size="1.5rem" />
                  </div>
                  <div className={styles.statCardInfo}>
                    <span className={styles.statCardLabel}>Total Orders</span>
                    <span className={styles.statCardValue}>{stats.orders}</span>
                  </div>
                  <div className={styles.statCardTrend}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>5%</span>
                  </div>
                  <div className={styles.statCardProgress} style={{ width: `${Math.min(stats.orders * 1.8, 100)}%` }}></div>
                </div>

                <div className={styles.statCardPremium} style={{ '--accent': '#ec4899' }}>
                  <div className={styles.statCardIcon}>
                    <Icon name="money" size="1.5rem" />
                  </div>
                  <div className={styles.statCardInfo}>
                    <span className={styles.statCardLabel}>Revenue</span>
                    <span className={styles.statCardValue}>฿{stats.revenue.toLocaleString()}</span>
                  </div>
                  <div className={styles.statCardTrend}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>15%</span>
                  </div>
                  <div className={styles.statCardProgress} style={{ width: `${Math.min(stats.revenue / 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Activity & Quick Actions Row */}
              <div className={styles.dashboardRow}>
                {/* Recent Activity */}
                <div className={styles.recentActivity}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="clock" size="1rem" />
                      Recent Activity
                    </h3>
                    <button onClick={() => setActiveTab("logs")} className={styles.viewAllBtn}>
                      View All <Icon name="arrow-right" size="0.7rem" />
                    </button>
                  </div>
                  <div className={styles.activityList}>
                    {logs.slice(0, 5).length > 0 ? (
                      logs.slice(0, 5).map((log, index) => (
                        <div key={index} className={styles.activityItem}>
                          <div className={styles.activityIcon}>
                            {log.type === 'purchase' && <Icon name="cart" size="0.8rem" color="#10b981" />}
                            {log.type === 'topup' && <Icon name="money" size="0.8rem" color="#3b82f6" />}
                            {log.type === 'login' && <Icon name="login" size="0.8rem" color="#f59e0b" />}
                            {log.type === 'product_add' && <Icon name="add" size="0.8rem" color="#10b981" />}
                            {log.type === 'error' && <Icon name="error" size="0.8rem" color="#ef4444" />}
                            {!['purchase', 'topup', 'login', 'product_add', 'error'].includes(log.type) && <Icon name="bell" size="0.8rem" color="#6366f1" />}
                          </div>
                          <div className={styles.activityContent}>
                            <p className={styles.activityText}>{log.title}</p>
                            <span className={styles.activityTime}>
                              {new Date(log.createdAt).toLocaleString("th-TH", { 
                                dateStyle: "medium", 
                                timeStyle: "short" 
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.activityEmpty}>
                        <Icon name="bell" size="1.5rem" color="#52525b" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActionsPremium}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="lightning" size="1rem" />
                      Quick Actions
                    </h3>
                  </div>
                  <div className={styles.quickActionsGridPremium}>
                    {[
                      { icon: "add", label: "Add Product", color: "#6366f1", bg: "rgba(99,102,241,0.15)", action: () => { setActiveTab("products"); setEditingItem(null); setShowModal(true); } },
                      { icon: "upload", label: "Upload Files", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", action: () => setActiveTab("uploads") },
                      { icon: "ticket", label: "Create Coupon", color: "#ec4899", bg: "rgba(236,72,153,0.15)", action: () => { setActiveTab("coupons"); setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); setShowCouponModal(true); } },
                      { icon: "users", label: "Manage Users", color: "#14b8a6", bg: "rgba(20,184,166,0.15)", action: () => setActiveTab("users") },
                      { icon: "order", label: "View Orders", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", action: () => setActiveTab("orders") },
                      { icon: "history", label: "View Logs", color: "#f43f5e", bg: "rgba(244,63,94,0.15)", action: () => setActiveTab("logs") },
                    ].map((action, i) => (
                      <button key={i} onClick={action.action} className={styles.quickActionBtnPremium}>
                        <div className={styles.quickActionIcon} style={{ background: action.bg, color: action.color }}>
                          <Icon name={action.icon} size="1.2rem" />
                        </div>
                        <span className={styles.quickActionLabel}>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Best Seller & Stats */}
              <div className={styles.dashboardRow}>
                <div className={styles.bestSellerCard}>
                  <div className={styles.bestSellerHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="trophy" size="1rem" color="#f59e0b" />
                      Best Selling Product
                    </h3>
                    <span className={styles.bestSellerBadge}>🏆</span>
                  </div>
                  <div className={styles.bestSellerContent}>
                    <div className={styles.bestSellerIcon}>
                      <Icon name="product" size="2rem" color="#f59e0b" />
                    </div>
                    <div className={styles.bestSellerInfo}>
                      <p className={styles.bestSellerName}>{topMod.split('(')[0]?.trim() || "No data"}</p>
                      <p className={styles.bestSellerMeta}>
                        <Icon name="users" size="0.7rem" />
                        Top seller this month
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.quickStatsCard}>
                  <div className={styles.quickStatsHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Icon name="stats" size="1rem" />
                      Quick Stats
                    </h3>
                  </div>
                  <div className={styles.quickStatsGrid}>
                    <div className={styles.quickStatItem}>
                      <span className={styles.quickStatValue}>{stats.orders || 0}</span>
                      <span className={styles.quickStatLabel}>Orders Today</span>
                    </div>
                    <div className={styles.quickStatItem}>
                      <span className={styles.quickStatValue}>{stats.users || 0}</span>
                      <span className={styles.quickStatLabel}>New Users</span>
                    </div>
                    <div className={styles.quickStatItem}>
                      <span className={styles.quickStatValue}>฿{(stats.revenue || 0).toLocaleString()}</span>
                      <span className={styles.quickStatLabel}>Revenue</span>
                    </div>
                    <div className={styles.quickStatItem}>
                      <span className={styles.quickStatValue}>{stats.products || 0}</span>
                      <span className={styles.quickStatLabel}>Products</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
         {/* ORDERS - Premium Design */}
          {activeTab === "orders" && (
            <div className={styles.tabContent}>
              
              {/* Header Section */}
              <div className={styles.ordersHeader}>
                <div className={styles.ordersHeaderLeft}>
                  <h2 className={styles.ordersTitle}>
                    <Icon name="order" size="1.2rem" color="#f59e0b" />
                    Order Management
                  </h2>
                  <span className={styles.ordersCount}>
                    {totalOrders} Orders
                  </span>
                </div>
                <div className={styles.ordersHeaderRight}>
                  <div className={styles.ordersSearch}>
                    <Icon name="search" size="0.8rem" />
                    <input 
                      type="text" 
                      placeholder="Search orders..." 
                      className={styles.ordersSearchInput}
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                    />
                    {orderSearchTerm && (
                      <button 
                        className={styles.ordersSearchClear} 
                        onClick={() => setOrderSearchTerm('')}
                      >
                        <Icon name="close" size="0.6rem" />
                      </button>
                    )}
                  </div>
                  <button 
                    className={styles.ordersRefreshBtn}
                    onClick={() => {
                      axios.get("/api/user/purchase").then((res) => {
                        const data = res.data || [];
                        setOrders(data);
                        setTotalOrders(data.length);
                        setTotalRevenue(data.reduce((sum, o) => sum + (o.price || 0), 0));
                      }).catch(console.error);
                    }}
                  >
                    <Icon name="refresh" size="0.8rem" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className={styles.ordersStatsGrid}>
                <div className={styles.ordersStatCard} style={{ '--accent': '#10b981' }}>
                  <div className={styles.ordersStatIcon}>
                    <Icon name="money" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.ordersStatValue}>฿{totalRevenue.toLocaleString()}</span>
                    <span className={styles.ordersStatLabel}>Total Revenue</span>
                  </div>
                  <div className={styles.ordersStatTrend}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>+12%</span>
                  </div>
                </div>

                <div className={styles.ordersStatCard} style={{ '--accent': '#3b82f6' }}>
                  <div className={styles.ordersStatIcon}>
                    <Icon name="order" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.ordersStatValue}>{totalOrders}</span>
                    <span className={styles.ordersStatLabel}>Total Orders</span>
                  </div>
                  <div className={styles.ordersStatTrend}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>+8%</span>
                  </div>
                </div>

                <div className={styles.ordersStatCard} style={{ '--accent': '#f59e0b' }}>
                  <div className={styles.ordersStatIcon}>
                    <Icon name="trophy" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.ordersStatValue} style={{ fontSize: '0.9rem' }}>
                      {topMod.split('(')[0]?.trim() || 'No data'}
                    </span>
                    <span className={styles.ordersStatLabel}>Best Seller</span>
                  </div>
                  <div className={styles.ordersStatTrend} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    <Icon name="crown" size="0.7rem" />
                    <span>Top</span>
                  </div>
                </div>

                <div className={styles.ordersStatCard} style={{ '--accent': '#8b5cf6' }}>
                  <div className={styles.ordersStatIcon}>
                    <Icon name="users" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.ordersStatValue}>
                      {new Set(orders.map(o => o.buyerName || o.buyerId)).size}
                    </span>
                    <span className={styles.ordersStatLabel}>Unique Buyers</span>
                  </div>
                  <div className={styles.ordersStatTrend} style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                    <Icon name="user" size="0.7rem" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className={styles.ordersTableContainer}>
                <div className={styles.ordersTableHeader}>
                  <div className={styles.ordersTableLeft}>
                    <span className={styles.ordersTableTitle}>
                      <Icon name="receipt" size="0.8rem" />
                      Order History
                    </span>
                    <span className={styles.ordersTableCount}>
                      {filteredOrders.length} records
                    </span>
                  </div>
                  <div className={styles.ordersTableFilter}>
                    <select 
                      className={styles.ordersFilterSelect}
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                    >
                      <option value="all">All Orders</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className={styles.ordersEmptyState}>
                    <Icon name="receipt" size="3rem" color="#52525b" />
                    <p className={styles.ordersEmptyTitle}>No orders found</p>
                    <p className={styles.ordersEmptyText}>
                      {orderSearchTerm ? 'Try adjusting your search' : 'Orders will appear here once customers make purchases'}
                    </p>
                  </div>
                ) : (
                  <div className={styles.ordersTableWrapper}>
                    <table className={styles.ordersTable}>
                      <thead>
                        <tr>
                          <th>
                            <Icon name="product" size="0.6rem" />
                            Product
                          </th>
                          <th>
                            <Icon name="user" size="0.6rem" />
                            Buyer
                          </th>
                          <th>
                            <Icon name="coin" size="0.6rem" />
                            Price
                          </th>
                          <th>
                            <Icon name="calendar" size="0.6rem" />
                            Date
                          </th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order, i) => (
                          <tr key={i} className={styles.ordersTableRow}>
                            <td>
                              <div className={styles.ordersProductInfo}>
                                {order.productImage ? (
                                  <img 
                                    src={order.productImage} 
                                    alt={order.productName} 
                                    className={styles.ordersProductThumb}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className={styles.ordersProductThumbPlaceholder}>
                                    <Icon name="product" size="0.8rem" color="#52525b" />
                                  </div>
                                )}
                                <span className={styles.ordersProductName}>
                                  {order.productName || order.productId}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.ordersBuyerInfo}>
                                <div className={styles.ordersBuyerAvatar}>
                                  {order.buyerImage ? (
                                    <img src={order.buyerImage} alt={order.buyerName} />
                                  ) : (
                                    <span>{order.buyerName?.charAt(0)?.toUpperCase() || '?'}</span>
                                  )}
                                </div>
                                <span>{order.buyerName || order.buyerId}</span>
                              </div>
                            </td>
                            <td>
                              <span className={styles.ordersPrice}>
                                <Icon name="coin" size="0.6rem" color="#10b981" />
                                {order.price} ฿
                              </span>
                            </td>
                            <td>
                              <span className={styles.ordersDate}>
                                {order.purchaseDate ? (
                                  <>
                                    <Icon name="calendar" size="0.6rem" color="#6b7280" />
                                    {new Date(order.purchaseDate).toLocaleString("th-TH", { 
                                      dateStyle: "medium", 
                                      timeStyle: "short" 
                                    })}
                                  </>
                                ) : '-'}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.ordersStatus} ${styles.ordersStatusSuccess}`}>
                                <Icon name="check-circle" size="0.6rem" />
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                  <div className={styles.ordersPagination}>
                    <button 
                      className={styles.ordersPageBtn} 
                      disabled={orderPage === 1}
                      onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                    >
                      <Icon name="arrow-left" size="0.7rem" />
                      Previous
                    </button>
                    <span className={styles.ordersPageInfo}>
                      Page {orderPage} of {orderTotalPages}
                    </span>
                    <button 
                      className={styles.ordersPageBtn}
                      disabled={orderPage === orderTotalPages}
                      onClick={() => setOrderPage(p => Math.min(orderTotalPages, p + 1))}
                    >
                      Next
                      <Icon name="arrow-right" size="0.7rem" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRODUCTS - Premium Design */}
          {activeTab === "products" && (
            <div className={styles.tabContent}>
              
              {/* Header Section */}
              <div className={styles.productsHeader}>
                <div className={styles.productsHeaderLeft}>
                  <h2 className={styles.productsTitle}>
                    <Icon name="product" size="1.2rem" color="#10b981" />
                    Product Management
                  </h2>
                  <span className={styles.productsCount}>
                    {items.length} Products
                  </span>
                </div>
                <div className={styles.productsHeaderRight}>
                  <div className={styles.productsSearch}>
                    <Icon name="search" size="0.8rem" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      className={styles.productsSearchInput}
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                    {productSearchTerm && (
                      <button 
                        className={styles.productsSearchClear} 
                        onClick={() => setProductSearchTerm('')}
                      >
                        <Icon name="close" size="0.6rem" />
                      </button>
                    )}
                  </div>
                  <button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.addButtonPremium}>
                    <Icon name="add" size="0.8rem" /> Add Product
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className={styles.productsStatsRow}>
                <div className={styles.productsStatItem}>
                  <span className={styles.productsStatValue}>{items.length}</span>
                  <span className={styles.productsStatLabel}>Total Products</span>
                </div>
                <div className={styles.productsStatItem}>
                  <span className={styles.productsStatValue}>
                    {items.reduce((sum, p) => sum + (p.itemsprice || 0), 0).toLocaleString()}
                  </span>
                  <span className={styles.productsStatLabel}>Total Value</span>
                </div>
                <div className={styles.productsStatItem}>
                  <span className={styles.productsStatValue}>
                    {items.filter(p => p.discordRoleIds?.length > 0).length}
                  </span>
                  <span className={styles.productsStatLabel}>With Roles</span>
                </div>
                <div className={styles.productsStatItem}>
                  <span className={styles.productsStatValue}>
                    {items.reduce((sum, p) => sum + (p.purchasedCount || 0), 0)}
                  </span>
                  <span className={styles.productsStatLabel}>Total Sales</span>
                </div>
              </div>

              {/* Product Grid */}
              <div className={styles.productGridPremium}>
                {filteredProducts.length === 0 ? (
                  <div className={styles.emptyStatePremium}>
                    <Icon name="product" size="3rem" color="#52525b" />
                    <p className={styles.emptyTitle}>No products found</p>
                    <p className={styles.emptyText}>
                      {productSearchTerm ? 'Try adjusting your search' : 'Start by adding your first product'}
                    </p>
                    {!productSearchTerm && (
                      <button onClick={() => { setEditingItem(null); setShowModal(true); }} className={styles.emptyAddBtn}>
                        <Icon name="add" size="0.8rem" /> Add Product
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((item) => (
                    <div key={item._id} className={styles.productCardPremium}>
                      
                      {/* Product Badge */}
                      {item.discordRoleIds?.length > 0 && (
                        <div className={styles.productCardBadge}>
                          <Icon name="role" size="0.5rem" />
                          Role
                        </div>
                      )}
                      
                      {/* Product Image */}
                      <div className={styles.productCardImageWrapper}>
                        <img 
                          src={item.itemsimage} 
                          alt={item.itemsname} 
                          className={styles.productCardImage}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                        <div className={styles.productCardOverlay}>
                          <span className={styles.productCardPrice}>
                            <Icon name="coin" size="0.7rem" /> {item.itemsprice}
                          </span>
                        </div>
                      </div>

                      {/* Product Body */}
                      <div className={styles.productCardBody}>
                        <div className={styles.productCardHeader}>
                          <h3 className={styles.productCardName}>{item.itemsname}</h3>
                          <span className={styles.productCardVersion}>
                            <Icon name="version" size="0.6rem" /> v{item.itemsversion}
                          </span>
                        </div>
                        <p className={styles.productCardTitle}>{item.itemstitle}</p>
                        <p className={styles.productCardDesc}>{item.itemsdesc}</p>
                        
                        {/* Role IDs */}
                        {item.discordRoleIds?.length > 0 && (
                          <div className={styles.productCardRoles}>
                            <Icon name="role" size="0.6rem" color="#a78bfa" />
                            {item.discordRoleIds.slice(0, 2).map((role, i) => (
                              <span key={i} className={styles.productCardRoleTag}>
                                {role.slice(0, 8)}...
                              </span>
                            ))}
                            {item.discordRoleIds.length > 2 && (
                              <span className={styles.productCardRoleMore}>
                                +{item.discordRoleIds.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Product Actions */}
                      <div className={styles.productCardActions}>
                        <button 
                          onClick={() => handleEdit(item)} 
                          className={styles.productCardActionBtn}
                          title="Edit"
                        >
                          <Icon name="edit" size="0.8rem" color="#f59e0b" />
                        </button>
                        <button 
                          onClick={() => handleVersionUpdate(item)} 
                          className={styles.productCardActionBtn}
                          title="Update Version"
                        >
                          <Icon name="refresh" size="0.8rem" color="#3b82f6" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id, item.itemsname)} 
                          className={styles.productCardActionBtn}
                          title="Delete"
                        >
                          <Icon name="delete" size="0.8rem" color="#ef4444" />
                        </button>
                        <a 
                          href={item.itemsfile} 
                          target="_blank" 
                          className={styles.productCardActionBtn}
                          title="Download File"
                        >
                          <Icon name="download" size="0.8rem" color="#10b981" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modals */}
              {showModal && <ProductModal editingItem={editingItem} onClose={() => { setShowModal(false); setEditingItem(null); }} onSaved={handleSaved} />}
              {showVersionModal && selectedProductForVersion && <VersionUpdateModal product={selectedProductForVersion} onClose={() => { setShowVersionModal(false); setSelectedProductForVersion(null); }} onUpdated={handleVersionUpdated} />}
            </div>
          )}

          {/* TOPUPS - Premium Design */}
          {activeTab === "topups" && (
            <div className={styles.tabContent}>
              
              {/* Header Section */}
              <div className={styles.topupsHeader}>
                <div className={styles.topupsHeaderLeft}>
                  <h2 className={styles.topupsTitle}>
                    <Icon name="money" size="1.2rem" color="#3b82f6" />
                    Topup Management
                  </h2>
                  <span className={styles.topupsCount}>
                    {topups.length} Transactions
                  </span>
                </div>
                <div className={styles.topupsHeaderRight}>
                  <div className={styles.topupsSearch}>
                    <Icon name="search" size="0.8rem" />
                    <input 
                      type="text" 
                      placeholder="Search by user or ref..." 
                      className={styles.topupsSearchInput}
                      value={topupSearchTerm}
                      onChange={(e) => setTopupSearchTerm(e.target.value)}
                    />
                    {topupSearchTerm && (
                      <button 
                        className={styles.topupsSearchClear} 
                        onClick={() => setTopupSearchTerm('')}
                      >
                        <Icon name="close" size="0.6rem" />
                      </button>
                    )}
                  </div>
                  <button 
                    className={styles.topupsRefreshBtn}
                    onClick={fetchTopups}
                  >
                    <Icon name="refresh" size="0.8rem" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className={styles.topupsStatsGrid}>
                <div className={styles.topupsStatCard} style={{ '--accent': '#10b981' }}>
                  <div className={styles.topupsStatIcon}>
                    <Icon name="coin" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.topupsStatValue}>
                      {topups.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                    </span>
                    <span className={styles.topupsStatLabel}>Total Amount</span>
                  </div>
                  <div className={styles.topupsStatTrend} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    <Icon name="arrow-up" size="0.7rem" />
                    <span>฿</span>
                  </div>
                </div>

                <div className={styles.topupsStatCard} style={{ '--accent': '#3b82f6' }}>
                  <div className={styles.topupsStatIcon}>
                    <Icon name="check" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.topupsStatValue}>
                      {topups.filter(t => t.status === 'success').length}
                    </span>
                    <span className={styles.topupsStatLabel}>Successful</span>
                  </div>
                  <div className={styles.topupsStatTrend} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                    <Icon name="check-circle" size="0.7rem" />
                    <span>Completed</span>
                  </div>
                </div>

                <div className={styles.topupsStatCard} style={{ '--accent': '#f59e0b' }}>
                  <div className={styles.topupsStatIcon}>
                    <Icon name="clock" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.topupsStatValue}>
                      {topups.filter(t => t.status === 'pending').length}
                    </span>
                    <span className={styles.topupsStatLabel}>Pending</span>
                  </div>
                  <div className={styles.topupsStatTrend} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    <Icon name="clock" size="0.7rem" />
                    <span>Waiting</span>
                  </div>
                </div>

                <div className={styles.topupsStatCard} style={{ '--accent': '#8b5cf6' }}>
                  <div className={styles.topupsStatIcon}>
                    <Icon name="users" size="1.2rem" />
                  </div>
                  <div>
                    <span className={styles.topupsStatValue}>
                      {new Set(topups.map(t => t.userId)).size}
                    </span>
                    <span className={styles.topupsStatLabel}>Unique Users</span>
                  </div>
                  <div className={styles.topupsStatTrend} style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                    <Icon name="user" size="0.7rem" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* Topups Table */}
              <div className={styles.topupsTableContainer}>
                <div className={styles.topupsTableHeader}>
                  <div className={styles.topupsTableLeft}>
                    <span className={styles.topupsTableTitle}>
                      <Icon name="receipt" size="0.8rem" />
                      Transaction History
                    </span>
                    <span className={styles.topupsTableCount}>
                      {filteredTopups.length} records
                    </span>
                  </div>
                  <div className={styles.topupsTableFilter}>
                    <select 
                      className={styles.topupsFilterSelect}
                      value={topupFilter}
                      onChange={(e) => setTopupFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="success">
                        <Icon name="check" size="0.6rem" /> Success
                      </option>
                      <option value="pending">
                        <Icon name="clock" size="0.6rem" /> Pending
                      </option>
                      <option value="error">
                        <Icon name="error" size="0.6rem" /> Failed
                      </option>
                      <option value="duplicate">
                        <Icon name="warning" size="0.6rem" /> Duplicate
                      </option>
                    </select>
                    <select 
                      className={styles.topupsFilterSelect}
                      value={topupMethodFilter}
                      onChange={(e) => setTopupMethodFilter(e.target.value)}
                    >
                      <option value="all">All Methods</option>
                      <option value="bank">
                        <Icon name="bank" size="0.6rem" /> Bank Transfer
                      </option>
                      <option value="wallet">
                        <Icon name="wallet" size="0.6rem" /> TrueWallet
                      </option>
                    </select>
                  </div>
                </div>

                {loadingTopups ? (
                  <div className={styles.topupsLoading}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading transactions...</p>
                  </div>
                ) : filteredTopups.length === 0 ? (
                  <div className={styles.topupsEmptyState}>
                    <Icon name="receipt" size="3rem" color="#52525b" />
                    <p className={styles.topupsEmptyTitle}>No transactions found</p>
                    <p className={styles.topupsEmptyText}>
                      {topupSearchTerm ? 'Try adjusting your search' : 'Topup transactions will appear here'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={styles.topupsTableWrapper}>
                      <table className={styles.topupsTable}>
                        <thead>
                          <tr>
                            <th>
                              <Icon name="calendar" size="0.6rem" />
                              Date
                            </th>
                            <th>
                              <Icon name="user" size="0.6rem" />
                              User
                            </th>
                            <th>
                              <Icon name="coin" size="0.6rem" />
                              Amount
                            </th>
                            <th>
                              <Icon name="receipt" size="0.6rem" />
                              Ref
                            </th>
                            <th>
                              <Icon name="image" size="0.6rem" />
                              Slip
                            </th>
                            <th>
                              <Icon name="wallet" size="0.6rem" />
                              Method
                            </th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTopups.map((topup) => {
                            const s = getStatusBadge(topup.status);
                            return (
                              <tr key={topup._id} className={styles.topupsTableRow}>
                                <td>
                                  <div className={styles.topupsDate}>
                                    <span className={styles.topupsDateMain}>
                                      {new Date(topup.createdAt).toLocaleDateString("th-TH", { 
                                        dateStyle: "medium" 
                                      })}
                                    </span>
                                    <span className={styles.topupsDateTime}>
                                      {new Date(topup.createdAt).toLocaleTimeString("th-TH", { 
                                        hour: "2-digit", 
                                        minute: "2-digit" 
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className={styles.topupsUser}>
                                    <div className={styles.topupsUserAvatar}>
                                      {topup.userImage ? (
                                        <img src={topup.userImage} alt={topup.userName} />
                                      ) : (
                                        <span>{topup.userName?.charAt(0)?.toUpperCase() || '?'}</span>
                                      )}
                                    </div>
                                    <div>
                                      <div className={styles.topupsUserName}>
                                        {topup.userName || 'Unknown'}
                                      </div>
                                      <div className={styles.topupsUserId}>
                                        ID: {topup.userId?.slice(0, 8)}...
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={styles.topupsAmount}>
                                    <Icon name="coin" size="0.6rem" color="#10b981" />
                                    {topup.amount?.toLocaleString() || 0}
                                  </span>
                                </td>
                                <td>
                                  <span className={styles.topupsRef}>
                                    {topup.transRef || topup.voucherCode?.slice(0, 8) || '-'}
                                  </span>
                                </td>
                                <td>
                                  {topup.slipUrl ? (
                                    <a 
                                      href={topup.slipUrl} 
                                      target="_blank" 
                                      className={styles.topupsSlipLink}
                                      rel="noopener noreferrer"
                                    >
                                      <Icon name="image" size="0.7rem" />
                                      View Slip
                                    </a>
                                  ) : topup.method === 'wallet' ? (
                                    <span className={styles.topupsMethodBadge}>
                                      <Icon name="gift" size="0.6rem" />
                                      Auto
                                    </span>
                                  ) : (
                                    <span className={styles.topupsNoSlip}>No slip</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`${styles.topupsMethod} ${topup.method === 'wallet' ? styles.topupsMethodWallet : styles.topupsMethodBank}`}>
                                    <Icon name={topup.method === 'wallet' ? 'gift' : 'bank'} size="0.6rem" />
                                    {topup.method === 'wallet' ? 'TrueWallet' : 'Bank'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`${styles.topupsStatus} ${styles[s.class]}`}>
                                    <Icon name={s.icon} size="0.6rem" />
                                    {s.text}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {topupTotalPages > 1 && (
                      <div className={styles.topupsPagination}>
                        <button 
                          className={styles.topupsPageBtn} 
                          disabled={topupPage === 1}
                          onClick={() => setTopupPage(p => Math.max(1, p - 1))}
                        >
                          <Icon name="arrow-left" size="0.7rem" />
                          Previous
                        </button>
                        <span className={styles.topupsPageInfo}>
                          Page {topupPage} of {topupTotalPages}
                        </span>
                        <button 
                          className={styles.topupsPageBtn}
                          disabled={topupPage === topupTotalPages}
                          onClick={() => setTopupPage(p => Math.min(topupTotalPages, p + 1))}
                        >
                          Next
                          <Icon name="arrow-right" size="0.7rem" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* UPLOADS */}
          {activeTab === "uploads" && (
            <div className={styles.tabContent}>
              <div className={styles.uploadSection}>
                <label className={`${styles.customFileUpload} ${uploading ? styles.uploading : ''} ${selectedFile ? styles.hasFile : ''}`}>
                  {uploading ? (
                    <span><Icon name="loading" size="0.8rem" className={styles.spinning} /> Uploading...</span>
                  ) : selectedFile ? (
                    <span><Icon name="check" size="0.8rem" /> {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  ) : (
                    <span><Icon name="upload" size="0.8rem" /> Choose File (Max 2GB)</span>
                  )}
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} disabled={uploading} />
                </label>
                {selectedFile && !uploading && (
                  <button onClick={() => setSelectedFile(null)} className={styles.cancelBtn}>
                    <Icon name="close" size="0.7rem" />
                  </button>
                )}
                <button onClick={handleUpload} disabled={!selectedFile || uploading} className={styles.addButton}>
                  {uploading ? <Icon name="loading" size="0.8rem" className={styles.spinning} /> : <><Icon name="upload" size="0.8rem" /> Upload</>}
                </button>
              </div>
              {images.length > 0 && (
                <div className={styles.galleryContainer}>
                  {groupFilesByCategory(images).map((category) => (
                    <div key={category.key} className={styles.galleryCategory}>
                      <div className={styles.galleryCategoryHeader}>
                        <span className={styles.galleryCategoryIcon}>{category.icon}</span>
                        <span className={styles.galleryCategoryLabel}>{category.label}</span>
                        <span className={styles.galleryCategoryCount}>{category.files.length} files</span>
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
                                <Icon name="file" size="1.5rem" />
                                <span className={styles.galleryFileName}>{file.fileName}</span>
                              </div>
                            )}
                            <div className={styles.galleryItemInfo}>
                              <input type="text" value={file.url} readOnly className={styles.galleryUrl} onClick={(e) => e.target.select()} />
                              <div className={styles.galleryActions}>
                                <button onClick={() => { navigator.clipboard.writeText(file.url); success("Copied!"); }} className={styles.galleryCopyBtn}>
                                  <Icon name="copy" size="0.8rem" />
                                </button>
                                <a href={file.url} target="_blank" className={styles.galleryOpenBtn}>
                                  <Icon name="link" size="0.8rem" />
                                </a>
                                <button onClick={() => handleDeleteFile(file.fileName)} disabled={deletingFile === file.fileName} className={styles.galleryDeleteBtn}>
                                  {deletingFile === file.fileName ? <Icon name="loading" size="0.8rem" className={styles.spinning} /> : <Icon name="delete" size="0.8rem" />}
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
              {images.length === 0 && !uploading && (
                <div className={styles.emptyState}>
                  <Icon name="file" size="3rem" />
                  <p className={styles.emptyTitle}>No files uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* R2 FILES */}
          {activeTab === "r2" && (
            <div className={styles.tabContent}>
              <div className={styles.r2UploadArea}>
                <h3><Icon name="cloud" size="1rem" /> Upload to R2</h3>
                <R2Uploader onUploadComplete={() => { success("Uploaded to R2!"); fetchR2Files(); }} accept="*/*" maxSize={5000} />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                  <Icon name="info" size="0.6rem" /> All file types, max 5GB
                </small>
              </div>
              <div className={styles.r2FilesSection}>
                <div className={styles.r2FilesHeader}>
                  <h3><Icon name="cloud" size="1rem" /> R2 Files ({r2Files.length})</h3>
                  <button onClick={fetchR2Files} className={styles.r2RefreshBtn}>
                    <Icon name="refresh" size="0.8rem" /> Refresh
                  </button>
                </div>
                {loadingR2Files ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading...</p>
                  </div>
                ) : r2Files.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Icon name="cloud" size="3rem" />
                    <p className={styles.emptyTitle}>No files in R2</p>
                  </div>
                ) : (
                  <div className={styles.r2FilesGrid}>
                    {r2Files.map((file) => (
                      <div key={file.key} className={styles.r2FileCard}>
                        {isImageFile(file.fileName) ? (
                          <div className={styles.r2FilePreview}>
                            <img src={file.url} alt={file.fileName} className={styles.r2FileThumb} loading="lazy" />
                          </div>
                        ) : (
                          <div className={styles.r2FileIcon}>
                            <Icon name="file" size="2.5rem" />
                            <span className={styles.r2FileType}>{file.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                          </div>
                        )}
                        <div className={styles.r2FileInfo}>
                          <p className={styles.r2FileName}>{file.fileName}</p>
                          <p className={styles.r2FileSize}>{file.sizeFormatted || 'Unknown'}</p>
                          {file.lastModified && (
                            <p className={styles.r2FileDate}>
                              <Icon name="calendar" size="0.6rem" /> {new Date(file.lastModified).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          )}
                        </div>
                        <div className={styles.r2FileActions}>
                          <button onClick={() => { navigator.clipboard.writeText(file.url); success("Copied!"); }} className={styles.r2CopyBtn}>
                            <Icon name="copy" size="0.8rem" />
                          </button>
                          <a href={file.url} target="_blank" className={styles.r2OpenBtn}>
                            <Icon name="link" size="0.8rem" />
                          </a>
                          <button onClick={() => handleDeleteR2File(file.key)} disabled={deletingR2File === file.key} className={styles.r2DeleteBtn}>
                            {deletingR2File === file.key ? <Icon name="loading" size="0.8rem" className={styles.spinning} /> : <Icon name="delete" size="0.8rem" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

         
          {activeTab === "users" && (
          <div className={styles.tabContent}>
            
            {/* Header Section */}
            <div className={styles.usersHeader}>
              <div className={styles.usersHeaderLeft}>
                <h2 className={styles.usersTitle}>
                  <Icon name="users" size="1.2rem" color="#6366f1" />
                  User Management
                </h2>
                <span className={styles.usersCount}>
                  {users.length} Users
                </span>
              </div>
              <div className={styles.usersHeaderRight}>
                <div className={styles.usersSearch}>
                  <Icon name="search" size="0.8rem" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className={styles.usersSearchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className={styles.usersRefreshBtn} onClick={fetchUsers}>
                  <Icon name="refresh" size="0.8rem" />
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className={styles.usersStatsRow}>
              <div className={styles.usersStatItem}>
                <span className={styles.usersStatValue}>{users.length}</span>
                <span className={styles.usersStatLabel}>Total Users</span>
              </div>
              <div className={styles.usersStatItem}>
                <span className={styles.usersStatValue}>
                  {users.reduce((sum, u) => sum + (u.points || 0), 0).toLocaleString()}
                </span>
                <span className={styles.usersStatLabel}>Total Points</span>
              </div>
              <div className={styles.usersStatItem}>
                <span className={styles.usersStatValue}>
                  {users.filter(u => u.points > 0).length}
                </span>
                <span className={styles.usersStatLabel}>Active Users</span>
              </div>
              <div className={styles.usersStatItem}>
                <span className={styles.usersStatValue}>
                  {users.reduce((sum, u) => sum + (u.purchasedCount || 0), 0)}
                </span>
                <span className={styles.usersStatLabel}>Total Purchases</span>
              </div>
            </div>

            {/* User Grid */}
            <div className={styles.userGrid}>
              {filteredUsers.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="users" size="3rem" />
                  <p className={styles.emptyTitle}>No users found</p>
                  <p className={styles.emptyText}>Try adjusting your search</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className={styles.userCard} onClick={() => handleSelectUser(user)}>
                    {/* User Card Badge */}
                    {user.points > 1000 && (
                      <div className={styles.userCardBadge}>
                        <Icon name="crown" size="0.6rem" />
                        VIP
                      </div>
                    )}
                    
                    {/* Avatar */}
                    <div className={styles.userCardAvatar}>
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt={user.name} 
                          className={styles.userCardAvatarImg}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className={styles.userCardAvatarText}>
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                      <div className={`${styles.userStatusDot} ${user.points > 0 ? styles.userStatusActive : styles.userStatusInactive}`} />
                    </div>

                    {/* User Info */}
                    <div className={styles.userCardInfo}>
                      <div className={styles.userCardNameRow}>
                        <h3 className={styles.userCardName}>{user.name}</h3>
                        {user.points > 500 && (
                          <span className={styles.userCardLevel}>
                            Lv.{Math.floor(user.points / 500) + 1}
                          </span>
                        )}
                      </div>
                      <p className={styles.userCardEmail}>{user.email}</p>
                      <div className={styles.userCardMeta}>
                        <span className={styles.userCardPoints}>
                          <Icon name="coin" size="0.7rem" color="#10b981" />
                          {user.points?.toLocaleString() || 0} Points
                        </span>
                        <span className={styles.userCardPurchases}>
                          <Icon name="cart" size="0.7rem" color="#6366f1" />
                          {user.purchasedCount || 0} items
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className={styles.userCardArrow}>
                      <Icon name="arrow-right" size="1.2rem" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* User Detail Modal - Premium Design */}
            {selectedUser && (
              <div className={styles.modalOverlay} onClick={() => !actionLoading && setSelectedUser(null)}>
                <div className={styles.userModal} onClick={(e) => e.stopPropagation()}>
                  
                  {/* Modal Header with Gradient */}
                  <div className={styles.userModalHeaderPremium}>
                    <button className={styles.userModalClose} onClick={() => setSelectedUser(null)} disabled={actionLoading}>
                      <Icon name="close" size="1rem" />
                    </button>
                    
                    <div className={styles.userModalHeaderContent}>
                      <div className={styles.userModalAvatarPremium}>
                        {selectedUser.image ? (
                          <img 
                            src={selectedUser.image} 
                            alt={selectedUser.name} 
                            className={styles.userModalAvatarImg}
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={styles.userModalAvatarText}>
                          {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <div className={styles.userModalAvatarRing} />
                      </div>
                      
                      <div className={styles.userModalHeaderInfo}>
                        <h2 className={styles.userModalName}>
                          {selectedUser.name}
                          {selectedUser.points > 1000 && (
                            <span className={styles.userModalVipBadge}>
                              <Icon name="crown" size="0.6rem" /> VIP
                            </span>
                          )}
                        </h2>
                        <p className={styles.userModalEmail}>
                          <Icon name="email" size="0.7rem" />
                          {selectedUser.email}
                        </p>
                        <div className={styles.userModalId}>
                          <Icon name="user" size="0.6rem" />
                          <span>Discord ID: {selectedUser.id}</span>
                        </div>
                        <div className={styles.userModalLevel}>
                          <span>Level {Math.floor((selectedUser.points || 0) / 500) + 1}</span>
                          <div className={styles.userModalLevelBar}>
                            <div 
                              className={styles.userModalLevelProgress} 
                              style={{ 
                                width: `${((selectedUser.points || 0) % 500) / 5}%` 
                              }} 
                            />
                          </div>
                          <span className={styles.userModalLevelText}>
                            {((selectedUser.points || 0) % 500)} / 500 XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className={styles.userModalStatsPremium}>
                    <div className={styles.userModalStatCardPremium}>
                      <div className={styles.userModalStatIcon} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <Icon name="coin" size="1.2rem" />
                      </div>
                      <div>
                        <p className={styles.userModalStatLabel}>Points</p>
                        <p className={styles.userModalStatValue}>{selectedUser.points?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    <div className={styles.userModalStatCardPremium}>
                      <div className={styles.userModalStatIcon} style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                        <Icon name="cart" size="1.2rem" />
                      </div>
                      <div>
                        <p className={styles.userModalStatLabel}>Purchases</p>
                        <p className={styles.userModalStatValue}>{userProducts.length}</p>
                      </div>
                    </div>
                    <div className={styles.userModalStatCardPremium}>
                      <div className={styles.userModalStatIcon} style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        <Icon name="calendar" size="1.2rem" />
                      </div>
                      <div>
                        <p className={styles.userModalStatLabel}>Joined</p>
                        <p className={styles.userModalStatValue}>
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("th-TH") : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className={styles.userModalStatCardPremium}>
                      <div className={styles.userModalStatIcon} style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                        <Icon name="trophy" size="1.2rem" />
                      </div>
                      <div>
                        <p className={styles.userModalStatLabel}>Rank</p>
                        <p className={styles.userModalStatValue}>
                          {selectedUser.points > 2000 ? 'Platinum' :
                          selectedUser.points > 1000 ? 'Gold' :
                          selectedUser.points > 500 ? 'Silver' : 'Bronze'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Manage Points - Premium */}
                  <div className={styles.userModalSection}>
                    <h3 className={styles.userModalSectionTitle}>
                      <Icon name="settings" size="0.8rem" color="#818cf8" />
                      Manage Points
                    </h3>
                    <div className={styles.userModalPointFormPremium}>
                      <div className={styles.userModalPointRow}>
                        <div className={styles.userModalPointInputPremium}>
                          <label className={styles.userModalPointLabel}>Amount</label>
                          <input 
                            type="number" 
                            className={styles.pointInputPremium} 
                            value={changeAmount} 
                            onChange={(e) => setChangeAmount(e.target.value)} 
                            min="1" 
                          />
                        </div>
                        <div className={styles.userModalPointButtonsPremium}>
                          <button className={styles.pointAddBtnPremium} onClick={() => applyPointChange("add")} disabled={actionLoading}>
                            <Icon name="add" size="0.8rem" /> Add
                          </button>
                          <button className={styles.pointSubtractBtnPremium} onClick={() => applyPointChange("subtract")} disabled={actionLoading}>
                            <Icon name="minus" size="0.8rem" /> Subtract
                          </button>
                        </div>
                      </div>
                      <div className={styles.pointPreviewPremium}>
                        <div className={styles.pointPreviewLeft}>
                          <span className={styles.pointPreviewLabel}>Current</span>
                          <span className={styles.pointPreviewCurrent}>{selectedUser.points?.toLocaleString() || 0}</span>
                        </div>
                        <Icon name="arrow-right" size="0.8rem" color="#52525b" />
                        <div className={styles.pointPreviewRight}>
                          <span className={styles.pointPreviewLabel}>New</span>
                          <span className={styles.pointPreviewValue}>{proposedPoints?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                      <div className={styles.pointActionButtonsPremium}>
                        <button className={styles.pointCancelBtnPremium} onClick={() => setSelectedUser(null)} disabled={actionLoading}>
                          Cancel
                        </button>
                        <button className={styles.pointSaveBtnPremium} onClick={handleSavePoints} disabled={actionLoading}>
                          {actionLoading ? <Icon name="loading" size="0.8rem" className={styles.spinning} /> : <Icon name="check" size="0.8rem" />}
                          <span>{actionLoading ? "Saving..." : "Save Changes"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Products - Premium */}
                  <div className={styles.userModalSection}>
                    <h3 className={styles.userModalSectionTitle}>
                      <Icon name="cart" size="0.8rem" color="#10b981" />
                      Purchased Products ({userProducts.length})
                    </h3>
                    <div className={styles.userModalProductsPremium}>
                      {userProducts.length > 0 ? (
                        userProducts.map((item, index) => (
                          <div key={index} className={styles.purchasedItemCardPremium}>
                            <div className={styles.purchasedItemThumb}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} />
                              ) : (
                                <Icon name="product" size="1.2rem" color="#52525b" />
                              )}
                            </div>
                            <div className={styles.purchasedItemInfo}>
                              <h4 className={styles.purchasedItemName}>{item.name}</h4>
                              <div className={styles.purchasedItemMeta}>
                                <span className={styles.purchasedItemVersion}>
                                  <Icon name="version" size="0.5rem" /> v{item.version}
                                </span>
                                <span className={styles.purchasedItemDate}>
                                  <Icon name="calendar" size="0.5rem" /> {new Date(item.purchaseDate).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                              </div>
                              <div className={styles.purchasedItemActions}>
                                <a href={item.fileUrl} target="_blank" className={styles.purchasedItemDownload}>
                                  <Icon name="download" size="0.6rem" /> Download
                                </a>
                                {item.discordRoleIds?.length > 0 && (
                                  <span className={styles.purchasedItemRoles}>
                                    <Icon name="role" size="0.5rem" /> {item.discordRoleIds.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              className={styles.purchasedItemRemove} 
                              onClick={() => handleRemoveProduct(item.productId, index, item.name)} 
                              disabled={actionLoading}
                              title="Remove product"
                            >
                              <Icon name="delete" size="0.8rem" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className={styles.noPurchasesPremium}>
                          <Icon name="product" size="2rem" color="#52525b" />
                          <p>No purchases yet</p>
                          <span>This user hasn't bought any products</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

          {/* COUPONS */}
          {activeTab === "coupons" && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <div className={styles.tabHeaderLeft}>
                  <span className={styles.tabCount}>
                    <Icon name="ticket" size="0.7rem" /> {coupons.length} coupons
                  </span>
                </div>
                <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minPurchase: 0, maxUsage: 0, expiresAt: '', productRestriction: 'all', allowedProductIds: [] }); setShowCouponModal(true); }} className={styles.addButton}>
                  <Icon name="add" size="0.8rem" /> Add Coupon
                </button>
              </div>
              {loadingCoupons ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading...</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="ticket" size="3rem" />
                  <p className={styles.emptyTitle}>No coupons yet</p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr><th>Code</th><th>Discount</th><th>Type</th><th>Used</th><th>Expires</th><th>Products</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => {
                        const now = new Date();
                        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
                        const isMaxedOut = coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage;
                        const isValid = coupon.isActive && !isExpired && !isMaxedOut;
                        return (
                          <tr key={coupon._id}>
                            <td><strong>{coupon.code}</strong></td>
                            <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue?.toLocaleString() || 0} Point`}</td>
                            <td>{coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                            <td>{coupon.usedCount || 0} / {coupon.maxUsage > 0 ? coupon.maxUsage : '∞'}</td>
                            <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("th-TH") : 'Unlimited'}</td>
                            <td>
                              {coupon.productRestriction === "all" ? (
                                <span style={{ color: '#10b981', fontSize: '0.75rem' }}>All Products</span>
                              ) : coupon.allowedProductIds?.length > 0 ? (
                                <span style={{ fontSize: '0.7rem' }}>{coupon.allowedProductIds.map(p => p.itemsname || p).join(", ")}</span>
                              ) : (
                                <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>None set</span>
                              )}
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${isValid ? styles.statusSuccess : styles.statusFailed}`}>
                                {!coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : isMaxedOut ? 'Full' : 'Active'}
                              </span>
                            </td>
                            <td>
                              <button onClick={() => handleEditCoupon(coupon)} className={styles.editBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                                <Icon name="edit" size="0.7rem" />
                              </button>
                              <button onClick={() => handleDeleteCoupon(coupon._id)} className={styles.deleteBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                                <Icon name="delete" size="0.7rem" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {showCouponModal && (
                <div className={styles.modalOverlay} onClick={() => !savingCoupon && setShowCouponModal(false)}>
                  <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                    <button className={styles.modalClose} onClick={() => !savingCoupon && setShowCouponModal(false)}>
                      <Icon name="close" size="1rem" />
                    </button>
                    <h2 className={styles.modalTitle}><Icon name="ticket" size="1rem" /> {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
                    <form onSubmit={handleSaveCoupon} className={styles.modalForm}>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Code *</label>
                        <input value={couponForm.code} onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className={styles.modalInput} required />
                      </div>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Description</label>
                        <input value={couponForm.description} onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))} className={styles.modalInput} />
                      </div>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Type</label>
                        <select value={couponForm.discountType} onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))} className={styles.modalInput}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (Point)</option>
                        </select>
                      </div>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Discount *</label>
                        <input value={couponForm.discountValue} onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))} className={styles.modalInput} type="number" required />
                      </div>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Min Purchase (Point)</label>
                        <input value={couponForm.minPurchase} onChange={(e) => setCouponForm(prev => ({ ...prev, minPurchase: e.target.value }))} className={styles.modalInput} type="number" />
                      </div>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Max Usage</label>
                        <input value={couponForm.maxUsage} onChange={(e) => setCouponForm(prev => ({ ...prev, maxUsage: e.target.value }))} className={styles.modalInput} type="number" />
                      </div>
                      <div className={styles.modalRow}>
                        <label className={styles.modalLabel}>Expiry Date</label>
                        <input value={couponForm.expiresAt} onChange={(e) => setCouponForm(prev => ({ ...prev, expiresAt: e.target.value }))} className={styles.modalInput} type="date" />
                      </div>
                      
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
                          <div className={styles.productCheckboxList}>
                            {allProducts.length === 0 ? (
                              <p style={{ color: '#52525b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Loading products...</p>
                            ) : (
                              allProducts.map(product => (
                                <label key={product._id} className={styles.productCheckboxItem}>
                                  <input type="checkbox" checked={(couponForm.allowedProductIds || []).includes(product._id)} onChange={(e) => { const newIds = e.target.checked ? [...(couponForm.allowedProductIds || []), product._id] : (couponForm.allowedProductIds || []).filter(id => id !== product._id); setCouponForm(prev => ({ ...prev, allowedProductIds: newIds })); }} />
                                  <img src={product.itemsimage} alt="" className={styles.productCheckboxImage} />
                                  <span>{product.itemsname}</span>
                                  <span className={styles.productCheckboxPrice}>฿{product.itemsprice}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div className={styles.modalActions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => !savingCoupon && setShowCouponModal(false)}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={savingCoupon}>
                          {savingCoupon ? <Icon name="loading" size="0.8rem" className={styles.spinning} /> : <Icon name="save" size="0.8rem" />}
                          {editingCoupon ? 'Save' : 'Add'}
                        </button>
                      </div>
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
              {loadingLogs ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="history" size="3rem" />
                  <p className={styles.emptyTitle}>No logs</p>
                </div>
              ) : (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr><th style={{ width: '140px' }}>Date</th><th style={{ width: '100px' }}>Type</th><th>Details</th><th style={{ width: '120px' }}>User</th></tr>
                      </thead>
                      <tbody>
                        {paginatedLogs.map((log) => (
                          <tr key={log._id}>
                            <td style={{ fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</td>
                            <td><span className={styles.logBadge}>{log.type}</span></td>
                            <td>
                              <strong>{log.title}</strong>
                              {log.message && <><br /><small style={{ color: '#9ca3af' }}>{log.message}</small></>}
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{log.user}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className={styles.logPagination}>
                      <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} className={styles.logPageBtn}>
                        <Icon name="arrow-left" size="0.8rem" /> Prev
                      </button>
                      <span className={styles.logPageInfo}>Page {logPage} / {totalPages} ({logs.length} total)</span>
                      <button onClick={() => setLogPage(p => Math.min(totalPages, p + 1))} disabled={logPage === totalPages} className={styles.logPageBtn}>
                        Next <Icon name="arrow-right" size="0.8rem" />
                      </button>
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
                  <div className={styles.webhookEvents}>
                    {['login', 'logout', 'purchase', 'topup', 'product_add', 'product_edit', 'product_delete', 'product_update', 'user_edit', 'file_upload', 'file_delete', 'error'].map(key => (
                      <div key={key} className={styles.webhookEventRow}>
                        <div className={styles.webhookEventLeft}>
                          <input type="checkbox" checked={webhookConfig.webhooks?.[key]?.enabled || false} onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhooks: { ...prev.webhooks, [key]: { ...prev.webhooks?.[key], enabled: e.target.checked } } }))} style={{ display: 'inline-block', width: 'auto' }} />
                          <span className={styles.webhookEventLabel}>{key.replace(/_/g, ' ')}</span>
                        </div>
                        <input type="url" value={webhookConfig.webhooks?.[key]?.url || ''} onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhooks: { ...prev.webhooks, [key]: { ...prev.webhooks?.[key], url: e.target.value, enabled: true } } }))} className={styles.modalInput} placeholder="Discord Webhook URL" />
                      </div>
                    ))}
                  </div>
                  <div className={styles.modalActions} style={{ marginTop: '1rem' }}>
                    <button onClick={handleSaveWebhook} disabled={savingWebhook} className={styles.submitBtn}>
                      {savingWebhook ? <Icon name="loading" size="0.8rem" className={styles.spinning} /> : <Icon name="save" size="0.8rem" />} Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMINS */}
          {activeTab === "admins" && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <div className={styles.tabHeaderLeft}>
                  <span className={styles.tabCount}>
                    <Icon name="role" size="0.7rem" /> {adminList.length} admins
                  </span>
                </div>
                {adminRole === "head" && (
                  <button onClick={() => setShowAdminModal(true)} className={styles.addButton}>
                    <Icon name="add" size="0.8rem" /> Add Admin
                  </button>
                )}
              </div>
              {showAdminModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAdminModal(false)}>
                  <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                    <button className={styles.modalClose} onClick={() => setShowAdminModal(false)}>
                      <Icon name="close" size="1rem" />
                    </button>
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