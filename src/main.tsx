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
    // Match the Tailwind/global typeface so antd components don't fall back
    // to their own default sans stack.
    fontFamily: '"Outfit", sans-serif',
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
  </React.StrictMode>
);
