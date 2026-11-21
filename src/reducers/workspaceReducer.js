
export const COMPONENT_IDS = ['card', 'button', 'input']

export const STYLE_STATES = [
    'normal',
    'hover',
    'focus',
    'disabled',
    'error',
]

export const DESIGN_EFFECTS = [
    "none",
    "glassmorphism",
    "neumorphism",
];

export const STYLE_PROPERTIES = {
    card: [
        "backgroundColor",
        "color",
        "titleColor",
        "borderRadius",
        "padding",
    ],
    button: [
        "backgroundColor",
        "color",
        "borderRadius",
        "padding",
    ],
    input: [
        "backgroundColor",
        "color",
        "borderRadius",
        "padding",
    ],
};

const COLOR_STYLE_PROPERTIES = [
    "backgroundColor",
    "color",
    "titleColor",
];

const SPACING_STYLE_PROPERTIES = [
    "borderRadius",
    "padding",
];

export function isValidStyleProperty(componentId, property, value) {
    if (!STYLE_PROPERTIES[componentId]?.includes(property)) {
        return false;
    }

    if (COLOR_STYLE_PROPERTIES.includes(property)) {
        return (
            typeof value === "string" &&
            /^#[0-9a-f]{6}$/i.test(value)
        );
    }

    if (SPACING_STYLE_PROPERTIES.includes(property)) {
        return (
            typeof value === "string" &&
            /^(?:[0-9]|[1-3][0-9]|4[0-8])px$/.test(value)
        );
    }

    return false;
}

export const WORKSPACE_ACTIONS = {
    UPDATE_COMPONENT_CONTENT: 'UPDATE_COMPONENT_CONTENT',
    UPDATE_COMPONENT_STYLE: 'UPDATE_COMPONENT_STYLE',
    UPDATE_COMPONENT_LAYOUT: 'UPDATE_COMPONENT_LAYOUT',
    UPDATE_COMPONENT_DESIGN_EFFECT: "UPDATE_COMPONENT_DESIGN_EFFECT",
}

const createEmptyStyles = () => ({
    normal: {},
    hover: {},
    focus: {},
    disabled: {},
    error: {},
})

export function createInitialWorkspace() {
    return {
        version: 1,

        components: {
            card: {
                layout: 'top',
                designEffect: "none",
                content: {
                    title: 'Product Title',
                    description: 'Product description',
                    imageId: null,
                },
                styles: createEmptyStyles(),
            },

            button: {
                designEffect: "none",
                content: {
                    label: 'Click Me',
                },
                styles: createEmptyStyles(),
            },

            input: {
                designEffect: "none",
                content: {
                    label: 'Email',
                    placeholder: 'Enter your email',
                },
                styles: createEmptyStyles(),
            },
        },
    }
}

const contentFields = {
    card: ['title', 'description', 'imageId'],
    button: ['label'],
    input: ['label', 'placeholder'],
}

export function workspaceReducer(state, action) {
    switch (action.type) {
        case WORKSPACE_ACTIONS.UPDATE_COMPONENT_CONTENT: {
            const { componentId, field, value } = action.payload

            if (
                !COMPONENT_IDS.includes(componentId) ||
                !contentFields[componentId].includes(field) ||
                value === undefined
            ) {
                return state
            }

            const component = state.components[componentId]

            return {
                ...state,
                components: {
                    ...state.components,
                    [componentId]: {
                        ...component,
                        content: {
                            ...component.content,
                            [field]: value,
                        },
                    },
                },
            }
        }

        case WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE: {
            const { componentId, styleState, property, value } = action.payload

            if (
                !COMPONENT_IDS.includes(componentId) ||
                !STYLE_STATES.includes(styleState) ||
                !isValidStyleProperty(componentId, property, value) ||
                styleState !== 'normal'
            ) {
                return state
            }

            const component = state.components[componentId]

            return {
                ...state,
                components: {
                    ...state.components,
                    [componentId]: {
                        ...component,
                        styles: {
                            ...component.styles,
                            [styleState]: {
                                ...component.styles[styleState],
                                [property]: value,
                            },
                        },
                    },
                },
            }
        }

        case WORKSPACE_ACTIONS.UPDATE_COMPONENT_LAYOUT: {
            const { componentId, layout } = action.payload

            if (
                componentId !== 'card' ||
                !['top', 'left'].includes(layout)
            ) {
                return state
            }

            return {
                ...state,
                components: {
                    ...state.components,
                    card: {
                        ...state.components.card,
                        layout,
                    },
                },
            }
        }

        case WORKSPACE_ACTIONS.UPDATE_COMPONENT_DESIGN_EFFECT: {
            const { componentId, designEffect } = action.payload;

            if (
                !COMPONENT_IDS.includes(componentId) ||
                !DESIGN_EFFECTS.includes(designEffect)
            ) {
                return state;
            }

            const component = state.components[componentId];

            return {
                ...state,
                components: {
                    ...state.components,
                    [componentId]: {
                        ...component,
                        designEffect,
                    },
                },
            };
        }

        default:
            return state
    }
}
