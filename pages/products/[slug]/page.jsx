import ProductVersions from "@/components/ProductVersions";

export default async function ProductPage({ params }) {

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/${params.slug}`
    );

    const data = await res.json();

    const product = data.product;

    return (
        <div className="max-w-5xl mx-auto p-6">

            <img
                src={product.image}
                className="rounded-2xl"
            />

            <h1 className="text-4xl font-bold mt-5">
                {product.name}
            </h1>

            <div className="mt-2 text-zinc-400">
                Current Version:
                {" "}
                v{product.currentVersion}
            </div>

            <ProductVersions productId={product._id} />

        </div>
    );
}