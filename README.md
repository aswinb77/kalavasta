# Kalavasta — Kerala Weather Dashboard

Kalavasta is a Kerala-focused weather dashboard built with React, TypeScript, Vite, and Leaflet.

## What it does

- Renders a Kerala district map with interactive hover and selection
- Highlights the selected district and user location clearly
- Fetches live weather from the Open-Meteo API
- Shows current conditions and a 3-day forecast for the selected district
- Provides a floating paper-plane locate button to center the map on the user

## Features

- District selection via dropdown or map click
- Ivory-themed district highlight and hover styling
- Floating locate button for geolocation
- Responsive dashboard layout
- Live Open-Meteo weather integration

## Tech stack

- React
- TypeScript
- Vite
- Leaflet
- Open-Meteo API

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in your terminal.

## Build for production

```bash
npm run build
```

## Notes

- No API key is required for Open-Meteo.
- Select a district before the weather card appears.
- Click the floating paper-plane button to locate your browser position.

## Improvements to add

- Better Malayalam district names and local branding
- Hourly weather view for the selected district
- A simple summary panel for Kerala-wide weather
- Deployment to Netlify, Vercel, or GitHub Pages

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
