export default function Icon({ name, size = "1rem", color = "currentColor", className = "" }) {
  const iconMap = {
    // การเงิน/สินค้า
    "money": "fi-rr-bank",
    "wallet": "fi-rr-wallet",
    "coin": "fi-rr-coins",
    "discount": "fi-rr-tag",
    "cart": "fi-rr-shopping-cart",
    "price": "fi-rr-bill",
    "bank": "fi-rr-building",           // 🏦 ธนาคาร
    "receipt": "fi-rr-receipt",          // 🧾 ใบเสร็จ
    "ticket": "fi-rr-ticket",            // 🎫 ตั๋ว
    
    // ไฟล์/document
    "file": "fi-rr-file",
    "download": "fi-rr-download",
    "upload": "fi-rr-upload",
    "image": "fi-rr-picture",
    "video": "fi-rr-video",
    "zip": "fi-rr-file-zipper",
    
    // ระบบ/ทั่วไป
    "settings": "fi-rr-settings",
    "user": "fi-rr-user",
    "users": "fi-rr-users",
    "dashboard": "fi-rr-chart-pie",
    "order": "fi-rr-box",
    "product": "fi-rr-cube",
    "category": "fi-rr-apps",
    
    // การกระทำ
    "edit": "fi-rr-pencil",
    "delete": "fi-rr-trash",
    "add": "fi-rr-plus",
    "close": "fi-rr-cross",
    "check": "fi-rr-circle-check",
    "warning": "fi-rr-exclamation",
    "info": "fi-rr-info",
    "error": "fi-rr-octagon",
    "success": "fi-rr-circle-check",
    
    // สื่อ/โซเชียล
    "discord": "fi-brands-discord",
    "youtube": "fi-brands-youtube",
    "instagram": "fi-brands-instagram",
    "facebook": "fi-brands-facebook",
    "twitter": "fi-brands-twitter",
    
    // อื่นๆ
    "star": "fi-rr-star",
    "heart": "fi-rr-heart",
    "like": "fi-rr-thumbs-up",
    "search": "fi-rr-search",
    "calendar": "fi-rr-calendar",
    "clock": "fi-rr-clock",
    "location": "fi-rr-marker",
    "email": "fi-rr-envelope",
    "phone": "fi-rr-phone",
    "lock": "fi-rr-lock",
    "unlock": "fi-rr-unlock",
    "eye": "fi-rr-eye",
    "eye-slash": "fi-rr-eye-crossed",
    "arrow-left": "fi-rr-arrow-left",
    "arrow-right": "fi-rr-arrow-right",
    "arrow-up": "fi-rr-arrow-up",
    "arrow-down": "fi-rr-arrow-down",
    "refresh": "fi-rr-refresh",
    "copy": "fi-rr-copy",
    "paste": "fi-rr-paste",
    "save": "fi-rr-save",
    "print": "fi-rr-print",
    "export": "fi-rr-export",
    "import": "fi-rr-import",
    
    // รางวัลและความสำเร็จ
    "winner": "fi-rr-trophy",
    "trophy": "fi-rr-trophy",
    "crown": "fi-rr-crown",
    "rocket": "fi-rr-rocket",
    "gift": "fi-rr-gift",
    
    // การแจ้งเตือนและเวลา
    "history": "fi-rr-time-past",
    "bell": "fi-rr-bell",
    "logout": "fi-rr-exit",
    "login": "fi-rr-enter",
    "menu": "fi-rr-menu-burger",
    "more": "fi-rr-menu-dots",
    "link": "fi-rr-link",
    "role": "fi-rr-badge",
    "version": "fi-rr-code-branch",
    "card": "fi-rr-credit-card",
    "loading": "fi-rr-spinner",
    "pending": "fi-rr-clock",
    "new": "fi-rr-sparkles",
    "sort": "fi-rr-sort",
    "cloud": "fi-rr-cloud",
    
    // เพิ่มเติมสำหรับ History Page
    "receipt": "fi-rr-receipt",          // 🧾 ใบเสร็จรับเงิน
    "calendar-alt": "fi-rr-calendar-alt", // 📅 ปฏิทินแบบอื่น
    "time": "fi-rr-time",                // ⏰ เวลา
    "check-circle": "fi-rr-check-circle", // ✅ วงกลมถูกต้อง
    "times-circle": "fi-rr-times-circle", // ❌ วงกลมผิดพลาด
    "exclamation-circle": "fi-rr-exclamation-circle", // ⚠️ วงกลมเตือน
    
    // สำหรับ TrueWallet
    "truewallet": "fi-rr-wallet",        // 👛 กระเป๋าเงิน
    "angpao": "fi-rr-gift",              // 🎁 อังเปา
    "voucher": "fi-rr-ticket",           // 🎫 บัตรกำนัล
    
    // สถานะ
    "success-circle": "fi-rr-check-circle",
    "error-circle": "fi-rr-times-circle",
    "warning-triangle": "fi-rr-triangle-warning",
    
    // การเงินเพิ่มเติม
    "cash": "fi-rr-money-bill",          // 💵 เงินสด
    "transfer": "fi-rr-exchange",        // 🔄 โอนเงิน
    "qr-code": "fi-rr-qr-scan",          // 📱 QR Code
    
    // อุปกรณ์
    "mobile": "fi-rr-mobile",            // 📱 มือถือ
    "tablet": "fi-rr-tablet",            // 📟 แท็บเล็ต
    "laptop": "fi-rr-laptop",            // 💻 โน้ตบุ๊ค
    "desktop": "fi-rr-desktop",          // 🖥️ คอมพิวเตอร์
    
    // ไฟล์และเอกสาร
    "document": "fi-rr-document",        // 📄 เอกสาร
    "folder": "fi-rr-folder",            // 📁 โฟลเดอร์
    "archive": "fi-rr-archive",          // 🗄️ ที่เก็บเอกสาร
    
    // เครื่องมือ
    "tool": "fi-rr-tool",                // 🔧 เครื่องมือ
    "wrench": "fi-rr-wrench",            // 🔧 ประแจ
    "gear": "fi-rr-gear",                // ⚙️ เฟือง
    
    // การเชื่อมต่อ
    "wifi": "fi-rr-wifi",                // 📶 WiFi
    "bluetooth": "fi-rr-bluetooth",      // 📶 Bluetooth
    "signal": "fi-rr-signal",            // 📶 สัญญาณ
    
    // สภาพอากาศ
    "sun": "fi-rr-sun",                  // ☀️ แดด
    "moon": "fi-rr-moon",                // 🌙 พระจันทร์
    "cloud-sun": "fi-rr-cloud-sun",      // ⛅ เมฆกับแดด
    "cloud-moon": "fi-rr-cloud-moon",    // ☁️🌙 เมฆกับจันทร์
    "rain": "fi-rr-cloud-rain",          // ☔ ฝนตก
    "storm": "fi-rr-cloud-storm",        // ⛈️ พายุ
    
    // สถานะและตัวบ่งชี้
    "status-online": "fi-rr-circle",     // 🟢 ออนไลน์
    "status-offline": "fi-rr-circle",    // 🔴 ออฟไลน์
    "status-away": "fi-rr-circle",       // 🟡 ไม่ว่าง
    
    // การนำทาง
    "home": "fi-rr-home",                // 🏠 หน้าหลัก
    "back": "fi-rr-arrow-left",          // ⬅️ กลับ
    "next": "fi-rr-arrow-right",         // ➡️ ถัดไป
    "up": "fi-rr-arrow-up",              // ⬆️ ขึ้น
    "down": "fi-rr-arrow-down",          // ⬇️ ลง
    
    // โซเชียลมีเดียเพิ่มเติม
    "line": "fi-brands-line",            // LINE
    "tiktok": "fi-brands-tiktok",        // TikTok
    "github": "fi-brands-github",        // GitHub
    "google": "fi-brands-google",        // Google
    "apple": "fi-brands-apple",          // Apple
    
    // การชำระเงิน
    "credit-card": "fi-rr-credit-card",  // 💳 บัตรเครดิต
    "paypal": "fi-brands-paypal",        // PayPal
    "bitcoin": "fi-brands-bitcoin",      // ₿ Bitcoin
    
    // เกมและการเล่น
    "game": "fi-rr-gamepad",             // 🎮 เกม
    "dice": "fi-rr-dice",                // 🎲 ลูกเต๋า
    "card-game": "fi-rr-cards",          // 🃏 ไพ่
    
    // การศึกษา
    "book": "fi-rr-book",                // 📚 หนังสือ
    "graduation": "fi-rr-graduation-cap", // 🎓 หมวกปริญญา
    "school": "fi-rr-school"             // 🏫 โรงเรียน
  };

  const iconClass = iconMap[name] || "fi-rr-question";

  return (
    <i 
      className={`${iconClass} ${className}`} 
      style={{ 
        fontSize: size, 
        color: color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      }} 
    />
  );
}