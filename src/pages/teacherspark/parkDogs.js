// Which students' dogs appear in the teacher's park (UN-401). The park shows at most
// MAX_PARK_DOGS students at once, each student only once. `x` / `y` are percentages of
// the park area (the centre of each dog).
export const MAX_PARK_DOGS = 5;

// Used for students who have not chosen their Pancho yet.
export const PLACEHOLDER_DOG = "images/SalchichaLenguaAfuera.png";

const PARK_SLOTS = [
    { x: 39, y: 42 },
    { x: 66, y: 52 },
    { x: 19, y: 68 },
    { x: 40, y: 82 },
    { x: 78, y: 78 }
];

// Returns a shuffled copy (Fisher-Yates). The original list is not changed.
export function shuffle(list, random = Math.random) {
    const copy = [...list];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const saved = copy[i];
        copy[i] = copy[j];
        copy[j] = saved;
    }

    return copy;
}

// Picks up to five different students at random and gives each one a place in the park.
export function pickParkDogs(students, random = Math.random) {
    const mixed = shuffle(students, random);
    const dogs = [];

    for (let i = 0; i < mixed.length && i < MAX_PARK_DOGS; i++) {
        dogs.push({ student: mixed[i], x: PARK_SLOTS[i].x, y: PARK_SLOTS[i].y });
    }

    return dogs;
}
