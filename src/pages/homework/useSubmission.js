import { useState } from "react";
import { submitHomework } from "../../lib/submissionApi.js";
import { prepareFile } from "../../lib/prepareFile.js";

function isWebLink(text) {
    try {
        return ["http:", "https:"].includes(new URL(text).protocol);
    } catch {
        return false;
    }
}

// State and send logic of the submit form of one assignment.
// mode is "link" or "file"; onDone receives the saved submission.
export function useSubmission(assignmentId, onDone) {
    const [mode, setMode] = useState("link");
    const [link, setLink] = useState("");
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setError("");

        if (mode === "link" && !isWebLink(link.trim())) {
            setError("Type a link that starts with http:// or https://");
            return;
        }
        if (mode === "file" && !file) {
            setError("Choose a photo or a PDF file.");
            return;
        }

        setSending(true);

        try {
            const payload = mode === "link"
                ? { kind: "link", url: link.trim() }
                : { kind: "file", ...(await prepareFile(file)) };
            onDone(await submitHomework(assignmentId, payload));
        } catch (err) {
            setError(err.name === "ApiError" || err.message ? err.message : "Could not reach the server.");
            setSending(false);
        }
    }

    return { mode, setMode, link, setLink, file, setFile, error, sending, submit };
}
