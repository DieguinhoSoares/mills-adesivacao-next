import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Troque 'mills-adesivacao-next' pelo nome real do repositório no GitHub,
// igual foi feito no mills-logistica. Em dev local isso não afeta nada.
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/mills-adesivacao-next/' : '/',
  server: {
    port: 5173,
  },
});
