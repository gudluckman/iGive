/// <reference types="cypress" />

describe('e2e', () => {
  // Navigate to page and log in as Edward
  beforeEach(() => {
    cy.visit('127.0.0.1:3901')
    cy.wait(1000);
    cy.get('body').then(($body) => {
      if ($body.find('#user-avatar').length > 0) {
        cy.get('#user-avatar').click();
        cy.get('#logout-button').click();
      }
    })
    cy.get('input[type="email"]').type('z5419884@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('foobar')
    cy.contains('Sign In').click()
  })

  // Log out
  afterEach(() => {
    cy.get('body').then(($body) => {
      if ($body.find('#user-avatar').length > 0) {
        cy.get('#user-avatar').click();
        cy.get('#logout-button').click();
      }
    })
  })

  it('Add and remove students', () => {
    cy.contains('COMP1511').click()
    cy.contains('Edward Lukman').should('be.visible')

    // adding a student that doesn't exist
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Add/Remove Students').click()
    cy.get('input[type="text"]').type('abcdefg')
    cy.get('button').contains('Add').click()
    cy.contains('Hold up! abcdefg not found').should('be.visible')

    // adding a student that exists
    cy.get('input[type="text"]').clear().type('z1234567')
    cy.get('button').contains('Add').click()
    cy.contains('Successful! Student successfully added to the course!').should('be.visible')

    // adding a student that already exists
    cy.get('input[type="text"]').clear()
    cy.contains('Upload file').selectFile('cypress/fixtures/z1234567.csv')
    cy.get('button').contains('Add').click()
    cy.contains('Hold up! z1234567 already in course').should('be.visible')

    // adding nothing
    cy.get('[data-testid="CloseIcon"]').eq(2).click();
    cy.get('button').contains('Add').click()
    cy.contains('Please enter zIDs or upload a file').should('be.visible')
    cy.contains('Add and Remove Students').find('[data-testid="CloseIcon"]').click();

    // checking that the student is added
    cy.contains('isPrime').click()
    cy.contains('Harry Zhang')
    cy.contains('z1234567').should('exist')

    // search function
    cy.get('input[type="text"]').type('z7654321')
    cy.contains('z1234567').should('not.exist')

    // removing a student
    cy.get('[id="back-to-course-button"]').click()
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Add/Remove Students').click()
    cy.get('input[type="text"]').type('z1234567')
    cy.get('button').contains('Remove').click()
    cy.contains('Successful! Student successfully removed from the course!').should('be.visible')
    cy.get('input[type="text"]').type('z1234567')
    cy.get('button').contains('Remove').click()
    cy.contains('Hold up! z1234567 is not in the course.').should('be.visible')
    cy.get('#close-course-settings-modal-button').click()
  })


  it('creating and deleting a task', () => {
    cy.contains('COMP1511').click()
    cy.contains('New Task').click()

    // creating a task with no fields filled
    cy.contains('Create Task').should('be.disabled')

    // creating a task with invalid name
    cy.contains('Task Name').parent().find('input').type('Test~Task')
    cy.contains('Maximum Automark').parent().find('input').type('80')
    cy.contains('Maximum Style Mark').parent().find('input').type('20')
    cy.get('input[type="datetime-local"]').type('2024-12-24T00:00')
    cy.contains('Create Task').should('be.disabled')

    // creating a task with valid fields
    cy.contains('Task Name').parent().find('input').clear().type('Cypress Task')
    cy.contains('Create Task').click()
    cy.contains('Task created successfully').should('be.visible')
    cy.contains('Cypress Task').click()
    cy.contains('Harry Zhang')
    cy.go('back')

    // deletion of task
    cy.contains('.MuiListItem-root', 'Cypress Task') // Locate the list item containing "Cypress Task"
    .within(() => { // Limit further searches to this element
      cy.get('[data-testid="DeleteIcon"]').click(); // Find and click the delete button
    });
    cy.contains('Do you really want to delete this task?').should('be.visible')
    cy.contains('Delete').click()
    cy.contains('Deletion Successful!').should('be.visible')
    cy.contains('Task Cypress Task deleted from course 24T3COMP1511').should('be.visible')
  })
})
