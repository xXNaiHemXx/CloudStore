import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";
import { useUser } from "../context/UserContext";
import Icon from "../components/Icon";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const { userProducts } = useUser();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, purchases: 0, members: 0, licenses: 0 });
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
          licenses: (usersRes.data.count || 0) * 1.3 || 0,
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
        
        {/* ========== HERO SECTION ========== */}
        <section className={styles.hero}>
          <div className={styles.heroBgOrb1}></div>
          <div className={styles.heroBgOrb2}></div>
          <div className={styles.heroBgOrb3}></div>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Icon name="star" size="0.7rem" />
              <span>xCloud Studio</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleAccent}>xCloud</span>
              <br />
              <span className={styles.heroTitleSub}>Studio</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Models and mods for ETS2 by xCloud-Studio. Quality you can trust, straight from the source.
            </p>
            <div className={styles.heroButtons}>
              <button onClick={scrollToProducts} className={styles.btnBrowse}>
                <Icon name="product" size="0.9rem" />
                Browse products
              </button>
              <a
                className={styles.btnDiscord}
                href="https://discord.gg/ntGypaUBNG"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/images/discord.png" alt="Discord" />
                <span>Join Discord</span>
              </a>
            </div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : stats.members.toLocaleString()}</span>
              <span className={styles.heroStatLabel}>Customers</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : stats.products}+</span>
              <span className={styles.heroStatLabel}>Products</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : stats.purchases.toLocaleString()}</span>
              <span className={styles.heroStatLabel}>Purchases</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : Math.floor(stats.licenses).toLocaleString()}</span>
              <span className={styles.heroStatLabel}>Licenses</span>
            </div>
          </div>

          <div className={styles.scrollIndicator} onClick={scrollToProducts} role="button" tabIndex={0}>
            <div className={styles.scrollMouse}></div>
            <span>Scroll</span>
          </div>
        </section>

        {/* ========== LATEST PRODUCTS ========== */}
        <section id="latest-products" className={styles.latestProducts}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Icon name="star" size="1rem" color="#f59e0b" />
              <span>Latest releases</span>
            </h2>
            <span className={styles.sectionSubtitle}>สคริปต์ใหม่ล่าสุด</span>
          </div>

          <div className={styles.productGrid}>
            {loading ? (
              // ===== LOADING STATE =====
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.productCardSkeleton}>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonText}></div>
                    <div className={styles.skeletonPrice}></div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <Icon name="product" size="3rem" />
                <p>No products available</p>
              </div>
            ) : (
              products.map((product) => {
                const isOwned = isProductOwned(product._id);
                const isNew = !isOwned && isNewProduct(product.createdAt);
                
                return (
                  <Link key={product._id} href={`/products/${product._id}`} className={styles.productCard}>
                    {/* NEW Badge */}
                    {isNew && (
                      <span className={styles.newBadge}>
                        <Icon name="new" size="0.6rem" />
                        <span>NEW</span>
                      </span>
                    )}
                    
                    {/* Image */}
                    <div className={styles.productImageWrapper}>
                      <img 
                        src={product.itemsimage} 
                        alt={product.itemsname} 
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.itemsname}</h3>
                      <p className={styles.productTitleTag}>{product.itemstitle}</p>
                      <div className={styles.productMeta}>
                        <span className={styles.productPrice}>
                          <Icon name="coin" size="0.7rem" color="#10b981" />
                          {product.itemsprice.toLocaleString()}
                        </span>
                        {isOwned && (
                          <span className={styles.ownedTag}>
                            <Icon name="check" size="0.6rem" color="#10b981" />
                            Owned
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* ========== RECOMMENDED / STATS SECTION ========== */}
        <section className={styles.recommendedSection}>
          <div className={styles.recommendedHeader}>
            <h2 className={styles.sectionTitle}>
              <Icon name="star" size="1rem" color="#f59e0b" />
              <span>Recommended</span>
            </h2>
            <span className={styles.sectionSubtitle}>Hand-picked for your server</span>
          </div>

          <div className={styles.recommendedGrid}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.recommendedCardSkeleton}>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonText}></div>
                  </div>
                </div>
              ))
            ) : (
              products.slice(0, 3).map((product) => (
                <Link key={product._id} href={`/products/${product._id}`} className={styles.recommendedCard}>
                  <div className={styles.recommendedImage}>
                    <img 
                      src={product.itemsimage} 
                      alt={product.itemsname}
                      onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                    />
                  </div>
                  <div className={styles.recommendedInfo}>
                    <h3 className={styles.recommendedName}>{product.itemsname}</h3>
                    <p className={styles.recommendedDesc}>{product.itemstitle}</p>
                    <div className={styles.recommendedFooter}>
                      <span className={styles.recommendedPrice}>
                        <Icon name="coin" size="0.7rem" color="#10b981" />
                        {product.itemsprice.toLocaleString()}
                      </span>
                      <span className={styles.recommendedView}>
                        View product <Icon name="arrow-right" size="0.6rem" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ========== LEADERSHIP SECTION - เหมือน xcore ========== */}
        <section className={styles.teamSection}>
          <div className={styles.teamHeader}>
            <div className={styles.teamKick}>
              <Icon name="users" size="0.9rem" />
              <span>Leadership &amp; Experience</span>
            </div>
            <h2 className={styles.teamTitle}>The developer behind xCloud</h2>
          </div>

          <div className={styles.teamCards}>
            {/* Card 1 - Empty (ghost) */}
            <div className={styles.teamCardEmpty} aria-hidden="true">
              <div className={styles.teamGhost}>
                <span className={styles.teamGhostRing}>
                  <Icon name="user" size="2rem" color="#52525b" />
                </span>
              </div>
              <div className={styles.teamSkeleton}>
                <span className={styles.skeletonName}></span>
                <span className={styles.skeletonLine}></span>
                <span className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}></span>
                <div className={styles.skeletonFoot}>
                  <span className={styles.skeletonStat}></span>
                  <span className={styles.skeletonPill}></span>
                </div>
              </div>
            </div>

            {/* Card 2 - Main Developer */}
            <div className={styles.teamCardFeatured}>
              <img 
                src="/images/developer-avatar.jpg" 
                alt="xCloud Developer" 
                className={styles.teamCardBg}
              />
              <div className={styles.teamCardOverlay}>
                <div className={styles.teamCardName}>
                  xCloud - Studio
                  <span className={styles.teamCardHandle}>@Jayther999</span>
                  <svg className={styles.verifiedBadge} viewBox="0 0 24 24">
                    <path fill="#7cc0ff" d="M12 1.3l2.2 1.7 2.8-.4 1 2.6 2.6 1-.4 2.8 1.7 2.2-1.7 2.2.4 2.8-2.6 1-1 2.6-2.8-.4L12 22.7l-2.2-1.7-2.8.4-1-2.6-2.6-1 .4-2.8L2.5 12 .8 9.8l.4-2.8 2.6-1 1-2.6 2.8.4z"/>
                    <polyline points="8.4 12 11 14.6 15.6 9.4" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <p className={styles.teamCardDesc}>Blender</p>
                <div className={styles.teamCardFoot}>
                  <div className={styles.teamCardStats}>
                    <span>
                      <Icon name="users" size="0.8rem" />
                      3K+
                    </span>
                    <span>
                      <Icon name="star" size="0.8rem" />
                      52
                    </span>
                  </div>
                  <a 
                    href="https://discord.gg/ntGypaUBNG" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.teamFollowBtn}
                  >
                    Follow 
                    <Icon name="add" size="0.7rem" />
                  </a>
                </div>
              </div>
            </div>

            {/* Card 3 - Empty (ghost) */}
            <div className={styles.teamCardEmpty} aria-hidden="true">
              <div className={styles.teamGhost}>
                <span className={styles.teamGhostRing}>
                  <Icon name="user" size="2rem" color="#52525b" />
                </span>
              </div>
              <div className={styles.teamSkeleton}>
                <span className={styles.skeletonName}></span>
                <span className={styles.skeletonLine}></span>
                <span className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}></span>
                <div className={styles.skeletonFoot}>
                  <span className={styles.skeletonStat}></span>
                  <span className={styles.skeletonPill}></span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}