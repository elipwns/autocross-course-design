# Styles

This directory contains CSS files for styling the application.

## Style Files

### index.css
Base styles that apply to the entire application:
- Typography
- Basic element styling
- Responsive adjustments

### App.css
Styles for the main application layout and common components:
- Navigation bar
- Homepage
- Voting page
- Common buttons and UI elements

### CourseDesign.css
Specialized styles for the course design functionality:
- Form elements
- Canvas components
- Drawing tools
- Progress indicators

## Organization

Styles are organized by feature area rather than by component to reduce duplication and ensure consistency across the application.

## CSS Variables

We use CSS variables for consistent theming:

```css
:root {
  --primary-color: #333;
  --secondary-color: #f0f0f0;
  --accent-color: #0066cc;
  --text-color: #333;
  --border-color: #ddd;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
  --border-radius: 4px;
}
```

## Responsive Design

All styles are designed to be responsive, with specific breakpoints:
- Mobile: up to 768px
- Tablet: 769px to 1024px
- Desktop: 1025px and above

## Future Improvements

- Consider migrating to CSS modules or styled-components
- Implement a design system with consistent spacing and typography
- Add dark mode support