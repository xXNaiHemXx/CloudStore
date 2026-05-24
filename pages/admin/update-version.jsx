import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function UpdateVersion() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get("/api/items");
    setProducts(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !newVersion || !newFileUrl) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/admin/update-version", {
        productId: selectedProduct,
        newVersion,
        newFileUrl,
        changelog
      });

      if (res.data.success) {
        alert(`✅ อัปเดตเวอร์ชันสำเร็จ! แจ้งเตือนผู้ใช้ ${res.data.notifiedUsers} คน`);
        setNewVersion("");
        setNewFileUrl("");
        setChangelog("");
      }
    } catch (error) {
      console.error(error);
      alert("อัปเดตไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <h1>📦 อัปเดตเวอร์ชันสินค้า</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>เลือกสินค้า</label>
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="">-- เลือกสินค้า --</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.itemsname} (เวอร์ชัน {p.itemsversion})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>เวอร์ชันใหม่</label>
            <input
              type="text"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="เช่น 2.0.0"
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>ลิงก์ไฟล์ใหม่</label>
            <input
              type="url"
              value={newFileUrl}
              onChange={(e) => setNewFileUrl(e.target.value)}
              placeholder="https://..."
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>รายการอัปเดต (Changelog)</label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows="4"
              placeholder="- แก้ไขบัค XYZ\n- เพิ่มฟีเจอร์ใหม่"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            {loading ? "กำลังอัปเดต..." : "📤 อัปเดตเวอร์ชัน"}
          </button>
        </form>
      </div>
    </Layout>
  );
}