/**
 * main.tsx — REACT ENTRY POINT — frontend/src/main.tsx
 *
 * PURPOSE:
 * The very first file executed by the browser/renderer process.
 * Mounts the React application into the DOM.
 *
 * WHAT HAPPENS:
 * 1. Vite (the bundler) starts here — this is the "entry" defined in vite.config.ts.
 * 2. index.css is imported globally — applies CSS reset, CSS variables (:root),
 *    and utility classes (font-small, no-animations, etc.) to the whole page.
 * 3. ReactDOM.createRoot() creates a React root attached to the #root <div>
 *    (defined in frontend/index.html).
 * 4. .render() renders the App component inside React.StrictMode.
 *
 * createRoot vs render (React 18+):
 * createRoot() is the React 18 API (replaces ReactDOM.render()).
 * It enables concurrent features (Suspense, transitions, etc.) and is required
 * for proper React 18 behavior.
 *
 * getElementById('root')!:
 * The ! is a TypeScript non-null assertion — tells TS "this will never be null".
 * Safe here because index.html always has <div id="root"></div>.
 *
 * React.StrictMode:
 * A development-only wrapper that:
 *   - Double-invokes render functions and effects to detect side effects
 *   - Warns about deprecated APIs (e.g. legacy string refs, findDOMNode)
 *   - Has NO effect in production builds
 * The double-invocation is why useEffect may appear to fire twice in dev mode.
 * This is intentional and expected behavior, not a bug.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';  // Global styles: CSS variables, resets, body class utilities

/**
 * Mount the React app.
 * document.getElementById('root') → the <div id="root"> in frontend/index.html
 * createRoot() → React 18 concurrent mode root
 * .render() → kicks off the component tree starting with <App />
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);