# Pages

This directory contains the top-level page components for the application.

## Page Components

### Homepage
The landing page for the application, providing an overview of features and calls to action.

### CourseDesignPage
The main page for designing autocross courses, with a multi-step workflow:
1. Venue selection (upload image and draw boundaries)
2. Course design (create course layout with elements)
3. Course saving (name, describe, and save the course)

### VotingPage
Page for browsing and voting on course designs submitted by community members.

## Structure

Each page component:
- Represents a complete screen in the application
- Maps to a specific route in the router
- May contain multiple smaller components
- Handles page-level state and logic

## Usage

Import pages individually:
```jsx
import Homepage from './pages/Homepage';
import CourseDesignPage from './pages/CourseDesignPage';
```

Or import from the index file:
```jsx
import { Homepage, CourseDesignPage } from './pages';
```

## Planned Pages

- **LoginPage**: User authentication
- **RegisterPage**: New user registration
- **ProfilePage**: User profile and saved courses
- **AdminPage**: Admin dashboard for club management