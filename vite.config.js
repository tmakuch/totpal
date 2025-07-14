/** @type {import('vite').UserConfig} */
export default {
  base: "/totpal",
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/totpal/ws": {
        target: "ws://localhost:3001/totpal",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      mangle: false,
      compress: {
        keep_fnames: true,
      },
      format: {
        beautify: false,
      },
    },
  },
  plugins: [],
};
