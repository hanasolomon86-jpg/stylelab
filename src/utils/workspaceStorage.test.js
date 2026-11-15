
import { beforeEach, describe, expect, it } from 'vitest'

import {
    COMPONENT_IDS,
    createInitialWorkspace,
} from '../reducers/workspaceReducer'

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

    it('saves and loads the selected Card layout', () => {
        const workspace = createInitialWorkspace();
        workspace.components.card.layout = 'left';

        expect(saveWorkspace(workspace)).toBe(true);
        expect(loadWorkspace().components.card.layout).toBe('left');
    });

    it('uses the top layout when loading an older workspace without layout', () => {
        const workspace = createInitialWorkspace();
        delete workspace.components.card.layout;

        localStorage.setItem(
            WORKSPACE_STORAGE_KEY,
            JSON.stringify(workspace),
        );

        const loadedWorkspace = loadWorkspace();

        expect(loadedWorkspace.components.card.layout).toBe('top');
    });

    it('preserves existing Card data when adding the default layout', () => {
        const workspace = createInitialWorkspace();
        workspace.components.card.content.title = 'My Product';
        workspace.components.card.content.description = 'Product description';
        delete workspace.components.card.layout;

        localStorage.setItem(
            WORKSPACE_STORAGE_KEY,
            JSON.stringify(workspace),
        );

        const loadedWorkspace = loadWorkspace();

        expect(loadedWorkspace.components.card.layout).toBe('top');
        expect(loadedWorkspace.components.card.content.title).toBe('My Product');
        expect(loadedWorkspace.components.card.content.description).toBe(
            'Product description',
        );
    });

    it('uses none as the default design effect for all components', () => {
        const workspace = createInitialWorkspace();

        COMPONENT_IDS.forEach((componentId) => {
            expect(workspace.components[componentId].designEffect).toBe('none');
        });
    });

    it('uses none when loading an older workspace without design effects', () => {
        const workspace = createInitialWorkspace();

        COMPONENT_IDS.forEach((componentId) => {
            delete workspace.components[componentId].designEffect;
        });

        workspace.components.card.content.title = 'My Product';

        localStorage.setItem(
            WORKSPACE_STORAGE_KEY,
            JSON.stringify(workspace),
        );

        const loadedWorkspace = loadWorkspace();

        COMPONENT_IDS.forEach((componentId) => {
            expect(loadedWorkspace.components[componentId].designEffect).toBe('none');
        });

        expect(loadedWorkspace.components.card.content.title).toBe('My Product');
    });

    it('saves and loads design effects for all components', () => {
        const workspace = createInitialWorkspace();

        workspace.components.card.designEffect = 'glassmorphism';
        workspace.components.button.designEffect = 'neumorphism';
        workspace.components.input.designEffect = 'glassmorphism';

        expect(saveWorkspace(workspace)).toBe(true);

        const loadedWorkspace = loadWorkspace();

        expect(loadedWorkspace.components.card.designEffect).toBe('glassmorphism');
        expect(loadedWorkspace.components.button.designEffect).toBe('neumorphism');
        expect(loadedWorkspace.components.input.designEffect).toBe('glassmorphism');
    });

    it('uses none when loading an unsupported design effect', () => {
        const workspace = createInitialWorkspace();

        workspace.components.card.designEffect = 'unsupported-effect';

        localStorage.setItem(
            WORKSPACE_STORAGE_KEY,
            JSON.stringify(workspace),
        );

        const loadedWorkspace = loadWorkspace();

        expect(loadedWorkspace.components.card.designEffect).toBe('none');
    });

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
