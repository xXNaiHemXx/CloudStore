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
                  
                  {/* Left: QR Code / Instruction Image */}
                  <div className={styles.topupQrSection}>
                    {topupMethod === 'bank' ? (
                      <img 
                        src="/images/kbank-qr.png" 
                        alt="KBank QR Code" 
                        className={styles.topupQrImage} 
                      />
                    ) : (
                      <div className={styles.tutorialSection}>
                        <div className={styles.tutorialHeader}>
                          <Icon name="gift" size="1.5rem" />
                          <span>วิธีการทำลิงก์อังเปา TrueWallet</span>
                        </div>
                        <div className={styles.tutorialSteps}>
                          <div className={styles.tutorialStep}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                              <span className={styles.stepTitle}>เปิดแอป TrueMoney</span>
                              <span className={styles.stepDesc}>กดที่เมนู "อังเปา" หรือ "สร้างอังเปา"</span>
                            </div>
                          </div>
                          <div className={styles.tutorialStep}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                              <span className={styles.stepTitle}>กรอกจำนวนเงิน</span>
                              <span className={styles.stepDesc}>ใส่จำนวนเงินที่ต้องการส่ง (ขั้นต่ำ 1 บาท)</span>
                            </div>
                          </div>
                          <div className={styles.tutorialStep}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                              <span className={styles.stepTitle}>สร้างอังเปา</span>
                              <span className={styles.stepDesc}>กดสร้างอังเปา แล้วระบบจะสร้างลิงก์ให้</span>
                            </div>
                          </div>
                          <div className={styles.tutorialStep}>
                            <div className={styles.stepNumber}>4</div>
                            <div className={styles.stepContent}>
                              <span className={styles.stepTitle}>คัดลอกลิงก์</span>
                              <span className={styles.stepDesc}>
                                ลิงก์จะมีลักษณะดังนี้:<br />
                                <code className={styles.codeExample}>gift.truemoney.com/campaign/?v=xxxxxxxxxx</code>
                              </span>
                            </div>
                          </div>
                          <div className={styles.tutorialStep}>
                            <div className={styles.stepNumber}>5</div>
                            <div className={styles.stepContent}>
                              <span className={styles.stepTitle}>วางลิงก์ในช่องด้านล่าง</span>
                              <span className={styles.stepDesc}>ระบบจะดึงรหัสอังเปามาให้อัตโนมัติ</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.tutorialNote}>
                          <Icon name="more" size="1rem" />
                          <span> ลิงก์อังเปาจะอยู่ที่ url ของหน้า gift.truemoney.com</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Form */}
                  <div className={styles.topupFormWrapper}>
                    <div className={styles.topupForm}>
                      
                      {/* Payment Information */}
                      <span className={styles.topupFormTitle}>Payment Information</span>

                      {/* Payment Methods */}
                      <div className={styles.topupMethods}>
                        {/* KBank */}
                        <button
                          className={`${styles.topupMethodCard} ${topupMethod === 'bank' ? styles.topupMethodCardActive : ''}`}
                          onClick={() => {
                            setTopupMethod('bank');
                            setTrueWalletLink('');
                            setExtractedCode('');
                            setRedeemStatus(null);
                          }}
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
                          onClick={() => {
                            setTopupMethod('wallet');
                            setFile(null);
                            setFileName('');
                            setPreviewUrl(null);
                            setRedeemStatus(null);
                          }}
                        >
                          <div className={styles.topupMethodIcon}>
                            <img src="/images/truemoney.jpg" alt="TrueMoney" className={styles.topupMethodLogo} />
                          </div>
                          <div className={styles.topupMethodInfo}>
                            <span className={`${styles.topupMethodName} ${styles.topupMethodNameWallet}`}>ทรูมันนี่วอลเล็ท</span>
                            <span className={styles.topupMethodDetail}>รับเงินผ่านลิงก์อังเปา TrueWallet</span>
                            <span className={styles.topupMethodDetail}>รับเงินทันที ไม่ต้องรอตรวจสอบ</span>
                          </div>
                        </button>
                      </div>

                      {/* Warning */}
                      <div className={styles.topupWarning}>
                        <Icon name="warning" size="0.8rem" />
                        <span>เมื่อโอนเงินแล้ว ไม่มีนโยบายโอนคืน โปรดตรวจสอบข้อมูลให้ถูกต้อง</span>
                      </div>

                      {/* TrueWallet Link Input (เฉพาะเมื่อเลือก wallet) */}
                      {topupMethod === 'wallet' && (
                        <>
                          <div className={styles.walletLinkSection}>
                            <span className={styles.walletLinkLabel}>
                              <Icon name="link" size="0.8rem" /> ลิงก์อังเปา TrueWallet
                            </span>
                            <textarea
                              className={styles.walletLinkInput}
                              placeholder="วางลิงก์อังเปาจาก TrueWallet ที่นี่..."
                              value={trueWalletLink}
                              onChange={(e) => handleTrueWalletLinkChange(e.target.value)}
                              rows={3}
                            />
                            <span className={styles.walletLinkHint}>
                               ระบบจะดึงรหัสอังเปาจากลิงก์ให้อัตโนมัติ
                            </span>
                          </div>

                          {/* Extracted Code Display */}
                          {extractedCode && (
                            <div className={styles.extractedCodeSection}>
                              <div className={styles.extractedCodeLabel}>
                                <Icon name="check" size="0.8rem" />
                                <span>รหัสอังเปาที่ตรวจพบ:</span>
                              </div>
                              <div className={styles.extractedCode}>
                                <code>{extractedCode}</code>
                                <button 
                                  className={styles.copyCodeBtn}
                                  onClick={() => copyToClipboard(extractedCode)}
                                >
                                  <Icon name="copy" size="0.8rem" />
                                  คัดลอก
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Amount Display from Link (ถ้าสามารถดึงได้) */}
                          {extractedAmount && (
                            <div className={styles.extractedAmountSection}>
                              <span className={styles.amountDetected}>
                                💰 จำนวนเงินจากอังเปา: <strong>{extractedAmount} บาท</strong>
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Upload Slip (เฉพาะเมื่อเลือก bank) */}
                      {topupMethod === 'bank' && (
                        <>
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
                                  <svg xmlns="http://www.w3.org/2000/svg" className={styles.topupUploadIcon} viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                                  </svg>
                                  <span className={styles.topupUploadText}>กดเพื่ออัพโหลดสลิป</span>
                                  <span className={styles.topupUploadHint}>ภาพความละเอียดสูง (jpeg, png, jpg)</span>
                                </div>
                              )}
                              <input type="file" className={styles.uploadInput} accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} />
                            </label>
                          </div>

                          {/* Amount Input (เฉพาะเมื่อเลือก bank) */}
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
                        </>
                      )}

                      {/* แสดงสถานะการรับเงิน */}
                      {redeemStatus && (
                        <div className={`${styles.redeemStatus} ${redeemStatus.success ? styles.redeemSuccess : styles.redeemError}`}>
                          <Icon name={redeemStatus.success ? "success" : "error"} size="1rem" />
                          <span>{redeemStatus.message}</span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button 
                        className={styles.topupSubmitBtn} 
                        onClick={topupMethod === 'wallet' ? handleWalletSubmit : handleBankSubmit} 
                        disabled={submitting}
                      >
                        {submitting ? (
                          <><Icon name="loading" size="0.8rem" /><span>กำลังดำเนินการ...</span></>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className={styles.topupSubmitIcon} viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2m2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708" />
                            </svg>
                            <span>{topupMethod === 'wallet' ? 'รับเงินจากอังเปา' : 'ยืนยันข้อมูล'}</span>
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
                <div className={styles.historyNotice}>
                  <Icon name="warning" size="1rem" />
                  <span>หาก Status ขึ้น Pending แสดงว่าเรากำลังตรวจสอบข้อมูล ไม่จำเป็นต้องส่งสลิปซ้ำ!</span>
                </div>
                
                {loadingHistory ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>กำลังโหลดประวัติ...</p>
                  </div>
                ) : topups.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Icon name="history" size="3rem" />
                    <p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p>
                    <p className={styles.emptyText}>ไปเติมพ้อยท์กันเลย!</p>
                  </div>
                ) : (
                  <div className={styles.historyList}>
                    {topups.map((topup) => (
                      <div key={topup._id} className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                          <span className={styles.historyRef}>
                            <Icon name="receipt" size="0.7rem" />
                            #{topup.transRef || topup.voucherCode?.slice(-8) || topup._id?.slice(-8)}
                          </span>
                          <span className={`${styles.statusBadge} ${getStatusClass(topup.status)}`}>
                            {topup.status === 'success' ? 'สำเร็จ' : 
                            topup.status === 'pending' ? 'รอตรวจสอบ' : 
                            topup.status === 'duplicate' ? 'สลิปซ้ำ' : 'ล้มเหลว'}
                          </span>
                        </div>
                        
                        <div className={styles.historyBody}>
                          {/* วันที่ */}
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>
                              <Icon name="calendar" size="0.7rem" /> วันที่
                            </p>
                            <p className={styles.historyItemValue}>
                              {new Date(topup.createdAt).toLocaleDateString("th-TH", { 
                                year: "numeric", 
                                month: "short", 
                                day: "numeric" 
                              })}
                            </p>
                          </div>
                          
                          {/* เวลา */}
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>
                              <Icon name="clock" size="0.7rem" /> เวลา
                            </p>
                            <p className={styles.historyItemValue}>
                              {new Date(topup.createdAt).toLocaleTimeString("th-TH", { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </p>
                          </div>
                          
                          {/* จำนวนเงิน */}
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>
                              <Icon name="money" size="0.7rem" /> จำนวนเงิน
                            </p>
                            <p className={styles.historyItemValue}>
                              {topup.amount?.toLocaleString()} บาท
                            </p>
                          </div>
                          
                          {/* แต้มที่ได้รับ */}
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>
                              <Icon name="coin" size="0.7rem" /> แต้มที่ได้รับ
                            </p>
                            <p className={styles.historyItemValue}>
                              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                {topup.points?.toLocaleString() || topup.amount?.toLocaleString()} พ้อยท์
                              </span>
                            </p>
                          </div>
                          
                          {/* วิธีชำระ */}
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>
                              <Icon name="card" size="0.7rem" /> วิธีชำระ
                            </p>
                            <p className={styles.historyItemValue}>
                              {topup.method === 'wallet' ? (
                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Icon name="gift" size="0.7rem" /> TrueWallet อังเปา
                                </span>
                              ) : (
                                <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Icon name="bank" size="0.7rem" /> โอนผ่านธนาคาร
                                </span>
                              )}
                            </p>
                          </div>
                          
                          {/* รหัสอังเปา (เฉพาะ wallet) */}
                          {topup.method === 'wallet' && topup.voucherCode && (
                            <div className={styles.historyItemFull}>
                              <p className={styles.historyItemLabel}>
                                <Icon name="ticket" size="0.7rem" /> รหัสอังเปา
                              </p>
                              <p className={styles.historyItemValue} style={{ 
                                fontSize: '0.7rem', 
                                fontFamily: 'monospace',
                                background: '#0a0a0f',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                display: 'inline-block'
                              }}>
                                {topup.voucherCode}
                              </p>
                            </div>
                          )}
                          
                          {/* เลขอ้างอิงสลิป (เฉพาะ bank) */}
                          {topup.method === 'bank' && topup.transRef && (
                            <div className={styles.historyItemFull}>
                              <p className={styles.historyItemLabel}>
                                <Icon name="file" size="0.7rem" /> เลขอ้างอิง
                              </p>
                              <p className={styles.historyItemValue} style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                {topup.transRef}
                              </p>
                            </div>
                          )}
                          
                          {/* ข้อความ error (ถ้ามี) */}
                          {topup.errorDetail && (
                            <div className={styles.historyItemFull}>
                              <p className={styles.historyItemLabel} style={{ color: '#ef4444' }}>
                                <Icon name="error" size="0.7rem" /> ข้อผิดพลาด
                              </p>
                              <p className={styles.historyItemValue} style={{ color: '#f87171', fontSize: '0.75rem' }}>
                                {topup.errorDetail}
                              </p>
                            </div>
                          )}
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