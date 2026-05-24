import { useEffect, useState } from "react";

export default function ProductVersions({ productId }) {

    const [versions, setVersions] = useState([]);

    useEffect(() => {

        fetch(`/api/products/${productId}/versions`)
            .then(res => res.json())
            .then(data => {
                setVersions(data.versions || []);
            });

    }, [productId]);

    return (

        <div className="space-y-4 mt-8">

            <h2 className="text-2xl font-bold">
                Version History
            </h2>

            {versions.map((v) => (

                <div
                    key={v._id}
                    className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl"
                >

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-xl font-bold">
                                v{v.version}
                            </h2>

                            <p className="text-zinc-400">
                                {v.title}
                            </p>
                        </div>

                        <div className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                            {v.releaseType}
                        </div>

                    </div>

                    <div className="mt-5 space-y-2">

                        {v.changelog?.map((log, index) => (

                            <div
                                key={index}
                                className="text-zinc-300"
                            >
                                • {log}
                            </div>

                        ))}

                    </div>

                    <div className="mt-5">

                        <a
                            href={v.downloadUrl}
                            target="_blank"
                            className="bg-blue-500 hover:bg-blue-600 transition px-4 py-2 rounded-xl inline-block"
                        >
                            Download
                        </a>

                    </div>

                </div>

            ))}

        </div>
    );
}