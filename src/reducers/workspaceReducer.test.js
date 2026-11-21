
import { describe, it, expect } from 'vitest'

import {
    createInitialWorkspace,
    workspaceReducer,
    WORKSPACE_ACTIONS,
} from './workspaceReducer'

describe('workspaceReducer', () => {
    it('creates a workspace with all components and style states', () => {
        const workspace = createInitialWorkspace()

        expect(Object.keys(workspace.components)).toEqual([
            'card',
            'button',
            'input',
        ])

        expect(Object.keys(workspace.components.card.styles)).toEqual([
            'normal',
            'hover',
            'focus',
            'disabled',
            'error',
        ])
    })

    it('updates component content without mutating the original state', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_CONTENT,
            payload: {
                componentId: 'card',
                field: 'title',
                value: 'My New Product',
            },
        })

        expect(newState.components.card.content.title).toBe(
            'My New Product',
        )

        expect(initialState.components.card.content.title).toBe(
            'Product Title',
        )
    })

    it('updates a base style property in Normal without mutating the original state', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
            payload: {
                componentId: 'card',
                styleState: 'normal',
                property: 'backgroundColor',
                value: '#000000',
            },
        })

        expect(
            newState.components.card.styles.normal.backgroundColor,
        ).toBe('#000000')

        expect(newState.components.card.styles.hover).toEqual({})
        expect(newState.components.card.styles.focus).toEqual({})
        expect(newState.components.card.styles.disabled).toEqual({})
        expect(newState.components.card.styles.error).toEqual({})

        expect(initialState.components.card.styles.normal).toEqual({})
    })

    it('ignores updates with an invalid content field', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_CONTENT,
            payload: {
                componentId: 'card',
                field: 'unknownField',
                value: 'Some value',
            },
        })

        expect(newState).toBe(initialState)
    })


    it('updates the Card layout without mutating the original state', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_LAYOUT,
            payload: {
                componentId: 'card',
                layout: 'left',
            },
        })

        expect(newState.components.card.layout).toBe('left')
        expect(initialState.components.card.layout).toBe('top')
        expect(newState.components.button).toBe(initialState.components.button)
    })

    it('ignores an invalid Card layout', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_LAYOUT,
            payload: {
                componentId: 'card',
                layout: 'diagonal',
            },
        })

        expect(newState).toBe(initialState)
    })

    it('ignores layout updates for components other than Card', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_LAYOUT,
            payload: {
                componentId: 'button',
                layout: 'left',
            },
        })

        expect(newState).toBe(initialState)
    })

    it('updates the component design effect without mutating the original state', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_DESIGN_EFFECT,
            payload: {
                componentId: 'card',
                designEffect: 'glassmorphism',
            },
        })

        expect(newState.components.card.designEffect).toBe('glassmorphism')
        expect(initialState.components.card.designEffect).toBe('none')
        expect(newState.components.button).toBe(initialState.components.button)
    })

    it('updates only Normal styles and ignores interaction-state style updates', () => {
        const initialState = createInitialWorkspace();

        const normalState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
            payload: {
                componentId: 'button',
                styleState: 'normal',
                property: 'backgroundColor',
                value: '#123456',
            },
        });

        expect(
            normalState.components.button.styles.normal.backgroundColor,
        ).toBe('#123456');

        expect(
            initialState.components.button.styles.normal.backgroundColor,
        ).toBeUndefined();

        for (const styleState of ['hover', 'focus', 'disabled', 'error']) {
            const nextState = workspaceReducer(normalState, {
                type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
                payload: {
                    componentId: 'button',
                    styleState,
                    property: 'backgroundColor',
                    value: '#abcdef',
                },
            });

            expect(nextState).toBe(normalState);
            expect(
                nextState.components.button.styles[styleState],
            ).toEqual({});
        }
    });

    it.each([
        {
            componentId: "card",
            property: "titleColor",
            value: "#123456",
        },
        {
            componentId: "button",
            property: "borderRadius",
            value: "48px",
        },
        {
            componentId: "input",
            property: "padding",
            value: "0px",
        },
    ])(
        "accepts valid style values for $componentId",
        ({ componentId, property, value }) => {
            const initialState = createInitialWorkspace();

            const newState = workspaceReducer(initialState, {
                type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
                payload: {
                    componentId,
                    styleState: "normal",
                    property,
                    value,
                },
            });

            expect(
                newState.components[componentId].styles.normal[property],
            ).toBe(value);
        },
    );

    it.each([
        {
            componentId: "card",
            property: "boxShadow",
            value: "none",
        },
        {
            componentId: "button",
            property: "titleColor",
            value: "#123456",
        },
        {
            componentId: "card",
            property: "backgroundColor",
            value: "red; display: none",
        },
        {
            componentId: "card",
            property: "padding",
            value: "49px",
        },
        {
            componentId: "input",
            property: "borderRadius",
            value: "12.5px",
        },
    ])(
        "rejects invalid style values for $componentId",
        ({ componentId, property, value }) => {
            const initialState = createInitialWorkspace();

            const newState = workspaceReducer(initialState, {
                type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
                payload: {
                    componentId,
                    styleState: "normal",
                    property,
                    value,
                },
            });

            expect(newState).toBe(initialState);
        },
    );

    it('ignores unknown actions', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: 'UNKNOWN_ACTION',
        })

        expect(newState).toBe(initialState)
    })
})
