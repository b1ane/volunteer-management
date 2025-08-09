# Volunteer Management Backend

## Event Management Module

This backend provides a mock API for managing events, including validation and unit tests. No database is used; all data is in-memory.

### Features
- Create, read, update, and delete events
- Field validation (required, type, length)
- Unit tests with Jest and Supertest
- Code coverage reporting

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   node index.js
   ```
   The server runs at `http://localhost:5000`.

## API Endpoints

### Create Event
- **POST** `/events`
- **Body:**
  ```json
  {
    "name": "Event Name",
    "details": "Event details (optional, max 500 chars)",
    "location": "Location",
    "requiredSkills": ["Skill1", "Skill2"],
    "urgency": "low" | "medium" | "high"
  }
  ```

### Get All Events
- **GET** `/events`

### Get Event by ID
- **GET** `/events/:id`

### Update Event
- **PUT** `/events/:id`
- **Body:** Same as POST

### Delete Event
- **DELETE** `/events/:id`

## Validation Rules
- `name`: required, string, max 100 chars
- `location`: required, string, max 100 chars
- `urgency`: required, one of `low`, `medium`, `high`
- `requiredSkills`: required, array of at least one string
- `details`: optional, string, max 500 chars

## Testing & Coverage

- Run all tests:
  ```sh
  npm test
  ```
- Run tests in watch mode:
  ```sh
  npm run test:watch
  ```
- Coverage report will be shown in the terminal and in the `coverage/` folder.

## Contribution & Team
- Use feature branches and pull requests for changes.
- Document team contributions in this README.

## GitHub
- Push all code to your GitHub repository.
- Include this README and all test files. 