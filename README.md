# Autocross Course Designer

A web application for designing, sharing, and voting on autocross courses for club events.

## Overview

Autocross Course Designer is a tool that allows autocross enthusiasts to:

- Design courses using an intuitive interface
- Share course designs with club members
- Vote on course designs for upcoming events
- Manage venue information and course elements

## Features

### Course Design

- **Venue Management**: Upload aerial images of venues and define boundaries
- **Course Drawing**: Create course layouts with intuitive drawing tools
- **Element Placement**: Add cones, slaloms, and other course elements
- **Customizable Elements**: Define properties for each element type:
  - Chicago Box - entry/exit width, box dimensions
  - Slalom - cone count, spacing, variable spacing, offset
  - Crossover Box - size
  - Pointer Cones - count, direction, placement
  - And more...

### Collaboration

- Share course designs with club members
- Vote on favorite designs
- Comment and provide feedback
- Save drafts and edit later

### Administration

- Admin tools for club management
- Venue preset management
- Course approval workflow
- Event scheduling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/autocross-course-design.git
   ```

2. Install dependencies:
   ```
   cd autocross-course-design
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/pages` - Page components
  - `/styles` - CSS files
  - `/utils` - Utility functions
  - `/hooks` - Custom React hooks
  - `/context` - React context providers

## Development Roadmap

See [ROADMAP.md](ROADMAP.md) for the detailed development plan.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all the autocross enthusiasts who provided feedback and ideas
- Special thanks to the open source community for the amazing tools that made this project possible