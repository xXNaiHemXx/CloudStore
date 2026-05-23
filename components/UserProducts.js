export default function UserProducts({ products }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products?.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg shadow-lg bg-gray-800">
                    <img src={product.image} className="w-full h-40 object-cover rounded" />
                    <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                    <p className="text-gray-400">เวอร์ชัน: {product.version}</p>
                    <p className="text-gray-400">IP Sync: {product.ipSync}</p>
                    <div className="flex gap-2 mt-3">
                        <button className="bg-blue-500 px-4 py-2 rounded">IP Config</button>
                        <button className="bg-green-500 px-4 py-2 rounded">Download</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
