// Small delay helper shared by the Pancho flows, so the loading state is
// visible for at least a moment instead of flashing.
export function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
