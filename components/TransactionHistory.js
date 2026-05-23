export default function TransactionHistory({ transactions }) {
    return (
        <div className="p-4 bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">ธุรกรรมล่าสุด</h3>
            <ul>
                {transactions?.map((tx) => (
                    <li key={tx.id} className="border-b py-2">
                        {tx.type === "deposit" ? "💰 เติมเงิน" : "🛒 ซื้อสินค้า"} - {tx.amount} บาท
                    </li>
                ))}
            </ul>
        </div>
    );
}
