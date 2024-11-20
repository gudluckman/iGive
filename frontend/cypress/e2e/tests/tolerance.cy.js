/// <reference types="cypress" />

describe('tolerance and file extension', () => {
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

  it('creating, editing, deleting task', () => {
    cy.contains('COMP2511').click()
    cy.contains('New Task').click()
    cy.contains('Task Name').parent().find('input').type('Tolerance and Extension')
    cy.contains('Maximum Automark').parent().find('input').type('80')
    cy.contains('Maximum Style Mark').parent().find('input').type('20')
    cy.get('input[type="datetime-local"]').type('2024-12-24T00:00')
    cy.contains('File Restrictions').click()
    cy.contains('Required File').parent().find('input').type('isprime.py')
    cy.contains('Allowed Extra File').parent().find('input').clear().type('csv')
    cy.contains('Create Task').click()
    cy.contains('Tolerance and Extension').click()
    cy.contains('Harry Zhang')


    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Autotest Center').click()
    cy.contains('Upload Script File').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/run.sh', { force: true })

    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('7 prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('7');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nIs prime\nEnter a nUmber:\n');
    cy.get('button').contains('Add').click()
    cy.contains('7 prime added').should('be.visible')
    cy.contains('Enter a number:\nIs prime\nEnter a number:\n').should('not.exist')

    cy.reload()
    cy.contains('Harry Zhang')
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('General Task Settings').click()
    cy.contains('File Restrictions').click()
    cy.contains('Allowed Extra File').parent().find('input').clear().type('pdf')
    cy.contains('Confirm').click()
    cy.reload()
    cy.contains('Edward Lukman').click()
    cy.contains('Logout').click()

    // submit isprime.py
    cy.get('input[type="email"]').type('z7654321@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('password')
    cy.contains('Sign In').click()
    cy.contains('COMP2511').click()
    cy.contains('Tolerance').click()
    cy.get('[id="make-submission-Tolerance and Extension').click()
    cy.get('[id="file-upload-0"]').selectFile('cypress/fixtures/isprime.py')
    cy.get('[id="add-file-button"]').click()
    cy.get('[id="file-upload-1"]').selectFile('cypress/fixtures/z1234567.csv')
    cy.get('[id="submit-files-button').click()
    cy.contains('invalid type').should('be.visible')
    cy.get('[id="close-icon-1"]').click()
    cy.get('[id="submit-files-button').click()
    cy.contains('Uploaded').should('be.visible')
    cy.reload()
    cy.contains('Dave Rogers').click()
    cy.contains('Logout').click()

    // changing tolerance
    cy.get('input[type="email"]').type('z5419884@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('foobar')
    cy.contains('Sign In').click()
    cy.contains('COMP2511').click()
    cy.contains('Tolerance').click()
    cy.contains('Harry Zhang')
    cy.contains('z7654321').click()
    cy.get('[id="autotest-z7654321"]').click()
    cy.contains('7 prime: Failed').should('be.visible')
    cy.reload()

    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Tolerance Settings').click()
    cy.wait(500)
    cy.get('[id="Ignore Case Differences"]').check()
    cy.contains('Confirm').click()
    cy.reload()
    cy.contains('Harry Zhang')
    cy.contains('z7654321').click()
    cy.get('[id="autotest-z7654321"]').click()
    cy.contains('7 prime: Passed').should('be.visible')

    cy.reload()
    cy.contains('Harry Zhang')
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Autotest Center').click()
    cy.contains('7 prime').click()
    cy.contains('nUmber')
    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).clear().type('7 prime test')
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).clear().type('Enter  a number:\nIs prime\nEnter a number:\n');
    cy.contains('Confirm').click()
    cy.reload()
    cy.contains('Harry Zhang')
    cy.contains('z7654321').click()
    cy.get('[id="autotest-z7654321"]').click()
    cy.contains('7 prime test: Failed').should('be.visible')
    cy.reload()
    cy.wait(1500)
    cy.contains('Harry Zhang')
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Tolerance Settings').click()
    cy.wait(500)
    cy.get('input[id="Ignore Whitespaces Amount"]').check()
    cy.contains('Confirm').click()
    cy.reload()
    cy.contains('Harry Zhang')
    cy.contains('z7654321').click()
    cy.get('[id="autotest-z7654321"]').click()
    cy.contains('7 prime test: Passed').should('be.visible')
    cy.reload()
    cy.get('[id="back-to-course-button"]').click()
    cy.get('button[id="Tolerance and Extension-delete"]').click()
    cy.contains('(Tolerance and Extension)').should('be.visible')
    cy.contains('Do you really want to delete this task?').should('be.visible')
    cy.contains('Delete').click()

  })

})
