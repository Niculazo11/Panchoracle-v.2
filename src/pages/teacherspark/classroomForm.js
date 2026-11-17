// Rules of the create-classroom form (UN-401): name 1-15 characters, end date after
// start date. The server still accepts up to 100 characters (server/validators/classroom.js).
export const MAX_CLASSROOM_NAME_LENGTH = 15;

export const EMPTY_CLASSROOM_FORM = { name: "", startDate: "", endDate: "" };
export const EMPTY_CLASSROOM_ERRORS = { name: "", startDate: "", endDate: "" };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// True for a real calendar day written as YYYY-MM-DD (2027-02-31 is rejected).
function isRealDate(value) {
    if (!DATE_REGEX.test(value)) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.toISOString().slice(0, 10) === value;
}

export function validateClassroomName(name) {
    const value = (name || "").trim();

    if (value === "") {
        return "Classroom name is required.";
    }

    if (value.length > MAX_CLASSROOM_NAME_LENGTH) {
        return `Classroom name must have at most ${MAX_CLASSROOM_NAME_LENGTH} characters.`;
    }

    return "";
}

export function validateStartDate(startDate) {
    if (!startDate) {
        return "Start date is required.";
    }

    if (!isRealDate(startDate)) {
        return "Please enter a valid start date.";
    }

    return "";
}

export function validateEndDate(startDate, endDate) {
    if (!endDate) {
        return "End date is required.";
    }

    if (!isRealDate(endDate)) {
        return "Please enter a valid end date.";
    }

    // YYYY-MM-DD strings sort in calendar order, so they can be compared directly.
    if (isRealDate(startDate) && endDate <= startDate) {
        return "End date must be after the start date.";
    }

    return "";
}

// Always returns an errors object with the same shape as formData.
export function validateClassroomForm(formData) {
    return {
        name: validateClassroomName(formData.name),
        startDate: validateStartDate(formData.startDate),
        endDate: validateEndDate(formData.startDate, formData.endDate)
    };
}

// The API wants ISO 8601 UTC date-times: the period runs from the start of the
// first day to the end of the last day.
export function toApiPeriod(formData) {
    return {
        startDate: formData.startDate + "T00:00:00Z",
        endDate: formData.endDate + "T23:59:59Z"
    };
}
