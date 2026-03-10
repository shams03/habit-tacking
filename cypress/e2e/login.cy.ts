describe("Login flow", () => {
  it("logs in demo user and redirects to dashboard", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@example.com");
    cy.get('input[type="password"]').type("DemoPass123!");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
  });

  it("shows error for wrong password", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@example.com");
    cy.get('input[type="password"]').type("WrongPass999!");
    cy.get('button[type="submit"]').click();
    cy.contains("Invalid credentials").should("be.visible");
  });

  it("redirects unauthenticated users to /login", () => {
    cy.visit("/dashboard");
    cy.url().should("include", "/login");
  });
});
