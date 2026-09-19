export default function StepButton({ step, dog, onClick }) {
    return (
        <li>
            <button
                type="button"
                data-step-id={step.id}
                disabled={step.completed || dog.status === "DEAD"}
                onClick={() => onClick(step.id)}
                className={
                    "w-full flex items-center justify-between gap-3 rounded-xl border border-black/10 " +
                    "px-4 py-3 text-left font-semibold shadow transition disabled:cursor-not-allowed " +
                    (step.completed ? "bg-emerald-100 text-emerald-800" : "bg-white/80 hover:bg-white") +
                    (dog.status === "DEAD" ? " opacity-50" : "")
                }
            >
                <span>Step {step.id}: {step.label}</span>
                <span className="text-lg">{step.completed ? "✅" : "◻️"}</span>
            </button>
        </li>
    );
}
