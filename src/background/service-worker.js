import { browserApi } from "../shared/browser-api.js";

browserApi.runtime.onInstalled.addListener(() => {
  if (browserApi.sidePanel?.setPanelBehavior) {
    browserApi.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
});
