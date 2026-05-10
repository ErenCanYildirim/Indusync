/**
 * EmptyDocumentsState Component Tests
 * Tests for the empty state component when no documents exist
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { EmptyDocumentsState } from "../EmptyDocumentsState";

describe("EmptyDocumentsState Component", () => {
  it("should render backend order empty state correctly", () => {
    render(<EmptyDocumentsState isBackendOrder={true} />);

    // Check for backend order specific content
    expect(screen.getByText("Keine Dokumente vorhanden")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Für diesen Auftrag wurden noch keine Dokumente hochgeladen/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Unterstützte Dateiformate: PDF, Word, Excel, PowerPoint, Bilder/
      )
    ).toBeInTheDocument();
  });

  it("should render mock project empty state correctly", () => {
    render(<EmptyDocumentsState isBackendOrder={false} />);

    // Check for mock project specific content
    expect(screen.getByText("Demo-Projekt ohne Dokumente")).toBeInTheDocument();
    expect(screen.getByText(/Dies ist ein Demo-Projekt/)).toBeInTheDocument();

    // Should not show supported formats for demo projects
    expect(
      screen.queryByText(/Unterstützte Dateiformate/)
    ).not.toBeInTheDocument();
  });

  it("should apply custom className when provided", () => {
    const { container } = render(
      <EmptyDocumentsState isBackendOrder={true} className="custom-class" />
    );

    const cardElement = container.querySelector(".custom-class");
    expect(cardElement).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    render(<EmptyDocumentsState isBackendOrder={true} />);

    // Check that the component has proper heading structure
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Keine Dokumente vorhanden");
  });
});
