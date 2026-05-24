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

  const [product, setProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("detail");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // ==================== IMAGES ====================
  const images = product?.itemsimages?.filter(Boolean) || [];

  // ==================== SLIDESHOW ====================
  const nextSlide = () => {
    if (!images.length) return;

    setCurrentSlide((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (!images.length) return;

    setCurrentSlide((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  // ==================== FETCH PRODUCT ====================
  useEffect(() => {
    if (!id) return;

    setLoading(true);

    axios
      .get(`/api/items?id=${id}`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
        setError("ไม่พบสินค้าหรือเกิดข้อผิดพลาด");
        setLoading(false);
      });
  }, [id]);

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

      // ✅ ตรวจสอบแต้มก่อน
      const currentPoints = Number(userPoints || 0);
      const productPrice = Number(product?.itemsprice || 0);

      console.log("💰 PURCHASE CHECK:", { currentPoints, productPrice });

      if (currentPoints < productPrice) {
        alert(`❌ แต้มไม่เพียงพอ! คุณมี ${currentPoints.toLocaleString()} แต้ม แต่ต้องใช้ ${productPrice.toLocaleString()} แต้ม`);
        return;
      }

      const confirmed = confirm(
        `ยืนยันการซื้อ ${product?.itemsname} ราคา ${productPrice.toLocaleString()} Points?`
      );

      if (!confirmed) return;

      setIsPurchasing(true);

      const purchaseRes = await axios.post("/api/user/purchase", {
        userId: session.user.discordId || session.user.id,
        productId: id,
        price: productPrice,
      });

      console.log("📌 PURCHASE RESPONSE:", purchaseRes.data);

      if (purchaseRes.status === 200 && purchaseRes.data.success) {
        // ✅ อัปเดตแต้ม
        const newPoints = purchaseRes.data.remainingPoints;
        await refreshPoints(); // รีเฟรชจาก Context
        
        alert(`✅ ซื้อสินค้าสำเร็จ! คงเหลือ ${newPoints?.toLocaleString() || 0} Points`);
        
        // ✅ รีเฟรชหน้าเพื่อแสดงสินค้าใหม่
        router.push("/profile");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      
      // ✅ แสดง error จาก API
      const errorMsg = error.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      alert(`❌ ${errorMsg}`);
    } finally {
      setIsPurchasing(false);
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

            <Link
              href="/shop"
              style={{
                color: "#818cf8",
                textDecoration: "underline",
              }}
            >
              กลับไปหน้าร้านค้า
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const hasYouTube =
    product.itemsurlyoutube &&
    product.itemsurlyoutube.length > 0;

  const descriptionLines = (product.itemsdesc || "")
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <Layout>
      <div className={styles.pageContainer}>
        {/* USER POINTS */}
        

        {/* BREADCRUMB */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>

          <span className={styles.breadcrumbSeparator}>/</span>

          <Link href="/shop">Products</Link>

          <span className={styles.breadcrumbSeparator}>/</span>

          <span className={styles.breadcrumbCurrent}>
            {product.itemsname}
          </span>
        </nav>

        {/* MAIN CONTENT */}
        <div className={styles.mainContent}>
          {/* PRODUCT HEADER */}
          <div className={styles.productHeader}>
            <div className={styles.productCategory}>
              📦 {product.itemstitle || "Product"}
            </div>

            <h1 className={styles.productName}>
              {product.itemsname}
            </h1>
          </div>

          {/* PRODUCT GRID */}
          <div className={styles.productGrid}>
            {/* MEDIA SECTION */}
            <div className={styles.mediaSection}>
              {hasYouTube ? (
                <div className={styles.videoWrapper}>
                  <iframe
                    src={convertToEmbedURL(
                      product.itemsurlyoutube
                    )}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={product.itemsname}
                  />
                </div>
              ) : images.length > 0 ? (
                <div className={styles.slideshow}>
                  <div
                    className={styles.slideshowTrack}
                    style={{
                      transform: `translateX(-${
                        currentSlide * 100
                      }%)`,
                    }}
                  >
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${product.itemsname} - ${
                          index + 1
                        }`}
                        className={styles.slideImage}
                        loading={
                          index === 0 ? "eager" : "lazy"
                        }
                      />
                    ))}
                  </div>

                  {images.length > 1 && (
                    <div className={styles.slideControls}>
                      <button
                        className={styles.slideNavBtn}
                        onClick={prevSlide}
                      >
                        ◀
                      </button>

                      <div className={styles.slideDots}>
                        {images.map((_, index) => (
                          <button
                            key={index}
                            className={`${styles.dot} ${
                              index === currentSlide
                                ? styles.dotActive
                                : ""
                            }`}
                            onClick={() =>
                              setCurrentSlide(index)
                            }
                          />
                        ))}
                      </div>

                      <button
                        className={styles.slideNavBtn}
                        onClick={nextSlide}
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    aspectRatio: "16/10",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                  }}
                >
                  No preview available
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className={styles.productSidebar}>

              {/* PRICE BOX */}
              <div className={styles.priceBox}>
                <span className={styles.priceIcon}>💰</span>

                <div className={styles.priceInfo}>
                  <p className={styles.priceLabel}>ราคา</p>

                  <span className={styles.priceValue}>
                    {product.itemsprice?.toLocaleString()}

                    <span className={styles.priceUnit}>
                      Point
                    </span>
                  </span>
                </div>
              </div>

              {/* FEATURE BOX */}
              <div className={styles.featureBox}>
                <p className={styles.featureTitle}>
                  ✨ สิ่งที่คุณจะได้รับ
                </p>

                <ul className={styles.featureList}>

                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      🔄
                    </span>

                    <span>
                      <strong>Lifetime Support</strong>
                      ซัพพอร์ตตลอดอายุการใช้งาน
                    </span>
                  </li>

                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      📦
                    </span>

                    <span>
                      <strong>
                        Version {product.itemsversion}
                      </strong>
                      อัปเดตเวอร์ชันล่าสุด
                    </span>
                  </li>

                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      📥
                    </span>

                    <span>
                      <strong>Download File</strong>
                      ดาวน์โหลดไฟล์ทันทีหลังซื้อ
                    </span>
                  </li>

                </ul>
              </div>

              {/* BUY BUTTON */}
              <button
                className={styles.buyButton}
                onClick={handlePurchase}
                disabled={
                  isPurchasing ||
                  userPoints < (product?.itemsprice || 0)
                }
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

        {/* DETAIL TABS */}
        <div className={styles.detailSection}>
          <div className={styles.detailTabs}>
            <button
              className={`${styles.detailTab} ${
                activeTab === "detail"
                  ? styles.detailTabActive
                  : ""
              }`}
              onClick={() => setActiveTab("detail")}
            >
              📋 รายละเอียด
            </button>

            {images.length > 0 && (
              <button
                className={`${styles.detailTab} ${
                  activeTab === "screenshots"
                    ? styles.detailTabActive
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("screenshots")
                }
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
                  <p style={{ color: "#6b7280" }}>
                    ไม่มีรายละเอียดเพิ่มเติม
                  </p>
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
                    onClick={() =>
                      setLightboxImage(img)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LIGHTBOX */}
        {lightboxImage && (
          <div
            className={styles.lightbox}
            onClick={() => setLightboxImage(null)}
          >
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>

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