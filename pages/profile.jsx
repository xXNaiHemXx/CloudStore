import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/Profile.module.css";
import { useUser } from "../context/UserContext";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import Icon from "../components/Icon";
import { addLog, LOG_TYPES } from "../utils/logger";

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const { userPoints, refreshPoints, isLoading, userProducts: contextUserProducts } = useUser();
  const { confirm } = useConfirm();
  const { success, error, warning, info } = useToast();
  
  const [activeTab, setActiveTab] = useState("products");
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [topups, setTopups] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [myProducts, setMyProducts] = useState([]);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [availableUpdates, setAvailableUpdates] = useState([]);
  const [downloading, setDownloading] = useState(null);
  //  Wallet States
  const [topupMethod, setTopupMethod] = useState('bank'); // bank | wallet


  //  Wallet Submit Handler
  
  
  //  เปลี่ยนจาก .env เป็นเช็คจาก API + Fallback
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  //  เช็คสิทธิ์ Admin จาก Database + .env Fallback
  useEffect(() => {
    if (session?.user?.id) {
      checkAdminStatus();
    }
  }, [session?.user?.id]);

  const checkAdminStatus = async () => {
    try {
      // เช็คจาก Database ก่อน
      const res = await axios.get(`/api/admin/check-admin?discordId=${session.user.id}`);
      if (res.data.isAdmin) {
        setIsUserAdmin(true);
        return;
      }
    } catch {}
    
    // Fallback: เช็คจาก .env
    const envIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];
    if (envIds.includes(session.user.id)) {
      setIsUserAdmin(true);
    }
  };
  // ✅ Sync สินค้าก่อนโหลด
  useEffect(() => {
    if (!session) return;
    
    const syncProducts = async () => {
      try {
        const res = await axios.post("/api/user/sync-products", {
          userId: session.user.discordId || session.user.id
        });
        if (res.data.success) {
          await refreshPoints(); // รีเฟรชข้อมูล
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    };
  
  syncProducts();
}, [session]);
  useEffect(() => { 
    setMyProducts(contextUserProducts || []); 
  }, [contextUserProducts]);

  useEffect(() => {
    if (!session || activeTab !== "history") return;
    setLoadingHistory(true);
    axios.get(`/api/topups?discordId=${session.user.id}`)
      .then((res) => setTopups(res.data || []))
      .catch((err) => console.error("History load error:", err))
      .finally(() => setLoadingHistory(false));
  }, [session, activeTab]);

  useEffect(() => { 
    if (session && activeTab === 'products') refreshPoints(); 
  }, [session, activeTab]);

  const checkForUpdates = async (showAlert = false) => {
    if (!session) return;
    
    const now = Date.now();
    if (now - lastCheckTime < 5000 && !showAlert) {
      return;
    }
    
    setCheckingUpdates(true);
    setLastCheckTime(now);
    
    try {
      const res = await axios.post("/api/user/check-updates", {
        userId: session.user.discordId || session.user.id
      });
      
      if (res.data.hasUpdates) {
        setAvailableUpdates(res.data.updates);
        if (showAlert) info(`มีสินค้าที่อัปเดต ${res.data.updates.length} รายการ`);
      } else {
        if (showAlert) success("สินค้าทั้งหมดเป็นเวอร์ชันล่าสุดแล้ว");
      }
    } catch (err) {
      if (showAlert) error("ตรวจสอบอัปเดตไม่สำเร็จ");
    } finally {
      setCheckingUpdates(false);
    }
  };

  useEffect(() => {
    if (!session || activeTab !== 'products') return;
    const timer = setTimeout(() => { checkForUpdates(false); }, 2000);
    return () => clearTimeout(timer);
  }, [session, activeTab, myProducts.length]);

  const downloadUpdate = async (productId, productName) => {
    const confirmed = await confirm({ title: "อัปเดตเวอร์ชัน", message: `ดาวน์โหลดเวอร์ชันล่าสุดของ ${productName}?`, confirmText: "ดาวน์โหลด", cancelText: "ยกเลิก", type: "info" });
    if (!confirmed) return;
    setDownloading(productId);
    try {
      const res = await axios.post("/api/user/download-update", { userId: session.user.discordId || session.user.id, productId });
      if (res.data.success) {
        window.open(res.data.downloadUrl, "_blank");
        success(`ดาวน์โหลด ${productName} เวอร์ชัน ${res.data.version} สำเร็จ`);
        
        await addLog('product_update', "อัปเดตสินค้า", `${session.user.name} อัปเดต "${productName}" เป็น v${res.data.version}`, session.user.name, {
          discordId: session.user.discordId || session.user.id,
          productName: productName,
          version: res.data.version,
        }).catch(() => {});
        
        await refreshPoints();
        setAvailableUpdates([]);
        setTimeout(() => checkForUpdates(false), 1000);
      }
    } catch (err) { error("ดาวน์โหลดไม่สำเร็จ"); }
    finally { setDownloading(null); }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(selectedFile.type)) { error("กรุณาเลือกไฟล์ jpg, jpeg หรือ png"); return; }
    setFile(selectedFile); setFileName(selectedFile.name); setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setFile(null); setFileName(""); setPreviewUrl(null); };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "success": case "approved": return styles.statusSuccess;
      case "pending": return styles.statusPending;
      case "failed": case "rejected": return styles.statusFailed;
      default: return styles.statusPending;
    }
  };

  const handleSubmit = async () => {
    if (!file || !amount || !session?.user?.id) { 
      error("กรุณากรอกข้อมูลให้ครบ"); 
      return; 
    }
    if (parseFloat(amount) <= 0) { 
      error("กรุณากรอกจำนวนเงินที่มากกว่า 0"); 
      return; 
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("slip", file);
    formData.append("userId", session.user.id);
    formData.append("amount", amount);

    try {
      const uploadRes = await fetch("/api/topup/upload-slip", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { 
        error(uploadData.error || "อัพโหลดไม่สำเร็จ"); 
        setSubmitting(false); 
        return; 
      }

      const verifyRes = await fetch("/api/topup/verify-slipok", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          fileUrl: uploadData.fileUrl, 
          amount, 
          userId: session.user.id 
        }) 
      });
      const verifyData = await verifyRes.json();
      
      if (!verifyRes.ok) {
        if (verifyData.error?.includes('จำนวนเงิน')) {
          error(`❌ ${verifyData.error}`);
          warning("💡 กรุณากรอกจำนวนเงินให้ตรงกับสลิปที่โอน");
        } else {
          error(verifyData.error || "การตรวจสอบไม่สำเร็จ");
        }
        setSubmitting(false); 
        return; 
      }

      // ✅ ใช้จำนวนเงินจริงจากสลิป (verifyData.amount)
      const actualAmount = verifyData.amount || parseFloat(amount);
      const actualPoints = verifyData.newPoints - (userPoints || 0);
      
      success(`✅ เติมเงินสำเร็จ! รับ ${actualPoints} Point (${actualAmount} บาท)`);
      
      await addLog(LOG_TYPES.TOPUP, "เติมเงิน", `${session.user.name} เติมเงิน ${actualAmount} บาท`, session.user.name, {
        discordId: session.user.id,
        amount: actualAmount,
        points: actualPoints,
      }).catch(() => {});
    
      removeFile();
      setAmount("");
      await refreshPoints();
    } catch (err) {
      error("เกิดข้อผิดพลาดในการดำเนินการ");
      await addLog(LOG_TYPES.ERROR, "เติมเงินผิดพลาด", `${session.user.name} เติมเงิน ${amount} บาท ไม่สำเร็จ`, session.user.name, { amount, error: err.message }).catch(() => {});
    } finally { 
      setSubmitting(false); 
    }
  };

  if (!session) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <Icon name="lock" size="3rem" />
            <h2 style={{ color: '#d1d5db', fontSize: '1.3rem' }}>กรุณาเข้าสู่ระบบ</h2>
            <Link href="/" style={{ color: '#818cf8', textDecoration: 'underline' }}>กลับไปหน้าหลัก</Link>
          </div>
        </div>
      </Layout>
    );
  }

    return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.profileHeader}>
          <div className={styles.profileCard}>
            <div className={styles.profileInfoRow}>
              <div className={styles.avatarWrapper}><div className={styles.avatarGlow}></div><img src={session.user.image} alt={session.user.name} className={styles.avatar} /></div>
              <div className={styles.userInfo}><p className={styles.userLabel}>Account</p><h1 className={styles.userName}>{session.user.name}</h1><p className={styles.userEmail}>{session.user.email}</p></div>
            </div>
            <div className={styles.profileActions}>
              <div className={styles.pointsBadge}><Icon name="coin" size="1rem" /><span>{userPoints?.toLocaleString() || 0} Point</span></div>
              {isUserAdmin && (
                <Link href="/admin" className={styles.btnAdmin}>
                  <Icon name="settings" size="1rem" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <button onClick={() => signOut({ callbackUrl: "/" })} className={styles.btnLogout}><Icon name="logout" size="1rem" /><span>Logout</span></button>
            </div>
          </div>
        </div>

        <nav className={styles.tabsNav}>
          <button className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('products')}><Icon name="product" size="1rem" /> สินค้าของคุณ</button>
          <button className={`${styles.tabBtn} ${activeTab === 'topup' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('topup')}><Icon name="money" size="1rem" /> เติมพ้อยท์</button>
          <button className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('history')}><Icon name="history" size="1rem" /> ธุรกรรมล่าสุด</button>
        </nav>

        <div className={styles.contentArea}>
          <div className={styles.contentCard}>

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <>
                {isLoading ? (<div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>กำลังโหลด...</p></div>) : (<>
                  {availableUpdates.length > 0 && (<div className={styles.updateAlert}><Icon name="bell" size="1.5rem" /><div className={styles.updateAlertContent}><strong>มีเวอร์ชันใหม่!</strong><span>สินค้าที่คุณซื้อมีการอัปเดต {availableUpdates.length} รายการ</span></div></div>)}
                  <div className={styles.productCountHeader}><p className={styles.productCount}>คุณมีสินค้า <span>{myProducts?.length || 0}</span> ชิ้น</p></div>
                  {!myProducts || myProducts.length === 0 ? (
                    <div className={styles.emptyState}><Icon name="product" size="3rem" /><p className={styles.emptyTitle}>ยังไม่มีสินค้า</p><p className={styles.emptyText}>คุณยังไม่ได้ซื้อสินค้าใดๆ ไปเลือกซื้อสินค้ากันเลย!</p><Link href="/shop" className={styles.emptyShopBtn}><Icon name="cart" size="1rem" /> ไปที่ร้านค้า</Link></div>
                  ) : (
                    <div className={styles.productGrid}>
                      {myProducts.map((product, index) => {
                        const hasUpdate = availableUpdates.some(u => u.productId === product.productId);
                        return (
                          <div key={`${product.productId}-${index}`} className={styles.productCard}>
                            {hasUpdate && <div className={styles.updateBadge}><Icon name="refresh" size="0.7rem" /> มีอัปเดต!</div>}
                            <div className={styles.cardImageWrapper}>
                              <img 
                                src={product.image || product.itemsimage?.[0] || '/images/placeholder.png'} 
                                alt={product.name} 
                                loading="lazy" 
                                onError={(e) => { e.target.src = '/images/placeholder.png'; }} 
                              />
                            </div>
                            <div className={styles.cardBody}><h3 className={styles.cardProductName}>{product.name}</h3>{product.version && <span className={styles.cardVersion}><Icon name="version" size="0.7rem" /> v{product.version}</span>}</div>
                            <div className={styles.cardFooter}>
                              {hasUpdate ? (
                                <button onClick={() => downloadUpdate(product.productId, product.name)} disabled={downloading === product.productId} className={styles.updateDownloadBtn}><Icon name="download" size="0.8rem" />{downloading === product.productId ? "กำลังโหลด..." : "อัปเดต"}</button>
                              ) : (
                                <a href={product.fileUrl || '#'} className={styles.downloadBtn} download target="_blank" rel="noopener noreferrer"><Icon name="download" size="0.8rem" /> ดาวน์โหลด</a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>)}
              </>
            )}

            {/* TOPUP TAB */}
            {activeTab === 'topup' && (
              <div className={styles.topupContainer}>
                <div className={styles.topupGrid}>
                  
                  {/* ✅ Left: QR Code */}
                  <div className={styles.topupQrSection}>
                    <img 
                      src={topupMethod === 'bank' ? '/images/kbank-qr.png' : '/images/truemoney-slip.png'} 
                      alt={topupMethod === 'bank' ? "KBank Slip" : "TrueMoney Slip"} 
                      className={styles.topupQrImage} 
                    />
                  </div>

                  {/* ✅ Right: Form */}
                  <div className={styles.topupFormWrapper}>
                    <div className={styles.topupForm}>
                      
                      {/* Payment Information */}
                      <span className={styles.topupFormTitle}>Payment Information</span>

                      {/* ✅ Payment Methods */}
                      <div className={styles.topupMethods}>
                        {/* KBank */}
                        <button
                          className={`${styles.topupMethodCard} ${topupMethod === 'bank' ? styles.topupMethodCardActive : ''}`}
                          onClick={() => setTopupMethod('bank')}
                        >
                          <div className={styles.topupMethodIcon}>
                            <img src="/images/kbank.png" alt="KBank" className={styles.topupMethodLogo} />
                          </div>
                          <div className={styles.topupMethodInfo}>
                            <span className={styles.topupMethodName}>ธนาคารกสิกรไทย</span>
                            <span className={styles.topupMethodDetail}>ชื่อบัญชี นาย อิบรอเหม อุสมา</span>
                            <span className={styles.topupMethodDetail}>เลขบัญชี 137-3-69899-3</span>
                          </div>
                        </button>

                        {/* TrueMoney */}
                        <button
                          className={`${styles.topupMethodCard} ${topupMethod === 'wallet' ? styles.topupMethodCardActive : ''}`}
                          onClick={() => setTopupMethod('wallet')}
                        >
                          <div className={styles.topupMethodIcon}>
                            <img src="/images/truemoney.jpg" alt="TrueMoney" className={styles.topupMethodLogo} />
                          </div>
                          <div className={styles.topupMethodInfo}>
                            <span className={`${styles.topupMethodName} ${styles.topupMethodNameWallet}`}>ทรูมันนี่วอลเล็ท</span>
                            <span className={styles.topupMethodDetail}>ชื่อบัญชี นาย อิบรอเหม อุสมา</span>
                            <span className={styles.topupMethodDetail}>หมายเลขบัญชี 080-045-1901</span>
                          </div>
                        </button>
                      </div>

                      {/* Warning */}
                      <div className={styles.topupWarning}>
                        <Icon name="warning" size="0.8rem" />
                        <span>เมื่อโอนเงินแล้ว ไม่มีนโยบายโอนคืน โปรดระบุยอดให้ตรงความต้องการ</span>
                      </div>

                      {/* Upload Slip */}
                      <div className={styles.topupUploadSection}>
                        <span className={styles.topupUploadLabel}>อัพโหลดสลิป</span>
                        <label className={`${styles.topupUploadBox} ${fileName ? styles.topupUploadBoxActive : ''}`}>
                          {fileName ? (
                            <div className={styles.topupPreviewContainer}>
                              {previewUrl && <img src={previewUrl} alt="Preview" className={styles.topupPreviewImage} />}
                              <span className={styles.topupPreviewName}>{fileName}</span>
                              <button type="button" className={styles.topupRemoveBtn} onClick={(e) => { e.preventDefault(); removeFile(); }}>
                                ✕ ลบไฟล์
                              </button>
                            </div>
                          ) : (
                            <div className={styles.topupUploadPlaceholder}>
                              <svg xmlns="http://www.w3.org/2000/svg" className={styles.topupUploadIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                              </svg>
                              <span className={styles.topupUploadText}>กดเพื่ออัพโหลดสลิป</span>
                              <span className={styles.topupUploadHint}>ภาพความละเอียดสูง (jpeg, png, jpg)</span>
                            </div>
                          )}
                          <input type="file" className={styles.uploadInput} accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                        </label>
                      </div>

                      {/* Amount */}
                      <div className={styles.topupAmountSection}>
                        <span className={styles.topupAmountLabel}>ระบุยอดที่โอนเข้ามา</span>
                        <input 
                          type="number" 
                          className={styles.topupAmountInput} 
                          placeholder="1 บาทเท่ากับ 1 Point" 
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)} 
                          min="1" 
                        />
                      </div>

                      {/* Submit */}
                      <button className={styles.topupSubmitBtn} onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                          <><Icon name="loading" size="0.8rem" /><span>กำลังดำเนินการ...</span></>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className={styles.topupSubmitIcon} viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708" />
                            </svg>
                            <span>ยืนยันข้อมูล</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <>
                <div className={styles.historyNotice}><Icon name="warning" size="1rem" /><span>หาก Status ขึ้น Pending แสดงว่าเรากำลังตรวจสอบข้อมูล ไม่จำเป็นต้องส่งสลิปซ้ำ!</span></div>
                {loadingHistory ? (<div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div><p>กำลังโหลดประวัติ...</p></div>) : topups.length === 0 ? (
                  <div className={styles.emptyState}><Icon name="history" size="3rem" /><p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p><p className={styles.emptyText}>ไปเติมพ้อยท์กันเลย!</p></div>
                ) : (
                  <div className={styles.historyList}>
                    {topups.map((topup) => (
                      <div key={topup._id} className={styles.historyCard}>
                        <div className={styles.historyHeader}><span className={styles.historyRef}>#{topup.transRef || topup._id?.slice(-8)}</span><span className={`${styles.statusBadge} ${getStatusClass(topup.status)}`}>{topup.status || 'pending'}</span></div>
                        <div className={styles.historyBody}>
                          <div className={styles.historyItem}><p className={styles.historyItemLabel}><Icon name="calendar" size="0.7rem" /> วันที่</p><p className={styles.historyItemValue}>{new Date(topup.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</p></div>
                          <div className={styles.historyItem}><p className={styles.historyItemLabel}><Icon name="money" size="0.7rem" /> จำนวนเงิน</p><p className={styles.historyItemValue}>{topup.amount?.toLocaleString()} บาท</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}