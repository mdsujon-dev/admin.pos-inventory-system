import "@fortawesome/fontawesome-free/css/all.min.css";
import { ConfigProvider } from "antd";
// Lenis's own stylesheet. Small but not optional: it is what puts
// `overscroll-behavior: contain` on the elements marked `data-lenis-prevent`,
// so an inner scroller that reaches its end stops there instead of handing the
// rest of the gesture to the page behind it.
import "lenis/dist/lenis.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "./redux/features/store";
import router from "./routes/routes";
import "./styles/index.css";

const config = {
  token: {
    // Brand #019532 — keep in step with `--primary` in styles/index.css and
    // `primary.DEFAULT` in tailwind.config.js. antd cannot read either.
    colorPrimary: "#019532",
    colorLink: "#019532",
    colorPrimaryBg: "#01953230",

    /**
     * antd's own status palette, pointed at the brand.
     *
     * Left alone these default to a different hue each — success green, info
     * blue, warning gold — and they are not a theme setting anyone sees: they
     * leak out through Alert, Badge, Steps, Progress, message toasts and every
     * preset Tag, so a panel that is one colour everywhere else still flashes
     * blue and gold the moment something happens.
     */
    colorSuccess: "#019532",
    colorInfo: "#019532",
    colorWarning: "#019532",

    /**
     * The one exception, and it is deliberate: destructive stays red.
     *
     * Delete confirmations, failed-save messages and form validation all read
     * through this token, and the Logout button is painted the same red by
     * hand. A red that appears only when something is being destroyed or has
     * gone wrong is not a second brand colour — it is the absence of the brand,
     * which is the point.
     */
    colorError: "#d41142",

    // Match the Tailwind/global typeface so antd components don't fall back
    // to their own default sans stack.
    fontFamily: '"Outfit", sans-serif',

    /**
     * Height of a default-size ("middle") control — 34px, antd's own is 32.
     *
     * One token rather than a rule per component: Button, Input, Select,
     * DatePicker and InputNumber all derive their height from this, so they
     * grow together and a form row cannot end up with a button 2px taller than
     * the field beside it. `controlHeightSM` / `controlHeightLG` are left alone,
     * so only the default size moves.
     */
    controlHeight: 34,
  },
  components: {
    // Only buttons use a 7px corner radius.
    Button: {
      borderRadius: 7,
    },
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={config}>
      <Provider store={store}>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </Provider>
    </ConfigProvider>
  </React.StrictMode>,
);
