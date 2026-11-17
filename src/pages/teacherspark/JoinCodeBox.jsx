import { useState, useEffect } from "react";

const BUTTON_CLASS = "mt-4 px-10 py-3 bg-[#5a57d9] text-white underline uppercase tracking-wide cursor-pointer";

// Shows the classroom join code with a button that copies it (UN-401 RF-6).
// onCopyError receives a message when the browser does not allow copying.
export default function JoinCodeBox({ code, onCopyError }) {
    const [copied, setCopied] = useState(false);

    // Shows "Copied!" for two seconds. The cleanup cancels the timer if the page closes first.
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
            onCopyError("Could not copy the code. Select it and copy it by hand.");
        }
    }

    return (
        <section className="mt-10 text-center">
            <h3 className="text-white text-xl mb-2">Join code</h3>
            <p className="text-white mb-3">Students type this code to join your classroom.</p>

            <p className="inline-block px-6 py-3 rounded bg-[#dddddd] text-black font-mono text-3xl tracking-widest select-all">
                {code}
            </p>

            <div>
                <button type="button" onClick={handleCopy} className={BUTTON_CLASS}>
                    {copied ? "Copied!" : "Copy code"}
                </button>
            </div>
        </section>
    );
}
