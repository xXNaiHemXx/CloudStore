import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";

export default function Home() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, purchases: 0, members: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsRes, usersRes, purchasesRes] = await Promise.all([
          axios.get("/api/items"),
          axios.get("/api/user/count"),
          axios.get("/api/purchases/count"),
        ]);
        const items = itemsRes.data;
        // เอา 6 ชิ้นล่าสุด
        setProducts(items.slice(0, 6));
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
          {/* Background Effects */}
          <div className={styles.heroGrid}></div>
          <div className={styles.heroOrb1}></div>
          <div className={styles.heroOrb2}></div>

          {/* Content */}
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              ⭐ Official xCloud Site
            </div>
            <h1 className={styles.heroTitle}>
              Modeling{' '}
              <span className={styles.heroTitleAccent}>xCloud</span>
              {' '}Store
            </h1>
            <p className={styles.heroSubtitle}>
              🏞️ โมเดลและรถสำหรับเกม ETS2 โดยทีมพัฒนา ALLNEWOKBUS 
              ให้บริการมายาวนานพร้อมอัปเดตต่อเนื่อง
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

          {/* Scroll Indicator */}
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
              products.map((product) => (
                <a key={product._id} href={`/products/${product._id}`} className={styles.productCard}>
                  <div className={styles.productImageWrapper}>
                    <img src={product.itemsimage} alt={product.itemsname} loading="lazy" />
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.itemsname}</h3>
                    <p className={styles.productTitleTag}>{product.itemstitle}</p>
                    <div className={styles.productPriceRow}>
                      <span className={styles.productPrice}>฿{product.itemsprice}</span>
                      <span className={styles.viewBtn}>
                        ดูรายละเอียด →
                      </span>
                    </div>
                  </div>
                </a>
              ))
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