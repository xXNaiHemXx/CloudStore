"use client";

import { useState } from "react";

export default function CreateVersion({ params }) {

    const [version, setVersion] = useState("");

    const [title, setTitle] = useState("");

    const [downloadUrl, setDownloadUrl] = useState("");

    const [logs, setLogs] = useState("");

    async function submit() {

        await fetch(
            `/api/admin/products/${params.id}/version`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    version,

                    title,

                    downloadUrl,

                    changelog: logs.split("\n"),

                    releaseType: "minor"
                })
            }
        );
    }

    return (

        <div className="max-w-2xl mx-auto p-6 space-y-4">

            <input
                placeholder="Version"
                className="w-full p-3 bg-zinc-900"
                onChange={(e) => setVersion(e.target.value)}
            />

            <input
                placeholder="Title"
                className="w-full p-3 bg-zinc-900"
                onChange={(e) => setTitle(e.target.value)}
            />

            <input
                placeholder="Download URL"
                className="w-full p-3 bg-zinc-900"
                onChange={(e) => setDownloadUrl(e.target.value)}
            />

            <textarea
                placeholder="Changelog"
                className="w-full p-3 bg-zinc-900 h-52"
                onChange={(e) => setLogs(e.target.value)}
            />

            <button
                onClick={submit}
                className="bg-blue-500 px-5 py-3 rounded-xl"
            >
                Publish Version
            </button>

        </div>
    );
}