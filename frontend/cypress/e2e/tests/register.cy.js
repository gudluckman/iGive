/// <reference types="cypress" />

describe('authentication error checking', () => {
  beforeEach(() => {
    cy.visit('127.0.0.1:3901')
    cy.wait(1000);
    cy.get('body').then(($body) => {
      if ($body.find('#user-avatar').length > 0) {
        cy.get('#user-avatar').click();
        cy.get('#logout-button').click();
      }
    })
  })

  it('registering errors', () => {
      cy.contains('SIGN UP').click()
      cy.get('input[id="firstName"]').type('first')
      cy.get('input[id="lastName"]').type('last')
      cy.get('input[type="email"]').type('notzid@notzid.com')
      cy.get('input[id="password"]').type('password')
      cy.get('button').contains('Register').should('be.disabled')
      cy.contains('Invalid').should('be.visible')
      cy.get('input[type="email"]').clear().type('z5737472@ad.unsw.edu.au')
      cy.get('button').contains('Register').should('be.enabled')
      cy.get('input[id="firstName"]').clear()
      cy.get('button').contains('Register').click()
      cy.contains('Authentication Error').should('be.visible')
      cy.contains('Include uppercase').should('be.visible')
      cy.contains('Include numbers').should('be.visible')
      cy.get('input[id="password"]').type('Password1')
      cy.contains('Include uppercase').should('not.exist')
      cy.contains('Include numbers').should('not.exist')
  })

  it('wrong login', () => {
    cy.get('input[type="email"]').type('nonsense')
    cy.get('input[type="password"]').type('nonsense')
    cy.contains('Sign In').click()
    cy.contains('auth/invalid-email').should('be.visible')

    cy.get('input[type="email"]').clear().type('z6234163@ad.unsw.edu.au') // email doesn't exist
    cy.contains('Sign In').click()
    cy.contains('auth/invalid-credential').should('be.visible')

    cy.get('input[type="email"]').clear().type('z7654321@ad.unsw.edu.au') // email exists
    cy.contains('Sign In').click()
    cy.contains('auth/invalid-credential').should('be.visible')
  })
})