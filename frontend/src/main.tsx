import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import ruRU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import App from "./App";
import "./index.css";

dayjs.locale("ru");

function Root() {
  const [dark] = useState(
    () => localStorage.getItem("kanban-theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#6d5dfc",
          borderRadius: 12,
          fontFamily: "Manrope, sans-serif",
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
