import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/Shop.module.css";
import { useUser } from "../context/UserContext";
import Icon from "../components/Icon";

export default function Shop() {
  const { data: session } = useSession();
  const { userProducts, isLoading: userLoading } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const ownedProductIds = useMemo(() => {
    if (!userProducts) return new Set();
    return new Set(userProducts.map(p => p.productId));
  }, [userProducts]);

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

  const isProductOwned = (productId) => {
    return session && ownedProductIds.has(productId);
  };

  const isNewProduct = (createdAt) => {
    if (!createdAt) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

  return (
    <Layout>
      <div className={styles.pageContainer}>

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
              <Icon name="product" size="1rem" /> <span className={styles.heroStatCount}>{products.length}</span> Products
            </div>
            <span className={styles.heroStatDivider}></span>
            <div className={styles.heroStatItem}>
              <Icon name="star" size="1rem" /> Quality Guaranteed
            </div>
            <span className={styles.heroStatDivider}></span>
            <div className={styles.heroStatItem}>
              <Icon name="refresh" size="1rem" /> Lifetime Updates
            </div>
          </div>
        </section>

        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <Icon name="search" size="1rem" />
            </span>
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
            <option value="newest"><Icon name="new" size="0.8rem" /> ใหม่ล่าสุด</option>
            <option value="price-asc"><Icon name="money" size="0.8rem" /> ราคา: ต่ำ → สูง</option>
            <option value="price-desc"><Icon name="money" size="0.8rem" /> ราคา: สูง → ต่ำ</option>
            <option value="name-asc"><Icon name="sort" size="0.8rem" /> ชื่อ: ก → ฮ</option>
            <option value="name-desc"><Icon name="sort" size="0.8rem" /> ชื่อ: ฮ → ก</option>
          </select>
        </div>

        {searchTerm && (
          <p className={styles.resultsCount}>
            พบ {filteredProducts.length} รายการ สำหรับ "{searchTerm}"
          </p>
        )}

        <section className={styles.productSection}>
          {loading ? (
            <div className={styles.emptyState}>
              <Icon name="loading" size="2rem" />
              <p className={styles.emptyTitle}>กำลังโหลดสินค้า...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon name={searchTerm ? "search" : "product"} size="3rem" />
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
                  <Icon name="refresh" size="0.8rem" /> รีเซ็ตการค้นหา
                </button>
              )}
            </div>
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => {
                const isOwned = isProductOwned(product._id);
                const isNew = !isOwned && isNewProduct(product.createdAt);
                
                return (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}`}
                    className={styles.productCard}
                  >
                    {isNew && (
                      <span className={styles.cardBadge}>
                        <Icon name="new" size="0.6rem" /> NEW
                      </span>
                    )}
                    
                    {isOwned && (
                      <div className={styles.ownedBadge}>
                        <Icon name="check" size="0.7rem" />
                        <span className={styles.ownedText}>IN LIBRARY</span>
                      </div>
                    )}

                    <div className={styles.cardImage}>
                      <img
                        src={product.itemsimage}
                        alt={product.itemsname}
                        loading="lazy"
                      />
                    </div>

                    <div className={styles.cardInfo}>
                      <p className={styles.cardTitle}>{product.itemstitle}</p>
                      <h3 className={styles.cardName}>{product.itemsname}</h3>
                      {product.itemsdesc && (
                        <p className={styles.cardDesc}>{product.itemsdesc}</p>
                      )}
                      <div className={styles.cardFooter}>
                        <div className={styles.cardPrice}>
                          <Icon name="coin" size="0.8rem" />
                          {product.itemsprice?.toLocaleString()}
                          <span className={styles.cardPriceCurrency}>฿</span>
                        </div>
                        <span className={styles.cardArrow}>
                          {isOwned ? "ดูรายละเอียด" : "ดูเพิ่มเติม"} <Icon name="arrow-right" size="0.7rem" />
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