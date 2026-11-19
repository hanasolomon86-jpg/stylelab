import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useWorkspace } from "./useWorkspace";

describe("useWorkspace", () => {
  it("throws an error when used outside WorkspaceProvider", () => {
    expect(() => renderHook(() => useWorkspace())).toThrow(
      "useWorkspace must be used within a WorkspaceProvider",
    );
  });
});
