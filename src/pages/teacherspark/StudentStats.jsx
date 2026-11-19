import StatusBars from "../raise/StatusBars.jsx";

// Hunger and health of one student, or the reason there is nothing to show.
// The server may send decimals (hunger is calculated), so the bars get whole numbers.
export default function StudentStats({ pet }) {
    if (!pet) {
        return <p className="m-0 text-sm italic">Has not chosen a Pancho yet.</p>;
    }

    const dog = { hunger: Math.round(pet.hunger), health: Math.round(pet.health) };

    return (
        <div className="flex flex-col gap-3">
            <StatusBars dog={dog} />
        </div>
    );
}
