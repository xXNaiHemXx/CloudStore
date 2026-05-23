import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import Head from "next/head";

export default function AdminUploads() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await axios.get("/api/uploads");
      setImages(res.data || []);
    } catch (error) {
      alert("ไม่สามารถโหลดรูปภาพได้");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    try {
      const res = await axios.post("/api/upload", formData);
      alert("อัปโหลดสำเร็จ");
      setSelectedFile(null);
      fetchImages();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูป");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="main-container">
      <Head>
        <title>Admin Uploads | xCloud Store</title>
      </Head>

      <header className="header">
        <section className="headersc">
          <a aria-current="page" href="/" className="headersca">
            <img src="/favicon.ico" className="icon" />
            <strong className="uppercase">
              <span className="tuppercase">xCloud</span>
              Store
            </strong>
          </a>
          <div className="header-links">
            <a href="/admin/dashboard" className="headertext">Dashboard</a>
            <a href="/admin/products" className="headertext">Products</a>
            <a href="/admin/uploads" className="headertext">Uploads</a>
            <a href="/admin/users" className="headertext">Users</a>
          </div>
          <div
            className="header-menu-icon"
            onClick={() =>
              document.querySelector(".header-links").classList.toggle("active")
            }
          >
            <i className="fas fa-bars"></i>
          </div>
        </section>
      </header>

      <main className="main-admin">
        <section className="main-one-al-profile">
          <div className="flex items-center gap-6"></div>
        </section>

        <h1 className="text-2xl font-bold mb-4">🖼 อัปโหลดรูป / ไฟล์</h1>

        <div className="mb-4">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary ml-2"
          >
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
          </button>
        </div>

        <div className="gallery-grid">
          {images.map((url) => (
            <div key={url} className="gallery-item">
              <Image
                src={url}
                alt="uploaded"
                width={300}
                height={200}
                loading="eager"
                className="gallery-thumb"
              />
              <input
                type="text"
                value={url}
                readOnly
                className="gallery-url"
                onClick={(e) => e.target.select()}
              />
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 20px;
        }
        .gallery-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .gallery-thumb {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
        }
        .gallery-url {
          font-size: 0.8rem;
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}