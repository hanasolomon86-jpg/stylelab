import { useEffect, useReducer, useState, useSyncExternalStore } from "react";

import { WorkspaceContext } from "./workspaceContext.js";

import {
  COMPONENT_IDS,
  STYLE_STATES,
  WORKSPACE_ACTIONS,
  workspaceReducer,
} from "../reducers/workspaceReducer";

import { loadWorkspace, saveWorkspace } from "../utils/workspaceStorage";

import {
  getStorageErrorSnapshot,
  subscribeToStorageStatus,
  publishStorageError,
} from "../utils/storageStatus";

export function WorkspaceProvider({ children }) {
  const [workspace, dispatch] = useReducer(
    workspaceReducer,
    undefined,
    loadWorkspace,
  );

  const [selectedComponent, setSelectedComponent] = useState("card");
  const [activeStyleState, setActiveStyleState] = useState("normal");
  const hasStorageError = useSyncExternalStore(
    subscribeToStorageStatus,
    getStorageErrorSnapshot,
    getStorageErrorSnapshot,
  );

  useEffect(() => {
    const saved = saveWorkspace(workspace);
    publishStorageError(!saved);
  }, [workspace]);

  function selectComponent(componentId) {
    if (COMPONENT_IDS.includes(componentId)) {
      setSelectedComponent(componentId);
    }
  }

  function selectStyleState(styleState) {
    if (STYLE_STATES.includes(styleState)) {
      setActiveStyleState(styleState);
    }
  }

  function updateComponentContent(componentId, field, value) {
    dispatch({
      type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_CONTENT,
      payload: {
        componentId,
        field,
        value,
      },
    });
  }

  function updateComponentStyle(componentId, styleState, property, value) {
    dispatch({
      type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_STYLE,
      payload: {
        componentId,
        styleState,
        property,
        value,
      },
    });
  }

  function updateComponentLayout(componentId, layout) {
    dispatch({
      type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_LAYOUT,
      payload: {
        componentId,
        layout,
      },
    });
  }

  function updateComponentDesignEffect(componentId, designEffect) {
    dispatch({
      type: WORKSPACE_ACTIONS.UPDATE_COMPONENT_DESIGN_EFFECT,
      payload: {
        componentId,
        designEffect,
      },
    });
  }

  const contextValue = {
    workspace,
    selectedComponent,
    activeStyleState,
    hasStorageError,
    selectComponent,
    selectStyleState,
    updateComponentContent,
    updateComponentStyle,
    updateComponentLayout,
    updateComponentDesignEffect,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}
