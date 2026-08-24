import Head from "next/head";
import Layout from "../components/Layout";
import styles from "../styles/Legal.module.css";
import Icon from "../components/Icon";
import { useState } from "react";

export default function Legal() {
  const [activeTab, setActiveTab] = useState("terms");

  return (
    <Layout>
      <Head>
        <title>ข้อกำหนดและนโยบาย - xCloud Studio</title>
        <meta name="description" content="ข้อกำหนดและนโยบายความเป็นส่วนตัวของ xCloud Studio" />
      </Head>

      <div className={styles.legalPage}>
        
        {/* ===== HERO ===== */}
        <div className={styles.legalHero}>
          <div className={styles.legalHeroContent}>
            <div className={styles.legalBadge}>
              <Icon name="file" size="0.8rem" color="#818cf8" />
              {activeTab === "terms" ? "ข้อกำหนด" : "นโยบาย"}
            </div>
            <h1 className={styles.legalTitle}>
              {activeTab === "terms" ? (
                <>ข้อกำหนด <span className={styles.legalTitleAccent}>การให้บริการ</span></>
              ) : (
                <>นโยบาย <span className={styles.legalTitleAccent}>ความเป็นส่วนตัว</span></>
              )}
            </h1>
            <p className={styles.legalSubtitle}>
              {activeTab === "terms" 
                ? "ปรับปรุงล่าสุด: 10 สิงหาคม 2569"
                : "ปรับปรุงล่าสุด: 10 สิงหาคม 2569"
              }
            </p>
          </div>
          <div className={styles.legalHeroOrb}></div>
        </div>

        {/* ===== TABS ===== */}
        <div className={styles.legalTabs}>
          <button 
            className={`${styles.legalTab} ${activeTab === 'terms' ? styles.legalTabActive : ''}`}
            onClick={() => setActiveTab("terms")}
          >
            <Icon name="file" size="0.8rem" />
            ข้อกำหนดการให้บริการ
          </button>
          <button 
            className={`${styles.legalTab} ${activeTab === 'privacy' ? styles.legalTabActive : ''}`}
            onClick={() => setActiveTab("privacy")}
          >
            <Icon name="lock" size="0.8rem" />
            นโยบายความเป็นส่วนตัว
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className={styles.legalContent}>

          {/* ===== ข้อกำหนดการให้บริการ ===== */}
          {activeTab === "terms" && (
            <section className={styles.legalSection}>
              
              {/* ข้อ 1 - คำนิยาม */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="book" size="1rem" color="#6366f1" />
                  1. คำนิยาม
                </h2>
                <ul>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    <strong>"ผู้ขาย" / "เรา" / "xCloud Studio":</strong> ผู้ให้บริการเว็บไซต์และเจ้าของลิขสิทธิ์โมเดลและม็อด
                  </li>
                  <li>
                    <Icon name="user" size="0.7rem" color="#6366f1" />
                    <strong>"ผู้ซื้อ" / "คุณ":</strong> ผู้ใช้งานที่ลงทะเบียนเข้าใช้และ/หรือซื้อสินค้าจากเรา
                  </li>
                  <li>
                    <Icon name="product" size="0.7rem" color="#f59e0b" />
                    <strong>"สินค้า" / "โมเดล" / "ม็อด":</strong> ไฟล์โมเดล 3D, สกิน, ม็อด และทรัพยากรดิจิทัลสำหรับ ETS2 ที่จำหน่ายบนเว็บไซต์
                  </li>
                  <li>
                    <Icon name="coin" size="0.7rem" color="#10b981" />
                    <strong>"Point":</strong> หน่วยมูลค่าที่ใช้ชำระค่าสินค้าภายในเว็บไซต์ (1 บาท = 1 Point)
                  </li>
                </ul>
              </div>

              {/* ข้อ 2 - การยอมรับข้อกำหนด */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="check-circle" size="1rem" color="#10b981" />
                  2. การยอมรับข้อกำหนด
                </h2>
                <p>
                  การเข้าถึงหรือใช้งานเว็บไซต์ xCloud Studio ("เว็บไซต์") และสินค้า/บริการของเรา ถือว่าคุณได้อ่าน เข้าใจ และยอมรับที่จะผูกพันตามข้อกำหนดนี้ทั้งหมด หากคุณไม่ยอมรับ โปรดหยุดใช้งานเว็บไซต์
                </p>
              </div>

              {/* ข้อ 3 - บัญชีผู้ใช้ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="user" size="1rem" color="#6366f1" />
                  3. บัญชีผู้ใช้
                </h2>
                <p>
                  การเข้าสู่ระบบทำผ่าน Discord OAuth คุณต้องรับผิดชอบต่อความถูกต้องและการรักษาความปลอดภัยของบัญชี Discord ของคุณเอง การกระทำใด ๆ ที่เกิดขึ้นภายใต้บัญชีของคุณถือเป็นความรับผิดชอบของคุณ
                </p>
              </div>

              {/* ข้อ 4 - การซื้อสินค้าและ Point */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="cart" size="1rem" color="#f59e0b" />
                  4. การซื้อสินค้าและ Point
                </h2>
                <ul>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    สินค้าทั้งหมดเป็นสินค้าดิจิทัล (โมเดล 3D, สกิน, ม็อดสำหรับ ETS2)
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    การชำระเงินทำผ่านระบบเติม Point โดย 1 บาท = 1 Point
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    สั่งซื้อสินค้าได้ที่ xcloudstudio.com ซึ่งเป็นช่องทางทางการเพียงช่องทางเดียว — เราไม่รับผิดชอบต่อการซื้อผ่านช่องทางอื่น
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ไม่มีนโยบายคืนเงิน</strong> หลังการเติม Point หรือการสั่งซื้อสำเร็จ โปรดตรวจสอบจำนวนเงินและสินค้าก่อนทำรายการทุกครั้ง
                  </li>
                  <li>
                    <Icon name="info" size="0.7rem" color="#3b82f6" />
                    เราขอสงวนสิทธิ์ในการปรับราคาหรือเงื่อนไขสินค้าโดยไม่ต้องแจ้งล่วงหน้า
                  </li>
                </ul>
              </div>

              {/* ข้อ 5 - สิทธิ์การใช้งาน - ปรับให้เข้ากับ MOD ETS2 */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="lock" size="1rem" color="#6366f1" />
                  5. สิทธิ์การใช้งานโมเดลและม็อด (License)
                </h2>
                <p>
                  เมื่อคุณซื้อโมเดลหรือม็อดจาก xCloud Studio เรามอบสิทธิ์การใช้งานแบบไม่ผูกขาดและโอนสิทธิ์ไม่ได้ (Non-exclusive, Non-transferable License) สำหรับใช้งานส่วนตัวในเกม Euro Truck Simulator 2 (ETS2) ของคุณเท่านั้น
                </p>
                <p style={{ marginTop: '0.75rem', fontWeight: 600, color: '#10b981' }}>สิ่งที่คุณทำได้:</p>
                <ul>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    ติดตั้งและใช้งานโมเดล/ม็อดในเกม ETS2 ของคุณ
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    ปรับแต่งสี/สกินเพื่อใช้งานส่วนตัวบนรถของคุณเอง
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    ใช้งานในเซิร์ฟเวอร์ Convoy (Multiplayer) ของคุณเอง
                  </li>
                </ul>
              </div>

              {/* ข้อ 6 - ข้อห้าม - ปรับให้เข้ากับ MOD ETS2 */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="warning" size="1rem" color="#ef4444" />
                  6. ข้อห้าม (สิ่งที่คุณทำไม่ได้)
                </h2>
                <ul>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ห้ามแจกจ่าย:</strong> ห้ามแจกจ่าย ทำซ้ำ ขายต่อ ให้เช่า หรือเผยแพร่ไฟล์โมเดล/ม็อดทั้งหมดหรือบางส่วนแก่บุคคลภายนอก ไม่ว่าทางใดก็ตาม
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ห้ามแชร์กับเพื่อน:</strong> ห้ามแชร์ไฟล์โมเดล/ม็อดกับเพื่อน ครอบครัว หรือบุคคลอื่นใด แม้จะอยู่ในเซิร์ฟเวอร์เดียวกัน
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ห้ามอัปโหลดสาธารณะ:</strong> ห้ามอัปโหลดไฟล์โมเดล/ม็อดขึ้นแพลตฟอร์มสาธารณะ เช่น Google Drive, MediaFire, Mega, NexusMods, ModLand, หรือเว็บไซต์อื่นใด
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ห้ามอ้างสิทธิ์:</strong> ห้ามนำโมเดล/ม็อดไปอ้างเป็นผลงานของตนเอง หรือลบข้อความแสดงลิขสิทธิ์/เครดิตของ xCloud Studio
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ห้ามดัดแปลงเพื่อแจก:</strong> คุณสามารถดัดแปลงโมเดลเพื่อใช้งานส่วนตัวได้ แต่ห้ามนำเวอร์ชันที่ดัดแปลงไปแจกจ่ายหรือเผยแพร่ต่อ
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    <strong>ห้ามปล่อยเช่า:</strong> ห้ามนำโมเดล/ม็อดไปปล่อยเช่า ให้ยืม หรือเปิดให้บุคคลอื่นใช้งาน
                  </li>
                </ul>
              </div>

              {/* ข้อ 7 - การบังคับใช้ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="gavel" size="1rem" color="#ef4444" />
                  7. การบังคับใช้และการตรวจสอบ
                </h2>
                <ul>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    เราใช้ระบบตรวจสอบลิขสิทธิ์เพื่อป้องกันการแจกจ่ายโดยไม่ได้รับอนุญาต
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    หากเราตรวจพบว่าโมเดล/ม็อดของคุณถูกแจกจ่ายหรือแชร์โดยไม่ได้รับอนุญาต เราจะดำเนินการตามข้อ "การระงับสิทธิ์" ทันที
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    เราขอสงวนสิทธิ์ในการตรวจสอบไฟล์โมเดล/ม็อดที่คุณครอบครองเพื่อยืนยันความถูกต้องของลิขสิทธิ์
                  </li>
                </ul>
              </div>

              {/* ข้อ 8 - การระงับสิทธิ์ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="ban" size="1rem" color="#ef4444" />
                  8. การระงับสิทธิ์และการยกเลิก
                </h2>
                <ul>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    หากพบว่ามีการละเมิดข้อกำหนดข้อใดข้อหนึ่ง สิทธิ์การใช้งานโมเดล/ม็อดของคุณจะถูกระงับทันที โดยไม่มีการคืนเงิน
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    บัญชีผู้ใช้ของคุณอาจถูกระงับหรือแบนถาวรจากแพลตฟอร์มของเรา
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    คุณต้องหยุดใช้งานและลบไฟล์โมเดล/ม็อดทั้งหมดออกจากเครื่องของคุณทันที
                  </li>
                  <li>
                    <Icon name="x" size="0.7rem" color="#ef4444" />
                    ผู้ละเมิดจะถูกขึ้นบัญชีดำไม่ให้ซื้อผลิตภัณฑ์ในอนาคตจาก xCloud Studio
                  </li>
                </ul>
              </div>

              {/* ข้อ 9 - ทรัพย์สินทางปัญญา */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="shield" size="1rem" color="#10b981" />
                  9. ทรัพย์สินทางปัญญา
                </h2>
                <p>
                  โมเดล 3D, สกิน, ม็อด และทรัพยากรทั้งหมดยังคงเป็นกรรมสิทธิ์ของ xCloud Studio 
                  การซื้อเป็นการมอบสิทธิ์การใช้งานเท่านั้น ไม่ใช่การโอนกรรมสิทธิ์ 
                  ห้ามนำไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากเรา
                </p>
              </div>

              {/* ข้อ 10 - ข้อจำกัดความรับผิดชอบ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="clock" size="1rem" color="#6b7280" />
                  10. ข้อจำกัดความรับผิดชอบ
                </h2>
                <ul>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    โมเดล/ม็อดทั้งหมดจัดให้ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    เราไม่รับประกันความเข้ากันได้กับเกมเวอร์ชันอื่นหรือม็อดอื่นๆ
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    เราไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้โมเดล/ม็อดของเรา
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    แนะนำให้สำรองข้อมูลเกมก่อนติดตั้งม็อดทุกครั้ง
                  </li>
                </ul>
              </div>

              {/* ข้อ 11 - ติดต่อเรา */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="mail" size="1rem" color="#818cf8" />
                  11. ติดต่อเรา
                </h2>
                <p>
                  หากมีคำถามเกี่ยวกับข้อกำหนดหรือสิทธิ์การใช้งานนี้ ติดต่อทีมงานผ่านช่องทาง Discord ของเรา
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <a 
                    href="https://discord.gg/ntGypaUBNG" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.contactLink}
                  >
                    <Icon name="discord" size="0.8rem" color="#818cf8" />
                    Join Discord
                  </a>
                </div>
              </div>

              <div className={`${styles.glassCard} ${styles.legalLastUpdate}`}>
                <p>
                  <Icon name="calendar" size="0.8rem" color="#6b7280" />
                  ปรับปรุงล่าสุด: 18 มิถุนายน 2569
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(107,114,128,0.4)', marginTop: '0.25rem' }}>
                  เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดใด ๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                </p>
              </div>

            </section>
          )}

          {/* ===== นโยบายความเป็นส่วนตัว ===== */}
          {activeTab === "privacy" && (
            <section className={styles.legalSection}>

              {/* ข้อ 1 - ข้อมูลที่เก็บ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="database" size="1rem" color="#6366f1" />
                  1. ข้อมูลที่เราเก็บรวบรวม
                </h2>
                <ul>
                  <li>
                    <Icon name="user" size="0.7rem" color="#6366f1" />
                    <strong>ข้อมูลบัญชี Discord:</strong> Discord ID, ชื่อผู้ใช้ (username), ชื่อที่แสดง, อีเมล และรูปโปรไฟล์ (avatar)
                  </li>
                  <li>
                    <Icon name="globe" size="0.7rem" color="#3b82f6" />
                    <strong>ที่อยู่ IP:</strong> เพื่อความปลอดภัยและการตรวจสอบย้อนหลัง
                  </li>
                  <li>
                    <Icon name="receipt" size="0.7rem" color="#f59e0b" />
                    <strong>ข้อมูลธุรกรรม:</strong> ประวัติการเติม Point การสั่งซื้อ และรูปสลิปการโอนเงิน
                  </li>
                </ul>
              </div>

              {/* ข้อ 2 - วัตถุประสงค์ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="eye" size="1rem" color="#3b82f6" />
                  2. วัตถุประสงค์ในการใช้ข้อมูล
                </h2>
                <ul>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    เพื่อให้บริการบัญชีผู้ใช้ ระบบ Point และการดาวน์โหลดสินค้า
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    เพื่อตรวจสอบและยืนยันการชำระเงิน
                  </li>
                  <li>
                    <Icon name="check" size="0.7rem" color="#10b981" />
                    เพื่อป้องกันการทุจริต การละเมิด และรักษาความปลอดภัยของระบบ
                  </li>
                </ul>
              </div>

              {/* ข้อ 3 - คุกกี้ */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="cookie" size="1rem" color="#f59e0b" />
                  3. คุกกี้ (Cookies)
                </h2>
                <p>
                  เราใช้คุกกี้ที่จำเป็นต่อการทำงานของระบบ เช่น คุกกี้เซสชัน เพื่อรักษาสถานะการเข้าสู่ระบบของคุณ และไม่ใช้เพื่อการติดตามเพื่อการโฆษณา
                </p>
              </div>

              {/* ข้อ 4 - การเปิดเผยข้อมูล */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="share" size="1rem" color="#8b5cf6" />
                  4. การเปิดเผยข้อมูลแก่บุคคลภายนอก
                </h2>
                <p>
                  เราไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณ เราอาจเปิดเผยข้อมูลเท่าที่จำเป็นแก่ผู้ให้บริการที่เกี่ยวข้อง (เช่น ระบบยืนยันสลิป) หรือเมื่อกฎหมายกำหนด
                </p>
              </div>

              {/* ข้อ 5 - การเก็บรักษาข้อมูล */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="archive" size="1rem" color="#6b7280" />
                  5. การเก็บรักษาข้อมูล
                </h2>
                <p>
                  เราเก็บข้อมูลของคุณตราบเท่าที่จำเป็นต่อการให้บริการและตามที่กฎหมายกำหนด เมื่อไม่จำเป็นแล้วข้อมูลจะถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้
                </p>
              </div>

              {/* ข้อ 6 - ติดต่อเรา */}
              <div className={styles.glassCard}>
                <h2>
                  <Icon name="mail" size="1rem" color="#818cf8" />
                  6. ติดต่อเรา
                </h2>
                <p>
                  หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ โปรดติดต่อทีมงานผ่านช่องทาง Discord ของเรา
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <a 
                    href="https://discord.gg/ntGypaUBNG" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.contactLink}
                  >
                    <Icon name="discord" size="0.8rem" color="#818cf8" />
                    Join Discord
                  </a>
                </div>
              </div>

              <div className={`${styles.glassCard} ${styles.legalLastUpdate}`}>
                <p>
                  <Icon name="calendar" size="0.8rem" color="#6b7280" />
                  ปรับปรุงล่าสุด: 18 มิถุนายน 2569
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(107,114,128,0.4)', marginTop: '0.25rem' }}>
                  เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดใด ๆ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                </p>
              </div>

            </section>
          )}

        </div>
      </div>
    </Layout>
  );
}