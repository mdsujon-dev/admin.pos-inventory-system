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
});
