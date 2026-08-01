import React from "react";
import ReactDOM from "react-dom/client";
import { FoodPlanner } from "./app/FoodPlanner";
import "./app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><FoodPlanner /></React.StrictMode>,
);
