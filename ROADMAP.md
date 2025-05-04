# Autocross Course Designer Roadmap

This document outlines the development plan and feature roadmap for the Autocross Course Designer application.

## Phase 1: Core Functionality

### Course Design Interface
- [x] Basic page structure and navigation
- [x] Canvas-based drawing implementation
- [x] Image upload functionality
- [x] Basic drawing tools (lines, curves)
- [x] Start/finish point placement

### User Management
- [ ] Basic authentication (login/register)
- [ ] User profiles
- [ ] Role-based permissions (member vs. admin)

## Phase 2: Enhanced Design Features

### Venue Management
- [x] Boundary line drawing and saving
- [x] Venue information storage
- [ ] Google Maps integration
- [ ] Venue sharing between club members
- [ ] **Hazard marking for admins** (light poles, fences, walls)
- [ ] **Preset venues for admins to add and share**

### Course Elements
- [x] Element definitions with customizable properties
  - [x] Chicago Box - defined by entry/exit width, box length/width
  - [x] Slalom - defined by cone count, spacing, variable spacing, offset
  - [x] Crossover Box - defined by size
  - [x] Pointer Cones - defined by count, direction, placement
  - [x] Gate - defined by width
  - [x] Chicane - defined by gate count, width, spacing, offset
  - [x] Sweeper - defined by radius, angle, cone spacing
  - [x] Offset Slalom - defined by sections, cones per section, spacing, offset
  - [x] Lane Change - defined by width, length, lane count
- [ ] Element placement on course
- [ ] Element rotation and scaling
- [ ] Cone counting functionality

## Phase 3: Collaboration Features

### Course Sharing
- [ ] Save course designs to database
- [ ] Browse courses by venue or creator
- [ ] Course preview functionality
- [ ] Course metadata (difficulty, style, etc.)
- [ ] **Draft saving and editing**
- [ ] **Course copying and modification**

### Voting System
- [ ] Upvote/downvote functionality
- [ ] Comments and feedback
- [ ] Featured courses section
- [ ] Notification system for new courses

## Phase 4: Club Administration

### Admin Dashboard
- [ ] Club management interface
- [ ] Member management
- [ ] Course approval workflow
- [ ] Event scheduling
- [ ] **Super admin capabilities**
- [ ] **Venue presets management**

### Resource Management
- [ ] Cone inventory tracking
- [ ] Venue availability calendar
- [ ] Equipment requirements calculator
- [ ] **Hazard management and safety checks**

## Phase 5: Advanced Features

### AI Integration
- [ ] Course suggestion algorithm
- [ ] Optimization recommendations
- [ ] Automated safety checks
- [ ] Course difficulty analysis

### Analytics
- [ ] Estimated run times
- [ ] Heat mapping for speed/technical sections
- [ ] Course comparison tools
- [ ] Historical data analysis

## Phase 6: Mobile and Offline Support

### Mobile Optimization
- [ ] Responsive design improvements
- [ ] Touch-friendly interface
- [ ] Mobile-specific features

### Offline Functionality
- [ ] Local storage of courses
- [ ] Offline editing capabilities
- [ ] Sync when connection restored

## Technical Considerations

### Performance Optimization
- [ ] Canvas rendering improvements
- [ ] Lazy loading for course library
- [ ] Image compression for uploads

### Security
- [ ] Data encryption
- [ ] Permission validation
- [ ] API security

### Scalability
- [ ] Database optimization
- [ ] CDN integration for assets
- [ ] Serverless function implementation