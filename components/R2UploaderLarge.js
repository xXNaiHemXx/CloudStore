// components/R2UploaderLarge.js
import { useState, useRef, useCallback } from "react";

// ✅ ลด chunk size เหลือ 10MB เพื่อลด timeout
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk (เดิม 50MB)
const MAX_CONCURRENT_UPLOADS = 3; // อัปโหลดพร้อมกันได้สูงสุด 3 ชิ้น

export default function R2UploaderLarge({ onUploadComplete, accept = "*", maxSize = 5000, children }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);

  const uploadChunk = async (key, uploadId, partNumber, chunk, retryCount = 0) => {
    try {
      // Get Presigned URL for this part
      const partUrlRes = await fetch("/api/r2/create-multipart-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-part-url",
          uploadId,
          key,
          partNumber,
        }),
      });
      
      const partUrlData = await partUrlRes.json();
      if (!partUrlData.success) throw new Error(partUrlData.error);
      
      // Upload chunk directly to R2 with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
      
      const uploadRes = await fetch(partUrlData.partUrl, {
        method: "PUT",
        body: chunk,
        headers: {
          "Content-Type": "application/octet-stream",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!uploadRes.ok) {
        throw new Error(`HTTP ${uploadRes.status}`);
      }
      
      const etag = uploadRes.headers.get("ETag") || "";
      return {
        PartNumber: partNumber,
        ETag: etag.replace(/"/g, ""),
      };
      
    } catch (err) {
      if (retryCount < 3) {
        console.log(`Retrying part ${partNumber}, attempt ${retryCount + 1}`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1))); // Exponential backoff
        return uploadChunk(key, uploadId, partNumber, chunk, retryCount + 1);
      }
      throw err;
    }
  };

  const uploadFileMultipart = async (file) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadId = null;
    let key = null;
    const uploadedParts = [];

    try {
      // Step 1: Create Multipart Upload
      setStatus("creating");
      setProgress(0);
      
      const createRes = await fetch("/api/r2/create-multipart-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          action: "create",
        }),
      });
      
      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.error);
      
      uploadId = createData.uploadId;
      key = createData.key;
      
      // Step 2: Upload chunks concurrently
      setStatus("uploading");
      
      const chunks = [];
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        chunks.push(file.slice(start, end));
      }
      
      // Upload chunks in batches
      for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchPromises = batch.map((chunk, idx) => {
          const partNumber = i + idx + 1;
          return uploadChunk(key, uploadId, partNumber, chunk);
        });
        
        const results = await Promise.all(batchPromises);
        uploadedParts.push(...results);
        
        const percent = Math.round(((i + batch.length) / totalChunks) * 100);
        setProgress(percent);
        console.log(`📤 Uploaded parts ${i + 1}-${i + batch.length}/${totalChunks} (${percent}%)`);
      }
      
      // Step 3: Complete Multipart Upload
      setStatus("completing");
      
      // Sort parts by PartNumber
      uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
      
      const completeRes = await fetch("/api/r2/create-multipart-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          uploadId,
          key,
          parts: uploadedParts,
        }),
      });
      
      const completeData = await completeRes.json();
      if (!completeData.success) throw new Error(completeData.error);
      
      setProgress(100);
      onUploadComplete(completeData.publicUrl);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
      
      // Abort upload if failed
      if (uploadId && key) {
        try {
          await fetch("/api/r2/create-multipart-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "abort",
              uploadId,
              key,
            }),
          });
        } catch (abortErr) {
          console.error("Failed to abort upload:", abortErr);
        }
      }
    } finally {
      setUploading(false);
      setStatus("");
    }
  };

  const uploadWithPresignedUrl = async (file) => {
    try {
      const urlRes = await fetch("/api/r2/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });
      
      const urlData = await urlRes.json();
      if (!urlData.success) throw new Error(urlData.error);

      const { uploadUrl, publicUrl } = urlData;

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.timeout = 1000 * 60 * 60 * 3; // 3 hours

      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      };
      
      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve(publicUrl);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Upload timeout"));
        xhr.send(file);
      });
      
      onUploadComplete(publicUrl);
      
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`ไฟล์ใหญ่เกินไป: ${fileSizeMB.toFixed(2)}MB (สูงสุด ${maxSize}MB)`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      if (file.size > 100 * 1024 * 1024) {
        // ไฟล์ > 100MB ใช้ Multipart Upload
        await uploadFileMultipart(file);
      } else {
        // ไฟล์เล็กใช้ Presigned URL
        await uploadWithPresignedUrl(file);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "creating": return "กำลังเตรียมอัปโหลด...";
      case "uploading": return `กำลังอัปโหลด (${progress}%)`;
      case "completing": return "กำลังรวมไฟล์...";
      default: return `กำลังอัปโหลด... ${progress}%`;
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
            <span>⏳ {getStatusText()}</span>
            <div style={{ marginTop: "8px", height: "4px", background: "#374151", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#3b82f6", transition: "width 0.3s" }} />
            </div>
          </div>
        ) : (
          children || <span>📦 คลิกเพื่อเลือกไฟล์ (สูงสุด {maxSize}MB) - รองรับไฟล์ 4GB+</span>
        )}
        <input 
          ref={fileInputRef}
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