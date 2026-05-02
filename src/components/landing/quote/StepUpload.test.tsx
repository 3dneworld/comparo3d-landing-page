import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepUpload } from "./StepUpload";

describe("StepUpload", () => {
  it("lets the user remove a detected file", () => {
    const onRemoveFile = vi.fn();

    render(
      <StepUpload
        fileName="2 balls.stl"
        isLoading={false}
        progressMessage=""
        error={null}
        onFileSelect={() => {}}
        onAutoUpload={() => {}}
        onRemoveFile={onRemoveFile}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /quitar archivo/i }));

    expect(onRemoveFile).toHaveBeenCalledOnce();
  });
});
