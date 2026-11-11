
export const COMPONENT_IDS = ['card', 'button', 'input']

export const STYLE_STATES = [
    'normal',
    'hover',
    'focus',
    'disabled',
    'error',
]

export const WORKSPACE_ACTIONS = {
    UPDATE_COMPONENT_CONTENT: 'UPDATE_COMPONENT_CONTENT',
    UPDATE_COMPONENT_STYLE: 'UPDATE_COMPONENT_STYLE',
    UPDATE_COMPONENT_LAYOUT: 'UPDATE_COMPONENT_LAYOUT',
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
                content: {
                    title: 'Product Title',
                    description: 'Product description',
                    imageId: null,
                },
                styles: createEmptyStyles(),
            },

            button: {
                content: {
                    label: 'Click Me',
                },
                styles: createEmptyStyles(),
            },

            input: {
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
                typeof property !== 'string' ||
                property.trim() === '' ||
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

        default:
            return state
    }
}
