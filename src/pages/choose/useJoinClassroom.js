import { useState } from "react";
import { joinClassroom } from "../../lib/classroomApi.js";

// "Join a Classroom" step. The server creates the Pancho on join, so after a successful join we
// reload the game state; ChoosePancho then switches to the Pancho picker on its own.
export function useJoinClassroom({ status, init }) {
    const [joinCode, setJoinCode] = useState("");
    const [joining, setJoining] = useState(false);

    async function handleJoinClassroom(event) {
        event.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) {
            status.showError("Enter a join code");
            return;
        }
        setJoining(true);
        status.showLoading();
        try {
            await joinClassroom(code);
            await init();
            status.showSuccess("Joined classroom! Now choose your Pancho.");
        } catch (err) {
            status.showError(err.message || "Invalid join code");
        } finally {
            setJoining(false);
        }
    }

    return { joinCode, setJoinCode, joining, handleJoinClassroom };
}
