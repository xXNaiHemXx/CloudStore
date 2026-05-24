import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Layout from "../../components/Layout";
import styles from "../../styles/ProductDetail.module.css";
import { useUser } from "../../context/UserContext";

const convertToEmbedURL = (videoId) => {
  if (!videoId || videoId.length === 0) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

export default function ProductDetail() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = router.query;
  const { userPoints, refreshPoints } = useUser();

  // ==================== STATE ====================
  const [product, setProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("detail");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // ✅ Version System State
  const [versionInfo, setVersionInfo] = useState(null);
  const [showFullChangelog, setShowFullChangelog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  // ==================== IMAGES ====================
  const images = product?.itemsimages?.filter(Boolean) || [];

  // ==================== SLIDESHOW ====================
  const nextSlide = () => {
    if (!images.length) return;
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (!images.length) return;
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // ==================== FETCH PRODUCT ====================
  useEffect(() => {
    if (!id) return;

    setLoading(true);

    Promise.all([
      axios.get(`/api/items?id=${id}`),
      axios.get(`/api/products/${id}/version`)
    ])
      .then(([productRes, versionRes]) => {
        setProduct(productRes.data);
        setVersionInfo(versionRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("ไม่พบสินค้าหรือเกิดข้อผิดพลาด");
        setLoading(false);
      });
  }, [id]);

  // ==================== CHECK USER HAS UPDATE ====================
  useEffect(() => {
    if (!session || !product) return;

    const checkUserUpdate = async () => {
      try {
        const res = await axios.post("/api/user/check-updates", {
          userId: session.user.discordId || session.user.id
        });
        
        const productUpdate = res.data.updates?.find(u => u.productId === id);
        setHasUpdate(!!productUpdate);
      } catch (error) {
        console.error("Check update error:", error);
      }
    };

    checkUserUpdate();
  }, [session, product, id]);

  // ==================== PURCHASE ====================
  const handlePurchase = async () => {
    if (isPurchasing) {
      alert("กำลังดำเนินการ กรุณารอสักครู่...");
      return;
    }

    try {
      if (!session) {
        alert("กรุณาเข้าสู่ระบบก่อนซื้อสินค้า");
        return;
      }

      if (userPoints < (product?.itemsprice || 0)) {
        alert(`แต้มไม่เพียงพอ! คุณมี ${userPoints} แต้ม แต่สินค้าราคา ${product?.itemsprice} แต้ม`);
        return;
      }

      const confirmed = confirm(`ยืนยันการซื้อ ${product?.itemsname} ราคา ${product?.itemsprice?.toLocaleString()} Points?`);
      if (!confirmed) return;

      setIsPurchasing(true);

      const purchaseRes = await axios.post("/api/user/purchase", {
        userId: session.user.discordId || session.user.id,
        productId: id,
        price: product?.itemsprice,
      });

      if (purchaseRes.status === 200) {
        await refreshPoints();
        alert(`✅ ซื้อสินค้าสำเร็จ! คงเหลือ ${purchaseRes.data.remainingPoints?.toLocaleString()} Points`);
        
        setTimeout(() => {
          setIsPurchasing(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      const errorMsg = error.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      alert(`❌ ${errorMsg}`);
      setIsPurchasing(false);
    }
  };

  // ==================== DOWNLOAD LATEST VERSION ====================
  const handleDownload = async () => {
    if (!session) {
      alert("กรุณาเข้าสู่ระบบเพื่อดาวน์โหลด");
      return;
    }

    setIsDownloading(true);

    try {
      const res = await axios.post("/api/user/download-update", {
        userId: session.user.discordId || session.user.id,
        productId: id
      });

      if (res.data.success) {
        window.open(res.data.downloadUrl, "_blank");
        alert(`✅ เริ่มดาวน์โหลด ${product?.itemsname} เวอร์ชัน ${res.data.version}`);
        setHasUpdate(false);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("❌ ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsDownloading(false);
    }
  };

  // ==================== LOADING ====================
  if (loading) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>กำลังโหลดข้อมูลสินค้า...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ==================== ERROR ====================
  if (error || !product) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <span style={{ fontSize: "3rem" }}>😔</span>
            <h2>{error || "ไม่พบสินค้า"}</h2>
            <Link href="/shop" style={{ color: "#818cf8", textDecoration: "underline" }}>
              กลับไปหน้าร้านค้า
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const hasYouTube = product.itemsurlyoutube && product.itemsurlyoutube.length > 0;
  const descriptionLines = (product.itemsdesc || "").split("\n").filter((line) => line.trim() !== "");
  const latestVersion = versionInfo?.latestVersion;
  const isForceUpdate = latestVersion?.isForceUpdate;

  return (
    <Layout>
      <div className={styles.pageContainer}>

        {/* ==================== UPDATE BANNER ==================== */}
        {hasUpdate && (
          <div className={styles.updateBanner}>
            <div className={styles.updateIcon}>🔄</div>
            <div className={styles.updateContent}>
              <h4>มีเวอร์ชันใหม่!</h4>
              <p>{product.itemsname} อัปเดตเป็นเวอร์ชัน {versionInfo?.currentVersion} แล้ว</p>
            </div>
            <button onClick={handleDownload} className={styles.updateNowBtn}>
              อัปเดตเลย
            </button>
          </div>
        )}

        {/* ==================== FORCE UPDATE WARNING ==================== */}
        {isForceUpdate && (
          <div className={styles.forceUpdateWarning}>
            <span>⚠️</span>
            <div>
              <strong>จำเป็นต้องอัปเดต!</strong>
              <p>เวอร์ชันนี้มีการแก้ไขที่สำคัญ กรุณาดาวน์โหลดเวอร์ชันล่าสุด</p>
            </div>
          </div>
        )}

        {/* ==================== BREADCRUMB ==================== */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/shop">Products</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.itemsname}</span>
        </nav>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className={styles.mainContent}>
          
          {/* PRODUCT HEADER */}
          <div className={styles.productHeader}>
            <div className={styles.productCategory}>📦 {product.itemstitle || "Product"}</div>
            <h1 className={styles.productName}>{product.itemsname}</h1>
          </div>

          {/* PRODUCT GRID */}
          <div className={styles.productGrid}>
            
            {/* MEDIA SECTION */}
            <div className={styles.mediaSection}>
              {hasYouTube ? (
                <div className={styles.videoWrapper}>
                  <iframe
                    src={convertToEmbedURL(product.itemsurlyoutube)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={product.itemsname}
                  />
                </div>
              ) : images.length > 0 ? (
                <div className={styles.slideshow}>
                  <div
                    className={styles.slideshowTrack}
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${product.itemsname} - ${index + 1}`}
                        className={styles.slideImage}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    ))}
                  </div>
                  {images.length > 1 && (
                    <div className={styles.slideControls}>
                      <button className={styles.slideNavBtn} onClick={prevSlide}>◀</button>
                      <div className={styles.slideDots}>
                        {images.map((_, index) => (
                          <button
                            key={index}
                            className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ""}`}
                            onClick={() => setCurrentSlide(index)}
                          />
                        ))}
                      </div>
                      <button className={styles.slideNavBtn} onClick={nextSlide}>▶</button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                  No preview available
                </div>
              )}
            </div>

            {/* ==================== SIDEBAR ==================== */}
            <div className={styles.productSidebar}>

              {/* PRICE BOX */}
              <div className={styles.priceBox}>
                <span className={styles.priceIcon}>💰</span>
                <div className={styles.priceInfo}>
                  <p className={styles.priceLabel}>ราคา</p>
                  <span className={styles.priceValue}>
                    {product.itemsprice?.toLocaleString()}
                    <span className={styles.priceUnit}>Point</span>
                  </span>
                </div>
              </div>

              {/* ==================== VERSION SECTION ==================== */}
              {versionInfo && (
                <div className={styles.versionBox}>
                  <div className={styles.versionHeader}>
                    <div className={styles.versionBadge}>
                      <span className={styles.versionIcon}>📦</span>
                      <span className={styles.versionNumber}>v{versionInfo.currentVersion}</span>
                      {versionInfo.versionStatus === "beta" && (
                        <span className={styles.betaBadge}>BETA</span>
                      )}
                      {hasUpdate && <span className={styles.updateBadge}>มีอัปเดต!</span>}
                    </div>
                    <div className={styles.versionDate}>
                      อัปเดตล่าสุด {new Date(versionInfo.latestUpdate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                  </div>

                  {/* CHANGELOG */}
                  {latestVersion && (
                    <div className={styles.changelogSection}>
                      <h4 className={styles.changelogTitle}>📋 รายการอัปเดต</h4>
                      <div className={styles.changelogContent}>
                        {latestVersion.changelog?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className={styles.changelogItem}>
                            <span className={styles.changelogBullet}>✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                        {latestVersion.changelog?.length > 3 && (
                          <button 
                            className={styles.viewMoreBtn}
                            onClick={() => setShowFullChangelog(!showFullChangelog)}
                          >
                            {showFullChangelog ? "แสดงน้อยลง" : `ดูทั้งหมด ${latestVersion.changelog.length} รายการ`}
                          </button>
                        )}
                      </div>

                      {showFullChangelog && latestVersion.changelog?.length > 3 && (
                        <div className={styles.fullChangelog}>
                          {latestVersion.changelog.slice(3).map((item, idx) => (
                            <div key={idx} className={styles.changelogItem}>
                              <span className={styles.changelogBullet}>✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* VERSION HISTORY */}
                  {versionInfo.versions?.length > 1 && (
                    <details className={styles.versionHistory}>
                      <summary className={styles.historySummary}>
                        📜 ประวัติเวอร์ชันทั้งหมด ({versionInfo.versions.length} เวอร์ชัน)
                      </summary>
                      <div className={styles.historyList}>
                        {versionInfo.versions.slice(0, 5).map((v, idx) => (
                          <div key={idx} className={styles.historyItem}>
                            <div className={styles.historyHeader}>
                              <span className={styles.historyVersion}>v{v.version}</span>
                              <span className={styles.historyDate}>
                                {new Date(v.createdAt).toLocaleDateString("th-TH")}
                              </span>
                            </div>
                            <ul className={styles.historyChangelog}>
                              {v.changelog?.slice(0, 2).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                              {v.changelog?.length > 2 && <li>...</li>}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* DOWNLOAD BUTTON (สำหรับผู้ที่ซื้อแล้ว) */}
                  {session && (
                    <button 
                      className={`${styles.downloadBtn} ${hasUpdate ? styles.hasUpdateBtn : ""}`}
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        "⏳ กำลังเตรียมไฟล์..."
                      ) : hasUpdate ? (
                        "📥 ดาวน์โหลดเวอร์ชันล่าสุด"
                      ) : (
                        "📥 ดาวน์โหลด"
                      )}
                    </button>
                  )}

                  {latestVersion?.fileSize && (
                    <div className={styles.fileInfo}>
                      📁 ขนาดไฟล์: {latestVersion.fileSize}
                    </div>
                  )}
                </div>
              )}

              {/* FEATURE BOX */}
              <div className={styles.featureBox}>
                <p className={styles.featureTitle}>✨ สิ่งที่คุณจะได้รับ</p>
                <ul className={styles.featureList}>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>🔄</span>
                    <span><strong>Lifetime Support</strong> ซัพพอร์ตตลอดอายุการใช้งาน</span>
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>📦</span>
                    <span><strong>Version {product.itemsversion}</strong> อัปเดตเวอร์ชันล่าสุด</span>
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>📥</span>
                    <span><strong>Download File</strong> ดาวน์โหลดไฟล์ทันทีหลังซื้อ</span>
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>🔔</span>
                    <span><strong>Auto Update</strong> แจ้งเตือนเมื่อมีเวอร์ชันใหม่</span>
                  </li>
                </ul>
              </div>

              {/* BUY BUTTON (สำหรับคนที่ยังไม่ได้ซื้อ) */}
              <button
                className={styles.buyButton}
                onClick={handlePurchase}
                disabled={isPurchasing || userPoints < (product?.itemsprice || 0)}
              >
                <span className={styles.buyButtonText}>
                  {isPurchasing
                    ? "⏳ กำลังดำเนินการ..."
                    : `🛒 ซื้อเลย - ${product?.itemsprice?.toLocaleString()} Point`}
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* ==================== DETAIL TABS ==================== */}
        <div className={styles.detailSection}>
          <div className={styles.detailTabs}>
            <button
              className={`${styles.detailTab} ${activeTab === "detail" ? styles.detailTabActive : ""}`}
              onClick={() => setActiveTab("detail")}
            >
              📋 รายละเอียด
            </button>
            {images.length > 0 && (
              <button
                className={`${styles.detailTab} ${activeTab === "screenshots" ? styles.detailTabActive : ""}`}
                onClick={() => setActiveTab("screenshots")}
              >
                📸 Screenshots
              </button>
            )}
          </div>

          <div className={styles.detailContent}>
            {activeTab === "detail" && (
              <div className={styles.detailText}>
                {descriptionLines.length > 0 ? (
                  <ul>
                    {descriptionLines.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#6b7280" }}>ไม่มีรายละเอียดเพิ่มเติม</p>
                )}
              </div>
            )}

            {activeTab === "screenshots" && (
              <div className={styles.galleryGrid}>
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Screenshot ${index + 1}`}
                    className={styles.galleryImage}
                    loading="lazy"
                    onClick={() => setLightboxImage(img)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ==================== LIGHTBOX ==================== */}
        {lightboxImage && (
          <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
            <button className={styles.lightboxClose} onClick={() => setLightboxImage(null)}>✕</button>
            <img
              src={lightboxImage}
              alt="Screenshot fullsize"
              className={styles.lightboxImage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      </div>
    </Layout>
  );
}