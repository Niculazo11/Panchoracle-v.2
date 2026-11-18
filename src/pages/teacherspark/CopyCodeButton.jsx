import { useState, useEffect } from "react";

// Small button that copies a join code. Shows "¡Copiado!" for two seconds; the cleanup
// cancels the timer if the page closes first. onCopyError receives a message if the
// browser does not allow copying.
export default function CopyCodeButton({ code, onCopyError }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) {
            return undefined;
        }
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [copied]);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
        } catch {
            onCopyError("No se pudo copiar el código. Selecciónalo y cópialo a mano.");
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="min-h-11 px-4 py-2 bg-[#5a57d9] text-white underline cursor-pointer rounded"
        >
            {copied ? "¡Copiado!" : "Copiar código"}
        </button>
    );
}
