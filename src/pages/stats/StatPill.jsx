// One "label + rounded pill" block, repeated for every stat.
export default function StatPill({ title, children }) {
    return (
        <section className="mb-6">
            <h2 className="mb-2 text-xl font-bold">
                {title}
            </h2>

            <div className="flex h-7 items-center justify-center rounded-full border border-black bg-[#b9d9f0] text-xs font-bold">
                {children}
            </div>
        </section>
    );
}
