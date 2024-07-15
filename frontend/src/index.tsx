/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import { Route, Router } from "@solidjs/router";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SearchPage } from "./pages/SearchPage";

const root = document.getElementById("root");

render(
  () => (
    <Router>
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/" component={SearchPage} />
    </Router>
  ),
  root!
);
