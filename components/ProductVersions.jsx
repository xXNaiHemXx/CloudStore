"use client";

import { useEffect, useState } from "react";

export default function ProductVersions({ productId }) {

    const [versions, setVersions] = useState([]);

    useEffect(() => {

        fetch(`/api/products/${productId}/versions`)
            .then(res => res.json())
            .then(data => {
                setVersions(data.versions);
            });

    }, []);

    return (
        <div className="space-y-4">

            {versions.map((v) => (

                <div
                    key={v._id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl"
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

                        <span className="text-sm bg-blue-500 px-3 py-1 rounded-full">
                            {v.releaseType}
                        </span>

                    </div>

                    <div className="mt-4 space-y-2">

                        {v.changelog.map((log, index) => (

                            <div
                                key={index}
                                className="text-zinc-300"
                            >
                                • {log}
                            </div>

                        ))}

                    </div>

                    <div className="mt-4 flex gap-3">

                        <a
                            href={v.downloadUrl}
                            target="_blank"
                            className="bg-blue-500 px-4 py-2 rounded-lg"
                        >
                            Download
                        </a>

                    </div>

                </div>

            ))}

        </div>
    );
}