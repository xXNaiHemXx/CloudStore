import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";
export default function AdminProducts() {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [itemsname, setItemsname] = useState("");
  const [itemstitle, setItemstitle] = useState("");
  const [itemsversion, setversion] = useState("");
  const [itemsprice, setItemsprice] = useState("");
  const [itemsdesc, setItemsdesc] = useState("");
  const [itemsimage, setItemsimage] = useState("");
  const [itemsfile, setfile] = useState("");
  const [itemsurlyoutube, seturlyoutube] = useState("");
  const [itemsimages, setItemsimages] = useState([""]);
  const [previewImage, setPreviewImage] = useState("");

  const fetchItems = async () => {
    const res = await axios.get("/api/items");
    setItems(res.data || []);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const clearForm = () => {
    setItemsname("");
    setItemstitle("");
    setversion("");
    setItemsprice("");
    setItemsdesc("");
    setItemsimage("");
    setfile("");
    seturlyoutube("");
    setItemsimages([""]);
    setPreviewImage("");
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setItemsname(item.itemsname);
    setItemstitle(item.itemstitle);
    setversion(item.itemsversion);
    setItemsprice(item.itemsprice);
    setItemsdesc(item.itemsdesc);
    setItemsimage(item.itemsimage);
    setfile(item.itemsfile);
    seturlyoutube(item.itemsurlyoutube);
    setItemsimages(item.itemsimages || [""]);
    setPreviewImage(item.itemsimage);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ยืนยันการลบสินค้า?")) return;
    await axios.delete(`/api/items?id=${id}`);
    fetchItems();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      itemsname,
      itemstitle,
      itemsversion,
      itemsprice: parseFloat(itemsprice),
      itemsdesc,
      itemsimage,
      itemsfile,
      itemsimages,
      itemsurlyoutube
    };

    if (editingItem) {
      await axios.put("/api/items", { id: editingItem._id, ...payload });
    } else {
      await axios.post("/api/items", payload);
    }

    clearForm();
    setShowModal(false);
    fetchItems();
  };

  return (
    <div className="main-container">
     <header className="header">
                <section className="headersc">
                    <a aria-current="page" href="/" class="headersca">
                        <img src="/favicon.ico" class="icon"/>
                        <strong class="uppercase">
                            <span class="tuppercase">xCloud</span>
                            Studio
                        </strong>
                    </a>      
                    <div className="header-links">
                            <a href="/admin/dashboard" className="headertext">Dashboard</a>
                            <a href="/admin/products" className="headertext">Products</a>
                            <a href="/admin/uploads" className="headertext">Uploads</a>
                            <a href="/admin/users" className="headertext">Users</a>
                    </div>  
                       
                    <div className="header-menu-icon" onClick={() => document.querySelector('.header-links').classList.toggle('active')}>
                        <i className="fas fa-bars"></i>    
                    </div>                   
                </section>      
            </header>

      <main className="main-admin">
         <section className="main-one-al-profile">
            <div className="flex items-center gap-6">
                    
            </div>             
        </section>
        <h1 className="text-2xl font-bold mb-4">🧱 จัดการสินค้า (MOD)</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary mb-4">+ เพิ่มสินค้า</button>

        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th>ชื่อสินค้า</th>
              <th>หัวข้อ</th>
              <th>เวอร์ชัน</th>
              <th>ราคา</th>
              <th>รูป</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t">
                <td>{item.itemsname}</td>
                <td>{item.itemstitle}</td>
                <td>{item.itemsversion}</td>
                <td>{item.itemsprice} ฿</td>
                <td><img src={item.itemsimage} width={50} /></td>
                <td>
                  <button onClick={() => handleEdit(item)} className="btn-sm btn-yellow">แก้ไข</button>
                  <button onClick={() => handleDelete(item._id)} className="btn-sm btn-red ml-2">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{editingItem ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-row">
                <label className="modal-row-label">ชื่อสินค้า *</label>
                <input value={itemsname} onChange={(e) => setItemsname(e.target.value)} className="modal-input" required />
              </div>
              <div className="modal-row">
                <label className="modal-row-label">หัวข้อสินค้า *</label>
                <input value={itemstitle} onChange={(e) => setItemstitle(e.target.value)} className="modal-input" required />
              </div>
              <div className="modal-row">
                <label className="modal-row-label">เวอร์ชัน *</label>
                <input value={itemsversion} onChange={(e) => setversion(e.target.value)} className="modal-input" required />
              </div>
              <div className="modal-row">
                <label className="modal-row-label">ลิ้งค์รูปภาพหลัก *</label>
                <input value={itemsimage} onChange={(e) => {
                  setItemsimage(e.target.value);
                  setPreviewImage(e.target.value);
                }} className="modal-input" required />
              </div>
              {previewImage && <img src={previewImage} className="preview-image" />}
              <div className="modal-row">
                <label className="modal-row-label">ลิ้งค์รูปเพิ่มเติม</label>
                <div className="modal-images">
                  {itemsimages.map((img, i) => (
                    <div key={i} className="image-input-container">
                      <input
                        value={img}
                        onChange={(e) => {
                          const updated = [...itemsimages];
                          updated[i] = e.target.value.trim();
                          const filtered = updated.filter(u => u !== "");
                          setItemsimages(filtered.includes("") ? filtered : [...filtered, ""]);
                        }}
                        className="modal-input"
                        placeholder={`รูปที่ ${i + 1}`}
                      />
                      {img && <img src={img} className="preview-image" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-row">
                <label className="modal-row-label">รายละเอียด *</label>
                <textarea value={itemsdesc} onChange={(e) => setItemsdesc(e.target.value)} className="modal-input" required />
              </div>
              <div className="modal-row">
                <label className="modal-row-label">YouTube Video ID</label>
                <input value={itemsurlyoutube} onChange={(e) => seturlyoutube(e.target.value.trim())} className="modal-input" />
              </div>
              <div className="modal-row">
                <label className="modal-row-label">ลิ้งค์ไฟล์ *</label>
                <input value={itemsfile} onChange={(e) => setfile(e.target.value)} className="modal-input" required />
              </div>
              <div className="modal-row">
                <label className="modal-row-label">ราคาสินค้า *</label>
                <input value={itemsprice} type="number" onChange={(e) => setItemsprice(e.target.value)} className="modal-input" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => { setShowModal(false); clearForm(); }}>Close</button>
                <button type="submit" className="modal-submit">{editingItem ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
