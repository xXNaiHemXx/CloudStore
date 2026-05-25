import { useState } from "react";
import axios from "axios";

export default function R2Uploader({ onUploadComplete, accept = "*", maxSize = 2000, children }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`ไฟล์ใหญ่เกินไป: ${fileSizeMB.toFixed(2)}MB (สูงสุด ${maxSize}MB)`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. ขอ Presigned URL
      const urlRes = await axios.post("/api/r2/get-upload-url", {
        fileName: file.name,
        contentType: file.type,
      });

      if (!urlRes.data.success) {
        throw new Error(urlRes.data.error);
      }

      const { uploadUrl, publicUrl } = urlRes.data;

      // 2. อัปโหลดตรงไป R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded * 100) / event.total));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          onUploadComplete(publicUrl);
          setUploading(false);
        } else {
          alert(`Upload failed: ${xhr.status}`);
          setUploading(false);
        }
      };
      
      xhr.onerror = () => {
        alert("Network error during upload");
        setUploading(false);
      };
      
      xhr.send(file);

    } catch (err) {
      console.error(err);
      alert(err.message);
      setUploading(false);
    }
  };

  return (
    <label className="r2-uploader" style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
      {uploading ? (
        <div>
          <span>⏳ กำลังอัปโหลด... {progress}%</span>
          <div className="upload-progress-bar" style={{ marginTop: "5px", height: "4px", background: "#333", borderRadius: "2px" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#4f46e5", borderRadius: "2px" }} />
          </div>
        </div>
      ) : (
        children || <span>📦 คลิกเพื่อเลือกไฟล์ (สูงสุด {maxSize}MB)</span>
      )}
      <input type="file" accept={accept} onChange={handleFileSelect} disabled={uploading} style={{ display: "none" }} />
    </label>
  );
}