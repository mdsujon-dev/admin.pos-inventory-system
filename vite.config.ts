import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /*
      Bound to every interface, not just localhost.

      The till's phone scanner is opened on a handset over the shop's wifi,
      and a dev server listening only on 127.0.0.1 is a server that machine
      cannot reach — the QR code resolves to an address that answers on the
      till and nowhere else.
    */
    host: true,
  },
  optimizeDeps: {
    include: ["moment-hijri"],
  },
  build: {
    /*
      Raised from Rollup's 500 kB only after the splitting below was real: the
      export writers and the charts now arrive when they are used, so what is
      left above the line is antd (~1.1 MB), which every screen in the panel
      draws itself with and which cannot be split into anything meaningful.

      Kept at 1200 rather than switched off, so a new dependency that quietly
      doubles a chunk still says so.
    */
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        /*
          Everything shipped as one 4.5 MB file, which is the whole panel
          downloaded before the login form can be drawn. These are the heavy
          dependencies that do not change between releases, split out so the
          browser caches them once and a rebuild only re-fetches our own code.

          Grouped by what they are rather than one chunk per package: a hundred
          tiny chunks costs a hundred requests, which on a shop's connection is
          worse than the file it replaced.
        */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Matched on the module's own path rather than by naming entry
          // points. Listing entries lets Rollup place shared transitive
          // dependencies wherever it likes, which is how antd and the charts
          // ended up importing each other — a circular chunk it warned about.
          // Deciding per module means every file has exactly one home.
          const pkg = /[\\/]node_modules[\\/](@[^\\/]+[\\/][^\\/]+|[^\\/]+)/.exec(
            id
          )?.[1]?.replace(/\\/g, "/");
          if (!pkg) return "vendor";

          // Just the runtime itself. React Router deliberately stays out: it
          // pulls @remix-run/router, which lands in `vendor`, and a `react`
          // chunk that imports `vendor` while every vendor package imports
          // React is the circular chunk Rollup complains about. These three
          // depend on nothing outside themselves, so the arrow points one way.
          if (/^(react|react-dom|scheduler)$/.test(pkg)) return "react";
          if (/^(antd|antd-style|@ant-design\/.*|rc-.*|@rc-component\/.*)$/.test(pkg))
            return "antd";
          if (/^(recharts|apexcharts|react-apexcharts|d3-.*|victory-.*)$/.test(pkg))
            return "charts";
          // One chunk per output format, not one "documents" bundle: these are
          // reached only through `await import()` in tableExport, and a
          // cashier exporting a list to Excel should not also download the PDF
          // and Word writers to do it.
          if (/^(xlsx)$/.test(pkg)) return "export-xlsx";
          if (/^(jspdf|html2canvas|canvg|dompurify)$/.test(pkg))
            return "export-pdf";
          if (/^(docx)$/.test(pkg)) return "export-docx";
          if (/^(quill|quill-better-table|react-quill|jodit|jodit-react|tinymce|@tinymce\/.*)$/.test(pkg))
            return "editor";
          if (/^(@reduxjs\/.*|react-redux|redux|redux-persist|immer|reselect)$/.test(pkg))
            return "state";

          return "vendor";
        },
      },
    },
  },
});
