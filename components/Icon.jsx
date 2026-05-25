export default function Icon({ name, size = "1rem", color = "currentColor" }) {
  const iconMap = {
    // การเงิน/สินค้า
    "money": "fi-rr-bank",
    "wallet": "fi-rr-wallet",
    "coin": "fi-rr-coins",
    "discount": "fi-rr-tag",
    "cart": "fi-rr-shopping-cart",
    "price": "fi-rr-bill",
    
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
    "check": "fi-rr-check",
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
    
    //  เพิ่มที่หายไป
    "winner": "fi-rr-trophy",           // 🏆 ถ้วยรางวัล
    "trophy": "fi-rr-trophy",            // 🏆 ถ้วยรางวัล
    "crown": "fi-rr-crown",              // 👑 มงกุฎ
    "rocket": "fi-rr-rocket",            // 🚀 จรวด
    "gift": "fi-rr-gift",                // 🎁 ของขวัญ
    "calendar": "fi-rr-calendar",        // 📅 ปฏิทิน
    "history": "fi-rr-time-past",          // 📜 ประวัติ
    "bell": "fi-rr-bell",                // 🔔 แจ้งเตือน
    "logout": "fi-rr-exit",              // 🚪 ออกจากระบบ
    "login": "fi-rr-enter",              // 🔐 เข้าสู่ระบบ
    "menu": "fi-rr-menu-burger",         // ☰ เมนู
    "more": "fi-rr-menu-dots",           // ⋯ จุดเพิ่มเติม
    "link": "fi-rr-link",                // 🔗 ลิงก์
    "role": "fi-rr-badge",               // 🎭 บทบาท
    "version": "fi-rr-code-branch",      // 📌 เวอร์ชัน
    "card": "fi-rr-credit-card",         // 💳 บัตรเครดิต
    "loading": "fi-rr-spinner",          // ⏳ กำลังโหลด
    "pending": "fi-rr-clock",            // ⏳ รอดำเนินการ
    "new": "fi-rr-sparkles",             // ✨ ใหม่
    "sort": "fi-rr-sort",                // 🔤 เรียงลำดับ
    "cloud": "fi-rr-cloud",              // ☁️ คลาวด์
  };

  const iconClass = iconMap[name] || "fi-rr-question";

  return (
    <i 
      className={iconClass} 
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