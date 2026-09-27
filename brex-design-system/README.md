# Brex Design System Implementation

This is a functional implementation of the Brex design system as specified in the style reference. It demonstrates the color tokens, typography, spacing, and components defined in the Brex design system.

## Features Implemented

- **Color Tokens**: All colors from the Brex design system implemented as CSS custom properties
- **Typography**: Implementation of Inter and Flecha fonts with proper scaling, tracking, and leading
- **Spacing System**: 8px-based spacing scale
- **Border Radius**: Consistent 12px radius for interactive elements, 6px for tags
- **Components**:
  - Navigation bar with Brex branding
  - Hero section with email capture
  - Feature category cards
  - Footer with multi-column links
  - Primary buttons (Ember-colored)
  - Ghost/link buttons
  - Email input fields

## Design System Compliance

This implementation follows all the guidelines from the Brex design system:

### Do's
- Uses Ember (#ff5900) exclusively for primary actions
- Applies Inter's negative tracking to all sizes
- Uses 12px border-radius on all interactive surfaces
- Maintains proper section gaps (48-80px) and card padding (24-32px)
- Defaults to Paper canvas with Fog for section contrast
- Uses Graphite for body paragraphs and Pewter for helper text
- Disables contextual alternates and ligatures on Inter (via font-feature-settings in practice)

### Don'ts
- No secondary accent colors introduced
- No drop shadows for card elevation
- Flecha used only for display headlines
- Body text paragraphs left-aligned
- Ember reserved for CTA buttons and standalone link phrases
- Consistent border-radius values within component groups
- Announcement bar background used only at top of page

## Files

- `index.html`: Main HTML file showcasing the design system
- `styles.css`: CSS implementation of the Brex design tokens and components

## Browser Support

This implementation uses modern CSS features and should work in:
- Chrome 49+
- Firefox 45+
- Safari 10+
- Edge 16+

## Local Development

To run this locally:

1. Clone or download this repository
2. Open `index.html` in your web browser
3. No build process or dependencies required

## Deployment

This implementation is ready for deployment to any static hosting service including Vercel, Netlify, or GitHub Pages.