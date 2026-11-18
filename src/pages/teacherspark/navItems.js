// Top-bar options of the Teachers Park. Each icon is a file you still have
// to drop into public/images/ (the names below are suggestions).
//
// Each tab points to a real route under /teachersPark (UN-401). The pages are
// "coming soon" placeholders until their own tickets replace them.
import { HOMEWORK_PATH, SEARCH_PATH, MINIGAMES_PATH } from "./teacherPaths.js";

export const NAV_ITEMS = [
    {
        id: "homework",
        label: ["Manage", "Homework"],
        // TODO(IMAGE): "Manage Homework" icon (yellow dog-food bag).
        icon: "images/teacher-homework-bag.png",
        to: HOMEWORK_PATH
    },
    {
        id: "search",
        label: ["Search for", "a Dog"],
        // TODO(IMAGE): "Search for a Dog" icon (magnifying glass).
        icon: "images/teacher-search-lens.png",
        to: SEARCH_PATH
    },
    {
        id: "minigames",
        label: ["Manage", "Minigames"],
        // TODO(IMAGE): "Manage Minigames" icon (tennis ball).
        icon: "images/teacher-tennis-ball.png",
        to: MINIGAMES_PATH
    }
];