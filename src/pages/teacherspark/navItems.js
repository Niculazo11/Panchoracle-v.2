// Top-bar options of the Teachers Park. Each icon is a file you still have
// to drop into public/images/ (the names below are suggestions).
//
// `to` is "#" on purpose: those tabs are not built yet. When each page
// exists, replace "#" with its real route (and register it in App.jsx).
export const NAV_ITEMS = [
    {
        id: "homework",
        label: ["Manage", "Homework"],
        // TODO(IMAGE): "Manage Homework" icon (yellow dog-food bag).
        icon: "images/teacher-homework-bag.png",
        // TODO(ROUTE): replace "#" with the Manage Homework page, e.g. "/teachers/homework".
        to: "#"
    },
    {
        id: "search",
        label: ["Search for", "a Dog"],
        // TODO(IMAGE): "Search for a Dog" icon (magnifying glass).
        icon: "images/teacher-search-lens.png",
        // TODO(ROUTE): replace "#" with the Search for a Dog page, e.g. "/teachers/search".
        to: "#"
    },
    {
        id: "minigames",
        label: ["Manage", "Minigames"],
        // TODO(IMAGE): "Manage Minigames" icon (tennis ball).
        icon: "images/teacher-tennis-ball.png",
        // TODO(ROUTE): replace "#" with the Manage Minigames page, e.g. "/teachers/minigames".
        to: "#"
    }
];