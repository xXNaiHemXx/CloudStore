import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Layout from "../../components/Layout";
import styles from "../../styles/ProductDetail.module.css";
import { useUser } from "../../context/UserContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import Icon from "../../components/Icon";
import { addLog, LOG_TYPES } from "../../utils/logger";

const convertToEmbedURL = (videoId) => {
  if (!videoId || videoId.length === 0) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

export default function ProductDetail() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = router.query;
  const { userPoints, refreshPoints, userProducts } = useUser();
  const { confirm } = useConfirm();
  const { success, error, warning } = useToast();

  const [product, setProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("detail");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  const ownedProductIds = new Set((userProducts || []).map(p => p.productId));
  const isProductOwned = (productId) => session && ownedProductIds.has(productId);
  const isNewProduct = (createdAt) => {
    if (!createdAt) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

  useEffect(() => {
    if (!id) return;
    const fetchRecommended = async () => {
      setLoadingRecommended(true);
      try {
        const res = await axios.get("/api/items");
        let allProducts = res.data || [];
        let otherProducts = allProducts.filter(p => p._id !== id);
        const shuffled = [...otherProducts];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setRecommendedProducts(shuffled.slice(0, 4));
      } catch (err) { console.error(err); }
      finally { setLoadingRecommended(false); }
    };
    fetchRecommended();
  }, [id]);

  const images = product?.itemsimages?.filter(Boolean) || [];

  const nextSlide = () => { if (!images.length) return; setCurrentSlide(p => p === images.length - 1 ? 0 : p + 1); };
  const prevSlide = () => { if (!images.length) return; setCurrentSlide(p => p === 0 ? images.length - 1 : p - 1); };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/items?id=${id}`)
      .then((res) => { setProduct(res.data); setLoading(false); })
      .catch(() => { setErrorState("ไม่พบสินค้าหรือเกิดข้อผิดพลาด"); setLoading(false); });
  }, [id]);

  const handlePurchase = async () => {
    if (isPurchasing) { warning("กำลังดำเนินการ กรุณารอสักครู่..."); return; }
    if (!session) { error("กรุณาเข้าสู่ระบบก่อนซื้อสินค้า"); return; }

    const currentPoints = Number(userPoints || 0);
    const productPrice = Number(product?.itemsprice || 0);

    if (currentPoints < productPrice) {
      error(`แต้มไม่เพียงพอ! คุณมี ${currentPoints.toLocaleString()} แต้ม แต่ต้องใช้ ${productPrice.toLocaleString()} แต้ม`);
      return;
    }

    const confirmed = await confirm({
      title: "ยืนยันการซื้อ",
      message: `คุณต้องการซื้อ ${product?.itemsname} ราคา ${productPrice.toLocaleString()} Points ใช่หรือไม่?`,
      confirmText: "ซื้อเลย",
      cancelText: "ยกเลิก",
      type: "info",
    });
    if (!confirmed) return;

    setIsPurchasing(true);
    try {
      const purchaseRes = await axios.post("/api/user/purchase", {
        userId: session.user.discordId || session.user.id,
        productId: id,
        price: productPrice,
      });

      if (purchaseRes.data.success) {
        await refreshPoints();
        
        // ✅ บันทึก Log การซื้อ
        await addLog(
          LOG_TYPES.PURCHASE,
          "ซื้อสินค้า",
          `${session.user.name} ซื้อ "${product?.itemsname}" ราคา ${productPrice} Point`,
          session.user.name,
          { productId: id, productName: product?.itemsname, price: productPrice }
        ).catch(() => {});

        success(`ซื้อสินค้าสำเร็จ! คงเหลือ ${purchaseRes.data.remainingPoints?.toLocaleString()} Points`);
        router.push("/profile");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "เกิดข้อผิดพลาด";
      error(errorMsg);
      
      // ✅ Log error
      await addLog(LOG_TYPES.ERROR, "ซื้อสินค้าผิดพลาด", errorMsg, session.user.name).catch(() => {});
    } finally {
      setIsPurchasing(false);
    }
  };

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

  if (errorState || !product) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <Icon name="error" size="3rem" />
            <h2>{errorState || "ไม่พบสินค้า"}</h2>
            <Link href="/shop" style={{ color: "#818cf8", textDecoration: "underline" }}>กลับไปหน้าร้านค้า</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const hasYouTube = product.itemsurlyoutube && product.itemsurlyoutube.length > 0;
  const descriptionLines = (product.itemsdesc || "").split("\n").filter((line) => line.trim() !== "");
  
  return (
    <Layout>
      <div className={styles.pageContainer}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <Link href="/shop">Products</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>{product.itemsname}</span>
        </nav>

        <div className={styles.mainContent}>
          <div className={styles.productHeader}>
            <div className={styles.productCategory}><Icon name="product" size="0.8rem" /> {product.itemstitle || "Product"}</div>
            <h1 className={styles.productName}>{product.itemsname}</h1>
          </div>

          <div className={styles.productGrid}>
            <div className={styles.mediaSection}>
              {hasYouTube ? (
                <div className={styles.videoWrapper}>
                  <iframe src={convertToEmbedURL(product.itemsurlyoutube)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={product.itemsname} />
                </div>
              ) : images.length > 0 ? (
                <div className={styles.slideshow}>
                  <div className={styles.slideshowTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {images.map((image, index) => (
                      <img key={index} src={image} alt={`${product.itemsname} - ${index + 1}`} className={styles.slideImage} loading={index === 0 ? "eager" : "lazy"} />
                    ))}
                  </div>
                  {images.length > 1 && (
                    <div className={styles.slideControls}>
                      <button className={styles.slideNavBtn} onClick={prevSlide}><Icon name="arrow-left" size="0.8rem" /></button>
                      <div className={styles.slideDots}>{images.map((_, i) => (<button key={i} className={`${styles.dot} ${i === currentSlide ? styles.dotActive : ""}`} onClick={() => setCurrentSlide(i)} />))}</div>
                      <button className={styles.slideNavBtn} onClick={nextSlide}><Icon name="arrow-right" size="0.8rem" /></button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}><Icon name="image" size="2rem" /> No preview</div>
              )}
            </div>

            <div className={styles.productSidebar}>
              <div className={styles.priceBox}>
                <Icon name="coin" size="1.5rem" />
                <div className={styles.priceInfo}>
                  <p className={styles.priceLabel}>ราคา</p>
                  <span className={styles.priceValue}>{product.itemsprice?.toLocaleString()}<span className={styles.priceUnit}>Point</span></span>
                </div>
              </div>

              <div className={styles.featureBox}>
                <p className={styles.featureTitle}><Icon name="star" size="0.8rem" /> สิ่งที่คุณจะได้รับ</p>
                <ul className={styles.featureList}>
                  <li className={styles.featureItem}><Icon name="refresh" size="0.8rem" /><span><strong>Lifetime Support</strong> ซัพพอร์ตตลอดอายุการใช้งาน</span></li>
                  <li className={styles.featureItem}><Icon name="product" size="0.8rem" /><span><strong>Version {product.itemsversion}</strong> อัปเดตเวอร์ชันล่าสุด</span></li>
                  <li className={styles.featureItem}><Icon name="download" size="0.8rem" /><span><strong>Download File</strong> ดาวน์โหลดไฟล์ทันทีหลังซื้อ</span></li>
                </ul>
              </div>

              <button className={styles.buyButton} onClick={handlePurchase} disabled={isPurchasing || userPoints < (product?.itemsprice || 0)}>
                <span className={styles.buyButtonText}>
                  {isPurchasing ? <><Icon name="loading" size="0.8rem" /> กำลังดำเนินการ...</> : <><Icon name="cart" size="0.9rem" /> ซื้อเลย - {product?.itemsprice?.toLocaleString()} Point</>}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.detailSection}>
          <div className={styles.detailTabs}>
            <button className={`${styles.detailTab} ${activeTab === "detail" ? styles.detailTabActive : ""}`} onClick={() => setActiveTab("detail")}><Icon name="info" size="0.8rem" /> รายละเอียด</button>
            {images.length > 0 && <button className={`${styles.detailTab} ${activeTab === "screenshots" ? styles.detailTabActive : ""}`} onClick={() => setActiveTab("screenshots")}><Icon name="image" size="0.8rem" /> Screenshots</button>}
          </div>
          <div className={styles.detailContent}>
            {activeTab === "detail" && (
              <div className={styles.detailText}>
                {descriptionLines.length > 0 ? <ul>{descriptionLines.map((line, i) => <li key={i}>{line}</li>)}</ul> : <p style={{ color: "#6b7280" }}>ไม่มีรายละเอียดเพิ่มเติม</p>}
              </div>
            )}
            {activeTab === "screenshots" && (
              <div className={styles.galleryGrid}>{images.map((img, i) => <img key={i} src={img} alt={`Screenshot ${i + 1}`} className={styles.galleryImage} loading="lazy" onClick={() => setLightboxImage(img)} />)}</div>
            )}
          </div>
        </div>

        {/* RECOMMENDED */}
        <section className={styles.recommendedSection}>
          <h2 className={styles.recommendedTitle}><Icon name="star" size="1rem" /> สินค้าแนะนำ</h2>
          {loadingRecommended ? <div className={styles.recommendedLoading}><div className={styles.loadingSpinner}></div><p>กำลังโหลด...</p></div>
            : recommendedProducts.length === 0 ? <div className={styles.recommendedEmpty}><p>ไม่มีสินค้าแนะนำ</p></div>
              : (<div className={styles.recommendedGrid}>{recommendedProducts.map((recProduct) => {
                  const isOwned = isProductOwned(recProduct._id);
                  const isNew = !isOwned && isNewProduct(recProduct.createdAt);
                  return (
                    <Link key={recProduct._id} href={`/products/${recProduct._id}`} className={styles.recommendedCard}>
                      {isNew && <span className={styles.recommendedNewBadge}><Icon name="new" size="0.6rem" /> NEW</span>}
                      {isOwned && <div className={styles.recommendedOwnedBadge}><Icon name="check" size="0.7rem" /> คุณเป็นเจ้าของแล้ว</div>}
                      <div className={styles.recommendedImageWrapper}><img src={recProduct.itemsimage} alt={recProduct.itemsname} loading="lazy" /></div>
                      <div className={styles.recommendedInfo}>
                        <h3 className={styles.recommendedName}>{recProduct.itemsname}</h3>
                        <p className={styles.recommendedTitle}>{recProduct.itemstitle}</p>
                        <div className={styles.recommendedPriceRow}>
                          <span className={styles.recommendedPrice}>฿{recProduct.itemsprice?.toLocaleString()}</span>
                          <span className={styles.recommendedViewBtn}><Icon name="arrow-right" size="0.7rem" /> ดูรายละเอียด</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}</div>)}
        </section>

        {lightboxImage && (
          <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
            <button className={styles.lightboxClose} onClick={() => setLightboxImage(null)}><Icon name="close" size="1rem" /></button>
            <img src={lightboxImage} alt="Screenshot" className={styles.lightboxImage} onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    </Layout>
  );
}