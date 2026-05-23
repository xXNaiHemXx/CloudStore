import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Layout from "../../components/Layout";
import styles from "../../styles/ProductDetail.module.css";

const convertToEmbedURL = (videoId) => {
  if (!videoId || videoId.length === 0) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

export default function ProductDetail() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("detail");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/items?id=${id}`)
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

  // Fetch user points
  useEffect(() => {
    if (!session?.user?.id) return;
    axios.get(`/api/user?discordId=${session.user.id}`)
      .then((res) => setUserPoints(res.data.points || 0))
      .catch(() => {});
  }, [session]);

  // Auto-rotate slideshow
  useEffect(() => {
    if (!product?.itemsimages?.length || product?.itemsurlyoutube) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % product.itemsimages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [product?.itemsimages?.length, product?.itemsurlyoutube]);

  const nextSlide = () => {
    if (!product?.itemsimages?.length) return;
    setCurrentSlide((prev) => (prev + 1) % product.itemsimages.length);
  };

  const prevSlide = () => {
    if (!product?.itemsimages?.length) return;
    setCurrentSlide((prev) => (prev - 1 + product.itemsimages.length) % product.itemsimages.length);
  };

  const handlePurchase = async (productId) => {
    if (!session) {
      alert("กรุณาเข้าสู่ระบบก่อนทำการซื้อสินค้า!");
      return;
    }
    try {
      const productRes = await axios.get(`/api/items?id=${productId}`);
      const data = productRes.data;

      if (userPoints < data.itemsprice) {
        alert("คุณมี Point ไม่เพียงพอสำหรับสินค้านี้!");
        return;
      }

      const confirmed = window.confirm(
        `ยืนยันการซื้อ "${data.itemsname}" ในราคา ${data.itemsprice} Point?`
      );
      if (!confirmed) return;

      const purchaseRes = await axios.post("/api/purchase", {
        userId: session.user.id,
        productId,
        productName: data.itemsname,
        productImage: data.itemsimages?.[0] || "",
        price: data.itemsprice,
        version: data.itemsversion,
      });

      if (purchaseRes.status === 200) {
        alert("ซื้อสินค้าสำเร็จ!");
        setUserPoints((prev) => prev - data.itemsprice);
        router.push("/profile");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.error || error.message}`);
    }
  };

  // Loading State
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

  // Error State
  if (error || !product) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <span style={{ fontSize: '3rem' }}>😔</span>
            <h2>{error || "ไม่พบสินค้า"}</h2>
            <Link href="/shop" style={{ color: '#818cf8', textDecoration: 'underline' }}>
              กลับไปหน้าร้านค้า
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const hasYouTube = product.itemsurlyoutube && product.itemsurlyoutube.length > 0;
  const images = product.itemsimages?.filter(Boolean) || [];
  const descriptionLines = (product.itemsdesc || "")
    .split("\n")
    .filter(line => line.trim() !== "");

  return (
    <Layout>
      <div className={styles.pageContainer}>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/shop">Products</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.itemsname}</span>
        </nav>

        {/* Main Content */}
        <div className={styles.mainContent}>

          {/* Product Header */}
          <div className={styles.productHeader}>
            <div className={styles.productCategory}>
              📦 {product.itemstitle || 'Product'}
            </div>
            <h1 className={styles.productName}>{product.itemsname}</h1>
          </div>

          {/* Product Grid */}
          <div className={styles.productGrid}>

            {/* Media Section */}
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
                      <button className={styles.slideNavBtn} onClick={prevSlide} aria-label="Previous">
                        ◀
                      </button>
                      <div className={styles.slideDots}>
                        {images.map((_, index) => (
                          <button
                            key={index}
                            className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                          />
                        ))}
                      </div>
                      <button className={styles.slideNavBtn} onClick={nextSlide} aria-label="Next">
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  No preview available
                </div>
              )}
            </div>

            {/* Product Sidebar */}
            <div className={styles.productSidebar}>

              {/* Price Box */}
              <div className={styles.priceBox}>
                <span className={styles.priceIcon}>💰</span>
                <div className={styles.priceInfo}>
                  <p className={styles.priceLabel}>ราคา</p>
                  <span className={styles.priceValue}>
                    {product.itemsprice.toLocaleString()}
                    <span className={styles.priceUnit}>Point</span>
                  </span>
                </div>
              </div>

              {/* Feature Box */}
              <div className={styles.featureBox}>
                <p className={styles.featureTitle}>✨ สิ่งที่คุณจะได้รับ</p>
                <ul className={styles.featureList}>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>🔄</span>
                    <span>
                      <strong>Lifetime Support</strong>
                      ซัพพอร์ตตลอดอายุการใช้งาน
                    </span>
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>📦</span>
                    <span>
                      <strong>Version {product.itemsversion}</strong>
                      อัปเดตเวอร์ชันล่าสุด
                    </span>
                  </li>
                  <li className={styles.featureItem}>
                    <span className={styles.featureIcon}>📥</span>
                    <span>
                      <strong>Download File</strong>
                      ดาวน์โหลดไฟล์ทันทีหลังซื้อ
                    </span>
                  </li>
                </ul>
              </div>

              {/* Buy Button */}
              <button
                className={styles.buyButton}
                onClick={() => handlePurchase(product._id)}
              >
                <span className={styles.buyButtonText}>
                  🛒 ซื้อเลย - {product.itemsprice.toLocaleString()} Point
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className={styles.detailSection}>
          <div className={styles.detailTabs}>
            <button
              className={`${styles.detailTab} ${activeTab === 'detail' ? styles.detailTabActive : ''}`}
              onClick={() => setActiveTab('detail')}
            >
              📋 รายละเอียด
            </button>
            {images.length > 0 && (
              <button
                className={`${styles.detailTab} ${activeTab === 'screenshots' ? styles.detailTabActive : ''}`}
                onClick={() => setActiveTab('screenshots')}
              >
                📸 Screenshots
              </button>
            )}
          </div>

          <div className={styles.detailContent}>
            {activeTab === 'detail' && (
              <div className={styles.detailText}>
                {descriptionLines.length > 0 ? (
                  <ul>
                    {descriptionLines.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#6b7280' }}>ไม่มีรายละเอียดเพิ่มเติม</p>
                )}
              </div>
            )}

            {activeTab === 'screenshots' && (
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

        {/* Lightbox */}
        {lightboxImage && (
          <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxImage(null)}
              aria-label="Close"
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