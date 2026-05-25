import { useState } from "react";
import axios from "axios";

export default function R2Uploader({ onUploadComplete, accept = "*", maxSize = 2000 }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`ไฟล์ใหญ่เกินไป: ${fileSizeMB.toFixed(2)}MB (สูงสุด ${maxSize}MB)`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. ขอ presigned URL
      const urlRes = await axios.post("/api/r2/get-upload-url", {
        fileName: file.name,
        contentType: file.type,
      });

      if (!urlRes.data.success) {
        throw new Error(urlRes.data.error);
      }

      const { uploadUrl, publicUrl, fileKey } = urlRes.data;

      // 2. อัปโหลดไฟล์ตรงไป R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          console.log("✅ Upload to R2 successful");
          onUploadComplete({ success: true, url: publicUrl, fileKey, fileName: file.name, sizeMB: fileSizeMB.toFixed(2) });
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
      
      xhr.send(file);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="r2-uploader">
        {uploading ? (
          <div>
            <span>⏳ กำลังอัปโหลด... {progress}%</span>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <span>📦 คลิกเพื่อเลือกไฟล์ (สูงสุด {maxSize}MB)</span>
        )}
        <input 
          type="file" 
          accept={accept} 
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>
      {error && <small style={{ color: "#ef4444" }}>{error}</small>}
    </div>
  );
}