/// <reference types="cypress" />

describe('editing tests', () => {
  beforeEach(() => {
    cy.visit('localhost:3901')
    cy.wait(1000)
    cy.get('body').then(($body) => {
      if ($body.find('#user-avatar').length > 0) {
        cy.get('#user-avatar').click()
        cy.get('#logout-button').click()
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

  it('creating, editing, deleting task', () => {
    cy.contains('COMP1511').click()
    cy.contains('New Task').click()
    cy.contains('Task Name').parent().find('input').type('Cypress Task')
    cy.contains('Maximum Automark').parent().find('input').type('80')
    cy.contains('Maximum Style Mark').parent().find('input').type('20')
    cy.get('input[type="datetime-local"]').type('2024-12-24T00:00')
    cy.contains('File Restrictions').click()
    cy.contains('Required File').parent().find('input').type('isprime.py')
    cy.contains('Max File Size').parent().find('input').clear().type('2')
    cy.contains('Create Task').click()
    cy.contains('Task created successfully').should('be.visible')
    cy.contains('Cypress Task').click()
    cy.contains('Harry Zhang')
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Autotest Center').click()

    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('7 prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('7');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nIs prime\nEnter a number:\n');
    cy.get('div[role="dialog"]').contains('Hidden:').parent().find('input[type="checkbox"]').check();
    cy.get('button').contains('Add').click()
    cy.contains('7 prime added').should('be.visible')
    cy.contains('Enter a number:\nIs prime\nEnter a number:\n').should('not.exist')

    cy.get('div[role="dialog"]').contains('7 prime').click()
    cy.contains('Enter a number:').should('exist')
    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).clear().type('5 prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).clear().type('5');
    cy.get('div[role="dialog"]').contains('Hidden:').parent().find('input[type="checkbox"]').check();
    cy.get('button').contains('Confirm').click()
    cy.contains('5 prime').should('exist')
    cy.reload() // for persistence
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Autotest Center').click()
    cy.contains('7 prime').should('not.exist')
    cy.contains('5 prime').should('exist')


    cy.get('button[id="5 prime"]').get('[data-testid="DeleteIcon"]').click()
    cy.contains('5 prime').should('not.exist')
    cy.reload() // for persistence
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Autotest Center').click()
    cy.contains('5 prime').should('not.exist')
    cy.reload()
    cy.get('[id="back-to-course-button"]').click()
    cy.contains('.MuiListItem-root', 'Cypress Task') // Locate the list item containing "Cypress Task"
      .within(() => { // Limit further searches to this element
        cy.get('[data-testid="DeleteIcon"]').click(); // Find and click the delete button
    });
    cy.contains('Do you really want to delete this task?').should('be.visible')
    cy.contains('Delete').click()
    cy.contains('Deletion Successful!').should('be.visible')
  })
})