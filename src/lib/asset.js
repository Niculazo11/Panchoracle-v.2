// Public-folder files (public/images/...) live under Vite's `base`
// ("/" in local dev and on Vercel), so paths written in JS are prefixed
// with it. Pass the path without a leading slash.
export function asset(path) {
    return import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
