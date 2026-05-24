import { useState } from "react";

export default function CreateVersion({ productId }) {

    const [version, setVersion] = useState("");
    const [title, setTitle] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [logs, setLogs] = useState("");

    async function submit() {

        const res = await fetch(
            `/api/admin/products/${productId}/version`,
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

        const data = await res.json();

        alert(data.success ? "Version Created" : data.message);
    }

    return (

        <div className="max-w-2xl mx-auto p-6 space-y-4">

            <h1 className="text-3xl font-bold">
                Create Version
            </h1>

            <input
                placeholder="1.2.0"
                className="w-full p-3 bg-zinc-900 rounded-xl"
                onChange={(e) => setVersion(e.target.value)}
            />

            <input
                placeholder="Update Title"
                className="w-full p-3 bg-zinc-900 rounded-xl"
                onChange={(e) => setTitle(e.target.value)}
            />

            <input
                placeholder="Download URL"
                className="w-full p-3 bg-zinc-900 rounded-xl"
                onChange={(e) => setDownloadUrl(e.target.value)}
            />

            <textarea
                placeholder="One changelog per line"
                className="w-full h-52 p-3 bg-zinc-900 rounded-xl"
                onChange={(e) => setLogs(e.target.value)}
            />

            <button
                onClick={submit}
                className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-xl"
            >
                Publish Version
            </button>

        </div>
    );
}