import { Link } from "react-router-dom";
import { asset } from "../../lib/asset.js";
import { PenIcon, LongArrowIcon } from "./HomeworkIcons.jsx";
import { submissionsPath } from "./teacherPaths.js";

// TODO(IMAGE): yellow dog-food bag, the same file the top bar uses for Manage Homework.
const BAG = "images/teacher-homework-bag.png";

function formatDue(dueAt) {
    return new Date(dueAt).toLocaleDateString(undefined, { dateStyle: "medium" });
}

// One assignment: title pill, description and pen on the left, and the bag that
// leads to the submitted homework on the right (UN-405).
export default function HomeworkRow({ assignment }) {
    return (
        <li className="flex flex-wrap items-center gap-x-6 gap-y-3 text-black dark:text-white">
            <div className="flex items-center gap-3 w-64 sm:w-72">
                <div className="min-w-0 flex-1 text-center">
                    <h3 className="m-0 mb-2 px-3 py-1 rounded-full bg-[#333] text-white text-sm font-bold truncate">
                        {assignment.title}
                    </h3>
                    <p className="m-0 text-sm break-words">{assignment.description}</p>
                    <p className="m-0 mt-1 text-xs opacity-80">Due {formatDue(assignment.dueAt)}</p>
                </div>
                <PenIcon />
            </div>

            <Link
                to={submissionsPath(assignment.id)}
                aria-label={"Check submitted homework of " + assignment.title}
                className="flex items-center gap-3 text-black dark:text-white no-underline"
            >
                <img src={asset(BAG)} alt="" className="w-16 sm:w-20 object-contain" />
                <span className="flex flex-col items-center text-center text-sm sm:text-base">
                    Check submitted<br />homework
                    <LongArrowIcon />
                </span>
            </Link>
        </li>
    );
}
