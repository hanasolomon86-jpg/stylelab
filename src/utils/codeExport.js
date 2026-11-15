
import { COMPONENT_IDS } from "../reducers/workspaceReducer";
import { CODE_FORMATS } from "./codeGenerator";

const MIME_TYPES = {
    jsx: "text/javascript;charset=utf-8",
    css: "text/css;charset=utf-8",
    tailwind: "text/javascript;charset=utf-8",
};

/**
 * Validates component and format before copy or export operations.
 */
function validateExportOptions(componentId, format) {
    if (!COMPONENT_IDS.includes(componentId)) {
        throw new Error(`Unsupported component: ${componentId}`);
    }

    if (!CODE_FORMATS.includes(format)) {
        throw new Error(`Unsupported code format: ${format}`);
    }
}

/**
 * Copies the exact generated code to the system clipboard.
 */
export async function copyCodeToClipboard(code) {
    if (typeof code !== "string") {
        throw new TypeError("Code must be a string.");
    }

    if (
        typeof navigator === "undefined" ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
    ) {
        throw new Error(
            "Clipboard access is unavailable in this browser."
        );
    }

    await navigator.clipboard.writeText(code);

    return true;
}

/**
 * Returns the file name according to the selected component and format.
 */
export function getExportFileName(componentId, format) {
    validateExportOptions(componentId, format);

    if (format === "css") {
        return `${componentId}.css`;
    }

    if (format === "tailwind") {
        return `${componentId}-tailwind.jsx`;
    }

    return `${componentId}.jsx`;
}

/**
 * Returns the MIME type according to the selected format.
 */
export function getExportMimeType(format) {
    if (!CODE_FORMATS.includes(format)) {
        throw new Error(`Unsupported code format: ${format}`);
    }

    return MIME_TYPES[format];
}

/**
 * Downloads the exact generated code as a file.
 * Temporary DOM elements and object URLs are cleaned up afterward.
 */
export function exportCode({ code, componentId, format }) {
    if (typeof code !== "string") {
        throw new TypeError("Code must be a string.");
    }

    const fileName = getExportFileName(componentId, format);
    const mimeType = getExportMimeType(format);

    if (
        typeof URL.createObjectURL !== "function" ||
        typeof URL.revokeObjectURL !== "function"
    ) {
        throw new Error("File export is unavailable in this browser.");
    }

    const blob = new Blob([code], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);

    let downloadLink;

    try {
        downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";

        document.body.appendChild(downloadLink);
        downloadLink.click();

        return {
            fileName,
            mimeType,
        };
    } finally {
        downloadLink?.remove();
        URL.revokeObjectURL(objectUrl);
    }
}
