import { asset } from "../../lib/asset.js";

// A single dog placed over the park by percentage coordinates.
export default function ParkDog({ dog }) {
    return (
        <img
            src={asset(dog.img)}
            alt="Dog walking in the park"
            className="absolute w-16 sm:w-24 -translate-x-1/2 -translate-y-1/2 object-contain"
            style={{ left: `${dog.x}%`, top: `${dog.y}%` }}
        />
    );
}