import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['frontend-production-bc305.up.railway.app'],
  },
})