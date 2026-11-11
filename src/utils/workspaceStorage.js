import {
    COMPONENT_IDS,
    STYLE_STATES,
    createInitialWorkspace,
} from "../reducers/workspaceReducer";

export const WORKSPACE_STORAGE_KEY = "stylelab-workspace";

function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidWorkspace(workspace) {
    if (
        !isObject(workspace) ||
        workspace.version !== 1 ||
        !isObject(workspace.components)
    ) {
        return false;
    }

    return COMPONENT_IDS.every((componentId) => {
        const component = workspace.components[componentId];

        if (
            !isObject(component) ||
            !isObject(component.content) ||
            !isObject(component.styles)
        ) {
            return false;
        }

        if (
            !STYLE_STATES.every((styleState) =>
                isObject(component.styles[styleState]),
            )
        ) {
            return false;
        }

        if (componentId === "card") {
            return (
                (component.layout === undefined ||
                    ["top", "left"].includes(component.layout)) &&
                typeof component.content.title === "string" &&
                typeof component.content.description === "string" &&
                (component.content.imageId === null ||
                    typeof component.content.imageId === "string")
            );
        }

        if (componentId === "button") {
            return typeof component.content.label === "string";
        }

        return (
            typeof component.content.label === "string" &&
            typeof component.content.placeholder === "string"
        );
    });
}

export function loadWorkspace(storage) {
    try {
        const storageTarget = storage ?? window.localStorage;
        const savedWorkspace = storageTarget.getItem(WORKSPACE_STORAGE_KEY);

        if (!savedWorkspace) {
            return createInitialWorkspace();
        }

        const parsedWorkspace = JSON.parse(savedWorkspace);

        if (!isValidWorkspace(parsedWorkspace)) {
            return createInitialWorkspace();
        }

        return {
            ...parsedWorkspace,
            components: {
                ...parsedWorkspace.components,
                card: {
                    ...parsedWorkspace.components.card,
                    layout: parsedWorkspace.components.card.layout ?? "top",
                },
            },
        };
    } catch {
        return createInitialWorkspace();
    }
}

export function saveWorkspace(workspace, storage) {
    try {
        const storageTarget = storage ?? window.localStorage;

        if (!isValidWorkspace(workspace)) {
            return false;
        }

        storageTarget.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));

        return true;
    } catch {
        return false;
    }
}
