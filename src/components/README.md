# Course Design Components

This directory contains the React components for the course design functionality.

## Component Overview

### ImageUpload
Handles uploading and previewing venue images.
- Supports large images up to 50MB
- Provides image preview
- Validates file types (JPG, PNG)

### BoundaryEditor
Allows drawing boundary lines on the uploaded venue image.
- Pan and zoom functionality for large images
- Draw polygon boundaries
- Multiple boundaries support
- Undo/redo functionality

### VenueSelector
Combines image upload and boundary editing into a complete venue selection workflow.
- Venue metadata (name, description)
- Boundary definition
- Preview and editing capabilities

### CourseDesigner
Provides tools for designing autocross courses on a selected venue.
- Multiple drawing modes (course lines, start/finish points, elements)
- Pan and zoom for large images
- Course statistics (cone count, length)
- Element placement (cones, slaloms)

## Pan and Zoom Features

Both the BoundaryEditor and CourseDesigner components support pan and zoom:

- **Pan**: Hold ALT + drag or use middle mouse button
- **Zoom**: Use mouse wheel or zoom buttons
- **Reset View**: Press 'R' key or click the reset button

## Usage

Import components individually:
```jsx
import ImageUpload from './components/ImageUpload';
import BoundaryEditor from './components/BoundaryEditor';
```

Or import from the index file:
```jsx
import { ImageUpload, BoundaryEditor } from './components';
```

## Component Hierarchy

```
CourseDesignPage
├── VenueSelector
│   ├── ImageUpload
│   └── BoundaryEditor
└── CourseDesigner
```

## Data Flow

1. User uploads an image via `ImageUpload`
2. User draws venue boundaries with `BoundaryEditor`
3. `VenueSelector` combines the image and boundaries into a venue object
4. `CourseDesigner` receives the venue and allows course creation
5. Course data is passed back to `CourseDesignPage` for saving

## Planned Features

### Hazard Marking for Admins
- Allow admins to mark hazards like light poles, fences, and walls
- Different visual representations for each hazard type
- Store hazard data with venue information
- Ensure course designs avoid hazardous areas
- Implement safety checks against hazards