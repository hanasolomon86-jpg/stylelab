import { useEffect, useReducer, useState } from "react";

import { WorkspaceContext } from "./workspaceContext.js";

import {
  COMPONENT_IDS,
  STYLE_STATES,
  WORKSPACE_ACTIONS,
  workspaceReducer,
} from "../reducers/workspaceReducer";

import { loadWorkspace, saveWorkspace } from "../utils/workspaceStorage";

export function WorkspaceProvider({ children }) {
  const [workspace, dispatch] = useReducer(
    workspaceReducer,
    undefined,
    loadWorkspace,
  );

  const [selectedComponent, setSelectedComponent] = useState("card");
  const [activeStyleState, setActiveStyleState] = useState("normal");

  useEffect(() => {
    saveWorkspace(workspace);
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

  const contextValue = {
    workspace,
    selectedComponent,
    activeStyleState,
    selectComponent,
    selectStyleState,
    updateComponentContent,
    updateComponentStyle,
    updateComponentLayout,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}
