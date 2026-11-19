import { useState, useEffect, useRef } from "react";
import { nextWanderTarget } from "./wander.js";

const FIRST_WAIT = [300, 2500]; // milliseconds before the first walk, so dogs do not start together
const REST = [800, 3000]; // milliseconds a dog rests between walks

function between(range) {
    return range[0] + Math.random() * (range[1] - range[0]);
}

// Makes a park dog walk around by itself. Returns { x, y, seconds }: the spot the dog is
// walking to and how long the walk takes (0 before the first walk). Dogs stay where they
// are if the visitor asked their system for less motion, or when `enabled` is false
// (a dead Pancho does not walk).
export function useWanderingDog(start, enabled = true) {
    const [spot, setSpot] = useState({ x: start.x, y: start.y, seconds: 0 });
    const place = useRef({ x: start.x, y: start.y });

    useEffect(() => {
        const lessMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!enabled || lessMotion) {
            return undefined;
        }

        let timer;

        function walk() {
            const next = nextWanderTarget(place.current);

            place.current = { x: next.x, y: next.y };
            setSpot(next);
            timer = setTimeout(walk, next.seconds * 1000 + between(REST));
        }

        timer = setTimeout(walk, between(FIRST_WAIT));

        // Cleanup: stop walking when the dog leaves the park.
        return () => clearTimeout(timer);
    }, [enabled]);

    return spot;
}
