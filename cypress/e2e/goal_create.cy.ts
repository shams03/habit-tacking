describe("Goal creation flow", () => {
  beforeEach(() => {
    cy.login();
  });

  it("completes 3-step goal wizard and redirects to /journal", () => {
    cy.visit("/goals/create");

    // Step 1 — title
    cy.get('input[placeholder*="goal"]').type("Master machine learning by 2026");
    cy.get('button[type="submit"]').click();

    // Step 2 — description
    cy.get("textarea").type("I want to become an ML engineer and build real products.");
    cy.get('button[type="submit"]').click();

    // Step 3 — target date
    cy.get('input[type="date"]').type("2026-12-31");
    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/journal");
  });
});
