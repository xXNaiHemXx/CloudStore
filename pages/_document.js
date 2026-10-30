import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* ใช้แค่ไอคอน fi-rr / fi-brands (components/Icon.jsx) — Font Awesome กับ solid-rounded ไม่ได้ใช้แล้ว */}
          <link rel="preconnect" href="https://cdn-uicons.flaticon.com" crossOrigin="" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          {/* โหลดฟอนต์ตรงนี้แทน @import ใน CSS จะได้เริ่มโหลดพร้อมหน้า ไม่ต้องรอ CSS ก่อน */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Urbanist:wght@400;600;700;800&display=swap" />
          <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css" />
          <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/uicons-brands/css/uicons-brands.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
