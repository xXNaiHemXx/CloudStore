import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/Shop.module.css";
import { useUser } from "../context/UserContext";

export default function Shop() {
  const { data: session } = useSession();
  const { userProducts, isLoading: userLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // ✅ สร้าง Set ของ productId ที่ user มี
  const ownedProductIds = useMemo(() => {
    if (!userProducts) return new Set();
    return new Set(userProducts.map(p => p.productId));
  }, [userProducts]);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    axios.get("/api/items")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.itemsname?.toLowerCase().includes(term) ||
          p.itemstitle?.toLowerCase().includes(term) ||
          p.itemsdesc?.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => (a.itemsprice || 0) - (b.itemsprice || 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.itemsprice || 0) - (a.itemsprice || 0));
        break;
      case "name-asc":
        result.sort((a, b) => (a.itemsname || "").localeCompare(b.itemsname || "", "th"));
        break;
      case "name-desc":
        result.sort((a, b) => (b.itemsname || "").localeCompare(a.itemsname || "", "th"));
        break;
      case "newest":
      default:
        result.reverse();
        break;
    }

    return result;
  }, [products, searchTerm, sortBy]);

  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("newest");
  };

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

  return (
    <Layout>
      <div className={styles.pageContainer}>

        {/* Hero Banner */}
        <section className={styles.heroBanner}>
          <h1 className={styles.heroTitle}>
            Our{' '}
            <span className={styles.heroTitleAccent}>Products</span>
          </h1>
          <p className={styles.heroSubtitle}>
            ค้นพบโมเดลและรถสำหรับเกม ETS2 คุณภาพสูงจากทีมพัฒนา ALLNEWOKBUS
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStatItem}>
              📦 <span className={styles.heroStatCount}>{products.length}</span> Products
            </div>
            <span className={styles.heroStatDivider}></span>
            <div className={styles.heroStatItem}>
              ⭐ Quality Guaranteed
            </div>
            <span className={styles.heroStatDivider}></span>
            <div className={styles.heroStatItem}>
              🔄 Lifetime Updates
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">🆕 ใหม่ล่าสุด</option>
            <option value="price-asc">💰 ราคา: ต่ำ → สูง</option>
            <option value="price-desc">💎 ราคา: สูง → ต่ำ</option>
            <option value="name-asc">🔤 ชื่อ: ก → ฮ</option>
            <option value="name-desc">🔤 ชื่อ: ฮ → ก</option>
          </select>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <p className={styles.resultsCount}>
            พบ {filteredProducts.length} รายการ สำหรับ "{searchTerm}"
          </p>
        )}

        {/* Product Grid */}
        <section className={styles.productSection}>
          {loading ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⏳</span>
              <p className={styles.emptyTitle}>กำลังโหลดสินค้า...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                {searchTerm ? '🔍' : '📦'}
              </span>
              <p className={styles.emptyTitle}>
                {searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในขณะนี้'}
              </p>
              <p className={styles.emptyText}>
                {searchTerm
                  ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}" ลองค้นหาด้วยคำอื่น`
                  : 'สินค้าจะปรากฏที่นี่เมื่อมีการเพิ่มเข้าสู่ระบบ'}
              </p>
              {searchTerm && (
                <button className={styles.emptyResetBtn} onClick={resetFilters}>
                  🔄 รีเซ็ตการค้นหา
                </button>
              )}
            </div>
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => {
                const isOwned = isProductOwned(product._id);
                const isNew = !isOwned && isNewProduct(product.createdAt); // ✅ ถ้าเป็นเจ้าของแล้วไม่แสดง NEW
                
                return (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className={styles.productCard}
                  >
                    {/* ✅ New Badge - แสดงเฉพาะเมื่อไม่ใช่ของ user */}
                    {isNew && (
                      <span className={styles.cardBadge}></span>
                    )}
                    
                    {/* ✅ Owned Badge - แสดงเฉพาะเมื่อเป็นของ user */}
                    {isOwned && (
                      <div className={styles.ownedBadge}>
                        <span className={styles.ownedIcon}></span>
                        <span className={styles.ownedText}>IN LIBRARY</span>
                      </div>
                    )}

                    {/* Image */}
                    <div className={styles.cardImage}>
                      <img
                        src={product.itemsimage}
                        alt={product.itemsname}
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className={styles.cardInfo}>
                      <p className={styles.cardTitle}>{product.itemstitle}</p>
                      <h3 className={styles.cardName}>{product.itemsname}</h3>
                      {product.itemsdesc && (
                        <p className={styles.cardDesc}>{product.itemsdesc}</p>
                      )}
                      <div className={styles.cardFooter}>
                        <div className={styles.cardPrice}>
                          {product.itemsprice?.toLocaleString()}
                          <span className={styles.cardPriceCurrency}>฿</span>
                        </div>
                        <span className={styles.cardArrow}>
                          {isOwned ? "ดูรายละเอียด →" : "ดูเพิ่มเติม →"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
}