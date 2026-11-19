export default function JoinClassroomForm({ joinCode, setJoinCode, joining, handleJoinClassroom }) {
    return (
        <section className="w-full max-w-md bg-white/90 dark:bg-[#2a2a2a] rounded-2xl shadow-xl p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-center text-[#6B5A8E] dark:text-[#c9b8f5] mb-6">
                Join a Classroom
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                Enter the join code your teacher gave you to get your Pancho.
            </p>
            <form onSubmit={handleJoinClassroom} className="flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABC-123"
                        className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase border-2 border-[#6B5A8E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5A8E] dark:bg-[#1a1a1a] dark:text-white"
                        maxLength={16}
                        disabled={joining}
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    disabled={joining}
                    className="w-full py-3 bg-[#6B5A8E] text-white font-semibold rounded-lg hover:bg-[#5a4a7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {joining ? "Joining..." : "Join Classroom"}
                </button>
            </form>
        </section>
    );
}
