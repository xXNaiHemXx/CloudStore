import Head from "next/head";
import Layout from "../components/Layout";
import styles from "../styles/Support.module.css";
import Icon from "../components/Icon";
import Link from "next/link";

export default function Support() {
  return (
    <Layout>
      <Head>
        <title>ฝ่ายสนับสนุน - xCloud Studio</title>
        <meta name="description" content="ศูนย์ช่วยเหลือและสนับสนุนของ xCloud Studio" />
      </Head>

      <div className={styles.supportPage}>
        
        {/* ===== HERO ===== */}
        <div className={styles.supportHero}>
          <div className={styles.supportHeroContent}>
            <div className={styles.supportBadge}>
              <Icon name="heart" size="0.8rem" color="#f43f5e" />
              Support Center
            </div>
            <h1 className={styles.supportTitle}>
              ศูนย์ <span className={styles.supportTitleAccent}>ช่วยเหลือ</span>
            </h1>
            <p className={styles.supportSubtitle}>
              ทีมงานของเราพร้อมให้ความช่วยเหลือคุณ
            </p>
          </div>
          <div className={styles.supportHeroOrb}></div>
        </div>

        {/* ===== COMING SOON ===== */}
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonIcon}>
            <Icon name="settings" size="3rem" color="#6366f1" />
          </div>
          <h2>🚧 กำลังจะเปิดให้บริการ</h2>
          <p>
            เรากำลังพัฒนาระบบสนับสนุนเพื่อให้บริการที่ดีที่สุดแก่คุณ
          </p>
          <p className={styles.comingSoonSub}>
            ในระหว่างนี้สามารถติดต่อเราได้ที่ Discord
          </p>
          
          <div className={styles.comingSoonActions}>
            <a 
              href="https://discord.gg/ntGypaUBNG" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.btnDiscord}
            >
              <Icon name="discord" size="1rem" color="#818cf8" />
              Join Discord
            </a>
            <Link href="/" className={styles.btnBack}>
              <Icon name="arrow-left" size="0.8rem" />
              กลับหน้าหลัก
            </Link>
          </div>

          {/* ===== FEATURES COMING ===== */}
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <Icon name="message" size="1.5rem" color="#6366f1" />
              <h4>ระบบตั๋วช่วยเหลือ</h4>
              <p>เปิดตั๋วเพื่อรับความช่วยเหลือจากทีมงาน</p>
            </div>
            <div className={styles.featureCard}>
              <Icon name="clock" size="1.5rem" color="#f59e0b" />
              <h4>ตอบกลับรวดเร็ว</h4>
              <p>ทีมงานตอบกลับภายใน 24 ชั่วโมง</p>
            </div>
            <div className={styles.featureCard}>
              <Icon name="book" size="1.5rem" color="#10b981" />
              <h4>ฐานความรู้</h4>
              <p>คู่มือและคำแนะนำในการใช้งานสินค้า</p>
            </div>
            <div className={styles.featureCard}>
              <Icon name="users" size="1.5rem" color="#8b5cf6" />
              <h4>ทีมงานมืออาชีพ</h4>
              <p>ทีมสนับสนุนที่พร้อมช่วยเหลือคุณ</p>
            </div>
          </div>
        </div>

        {/* ===== CONTACT SECTION ===== */}
        <div className={styles.contactSection}>
          <div className={styles.glassCard}>
            <h3>
              <Icon name="mail" size="1rem" color="#818cf8" />
              ติดต่อเรา
            </h3>
            <p>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถติดต่อเราได้ที่</p>
            <div className={styles.contactLinks}>
              <a 
                href="https://discord.gg/ntGypaUBNG" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.contactLink}
              >
                <Icon name="discord" size="1rem" color="#818cf8" />
                Discord
              </a>
              <a 
                href="mailto:ets2promodth@gmail.com" 
                className={styles.contactLink}
              >
                <Icon name="email" size="1rem" color="#818cf8" />
                ets2promodth@gmail.com
              </a>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}