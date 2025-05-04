# [Autocross Course Designer](https://www.autocrosscoursedesign.com/)

A web application for designing, sharing, and voting on autocross courses.

## Overview

Autocross Course Designer is a platform that helps autocross enthusiasts and event organizers design and collaborate on course layouts. The application allows users to create courses within venue boundaries, share designs with club members, and vote on preferred layouts for upcoming events.

## Features

### For Club Members

- **Course Design**
  - Upload venue images or use Google Maps integration
  - Draw courses within predefined venue boundaries
  - Place standard autocross elements (slaloms, chicanes, etc.)
  - Create custom course elements with freehand drawing
  - Set start and finish points
  - Track cone count to ensure it stays within club limits

- **Course Sharing & Voting**
  - Save and share course designs with club members
  - Browse courses created by other members
  - Vote on favorite course designs
  - Comment and provide feedback on courses

### For Club Administrators

- **Venue Management**
  - Define venue boundaries for members to use
  - Set available cone count limits
  - Approve or modify submitted course designs
  - Schedule courses for upcoming events

### Advanced Features (Planned)

- **AI Course Suggestions**
  - Get AI-generated course ideas based on venue constraints
  - Receive optimization suggestions for existing courses
  - Generate variations of popular course layouts

- **Course Analysis**
  - Estimate average speeds and times
  - Identify potential safety concerns
  - Analyze course flow and technical difficulty

## Technical Implementation

- Built with React 19 and modern JavaScript
- AWS Amplify for backend services and hosting
- Interactive canvas-based drawing tools
- Google Maps API integration for venue selection
- User authentication and role-based permissions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/autocross-course-design.git
   cd autocross-course-design
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
