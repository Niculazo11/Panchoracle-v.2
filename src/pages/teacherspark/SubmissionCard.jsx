// One handed-in work: who sent it, when, and the file or link. Photos show a preview.
const IMAGE = /\.(jpe?g|png|webp)$/i;

// Only web links and our own file route are opened, whatever the server sent.
function safeHref(url) {
    return /^https?:\/\//.test(url) || url.startsWith("/api/") ? url : undefined;
}

export default function SubmissionCard({ submission }) {
    const href = safeHref(submission.fileUrl);
    const isPhoto = submission.kind === "file" && IMAGE.test(submission.fileName);
    const sentAt = new Date(submission.submittedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

    return (
        <li className="flex flex-col gap-2 p-4 rounded-lg bg-white/90 text-black dark:bg-[#2a2a2a] dark:text-white">
            <h3 className="m-0 text-lg font-bold break-words">{submission.student.name}</h3>
            <p className="m-0 text-xs opacity-70">Sent {sentAt}</p>

            {isPhoto && href && (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    <img src={href} alt={"Photo handed in by " + submission.student.name} className="max-h-48 rounded border border-black/20 object-contain" />
                </a>
            )}

            <a href={href} target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#5a57d9] dark:text-[#c4b5fd] break-all">
                {submission.kind === "link" ? submission.fileUrl : submission.fileName}
            </a>
        </li>
    );
}
