# iGive

**iGive** is a modern educational tool designed to streamline the process of managing submissions, grading, and feedback for academic assignments. This platform aims to replace traditional, cumbersome submission systems with a user-friendly, efficient, and scalable solution.

Simply run `docker-compose up --build` and access `https://localhost:3901` to get started.

## Tech Stack

**iGive** leverages a robust combination of technologies to ensure fast, reliable, and responsive user experiences:

### Frontend:

- **React**: Utilized for building a dynamic and interactive user interface with efficient state management.
- **TypeScript**: Adds static type definitions to enhance code quality and reliability.

### Backend:

- **Firebase**: Provides a comprehensive suite of tools including real-time databases, authentication, and cloud functions to power the backend.
    - Firestore: Provides a scalable NoSQL cloud database
    - Firebase storage: Cloud storage solution that integrates with Firebase services

## Features

- **Submission Portal**: Students can easily submit their assignments through a user-friendly web interface.
- **Real-Time Feedback**: Immediate automated feedback upon submissions to aid in learning.
- **Grading System**: Automated grading system that simplifies the evaluation process.
- **Administration Panel**: Allows educators to manage courses, assignments, and user roles efficiently.

## Testing

- Ensure you are in the root directory.
- Run the following commands:
- `cd frontend` - switch to frontend folder
- `npm i` - install requirements to run cypress
- `node_modules/.bin/cypress open` - open cypress from frontend folder
- Follow any instructions that pop up (likely including `node_modules/.bin/cypress install`)
- `node_modules/.bin/cypress open` - open the graphic user interface.
- Click on one of the tests to run!
- To run cypress tests with no graphic user interface: "node_modules/.bin/cypress run"

## API Documentation

https://app.swaggerhub.com/apis-docs/alxxwu/iGive/