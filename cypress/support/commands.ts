/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add(
  "login",
  (email = "demo@example.com", password = "DemoPass123!") => {
    cy.request("POST", "/api/auth/login", { email, password }).then(res => {
      expect(res.status).to.eq(200);
    });
  }
);

export {};
