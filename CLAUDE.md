# DC Rack Viewer

A 3D data center rack visualization tool built with React, Vite, and Three.js.

## Project Structure

- `src/` - React components and application logic
- `public/` - Static assets
- `dist/` - Built output
- `vite.config.js` - Vite configuration

## Getting Started

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Build for production
npm run lint     # Run Oxlint
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** - UI framework
- **Vite 8** - Build tool with HMR
- **Three.js** - 3D graphics
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Helpful utilities for R3F

## Development Notes

- Uses Oxlint for linting
- HMR enabled for fast development
- No TypeScript currently (see README for migration option)
