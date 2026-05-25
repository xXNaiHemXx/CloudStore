import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";
import { useUser } from "../context/UserContext";

export default function Home() {
  const { data: session } = useSession();
  const { userProducts } = useUser(); // ✅ ดึงสินค้าที่ user มี
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, purchases: 0, members: 0 });
  const [loading, setLoading] = useState(true);

  // ✅ สร้าง Set ของ productId ที่ user มี
  const ownedProductIds = useMemo(() => {
    if (!userProducts) return new Set();
    return new Set(userProducts.map(p => p.productId));
  }, [userProducts]);

  // ✅ ตรวจสอบว่าสินค้าเป็นของ user หรือไม่
  const isProductOwned = (productId) => {
    return session && ownedProductIds.has(productId);
  };

  // ✅ ตรวจสอบว่าเป็นสินค้าใหม่หรือไม่ (7 วันล่าสุด)
  const isNewProduct = (createdAt) => {
    if (!createdAt) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsRes, usersRes, purchasesRes] = await Promise.all([
          axios.get("/api/items"),
          axios.get("/api/user/count"),
          axios.get("/api/purchases/count"),
        ]);
        const items = itemsRes.data;
        // เรียงตามวันที่สร้าง ล่าสุดอยู่หน้า
        const sortedItems = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(sortedItems.slice(0, 6));
        setStats({
          products: items.length,
          members: usersRes.data.count || 0,
          purchases: purchasesRes.data.count || 0,
        });
      } catch (err) {
        console.error("Home data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Scroll to products
  const scrollToProducts = () => {
    const el = document.getElementById('latest-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Layout>
      <div className={styles.homePage}>
        
        {/* ========== Hero Section ========== */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}></div>
          <div className={styles.heroOrb1}></div>
          <div className={styles.heroOrb2}></div>

          <div className={styles.heroContent}>
            <div className={styles.badge}>
              ⭐ Official xCloud Site
            </div>
            <h1 className={styles.heroTitle}>
              Modeling{' '}
              <span className={styles.heroTitleAccent}>xCloud</span>
              {' '}Studio
            </h1>
            <p className={styles.heroSubtitle}>
              Models and mods for ETS2 by xCloud-Studio. Quality you can trust, straight from the source.
            </p>
            <div className={styles.heroButtons}>
              <a
                className={styles.btnDiscord}
                href="https://discord.gg/G6Up8VDa5t"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/images/discord.png" alt="Discord" />
                <span>Join Discord</span>
              </a>
              <a className={styles.btnShop} href="/shop">
                <span>🛍️</span>
                <span>View Products</span>
              </a>
            </div>
          </div>

          <div className={styles.scrollIndicator} onClick={scrollToProducts} role="button" tabIndex={0}>
            <div className={styles.scrollMouse}></div>
            <span>Scroll</span>
          </div>
        </section>

        {/* ========== Latest Products ========== */}
        <section id="latest-products" className={styles.latestProducts}>
          <h2 className={styles.sectionTitle}>
            ✨ สินค้า<span>ใหม่ล่าสุด</span>
          </h2>
          <div className={styles.productGrid}>
            {loading ? (
              <div className={styles.emptyState}>
                <p>⏳ กำลังโหลด...</p>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <p>ยังไม่มีสินค้าในขณะนี้</p>
              </div>
            ) : (
              products.map((product) => {
                const isOwned = isProductOwned(product._id);
                const isNew = !isOwned && isNewProduct(product.createdAt); // ✅ ถ้าเป็นเจ้าของแล้วไม่แสดง NEW
                
                return (
                  <a key={product._id} href={`/products/${product._id}`} className={styles.productCard}>
                    {/* ✅ New Badge - แสดงเฉพาะเมื่อไม่ใช่ของ user */}
                    {isNew && (
                      <span className={styles.newBadge}></span>
                    )}
                    
                    {/* ✅ Owned Badge - แสดงเฉพาะเมื่อเป็นของ user */}
                    {isOwned && (
                      <div className={styles.ownedBadge}>
                        <span className={styles.ownedIcon}></span>
                        <span className={styles.ownedText}>IN LIBRARY</span>
                      </div>
                    )}
                    
                    <div className={styles.productImageWrapper}>
                      <img src={product.itemsimage} alt={product.itemsname} loading="lazy" />
                    </div>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.itemsname}</h3>
                      <p className={styles.productTitleTag}>{product.itemstitle}</p>
                      <div className={styles.productPriceRow}>
                        <span className={styles.productPrice}>฿{product.itemsprice}</span>
                        <span className={styles.viewBtn}>
                          {isOwned ? "ดูรายละเอียด →" : "ดูรายละเอียด →"}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </section>

        {/* ========== Stats Section ========== */}
        <section className={styles.statsSection}>
          <div className={styles.statsContainer}>
            <div className={styles.statCard} style={{ '--stat-color': '#a78bfa' }}>
              <span className={styles.statIcon}>🛍️</span>
              <p className={styles.statValue}>{loading ? '-' : stats.products}</p>
              <p className={styles.statLabel}>Products</p>
            </div>
            <div className={styles.statCard} style={{ '--stat-color': '#10b981' }}>
              <span className={styles.statIcon}>💵</span>
              <p className={styles.statValue}>{loading ? '-' : stats.purchases}</p>
              <p className={styles.statLabel}>Purchases</p>
            </div>
            <div className={styles.statCard} style={{ '--stat-color': '#f43f5e' }}>
              <span className={styles.statIcon}>👥</span>
              <p className={styles.statValue}>{loading ? '-' : stats.members}</p>
              <p className={styles.statLabel}>Members</p>
            </div>
          </div>
        </section>

        {/* ========== Team Section ========== */}
        <section className={styles.teamSection}>
          <h2 className={styles.teamTitle}>🚀 xCloud Leadership</h2>
          <div className={styles.teamCard}>
            <img
              src="/images/developer-avatar.jpg"
              alt="Developer"
              className={styles.teamAvatar}
              loading="lazy"
            />
            <p className={styles.teamName}>Jayther</p>
            <p className={styles.teamRole}>Owner & Developer</p>
          </div>
        </section>

      </div>
    </Layout>
  );
}