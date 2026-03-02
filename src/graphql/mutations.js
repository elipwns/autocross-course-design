export const createCourse = /* GraphQL */ `
  mutation CreateCourse($input: CreateCourseInput!) {
    createCourse(input: $input) {
      id
      name
      description
      venueId
      eventId
      coneCount
      owner
      isDraft
      isPublic
      createdAt
    }
  }
`;

export const updateCourse = /* GraphQL */ `
  mutation UpdateCourse($input: UpdateCourseInput!) {
    updateCourse(input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const deleteCourse = /* GraphQL */ `
  mutation DeleteCourse($input: DeleteCourseInput!) {
    deleteCourse(input: $input) {
      id
    }
  }
`;

export const createVenue = /* GraphQL */ `
  mutation CreateVenue($input: CreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      description
      centerLat
      centerLng
      boundaries
      isPreset
      owner
    }
  }
`;

export const updateVenue = /* GraphQL */ `
  mutation UpdateVenue($input: UpdateVenueInput!) {
    updateVenue(input: $input) {
      id
      name
      centerLat
      centerLng
      boundaries
    }
  }
`;

export const deleteVenue = /* GraphQL */ `
  mutation DeleteVenue($input: DeleteVenueInput!) {
    deleteVenue(input: $input) {
      id
    }
  }
`;

export const createEvent = /* GraphQL */ `
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      date
      description
      venueId
      status
      owner
      createdAt
    }
  }
`;

export const updateEvent = /* GraphQL */ `
  mutation UpdateEvent($input: UpdateEventInput!) {
    updateEvent(input: $input) {
      id
      name
      date
      description
      venueId
      status
      owner
    }
  }
`;

export const deleteEvent = /* GraphQL */ `
  mutation DeleteEvent($input: DeleteEventInput!) {
    deleteEvent(input: $input) {
      id
    }
  }
`;

export const createVote = /* GraphQL */ `
  mutation CreateVote($input: CreateVoteInput!) {
    createVote(input: $input) {
      id
      courseId
      eventId
      userId
      createdAt
    }
  }
`;

export const deleteVote = /* GraphQL */ `
  mutation DeleteVote($input: DeleteVoteInput!) {
    deleteVote(input: $input) {
      id
    }
  }
`;
