import { useState } from "react";

const BASE = "px-3 py-1 rounded border-2 text-sm font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

// "Remove" button with an inline confirmation, so one click cannot unenroll a student.
export default function RemoveStudent({ name, busy, onConfirm }) {
    const [asking, setAsking] = useState(false);

    if (!asking) {
        return (
            <button type="button" onClick={() => setAsking(true)} className={BASE + " border-red-700 text-red-700 dark:border-red-300 dark:text-red-300 bg-transparent"}>
                Remove
            </button>
        );
    }

    return (
        <div role="group" aria-label={"Confirm removing " + name} className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Remove {name}?</span>
            <button type="button" disabled={busy} onClick={onConfirm} className={BASE + " border-red-700 bg-red-700 text-white"}>
                {busy ? "Removing..." : "Yes, remove"}
            </button>
            <button type="button" disabled={busy} onClick={() => setAsking(false)} className={BASE + " border-current bg-transparent"}>
                Cancel
            </button>
        </div>
    );
}
