
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
  
  // Wallet States
  const [topupMethod, setTopupMethod] = useState('bank'); // bank | wallet
  const [voucherCode, setVoucherCode] = useState(''); // ✅ เพิ่ม state สำหรับ voucher code
  const [redeemStatus, setRedeemStatus] = useState(null); // ✅ เพิ่ม state สำหรับแสดงสถานะการรับเงิน
  
  // เปลี่ยนจาก .env เป็นเช็คจาก API + Fallback
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  // เพิ่ม state สำหรับ TrueWallet Link
const [trueWalletLink, setTrueWalletLink] = useState('');
const [extractedCode, setExtractedCode] = useState('');
const [extractedAmount, setExtractedAmount] = useState('');

// ฟังก์ชันดึงรหัสจากลิงก์ TrueWallet
const extractCodeFromLink = (link) => {
  try {
    // รูปแบบลิงก์: gift.truemoney.com/campaign/?v=xxxxxxxxxx
    const urlPattern = /(?:gift\.truemoney\.com\/campaign\/\?v=|gift\.truemoney\.com\/\?v=)([a-zA-Z0-9]+)/;
    const match = link.match(urlPattern);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // ถ้าใส่แค่รหัสล้วนๆ
    if (/^[a-zA-Z0-9]{10,}$/.test(link.trim())) {
      return link.trim();
    }
    
    return null;
  } catch {
    return null;
  }
};

// ฟังก์ชันดึงจำนวนเงินจาก API (optional)
const fetchVoucherAmount = async (code) => {
  try {
    const response = await fetch(`https://tw.oiioioiiioooioio.de/api/voucher/${code}`);
    if (response.ok) {
      const data = await response.json();
      return data.amount_baht;
    }
  } catch (error) {
    console.error('Failed to fetch voucher amount:', error);
  }
  return null;
};

// จัดการการเปลี่ยนลิงก์
const handleTrueWalletLinkChange = async (link) => {
  setTrueWalletLink(link);
  const code = extractCodeFromLink(link);
  
  if (code) {
    setExtractedCode(code);
    // option: ดึงจำนวนเงินจาก API
    // const amount = await fetchVoucherAmount(code);
    // if (amount) setExtractedAmount(amount);
  } else {
    setExtractedCode('');
    setExtractedAmount('');
  }
};

