/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import { Route, Router } from "@solidjs/router";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SearchPage } from "./pages/SearchPage";
import { RagPage } from "./pages/RagPage";
import { AboutPage, HelpPage } from "./pages/AboutPage";
import { RedirectToSearch } from "./components/RedirectToSearch";

const root = document.getElementById("root");

render(
  () => (
    <Router>
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/chat" component={RagPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/" component={SearchPage} />
      <Route path="*404" component={RedirectToSearch} />
    </Router>
  ),
  root!,
);
