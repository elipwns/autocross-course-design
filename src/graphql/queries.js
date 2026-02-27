export const getCourse = /* GraphQL */ `
  query GetCourse($id: ID!) {
    getCourse(id: $id) {
      id
      name
      description
      venueId
      eventId
      courseLines
      startPoint
      finishPoint
      elements
      coneCount
      courseLength
      notes
      owner
      isDraft
      isPublic
      createdAt
      updatedAt
    }
  }
`;

export const listCourses = /* GraphQL */ `
  query ListCourses($filter: CourseFilterInput, $limit: Int, $nextToken: String) {
    listCourses(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;

export const listCoursesByEvent = /* GraphQL */ `
  query ListCoursesByEvent($eventId: ID!, $limit: Int, $nextToken: String) {
    listCoursesByEvent(eventId: $eventId, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;

export const getVenue = /* GraphQL */ `
  query GetVenue($id: ID!) {
    getVenue(id: $id) {
      id
      name
      description
      imageKey
      centerLat
      centerLng
      boundaries
      isPreset
      owner
    }
  }
`;

export const listVenues = /* GraphQL */ `
  query ListVenues($filter: VenueFilterInput, $limit: Int, $nextToken: String) {
    listVenues(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
        centerLat
        centerLng
        isPreset
        owner
      }
      nextToken
    }
  }
`;

export const getEvent = /* GraphQL */ `
  query GetEvent($id: ID!) {
    getEvent(id: $id) {
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

export const listEvents = /* GraphQL */ `
  query ListEvents($limit: Int, $nextToken: String) {
    listEvents(limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        date
        description
        venueId
        status
        owner
        createdAt
      }
      nextToken
    }
  }
`;
