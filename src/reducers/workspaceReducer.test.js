
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

    it('updates a style property only in the selected style state', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
            payload: {
                componentId: 'card',
                styleState: 'hover',
                property: 'backgroundColor',
                value: '#000000',
            },
        })

        expect(
            newState.components.card.styles.hover.backgroundColor,
        ).toBe('#000000')

        expect(newState.components.card.styles.normal).toEqual({})
        expect(initialState.components.card.styles.hover).toEqual({})
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


    it('ignores unknown actions', () => {
        const initialState = createInitialWorkspace()

        const newState = workspaceReducer(initialState, {
            type: 'UNKNOWN_ACTION',
        })

        expect(newState).toBe(initialState)
    })
})
