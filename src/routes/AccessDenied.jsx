import { Link } from "react-router-dom";

// Shown when a logged-in user opens a page their role cannot use (for example a student on
// /teachersPark). Anonymous users are still sent to /login by withRole.
export default function AccessDenied({ message }) {
  return (
    <main className="min-h-screen bg-[rgb(149,248,165)] dark:bg-[#18351f] flex flex-col justify-center items-center px-5 py-16">
      <section className="bg-[rgb(44,182,78)] dark:bg-[#17652e] text-center w-full max-w-lg py-10 px-5 sm:px-10 box-border rounded-2xl shadow-xl">
        <h1 className="font-display text-2xl sm:text-3xl text-white mb-2">Access restricted</h1>
        <p role="alert" className="text-white/90 text-sm">{message}</p>
      </section>

      <Link to="/" className="mt-6 underline text-black dark:text-white">
        Back to Home
      </Link>
    </main>
  );
}
