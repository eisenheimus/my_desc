import React, { useEffect, useState } from "react";
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
  const [dark, setDark] = useState(
    () => localStorage.getItem("kanban-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("kanban-theme", dark ? "dark" : "light");
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
      <App dark={dark} onToggleTheme={() => setDark((value) => !value)} />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
