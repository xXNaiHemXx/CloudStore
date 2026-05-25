import { useState } from "react";
import axios from "axios";

export default function R2Uploader({ onUploadComplete, accept = "*", maxSize = 5000, children }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`ไฟล์ใหญ่เกินไป: ${fileSizeMB.toFixed(2)}MB (สูงสุด ${maxSize}MB)`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. ขอ Presigned URL จาก API ของเรา
      const urlRes = await axios.post("/api/r2/get-upload-url", {
        fileName: file.name,
        contentType: file.type,
      });

      if (!urlRes.data.success) {
        throw new Error(urlRes.data.error);
      }

      const { uploadUrl, publicUrl } = urlRes.data;

      // 2. อัปโหลดตรงไป R2 ผ่าน XMLHttpRequest (ไม่ผ่าน Vercel API)
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", uploadUrl, true);

      xhr.timeout = 1000 * 60 * 60 * 3; // 3 ชั่วโมง

      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream"
      );

      xhr.setRequestHeader(
        "Cache-Control",
        "no-cache"
      );
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
          console.log(`📤 Upload to R2: ${percent}% (${(event.loaded / 1024 / 1024).toFixed(2)}MB / ${(event.total / 1024 / 1024).toFixed(2)}MB)`);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 204) {
          console.log("✅ Upload to R2 successful");
          onUploadComplete(publicUrl);
          setUploading(false);
        } else {
          setError(`Upload failed: ${xhr.status}`);
          setUploading(false);
        }
      };
      
      xhr.onerror = () => {
        setError("Network error during upload");
        setUploading(false);
      };
      xhr.ontimeout = () => {
        setError("Upload timeout");
        setUploading(false);
      };
      xhr.send(file);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <label style={{ 
        display: "block",
        padding: "12px",
        background: "rgba(99, 102, 241, 0.1)",
        border: "1px dashed rgba(99, 102, 241, 0.3)",
        borderRadius: "8px",
        textAlign: "center",
        cursor: uploading ? "not-allowed" : "pointer",
        opacity: uploading ? 0.6 : 1,
      }}>
        {uploading ? (
          <div>
            <span>⏳ กำลังอัปโหลดไป R2... {progress}%</span>
            <div style={{ marginTop: "8px", height: "4px", background: "#374151", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#3b82f6", transition: "width 0.3s" }} />
            </div>
          </div>
        ) : (
          children || <span>📦 คลิกเพื่อเลือกไฟล์ (สูงสุด {maxSize}MB) - อัปโหลดตรงไป Cloudflare R2</span>
        )}
        <input 
          type="file" 
          accept={accept} 
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>
      {error && <small style={{ color: "#ef4444", marginTop: "4px", display: "block" }}>❌ {error}</small>}
    </div>
  );
}