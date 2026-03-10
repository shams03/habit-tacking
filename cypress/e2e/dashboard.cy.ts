describe("Dashboard", () => {
  beforeEach(() => {
    cy.login();
  });

  it("loads dashboard with stat cards and charts", () => {
    cy.visit("/dashboard");

    cy.contains("Dashboard").should("be.visible");
    cy.contains("Journal Entries").should("be.visible");
    cy.contains("Alignment Path").should("be.visible");
  });

  it("navigates to journal from dashboard", () => {
    cy.visit("/dashboard");
    cy.contains("Journal").click();
    cy.url().should("include", "/journal");
  });
});
