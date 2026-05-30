export default function Icon({ name, size = "1rem", color = "currentColor", className = "" }) {
  const iconMap = {
    // การเงิน/สินค้า
    "money": "fi-rr-bank",
    "wallet": "fi-rr-wallet",
    "coin": "fi-rr-coins",
    "discount": "fi-rr-tag",
    "cart": "fi-rr-shopping-cart",
    "price": "fi-rr-bill",
    "gift": "fi-rr-gift",
    "ticket": "fi-rr-ticket",
    
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
    "role": "fi-rr-badge",
    "version": "fi-rr-code-branch",
    
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
    "copy": "fi-rr-copy",
    "paste": "fi-rr-paste",
    "save": "fi-rr-save",
    "print": "fi-rr-print",
    "export": "fi-rr-export",
    "import": "fi-rr-import",
    "refresh": "fi-rr-refresh",
    "search": "fi-rr-search",
    
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
    
    // รางวัลและสถานะ
    "winner": "fi-rr-trophy",
    "trophy": "fi-rr-trophy",
    "crown": "fi-rr-crown",
    "rocket": "fi-rr-rocket",
    "history": "fi-rr-time-past",
    "bell": "fi-rr-bell",
    "logout": "fi-rr-exit",
    "login": "fi-rr-enter",
    "menu": "fi-rr-menu-burger",
    "more": "fi-rr-menu-dots",
    "link": "fi-rr-link",
    "card": "fi-rr-credit-card",
    "loading": "fi-rr-spinner",
    "pending": "fi-rr-clock",
    "new": "fi-rr-sparkles",
    "sort": "fi-rr-sort",
    "cloud": "fi-rr-cloud",
    "lightbulb": "fi-rr-lightbulb",
    "bulb": "fi-rr-lightbulb",
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
        justifyContent: "center",
        lineHeight: 1
      }} 
    />
  );
}