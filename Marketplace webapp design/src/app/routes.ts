import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LandingPage } from "./components/LandingPage";
import { MarketplacePage } from "./components/MarketplacePage";
import { UploadPage } from "./components/UploadPage";
import { DatasetDetailPage } from "./components/DatasetDetailPage";
import { DashboardPage } from "./components/DashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      { path: "marketplace", Component: MarketplacePage },
      { path: "upload", Component: UploadPage },
      { path: "dataset/:id", Component: DatasetDetailPage },
      { path: "dashboard", Component: DashboardPage },
    ],
  },
]);
