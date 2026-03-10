describe("Journal submission flow", () => {
  beforeEach(() => {
    cy.login();
    // Intercept Groq API call to avoid real LLM requests during E2E tests.
    cy.intercept("POST", "/api/journal", {
      statusCode: 200,
      body: {
        journalId: "test-journal-id",
        parsedEntryId: "test-entry-id",
        parsed: {
          activities: [
            {
              name: "Study ML",
              category: "study_ml",
              duration_minutes: 120,
              confidence: 0.9
            }
          ],
          alignment_score: 7,
          summary: "Great study session focused on machine learning fundamentals."
        }
      }
    }).as("journalPost");
  });

  it("submits journal and shows parsed results", () => {
    cy.visit("/journal");

    cy.get("textarea").type(
      "Today I studied ML for 2 hours. Had a great deep focus session going through neural networks."
    );
    cy.get('button[type="submit"]').click();

    cy.wait("@journalPost");

    cy.contains("AI Summary").should("be.visible");
    cy.contains("Study ML").should("be.visible");
    cy.contains("+7").should("be.visible");
    cy.contains("Great study session").should("be.visible");
  });

  it("shows error when API fails", () => {
    cy.intercept("POST", "/api/journal", {
      statusCode: 502,
      body: { error: "LLM call failed" }
    });

    cy.visit("/journal");
    cy.get("textarea").type("This journal entry should fail.");
    cy.get('button[type="submit"]').click();
    cy.contains("LLM call failed").should("be.visible");
  });
});
