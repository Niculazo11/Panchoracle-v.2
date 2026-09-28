// Public-folder files (public/images/...) live under Vite's `base`
// (/Panchoracle-v.2/ on GitHub Pages, / in local dev), so paths written
// in JS must be prefixed with it. Pass the path without a leading slash.
export function asset(path) {
    return import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
