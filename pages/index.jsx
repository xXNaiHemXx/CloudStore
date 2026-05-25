import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";
import { useUser } from "../context/UserContext";
import Icon from "../components/Icon";

export default function Home() {
  const { data: session } = useSession();
  const { userProducts } = useUser();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, purchases: 0, members: 0 });
  const [loading, setLoading] = useState(true);

  const ownedProductIds = useMemo(() => {
    if (!userProducts) return new Set();
    return new Set(userProducts.map(p => p.productId));
  }, [userProducts]);

  const isProductOwned = (productId) => {
    return session && ownedProductIds.has(productId);
  };

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
              <Icon name="star" size="0.8rem" />
              <span> Official xCloud Site</span>
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
                <Icon name="cart" size="1rem" />
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
            <Icon name="star" size="1rem" />
            <span>สินค้า</span>
            <span>ใหม่ล่าสุด</span>
          </h2>
          <div className={styles.productGrid}>
            {loading ? (
              <div className={styles.emptyState}>
                <Icon name="loading" size="2rem" />
                <p>กำลังโหลด...</p>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon name="product" size="3rem" />
                <p>ยังไม่มีสินค้าในขณะนี้</p>
              </div>
            ) : (
              products.map((product) => {
                const isOwned = isProductOwned(product._id);
                const isNew = !isOwned && isNewProduct(product.createdAt);
                
                return (
                  <a key={product._id} href={`/products/${product._id}`} className={styles.productCard}>
                    {isNew && (
                      <span className={styles.newBadge}>
                        <Icon name="new" size="0.6rem" />
                        <span>NEW</span>
                      </span>
                    )}
                    
                    {isOwned && (
                      <div className={styles.ownedBadge}>
                        <Icon name="check" size="0.6rem" />
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
                        <span className={styles.productPrice}>
                          <Icon name="coin" size="0.8rem" />
                          {product.itemsprice}
                        </span>
                        <span className={styles.viewBtn}>
                          ดูรายละเอียด <Icon name="arrow-right" size="0.7rem" />
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
              <span className={styles.statIcon}>
                <Icon name="product" size="1.5rem" />
              </span>
              <p className={styles.statValue}>{loading ? '-' : stats.products}</p>
              <p className={styles.statLabel}>Products</p>
            </div>
            <div className={styles.statCard} style={{ '--stat-color': '#10b981' }}>
              <span className={styles.statIcon}>
                <Icon name="money" size="1.5rem" />
              </span>
              <p className={styles.statValue}>{loading ? '-' : stats.purchases}</p>
              <p className={styles.statLabel}>Purchases</p>
            </div>
            <div className={styles.statCard} style={{ '--stat-color': '#f43f5e' }}>
              <span className={styles.statIcon}>
                <Icon name="users" size="1.5rem" />
              </span>
              <p className={styles.statValue}>{loading ? '-' : stats.members}</p>
              <p className={styles.statLabel}>Members</p>
            </div>
          </div>
        </section>

        {/* ========== Team Section ========== */}
        <section className={styles.teamSection}>
          <h2 className={styles.teamTitle}>
            <Icon name="rocket" size="1.2rem" />
            <span>xCloud Leadership</span>
          </h2>
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