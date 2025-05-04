# Autocross Course Designer - Technical Architecture

This document outlines the technical architecture and implementation details for the Autocross Course Designer application.

## Frontend Architecture

### React Component Structure

```
App
├── NavigationBar
├── Routes
│   ├── Homepage
│   ├── CourseDesign
│   │   ├── VenueSelector
│   │   │   ├── ImageUpload
│   │   │   └── GoogleMapsIntegration
│   │   ├── BoundaryEditor
│   │   ├── CourseEditor
│   │   │   ├── DrawingCanvas
│   │   │   ├── ElementLibrary
│   │   │   └── CourseProperties
│   │   └── CoursePreview
│   ├── Voting
│   │   ├── CourseList
│   │   ├── CourseCard
│   │   └── VotingControls
│   ├── ClubAdmin
│   │   ├── MemberManagement
│   │   ├── VenueManagement
│   │   └── CourseApproval
│   ├── UserProfile
│   └── Authentication
│       ├── Login
│       └── Register
└── SharedComponents
    ├── Modal
    ├── Notifications
    └── Footer
```

### State Management

- **React Context API**: For global state management
- **Custom Hooks**: For reusable logic
- **Local Component State**: For component-specific state

### Key Technologies

- **React 19**: Core UI library
- **React Router 7**: Navigation and routing
- **HTML5 Canvas API**: For drawing functionality
- **CSS Modules**: For component-specific styling
- **Google Maps API**: For venue selection and mapping

## Backend Architecture (AWS Amplify)

### Authentication

- **Amazon Cognito**: User authentication and authorization
- **JWT Tokens**: Secure API access
- **Role-Based Access Control**: Member vs. Admin permissions

### Data Storage

- **Amazon DynamoDB**: NoSQL database for application data
  - Users table
  - Clubs table
  - Venues table
  - Courses table
  - Votes table

- **Amazon S3**: Storage for images and course files
  - Venue images
  - Course exports
  - User avatars

### API Layer

- **AWS AppSync**: GraphQL API for data operations
- **AWS Lambda**: Serverless functions for business logic
  - Course validation
  - AI suggestions
  - Image processing

### Serverless Functions

```
Functions
├── Authentication
│   ├── postConfirmation
│   └── customAuthorizer
├── Courses
│   ├── createCourse
│   ├── updateCourse
│   ├── validateCourse
│   └── generateCoursePDF
├── Venues
│   ├── processVenueImage
│   └── extractBoundaries
├── Voting
│   ├── submitVote
│   └── calculateResults
└── AI
    ├── suggestCourse
    └── analyzeCourse
```

## Data Models

### User

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "name": "string",
  "role": "enum(MEMBER, ADMIN)",
  "clubId": "string",
  "preferences": {
    "favoriteElements": ["string"],
    "designStyle": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Club

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "adminIds": ["string"],
  "memberIds": ["string"],
  "resources": {
    "coneCount": "number",
    "equipment": ["string"]
  },
  "venues": ["string"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Venue

```json
{
  "id": "string",
  "name": "string",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "boundaries": ["array of coordinates"],
  "surface": "string",
  "size": "number",
  "imageUrl": "string",
  "clubId": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Course

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "venueId": "string",
  "creatorId": "string",
  "elements": [
    {
      "type": "string",
      "position": { "x": "number", "y": "number" },
      "rotation": "number",
      "properties": {}
    }
  ],
  "startPosition": { "x": "number", "y": "number" },
  "finishPosition": { "x": "number", "y": "number" },
  "coneCount": "number",
  "length": "number",
  "difficulty": "number",
  "status": "enum(DRAFT, SUBMITTED, APPROVED, REJECTED)",
  "votes": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Integration Points

### Google Maps API
- Venue selection
- Coordinate mapping
- Distance calculations

### AWS Services
- Authentication (Cognito)
- Storage (S3)
- Database (DynamoDB)
- API (AppSync/GraphQL)
- Functions (Lambda)
- Hosting (Amplify)

### Future AI Integration
- OpenAI API for course suggestions
- Custom ML models for course analysis

## Deployment Strategy

### CI/CD Pipeline
- GitHub integration
- Automated testing
- Staged deployments (dev, test, prod)

### Environment Configuration
- Environment variables for API keys
- Feature flags for gradual rollout
- A/B testing capabilities

### Monitoring
- Error tracking
- Performance monitoring
- Usage analytics