import StepButton from "./StepButton.jsx";

export default function AssignmentPanel({ dog, assignment, feedback, onStepClick, onSubmit }) {
    const prepSteps = assignment.steps.filter((s) => s.id !== 4);
    const finalStep = assignment.steps.find((s) => s.id === 4);
    const allPrepDone = prepSteps.every((s) => s.completed);
    const submitDisabled = !allPrepDone || dog.status === "DEAD";

    return (
        <div>
            <h2 className="text-lg font-bold mb-1">Assignment Tasks</h2>
            <p id="assignmentTitle" className="text-sm text-gray-600 mb-3">{assignment.title}</p>

            <ul id="stepsList" className="flex flex-col gap-2 mb-3">
                {prepSteps.map((step) => (
                    <StepButton key={step.id} step={step} dog={dog} onClick={onStepClick} />
                ))}
            </ul>

            {finalStep && (
                <button
                    id="submitAssignmentBtn"
                    type="button"
                    disabled={submitDisabled}
                    onClick={onSubmit}
                    className={
                        "w-full rounded-xl bg-[#6B5A8E] text-white font-bold py-3 shadow transition hover:opacity-90 " +
                        (submitDisabled ? "opacity-50 cursor-not-allowed" : "")
                    }
                >
                    {allPrepDone ? `Step 4: ${finalStep.label}` : `Step 4: ${finalStep.label} (complete steps 1-3 first)`}
                </button>
            )}

            <p id="dashboardFeedback" className="min-h-[1.25rem] mt-2 text-sm font-semibold text-center">{feedback}</p>
        </div>
    );
}
