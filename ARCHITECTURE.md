# Autocross Course Designer — Architecture

## Frontend

### Component Structure

```
App
├── NavigationBar
├── Routes
│   ├── Homepage
│   ├── CourseDesignPage
│   │   ├── MapVenueSelector       # Mapbox-based venue selection
│   │   ├── MapCourseDesigner      # Course drawing on Mapbox map
│   │   ├── CourseDesigner         # Canvas-based course designer
│   │   ├── CourseElementsPanel    # Element library sidebar
│   │   └── ElementPropertiesPanel # Selected element properties
│   ├── VotingPage
│   ├── EventCalendarPage
│   └── EventCreationPage
└── (shared components to be built)
```

### State Management
- React Context API for global state
- Local component state for UI-specific state
- No external state library currently

### Key Technologies
- **React 19** + **Vite**
- **React Router v7**
- **Mapbox GL** + **react-map-gl** — map display, satellite imagery, drawing
- **@mapbox/mapbox-gl-draw** — boundary and course drawing directly on map
- **AWS Amplify v6** — auth and backend

## Backend (AWS Amplify)

### Authentication
- Amazon Cognito via Amplify Auth
- JWT tokens for API access
- Roles: MEMBER, ADMIN (role-based access not yet enforced in frontend)

### Data Storage
- **DynamoDB** (via AppSync/GraphQL): users, clubs, venues, courses, votes
- **S3**: venue images, course exports, user avatars

### API
- AWS AppSync (GraphQL)
- Amplify v6 client pattern:
  ```javascript
  import { generateClient } from 'aws-amplify/api';
  const client = generateClient();
  const result = await client.graphql({ query: createCourse, variables: { input: courseData } });
  ```

### Lambda Functions (planned)
- Course validation
- PDF export generation
- AI course suggestions

## Data Models

### User
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "MEMBER | ADMIN",
  "clubId": "string",
  "createdAt": "timestamp"
}
```

### Venue
```json
{
  "id": "string",
  "name": "string",
  "location": { "lat": "number", "lng": "number" },
  "boundaries": ["array of lat/lng coordinates"],
  "hazards": ["array of marked obstacles"],
  "clubId": "string",
  "imageUrl": "string"
}
```

### Course
```json
{
  "id": "string",
  "name": "string",
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
  "status": "DRAFT | SUBMITTED | APPROVED | REJECTED",
  "eventId": "string"
}
```

### Club
```json
{
  "id": "string",
  "name": "string",
  "adminIds": ["string"],
  "memberIds": ["string"],
  "venueIds": ["string"],
  "resources": { "coneCount": "number" }
}
```

## Deployment

- Hosting: AWS Amplify Hosting (CI/CD via GitHub integration)
- Environments: dev → prod
- Config: environment variables for Mapbox token, Amplify config
