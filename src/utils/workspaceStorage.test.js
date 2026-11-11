
import { beforeEach, describe, expect, it } from 'vitest'

import { createInitialWorkspace } from '../reducers/workspaceReducer'

import {
    loadWorkspace,
    saveWorkspace,
    WORKSPACE_STORAGE_KEY,
} from './workspaceStorage'

describe('workspaceStorage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('returns an initial workspace when no saved data exists', () => {
        const workspace = loadWorkspace()

        expect(workspace).toEqual(createInitialWorkspace())
    })

    it('saves and loads a valid workspace', () => {
        const workspace = createInitialWorkspace()

        workspace.components.card.content.title = 'My Product'

        const saved = saveWorkspace(workspace)

        expect(saved).toBe(true)
        expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).not.toBeNull()
        expect(loadWorkspace()).toEqual(workspace)
    })

    it('returns an initial workspace when saved JSON is invalid', () => {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, '{invalid json')

        expect(loadWorkspace()).toEqual(createInitialWorkspace())
    })

    it('returns an initial workspace when saved data has an invalid structure', () => {
        localStorage.setItem(
            WORKSPACE_STORAGE_KEY,
            JSON.stringify({
                version: 1,
                components: {
                    card: {},
                    button: {},
                    input: {},
                },
            }),
        )

        expect(loadWorkspace()).toEqual(createInitialWorkspace())
    })

    it('rejects an invalid workspace when saving', () => {
        const result = saveWorkspace({
            version: 1,
            components: {},
        })

        expect(result).toBe(false)
        expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull()
    })

    it('handles unavailable storage when loading', () => {
        const unavailableStorage = {
            getItem() {
                throw new Error('Storage unavailable')
            },
        }

        expect(loadWorkspace(unavailableStorage)).toEqual(
            createInitialWorkspace(),
        )
    })

    it('handles storage errors when saving', () => {
        const unavailableStorage = {
            setItem() {
                throw new Error('Storage unavailable')
            },
        }

        expect(
            saveWorkspace(createInitialWorkspace(), unavailableStorage),
        ).toBe(false)
    })
})
