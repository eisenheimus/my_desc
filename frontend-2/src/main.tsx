import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import ruRU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import App from "./App";
import "./styles/tokens.css";
import "./index.css";

dayjs.locale("ru");

function Root() {
  document.documentElement.dataset.theme = "dark";
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#579dff",
          borderRadius: 5,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif',
          colorBgBase: "#1d2125",
          colorBgContainer: "#22272b",
          colorText: "#dfe1e6",
          colorTextSecondary: "#9fadbc",
          colorBorder: "#343a40",
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
