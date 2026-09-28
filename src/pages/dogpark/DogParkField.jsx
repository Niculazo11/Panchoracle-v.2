// Label + input used by the Dog Park login form.
export default function DogParkField({ id, label, type = "text", autoComplete, value, onChange }) {
    return (
        <div>
            <label htmlFor={id} className="block text-white text-lg mb-2">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                autoComplete={autoComplete}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded px-4 py-3 bg-[#d9d9d9] text-black"
            />
        </div>
    );
}
