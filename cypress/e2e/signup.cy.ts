describe("Signup flow", () => {
  const uniqueEmail = () => `e2e-${Date.now()}@example.com`;

  it("creates account and redirects to /goals/create", () => {
    const email = uniqueEmail();
    cy.visit("/signup");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("TestPassword123!");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/goals/create");
  });

  it("shows error for duplicate email", () => {
    cy.visit("/signup");
    cy.get('input[type="email"]').type("demo@example.com");
    cy.get('input[type="password"]').type("TestPassword123!");
    cy.get('button[type="submit"]').click();
    cy.contains("Email already in use").should("be.visible");
  });

  it("shows error for short password", () => {
    cy.visit("/signup");
    cy.get('input[type="email"]').type(uniqueEmail());
    cy.get('input[type="password"]').type("short");
    cy.get('button[type="submit"]').click();
    cy.contains("10 characters").should("be.visible");
  });
});
