import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DepositForm({ userId }) {
    const [amount, setAmount] = useState("");
    const [refNo, setRefNo] = useState("");
    const [slipFile, setSlipFile] = useState(null);

    const handleUpload = async () => {
        if (!amount || !refNo || !slipFile) {
            alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        const formData = new FormData();
        formData.append("file", slipFile);
        formData.append("upload_preset", "your-cloudinary-preset");

        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/your-cloudinary-name/image/upload", {
            method: "POST",
            body: formData,
        });

        const uploadData = await uploadRes.json();
        const slipUrl = uploadData.secure_url;

        const response = await fetch("/api/check-slip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, amount, refNo, slipUrl }),
        });

        const data = await response.json();
        if (response.ok) {
            alert("เติมเงินสำเร็จ!");
        } else {
            alert("เกิดข้อผิดพลาด: " + data.message);
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">เติมเงินเข้าระบบ</h2>
            <input
                type="number"
                placeholder="จำนวนเงิน (บาท)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />
            <input
                type="text"
                placeholder="เลขอ้างอิง (Ref No.)"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />
            <input
                type="file"
                onChange={(e) => setSlipFile(e.target.files[0])}
                className="w-full p-2 border rounded mb-2"
            />
            <Button onClick={handleUpload} className="w-full">ส่งหลักฐานเติมเงิน</Button>
        </div>
    );
}
