import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/Profile.module.css";

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // --- Common State ---
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(",") || [];

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState("products"); // products | topup | history

  // --- Products State ---
  const [userProducts, setUserProducts] = useState([]);

  // --- Topup State ---
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- History State ---
  const [topups, setTopups] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- Fetch User Data ---
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    axios.get(`/api/user?discordId=${session.user.id}`)
      .then((res) => {
        setUserPoints(res.data.points || 0);
        setUserProducts(res.data.products || []);
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
      })
      .finally(() => setLoading(false));
  }, [session]);

  // --- Fetch History when tab active ---
  useEffect(() => {
    if (!session || activeTab !== "history") return;
    setLoadingHistory(true);
    axios.get(`/api/topups?discordId=${session.user.id}`)
      .then((res) => setTopups(res.data || []))
      .catch((err) => console.error("History load error:", err))
      .finally(() => setLoadingHistory(false));
  }, [session, activeTab]);

  // --- Topup: File Change ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert("กรุณาเลือกไฟล์ jpg, jpeg หรือ png เท่านั้น");
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // --- Topup: Remove File ---
  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setFileName("");
    setPreviewUrl(null);
  };

  // --- Topup: Submit ---
  const handleSubmit = async () => {
    if (!file || !amount || !session?.user?.id) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (parseFloat(amount) <= 0) {
      alert("กรุณากรอกจำนวนเงินที่มากกว่า 0");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("slip", file);
    formData.append("userId", session.user.id);
    formData.append("amount", amount);

    try {
      const uploadRes = await fetch("/api/topup/upload-slip", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        alert(uploadData.error || "อัพโหลดไม่สำเร็จ");
        setSubmitting(false);
        return;
      }

      const verifyRes = await fetch("/api/topup/verify-slipok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadData.fileUrl,
          amount,
          userId: session.user.id,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        alert(verifyData.error || "การตรวจสอบไม่สำเร็จ");
        setSubmitting(false);
        return;
      }

      alert(`✅ ส่งคำขอเติมเงินสำเร็จ! กรุณารอการตรวจสอบ`);
      removeFile();
      setAmount("");
      setUserPoints(verifyData.newPoints || userPoints);
    } catch (error) {
      console.error("Top-up error:", error);
      alert("เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Status Helper ---
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "approved":
        return styles.statusSuccess;
      case "pending":
        return styles.statusPending;
      case "failed":
      case "rejected":
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  // --- Redirect if not logged in ---
  if (!session) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <span style={{ fontSize: '3rem' }}>🔒</span>
            <h2 style={{ color: '#d1d5db', fontSize: '1.3rem' }}>กรุณาเข้าสู่ระบบ</h2>
            <Link href="/" style={{ color: '#818cf8', textDecoration: 'underline' }}>
              กลับไปหน้าหลัก
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>

        {/* ========== Profile Header ========== */}
        <div className={styles.profileHeader}>
          <div className={styles.profileCard}>
            <div className={styles.profileInfoRow}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatarGlow}></div>
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className={styles.avatar}
                />
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userLabel}>Account</p>
                <h1 className={styles.userName}>{session.user.name}</h1>
                <p className={styles.userEmail}>{session.user.email}</p>
              </div>
            </div>
            <div className={styles.profileActions}>
              <div className={styles.pointsBadge}>
                <span className={styles.pointsIcon}>💎</span>
                {userPoints.toLocaleString()} Point
              </div>
              {adminIds.includes(session.user.id) && (
                <Link href="/admin" className={styles.btnAdmin}>
                  ⚙️ Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={styles.btnLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* ========== Tabs Navigation ========== */}
        <nav className={styles.tabsNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 สินค้าของคุณ
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'topup' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('topup')}
          >
            💰 เติมพ้อยท์
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 ธุรกรรมล่าสุด
          </button>
        </nav>

        {/* ========== Content Area ========== */}
        <div className={styles.contentArea}>
          <div className={styles.contentCard}>

            {/* ========================================== */}
            {/* PRODUCTS TAB                               */}
            {/* ========================================== */}
            {activeTab === 'products' && (
              <>
                {loading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>กำลังโหลด...</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.productCountHeader}>
                      <p className={styles.productCount}>
                        คุณมีสินค้า <span>{userProducts.length}</span> ชิ้น
                      </p>
                    </div>

                    {userProducts.length === 0 ? (
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🛍️</span>
                        <p className={styles.emptyTitle}>ยังไม่มีสินค้า</p>
                        <p className={styles.emptyText}>
                          คุณยังไม่ได้ซื้อสินค้าใดๆ ไปเลือกซื้อสินค้ากันเลย!
                        </p>
                        <Link href="/shop" className={styles.emptyShopBtn}>
                          🛒 ไปที่ร้านค้า
                        </Link>
                      </div>
                    ) : (
                      <div className={styles.productGrid}>
                        {userProducts.map((product) => (
                          <div key={product.productId || product._id} className={styles.productCard}>
                            <div className={styles.cardImageWrapper}>
                              <img
                                src={product.image || '/images/placeholder.png'}
                                alt={product.name}
                                loading="lazy"
                              />
                            </div>
                            <div className={styles.cardBody}>
                              <h3 className={styles.cardProductName}>{product.name}</h3>
                              {product.version && (
                                <span className={styles.cardVersion}>
                                  📌 v{product.version}
                                </span>
                              )}
                            </div>
                            <div className={styles.cardFooter}>
                              <a
                                href={product.fileUrl || '#'}
                                className={styles.downloadBtn}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                📥 ดาวน์โหลด
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ========================================== */}
            {/* TOPUP TAB                                  */}
            {/* ========================================== */}
            {activeTab === 'topup' && (
              <div className={styles.topupLayout}>

                {/* QR Code */}
                <div className={styles.qrSection}>
                  <img
                    src="/images/kbank-qr.png"
                    alt="KBank QR Code"
                    className={styles.qrImage}
                  />
                  <p className={styles.qrHint}>📱 สแกน QR Code เพื่อโอนเงิน</p>
                </div>

                {/* Form */}
                <div className={styles.formSection}>
                  <h3 className={styles.formTitle}>💳 ข้อมูลการโอนเงิน</h3>

                  {/* Bank Info */}
                  <div className={styles.bankCard}>
                    <img
                      src="/images/kbank.png"
                      alt="KBank"
                      className={styles.bankLogo}
                    />
                    <div className={styles.bankInfo}>
                      <p className={styles.bankName}>ธนาคารกสิกรไทย</p>
                      <p className={styles.bankDetail}>
                        ชื่อบัญชี: นาย อิบรอเหม อุสมา<br />
                        เลขบัญชี: 137-3-69899-3
                      </p>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className={styles.warningBox}>
                    <span className={styles.warningIcon}>⚠️</span>
                    <span>เมื่อโอนเงินแล้ว ไม่มีนโยบายโอนคืน โปรดระบุยอดให้ตรงความต้องการ</span>
                  </div>

                  {/* Upload */}
                  <div className={styles.uploadSection}>
                    <label className={styles.uploadLabel}>📎 อัพโหลดสลิป</label>
                    <label
                      className={`${styles.uploadBox} ${fileName ? styles.hasFile : ''}`}
                    >
                      {fileName ? (
                        <div className={styles.previewContainer}>
                          {previewUrl && (
                            <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                          )}
                          <span className={styles.previewName}>{fileName}</span>
                          <button
                            type="button"
                            className={styles.removeFileBtn}
                            onClick={(e) => {
                              e.preventDefault();
                              removeFile();
                            }}
                          >
                            ✕ ลบไฟล์
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={styles.uploadIcon}>📤</span>
                          <span className={styles.uploadText}>กดเพื่ออัพโหลดสลิป</span>
                          <span className={styles.uploadHint}>ภาพความละเอียดสูง (jpg, jpeg, png)</span>
                        </>
                      )}
                      <input
                        type="file"
                        className={styles.uploadInput}
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {/* Amount */}
                  <div className={styles.amountSection}>
                    <label className={styles.amountLabel}>💵 จำนวนเงินที่ต้องการเติม</label>
                    <input
                      type="number"
                      className={styles.amountInput}
                      placeholder="1 บาท = 1 Point"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? '⏳ กำลังดำเนินการ...' : '✅ ยืนยันการโอนเงิน'}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* HISTORY TAB                                */}
            {/* ========================================== */}
            {activeTab === 'history' && (
              <>
                <div className={styles.historyNotice}>
                  <span>⚠️</span>
                  <span>หาก Status ขึ้น Pending แสดงว่าเรากำลังตรวจสอบข้อมูล ไม่จำเป็นต้องส่งสลิปซ้ำ!</span>
                </div>

                {loadingHistory ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>กำลังโหลดประวัติ...</p>
                  </div>
                ) : topups.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📋</span>
                    <p className={styles.emptyTitle}>ยังไม่มีประวัติการเติมเงิน</p>
                    <p className={styles.emptyText}>
                      ไปเติมพ้อยท์กันเลย!
                    </p>
                  </div>
                ) : (
                  <div className={styles.historyList}>
                    {topups.map((topup) => (
                      <div key={topup._id} className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                          <span className={styles.historyRef}>
                            #{topup.transRef || topup._id?.slice(-8)}
                          </span>
                          <span className={`${styles.statusBadge} ${getStatusClass(topup.status)}`}>
                            {topup.status || 'pending'}
                          </span>
                        </div>
                        <div className={styles.historyBody}>
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>📅 วันที่</p>
                            <p className={styles.historyItemValue}>
                              {new Date(topup.createdAt).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className={styles.historyItem}>
                            <p className={styles.historyItemLabel}>💰 จำนวนเงิน</p>
                            <p className={styles.historyItemValue}>
                              {topup.amount?.toLocaleString()} บาท
                            </p>
                          </div>
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