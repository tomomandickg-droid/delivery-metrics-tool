import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths: the same build works locally at "/" and on GitHub Pages under
  // "/delivery-metrics-tool/" (plan.md §11.1). The sample is fetched relative to the page too.
  base: './',
  plugins: [react()],
});