// คัดลอกข้อความ
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    success('คัดลอกรหัสสำเร็จ');
  } catch (err) {
    error('คัดลอกไม่สำเร็จ');
  }
};


  const handleWalletSubmit = async () => {
    if (!extractedCode) {
      error('กรุณาวางลิงก์อังเปา TrueWallet ให้ถูกต้อง');
      return;
    }

    setSubmitting(true);
    setRedeemStatus(null);

    try {
      const receiverMobile = '0800451901';
      const redeemResult = await redeemTrueWalletVoucher(extractedCode, receiverMobile);

      if (redeemResult.status?.code !== 'SUCCESS') {
        const errorMessages = {
          'TARGET_USER_REDEEMED': 'คุณรับอังเปานี้ไปแล้ว',
          'VOUCHER_OUT_OF_STOCK': 'มีคนรับอังเปานี้ไปแล้ว',
          'VOUCHER_EXPIRED': 'อังเปาหมดอายุแล้ว',
          'VOUCHER_NOT_FOUND': 'ไม่พบอังเปาในระบบ',
          'CANNOT_GET_OWN_VOUCHER': 'ไม่สามารถรับอังเปาของตัวเองได้',
          'TARGET_USER_NOT_FOUND': 'ไม่พบเบอร์ผู้รับในระบบ',
        };
        const errorMsg = errorMessages[redeemResult.status?.code] || redeemResult.status?.message || 'การรับเงินล้มเหลว';
        error(`❌ ${errorMsg}`);
        setRedeemStatus({ success: false, message: errorMsg });
        setSubmitting(false);
        return;
      }

      const redeemedAmount = redeemResult.data?.my_ticket?.amount_baht || '0';
      
      // ✅ เรียก API เพิ่มแต้ม (ใช้ endpoint ใหม่)
      const addPointsResponse = await fetch('/api/topup/add-points-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name,
          amount: redeemedAmount,
          voucherCode: extractedCode,
          provider: 'truemoney-api'
        })
      });

      const addPointsResult = await addPointsResponse.json();

      if (!addPointsResult.success) {
        error(`⚠️ รับเงิน ${redeemedAmount} บาท แล้ว แต่ระบบเพิ่มแต้มไม่สำเร็จ: ${addPointsResult.message}`);
        setRedeemStatus({ 
          success: false, 
          message: `รับเงิน ${redeemedAmount} บาท แล้ว แต่ระบบเพิ่มแต้มไม่สำเร็จ กรุณาแจ้งแอดมิน`
        });
      } else {
        // ✅ สำเร็จ
        success(`✅ รับเงินสำเร็จ! จำนวน ${redeemedAmount} บาท (เพิ่ม ${redeemedAmount} พ้อยท์)`);
        
        await addLog(LOG_TYPES.TOPUP, "เติมเงิน TrueWallet สำเร็จ", 
          `${session.user.name} รับเงิน ${redeemedAmount} บาท และได้รับ ${redeemedAmount} พ้อยท์`, 
          session.user.name, {
            discordId: session.user.id,
            amount: redeemedAmount,
            points: redeemedAmount,
            voucherCode: extractedCode,
            method: 'wallet',
            oldPoints: addPointsResult.data?.oldPoints,
            newPoints: addPointsResult.data?.newPoints
          }
        ).catch(() => {});

        setRedeemStatus({ 
          success: true, 
          message: `รับเงินสำเร็จ ${redeemedAmount} บาท (ได้รับ ${redeemedAmount} พ้อยท์)`,
          amount: redeemedAmount 
        });

        await refreshPoints();
      }
      
      // เคลียร์ฟอร์ม
      setTrueWalletLink('');
      setExtractedCode('');
      setExtractedAmount('');

      setTimeout(() => setRedeemStatus(null), 5000);

    } catch (err) {
      console.error('Wallet submit error:', err);
      error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setRedeemStatus({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmitting(false);
    }
  };
  
// Submit สำหรับธนาคาร (แยกจากเดิม)
  const handleBankSubmit = async () => {
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
          warning(" กรุณากรอกจำนวนเงินให้ตรงกับสลิปที่โอน");
        } else {
          error(verifyData.error || "การตรวจสอบไม่สำเร็จ");
        }
        setSubmitting(false); 
        return; 
      }

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
  // ฟังก์ชันเรียกใช้ API TrueWallet
  const redeemTrueWalletVoucher = async (code, mobile) => {
    try {
      const response = await fetch(`https://tw.oiioioiiioooioio.de/api/${code}/${mobile}`, {
        method: 'POST'
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API Error:', error);
      return { status: { code: 'INTERNAL_ERROR', message: 'เชื่อมต่อล้มเหลว' } };
    }
  };

  // เช็คสิทธิ์ Admin จาก Database + .env Fallback
  useEffect(() => {
    if (session?.user?.id) {
      checkAdminStatus();
    }
  }, [session?.user?.id]);

  const checkAdminStatus = async () => {
    try {
      const res = await axios.get(`/api/admin/check-admin?discordId=${session.user.id}`);
      if (res.data.isAdmin) {
        setIsUserAdmin(true);
        return;
      }
    } catch {}
    
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
          await refreshPoints();
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

  const removeFile = () => { 
    if (previewUrl) URL.revokeObjectURL(previewUrl); 
    setFile(null); 
    setFileName(""); 
    setPreviewUrl(null); 
  };


  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
        return styles.statusSuccess;
      case "pending":
        return styles.statusPending;
      case "failed":
      case "rejected":
      case "error":
        return styles.statusFailed;
      case "duplicate":
        return styles.statusDuplicate;
      default:
        return styles.statusPending;
    }
  };

 
  

  if (!session) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.glassCard}>
            <Icon name="lock" size="3rem" color="#6366f1" />
            <h2>กรุณาเข้าสู่ระบบ</h2>
            <Link href="/">กลับไปหน้าหลัก</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        
        {/* ===== PROFILE HEADER - LIQUID GLASS ===== */}
        <div className={styles.profileHeader}>
          <div className={styles.glassCard}>
            <div className={styles.profileContent}>
              <div className={styles.profileAvatar}>
                <div className={styles.avatarRing}></div>
                <img src={session.user.image} alt={session.user.name} />
                <div className={styles.avatarStatus}></div>
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileBadge}>Account</span>
                <h1>{session.user.name}</h1>
                <p>{session.user.email}</p>
                <div className={styles.profileStats}>
                  <div className={styles.profileStat}>
                    <Icon name="coin" size="1.2rem" color="#10b981" />
                    <span>{userPoints?.toLocaleString() || 0}</span>
                    <label>Points</label>
                  </div>
                  <div className={styles.profileStatDivider}></div>
                  <div className={styles.profileStat}>
                    <Icon name="product" size="1.2rem" color="#6366f1" />
                    <span>{myProducts?.length || 0}</span>
                    <label>Products</label>
                  </div>
                </div>
              </div>
              <div className={styles.profileActions}>
                {isUserAdmin && (
                  <Link href="/adminsudlor" className={styles.glassBtn}>
                    <Icon name="settings" size="0.8rem" />
                    Admin
                  </Link>
                )}
                <button onClick={() => signOut({ callbackUrl: "/" })} className={styles.glassBtnDanger}>
                  <Icon name="logout" size="0.8rem" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <nav className={styles.tabsNav}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`} 
            onClick={() => setActiveTab('products')}
          >
            <Icon name="product" size="0.9rem" />
            สินค้าของคุณ
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'topup' ? styles.tabBtnActive : ''}`} 
            onClick={() => setActiveTab('topup')}
          >
            <Icon name="money" size="0.9rem" />
            เติมพ้อยท์
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`} 
            onClick={() => setActiveTab('history')}
          >
            <Icon name="history" size="0.9rem" />
            ธุรกรรมล่าสุด
          </button>
        </nav>

        {/* ===== CONTENT ===== */}
        <div className={styles.contentArea}>
          <div className={styles.glassCard}>

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className={styles.tabContent}>
                {isLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>กำลังโหลด...</p>
                  </div>
                ) : (
                  <>
                    {availableUpdates.length > 0 && (
                      <div className={styles.updateAlert}>
                        <Icon name="bell" size="1.2rem" color="#60a5fa" />
                        <div>
                          <strong>มีเวอร์ชันใหม่!</strong>
                          <span>สินค้าที่คุณซื้อมีการอัปเดต {availableUpdates.length} รายการ</span>
                        </div>
                      </div>
                    )}
                    
                    <div className={styles.productHeader}>
                      <span>คุณมีสินค้า <strong>{myProducts?.length || 0}</strong> ชิ้น</span>
                    </div>

                    {!myProducts || myProducts.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Icon name="product" size="3rem" color="#52525b" />
                        <p className={styles.emptyTitle}>ยังไม่มีสินค้า</p>
                        <p>คุณยังไม่ได้ซื้อสินค้าใดๆ ไปเลือกซื้อสินค้ากันเลย!</p>
                        <Link href="/shop" className={styles.glassBtnPrimary}>
                          <Icon name="cart" size="0.8rem" />
                          ไปที่ร้านค้า
                        </Link>
                      </div>
                    ) : (
                      <div className={styles.productGrid}>
                        {myProducts.map((product, index) => {
                          const hasUpdate = availableUpdates.some(u => u.productId === product.productId);
                          return (
                            <div key={`${product.productId}-${index}`} className={styles.productCard}>
                              {hasUpdate && (
                                <div className={styles.updateBadge}>
                                  <Icon name="refresh" size="0.6rem" />
                                  อัปเดต!
                                </div>
                              )}
                              <div className={styles.productImage}>
                                <img 
                                  src={product.image || product.itemsimage?.[0] || '/images/placeholder.png'} 
                                  alt={product.name}
                                  loading="lazy"
                                  onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                                />
                              </div>
                              <div className={styles.productBody}>
                                <h3>{product.name}</h3>
                                {product.version && (
                                  <span className={styles.productVersion}>
                                    <Icon name="version" size="0.6rem" />
                                    v{product.version}
                                  </span>
                                )}
                              </div>
                              <div className={styles.productFooter}>
                                {hasUpdate ? (
                                  <button 
                                    onClick={() => downloadUpdate(product.productId, product.name)} 
                                    disabled={downloading === product.productId}
                                    className={styles.glassBtnUpdate}
                                  >
                                    <Icon name="download" size="0.7rem" />
                                    {downloading === product.productId ? "กำลังโหลด..." : "อัปเดต"}
                                  </button>
                                ) : (
                                  <a href={product.fileUrl || '#'} className={styles.glassBtnDownload} download target="_blank" rel="noopener noreferrer">
                                    <Icon name="download" size="0.7rem" />
                                    ดาวน์โหลด
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TOPUP TAB */}
            {activeTab === 'topup' && (
              <div className={styles.topupContainer}>
                <div className={styles.topupGrid}>
                  
                  {/* Left: QR Code */}
                  <div className={styles.topupQrSection}>
                    {topupMethod === 'bank' ? (
                      <img src="/images/kbank-qr.png" alt="KBank QR Code" className={styles.topupQrImage} />
                    ) : (
                      <div className={styles.maintenanceCard}>
                        <Icon name="warning" size="2.5rem" color="#f59e0b" />
                        <h3>ระบบกำลังปรับปรุง</h3>
                        <p>ฟังก์ชันรับเงินผ่าน TrueWallet อังเปากำลังอยู่ระหว่างการพัฒนาปรับปรุง</p>
                        <p className={styles.maintenanceSub}>กรุณาใช้วิธีการโอนผ่านธนาคารแทน ขออภัยในความไม่สะดวก</p>
                        <div className={styles.maintenanceStatus}>
                          <span className={styles.statusDot}></span>
                          <span>คาดว่าจะกลับมาให้บริการเร็วๆ นี้</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Form */}
                  <div className={styles.topupFormWrapper}>
                    <div className={styles.topupForm}>
                      <span className={styles.topupFormTitle}>Payment Information</span>

                      {/* Payment Methods */}
                      <div className={styles.topupMethods}>
                        <button
                          className={`${styles.methodCard} ${topupMethod === 'bank' ? styles.methodCardActive : ''}`}
                          onClick={() => {
                            setTopupMethod('bank');
                            setTrueWalletLink('');
                            setExtractedCode('');
                            setRedeemStatus(null);
                          }}
                        >
                          <img src="/images/kbank.png" alt="KBank" className={styles.methodLogo} />
                          <div className={styles.methodInfo}>
                            <span className={styles.methodName}>ธนาคารกสิกรไทย</span>
                            <span className={styles.methodDetail}>ชื่อบัญชี นาย อิบรอเหม อุสมา</span>
                            <span className={styles.methodDetail}>เลขบัญชี 137-3-69899-3</span>
                          </div>
                        </button>

                        <button
                          className={`${styles.methodCard} ${styles.methodCardDisabled} ${topupMethod === 'wallet' ? styles.methodCardActive : ''}`}
                          onClick={() => {
                            setTopupMethod('wallet');
                            setFile(null);
                            setFileName('');
                            setPreviewUrl(null);
                            setRedeemStatus(null);
                          }}
                        >
                          <img src="/images/truemoney.jpg" alt="TrueMoney" className={styles.methodLogo} />
                          <div className={styles.methodInfo}>
                            <span className={`${styles.methodName} ${styles.methodNameWallet}`}>ทรูมันนี่วอลเล็ท</span>
                            <span className={styles.methodDetail}>รับเงินผ่านลิงก์อังเปา TrueWallet</span>
                            <span className={styles.methodDetail} style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚠️ ระบบกำลังปรับปรุง</span>
                          </div>
                        </button>
                      </div>

                      {/* Warning */}
                      <div className={styles.topupWarning}>
                        <Icon name="warning-triangle" size="0.8rem" color="#fbbf24" />
                        <span>เมื่อโอนเงินแล้ว ไม่มีนโยบายโอนคืน โปรดตรวจสอบข้อมูลให้ถูกต้อง</span>
                      </div>

                      {/* Maintenance Banner */}
                      {topupMethod === 'wallet' && (
                        <div className={styles.maintenanceForm}>
                          <Icon name="settings" size="1.5rem" color="#f59e0b" />
                          <div>
                            <h4>🔧 ระบบกำลังปรับปรุง</h4>
                            <p>ฟังก์ชันนี้ไม่สามารถใช้งานได้ในขณะนี้</p>
                          </div>
                        </div>
                      )}

                      {/* Upload Slip */}
                      {topupMethod === 'bank' && (
                        <>
                          <div className={styles.uploadSection}>
                            <span className={styles.uploadLabel}>อัพโหลดสลิป</span>
                            <label className={`${styles.uploadBox} ${fileName ? styles.uploadBoxActive : ''}`}>
                              {fileName ? (
                                <div className={styles.previewContainer}>
                                  {previewUrl && <img src={previewUrl} alt="Preview" className={styles.previewImage} />}
                                  <span className={styles.previewName}>{fileName}</span>
                                  <button type="button" className={styles.removeBtn} onClick={(e) => { e.preventDefault(); removeFile(); }}>
                                    <Icon name="close" size="0.6rem" />
                                    ลบไฟล์
                                  </button>
                                </div>
                              ) : (
                                <div className={styles.uploadPlaceholder}>
                                  <Icon name="image" size="2rem" color="#52525b" />
                                  <span>กดเพื่ออัพโหลดสลิป</span>
                                  <span>ภาพความละเอียดสูง (jpeg, png, jpg)</span>
                                </div>
                              )}
                              <input type="file" className={styles.uploadInput} accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                            </label>
                          </div>

                          <div className={styles.amountSection}>
                            <span className={styles.amountLabel}>ระบุยอดที่โอนเข้ามา</span>
                            <input 
                              type="number" 
                              className={styles.amountInput} 
                              placeholder="1 บาทเท่ากับ 1 Point" 
                              value={amount} 
                              onChange={(e) => setAmount(e.target.value)} 
                              min="1" 
                            />
                          </div>
                        </>
                      )}

                      {/* Redeem Status */}
                      {redeemStatus && (
                        <div className={`${styles.redeemStatus} ${redeemStatus.success ? styles.redeemSuccess : styles.redeemError}`}>
                          <Icon name={redeemStatus.success ? "check-circle" : "error-circle"} size="1rem" />
                          <span>{redeemStatus.message}</span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button 
                        className={`${styles.submitBtn} ${topupMethod === 'wallet' ? styles.submitBtnDisabled : ''}`}
                        onClick={topupMethod === 'wallet' ? undefined : handleBankSubmit} 
                        disabled={submitting || topupMethod === 'wallet'}
                      >
                        {submitting ? (
                          <>
                            <Icon name="loading" size="0.8rem" className={styles.spinning} />
                            <span>กำลังดำเนินการ...</span>
                          </>
                        ) : topupMethod === 'wallet' ? (
                          <>
                            <Icon name="settings" size="0.8rem" />
                            <span>ระบบกำลังปรับปรุง</span>
                          </>
                        ) : (
                          <>
                            <Icon name="check" size="0.8rem" />
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
              <div className={styles.tabContent}>
                <div className={styles.historyNotice}>
                  <Icon name="warning" size="0.9rem" color="#fbbf24" />
                  <span>หาก Status ขึ้น Pending แสดงว่าเรากำลังตรวจสอบข้อมูล ไม่จำเป็นต้องส่งสลิปซ้ำ!</span>
                </div>
                
                {loadingHistory ? (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>กำลังโหลดประวัติ...</p>
                  </div>
                ) : topups.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Icon name="history" size="3rem" color="#52525b" />
                    <p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p>
                    <p>ไปเติมพ้อยท์กันเลย!</p>
                  </div>
                ) : (
                  <div className={styles.historyList}>
                    {topups.map((topup) => (
                      <div key={topup._id} className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                          <span className={styles.historyRef}>
                            <Icon name="receipt" size="0.6rem" />
                            #{topup.transRef || topup.voucherCode?.slice(-8) || topup._id?.slice(-8)}
                          </span>
                          <span className={`${styles.statusBadge} ${styles[getStatusClass(topup.status)]}`}>
                            {topup.status === 'success' ? 'สำเร็จ' : 
                             topup.status === 'pending' ? 'รอตรวจสอบ' : 
                             topup.status === 'duplicate' ? 'สลิปซ้ำ' : 'ล้มเหลว'}
                          </span>
                        </div>
                        
                        <div className={styles.historyBody}>
                          <div className={styles.historyItem}>
                            <span className={styles.historyItemLabel}>
                              <Icon name="calendar" size="0.6rem" /> วันที่
                            </span>
                            <span className={styles.historyItemValue}>
                              {new Date(topup.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className={styles.historyItem}>
                            <span className={styles.historyItemLabel}>
                              <Icon name="clock" size="0.6rem" /> เวลา
                            </span>
                            <span className={styles.historyItemValue}>
                              {new Date(topup.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className={styles.historyItem}>
                            <span className={styles.historyItemLabel}>
                              <Icon name="money" size="0.6rem" /> จำนวนเงิน
                            </span>
                            <span className={styles.historyItemValue}>
                              {topup.amount?.toLocaleString()} บาท
                            </span>
                          </div>
                          <div className={styles.historyItem}>
                            <span className={styles.historyItemLabel}>
                              <Icon name="coin" size="0.6rem" /> แต้มที่ได้รับ
                            </span>
                            <span className={styles.historyItemValue} style={{ color: '#10b981' }}>
                              {topup.points?.toLocaleString() || topup.amount?.toLocaleString()} พ้อยท์
                            </span>
                          </div>
                          <div className={styles.historyItem}>
                            <span className={styles.historyItemLabel}>
                              <Icon name="card" size="0.6rem" /> วิธีชำระ
                            </span>
                            <span className={styles.historyItemValue}>
                              {topup.method === 'wallet' ? (
                                <span style={{ color: '#f59e0b' }}>
                                  <Icon name="gift" size="0.6rem" /> TrueWallet
                                </span>
                              ) : (
                                <span style={{ color: '#3b82f6' }}>
                                  <Icon name="bank" size="0.6rem" /> ธนาคาร
                                </span>
                              )}
                            </span>
                          </div>
                          {topup.method === 'wallet' && topup.voucherCode && (
                            <div className={styles.historyItemFull}>
                              <span className={styles.historyItemLabel}>
                                <Icon name="ticket" size="0.6rem" /> รหัสอังเปา
                              </span>
                              <span className={styles.historyItemValue} style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                {topup.voucherCode}
                              </span>
                            </div>
                          )}
                          {topup.errorDetail && (
                            <div className={styles.historyItemFull}>
                              <span className={styles.historyItemLabel} style={{ color: '#ef4444' }}>
                                <Icon name="error" size="0.6rem" /> ข้อผิดพลาด
                              </span>
                              <span className={styles.historyItemValue} style={{ color: '#f87171', fontSize: '0.75rem' }}>
                                {topup.errorDetail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}