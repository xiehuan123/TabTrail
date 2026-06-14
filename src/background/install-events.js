import { markOnboardingPending } from "../shared/preferences.js";

export const FIRST_INSTALL_ONBOARDING_PATH = "src/newtab/newtab.html?onboarding=1";

export async function handleInstalled({
  reason,
  syncArea,
  tabsApi,
  sidePanelApi,
  runtimeApi,
  now = Date.now()
}) {
  let sidePanelError = null;
  if (sidePanelApi?.setPanelBehavior) {
    try {
      await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: false });
    } catch (error) {
      sidePanelError = error;
    }
  }

  if (reason !== "install") {
    return { onboardingOpened: false, sidePanelError };
  }

  const pendingResult = await markOnboardingPending(syncArea, now);
  const url = runtimeApi?.getURL
    ? runtimeApi.getURL(FIRST_INSTALL_ONBOARDING_PATH)
    : FIRST_INSTALL_ONBOARDING_PATH;

  try {
    await tabsApi?.create?.({ url });
    return { onboardingOpened: true, pendingResult, sidePanelError };
  } catch (error) {
    return { onboardingOpened: false, pendingResult, openError: error, sidePanelError };
  }
}
