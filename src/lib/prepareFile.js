// Gets a photo or a PDF ready to send as JSON: checks type and size, shrinks big photos
// and returns { fileName, mimeType, dataBase64 }. The server keeps the file in MongoDB, so
// it is small: 3 MB at most (base64 adds a third and the request limit is 4.5 MB).
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_SIDE = 1600; // longest side of a photo, in pixels
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function toBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(blob);
    });
}

// Redraws the photo smaller as JPEG, so phone photos fit in the limit.
async function shrinkPhoto(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return { blob, fileName: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
}

export async function prepareFile(file) {
    let blob = file;
    let fileName = file.name;

    if (IMAGE_TYPES.includes(file.type)) {
        ({ blob, fileName } = await shrinkPhoto(file));
    } else if (file.type !== "application/pdf") {
        throw new Error("Only photos (JPG, PNG, WebP) and PDF files are allowed.");
    }

    if (blob.size > MAX_FILE_BYTES) {
        throw new Error("The file is too big. The limit is 3 MB.");
    }

    return { fileName, mimeType: blob.type, dataBase64: await toBase64(blob) };
}
