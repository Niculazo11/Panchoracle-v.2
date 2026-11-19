import { useSubmission } from "./useSubmission.js";

const TAB = "px-3 py-1 rounded-t border-b-4 font-bold cursor-pointer bg-transparent ";

// Form to hand in an assignment: a link, or a photo / PDF file.
export default function SubmitForm({ assignmentId, onDone }) {
    const { mode, setMode, link, setLink, setFile, error, sending, submit } = useSubmission(assignmentId, onDone);

    return (
        <form onSubmit={submit} noValidate className="mt-3">
            <div role="group" aria-label="What do you want to send?" className="flex gap-2">
                <button type="button" aria-pressed={mode === "link"} onClick={() => setMode("link")} className={TAB + (mode === "link" ? "border-[#5a57d9]" : "border-transparent")}>Link</button>
                <button type="button" aria-pressed={mode === "file"} onClick={() => setMode("file")} className={TAB + (mode === "file" ? "border-[#5a57d9]" : "border-transparent")}>Photo or PDF</button>
            </div>

            {mode === "link" ? (
                <input type="url" aria-label="Link to your homework" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} className="w-full mt-2 rounded px-3 py-2 bg-white text-black border border-black/30" />
            ) : (
                <input type="file" aria-label="Photo or PDF file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} className="w-full mt-2" />
            )}

            {error && <p role="alert" className="m-0 mt-2 text-sm font-bold text-red-700">{error}</p>}

            <button type="submit" disabled={sending} className="mt-3 px-6 py-2 bg-[#5a57d9] text-white font-bold underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? "Sending..." : "Hand in"}
            </button>
        </form>
    );
}
