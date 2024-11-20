/// <reference types="cypress" />

describe('autotest path', () => {
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

  it('autotest', () => {
    cy.contains('COMP1511').click()
    // create new task
    cy.contains('New Task').click()
    cy.contains('Task Name').parent().find('input').type('Cypress Task')
    cy.contains('Maximum Automark').parent().find('input').type('80')
    cy.contains('Maximum Style Mark').parent().find('input').type('20')
    cy.get('input[type="datetime-local"]').type('2124-12-24T00:00')
    cy.contains('File Restrictions').click()
    cy.contains('Required File').parent().find('input').type('isprime.py')
    cy.contains('Max File Size').parent().find('input').clear().type('2')
    cy.contains('Create Task').click()
    cy.contains('Task created successfully').should('be.visible')
    cy.contains('Cypress Task').click()
    cy.contains('Harry Zhang')

    // upload script and create autotests
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('Autotest Center').click()
    cy.contains('Upload Script File').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/run.sh', { force: true })
    cy.contains('Script uploaded (automark)').should('be.visible')
    cy.contains('Script uploaded (autotest)').should('be.visible')

    // automark hidden tests
    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('7 prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('7');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nIs prime\nEnter a number:\n');
    cy.get('div[role="dialog"]').contains('Hidden:').parent().find('input[type="checkbox"]').check();
    cy.get('button').contains('Add').click()
    cy.contains('7 prime added').should('be.visible')
    cy.contains('Enter a number:\nIs prime\nEnter a number:\n').should('not.exist')

    // Wait until form clears
    cy.contains('Enter a number:').should('not.exist')

    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('6 not prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('6');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nNot prime\nEnter a number:\n');
    cy.get('div[role="dialog"]').contains('Hidden:').parent().find('input[type="checkbox"]').check();
    cy.get('button').contains('Add').click()

    cy.contains('Enter a number:').should('not.exist')

    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('420 not prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('420');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nNot prime\nEnter a number:\n');
    cy.get('div[role="dialog"]').contains('Hidden:').parent().find('input[type="checkbox"]').check();
    cy.get('button').contains('Add').click()

    // visible autotests
    cy.contains('Enter a number:').should('not.exist')

    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('7 prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('7');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nIs prime\nEnter a number:\n');
    cy.get('button').contains('Add').click()

    cy.contains('Enter a number:').should('not.exist')

    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('6 not prime')
    cy.get('div[role="dialog"]').contains('Input').parent().find('textarea').eq(0).type('6');
    cy.get('div[role="dialog"]').contains('Output').parent().find('textarea').eq(0).type('Enter a number:\nNot prime\nEnter a number:\n');
    cy.get('button').contains('Add').click()

    cy.contains('Enter a number:').should('not.exist')

    cy.get('[id="swap"]').click()
    cy.get('div[role="dialog"]').contains('Test Name').parent().find('input[type="text"]').eq(0).type('420 prime')
    cy.get('[id="file-upload-in').selectFile('cypress/fixtures/in.txt', { force: true })
    cy.get('[id="file-upload-out').selectFile('cypress/fixtures/out.txt', { force: true })
    cy.get('button').contains('Add').click()

    cy.get('div[role="dialog"]').get('[data-testid="CloseIcon"]').first().click()

    cy.contains('Edward Lukman').click()
    cy.contains('Logout').click()

    // submit isprime.py
    cy.get('input[type="email"]').type('z7654321@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('password')
    cy.contains('Sign In').click()
    cy.contains('COMP1511').click()
    cy.contains('Cypress Task').click()
    cy.get('[id="make-submission-Cypress Task"]').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/notprime.py', { force: true })
    cy.get('#submit-files-button').click()
    cy.contains('Error').should('be.visible')
    cy.get('input[type="file"]').selectFile('cypress/fixtures/isprime.py', { force: true })
    cy.get('#submit-files-button').click()
    cy.contains('Uploaded').should('be.visible')
    cy.contains('Cancel').click()

    cy.get('[id="run-autotests-Cypress Task"]').click()
    cy.contains('7 prime: Passed', { timeout: 10000 }).should('be.visible')
    cy.contains('6 not prime: Passed').should('be.visible')
    cy.contains('420 prime: Failed').should('be.visible')
    cy.get('#close-autotest-result-modal-button').click()
    cy.contains('Not available')
    cy.contains('Dave Rogers').click()
    cy.contains('Logout').click()

    // run automark and release marks
    cy.get('input[type="email"]').type('z5419884@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('foobar')
    cy.contains('Sign In').click()
    cy.contains('COMP1511').click()
    cy.contains('Cypress Task').click()
    cy.contains('Harry Zhang')
    cy.get('[id="admin-actions"]').click()
    cy.contains('Automarks').click()
    cy.contains('Run All').click()
    cy.contains('Complete!', { timeout: 10000 }).should('be.visible')
    cy.contains('Close').click()
    cy.get('span[aria-label="Overall Mark Status"]').click()

    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('View Submission Rate').click()
    cy.contains('Total enrolled students: ').should('be.visible')
    cy.contains('1 student').should('be.visible')
    cy.get('div[role="dialog"]').get('[data-testid="CloseIcon"]').first().click()

    cy.contains('Edward Lukman').click()
    cy.contains('Logout').click()


    cy.get('input[type="email"]').type('z7654321@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('password')
    cy.contains('Sign In').click()
    cy.contains('COMP1511').click()
    cy.contains('Cypress Task').click()
    cy.contains('53 / 80').should('be.visible')

    cy.contains('Dave Rogers').click()
    cy.contains('Logout').click()

    // clean up
    cy.get('input[type="email"]').type('z5419884@ad.unsw.edu.au')
    cy.get('input[type="password"]').type('foobar')
    cy.contains('Sign In').click()
    cy.contains('COMP1511').click()
    cy.contains('Cypress Task').click()
    cy.contains('Harry Zhang')
    cy.get('[data-testid="SettingsIcon"]').click();
    cy.contains('General Task Settings').click()
    cy.get('input[type="datetime-local"]').clear().type('2024-11-01T00:00')
    cy.contains('Confirm').click()
    cy.contains('Cancel').click()
    cy.get('[id="admin-actions"]').click()
    cy.contains('Automarks').click()
    cy.contains('Run All').click()
    cy.contains('Close').click()
    cy.get('svg[id="late-icon-z7654321"]').click()
    cy.contains('100% penalty').should('be.visible')
    cy.contains('53.0 marks deducted').should('be.visible')
    cy.contains('Close').click()
    cy.contains('0 / 100')
    cy.contains('z7654321').click()
    cy.get('button[id="special-consideration-z7654321"]').click()
    cy.contains('Extension Hours').parent().find('input').clear().type('4000')
    cy.contains('Reason').parent().find('textarea').first().type('pog work')
    cy.get('button').contains('Grant').click()
    cy.reload()
    cy.contains('Harry Zhang')
    cy.get('[id="admin-actions"]').click()
    cy.contains('Automarks').click()
    cy.contains('Run All').click()
    cy.contains('Close').click({timeout: 10000})
    cy.contains('53.0 / 100')
    cy.contains('Admin Courses').click()
    cy.contains('COMP1511').click()
    cy.get('button[id="Cypress Task-delete"]').click()
    cy.contains('(Cypress Task)').should('be.visible')
    cy.contains('Do you really want to delete this task?').should('be.visible')
    cy.contains('Delete').click()
    cy.contains('Deletion Successful!').should('be.visible')
  })
})
