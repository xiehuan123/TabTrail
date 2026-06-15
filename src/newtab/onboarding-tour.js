const TARGETS = [
  {
    key: "welcome",
    title: "欢迎使用 TabTrail",
    description: "这是一段一次性新手引导。TabTrail 不上传标签数据，也不会修改默认搜索引擎。",
    side: "bottom"
  },
  {
    key: "search",
    title: "搜索标签",
    description: "输入标题、网址或域名，快速缩小当前工作台里的标签范围。",
    side: "bottom"
  },
  {
    key: "scope",
    title: "选择整理范围",
    description: "先整理当前窗口；需要看所有浏览器窗口时，再切换到全部窗口。",
    side: "bottom"
  },
  {
    key: "categories",
    title: "按分类整理",
    description: "这里可以查看全部、域名分类和手动分类，也可以把标签拖入可接收的分类。",
    side: "bottom"
  },
  {
    key: "current-list",
    title: "整理当前分类",
    description: "在列表里选择、移动、归类、排序或关闭标签。键盘用户也能用上移、下移和移动到分类完成整理。",
    side: "right"
  },
  {
    key: "recent-closed",
    title: "找回最近关闭",
    description: "误关或批量关闭后，可以从这里重新打开最近关闭的标签。",
    side: "left"
  },
  {
    key: "reopen",
    title: "重新查看引导",
    description: "之后需要复习时，可以从这里再次打开这段引导。",
    side: "left"
  }
];

function getDriverFactory() {
  return globalThis.driver?.js?.driver;
}

function getTarget(key) {
  return document.querySelector(`[data-onboarding-target="${key}"]`);
}

function createStep(target) {
  return {
    element: `[data-onboarding-target="${target.key}"]`,
    popover: {
      title: target.title,
      description: target.description,
      side: target.side,
      align: "start"
    }
  };
}

function getAvailableSteps() {
  return TARGETS
    .filter((target) => getTarget(target.key))
    .map(createStep);
}

export function createOnboardingTour({
  onComplete,
  onSkip,
  onUnavailable
} = {}) {
  const driverFactory = getDriverFactory();
  const steps = getAvailableSteps();

  if (!driverFactory || steps.length === 0) {
    return {
      available: false,
      start() {
        onUnavailable?.();
      },
      destroy() {}
    };
  }

  let completed = false;
  let closedByButton = false;
  let suppressDestroyedCallback = false;
  const tour = driverFactory({
    steps,
    animate: true,
    allowClose: true,
    allowKeyboardControl: true,
    disableActiveInteraction: false,
    doneBtnText: "完成",
    nextBtnText: "下一步",
    overlayClickBehavior: "close",
    overlayOpacity: 0.58,
    popoverClass: "tabtrail-driver-popover",
    prevBtnText: "上一步",
    progressText: "{{current}} / {{total}}",
    showButtons: ["next", "previous", "close"],
    showProgress: true,
    stagePadding: 8,
    stageRadius: 8,
    onNextClick(_element, _step, { driver }) {
      if (driver.isLastStep()) {
        completed = true;
        driver.destroy();
        return;
      }
      driver.moveNext();
    },
    onCloseClick(_element, _step, { driver }) {
      closedByButton = true;
      driver.destroy();
    },
    onDestroyed() {
      if (suppressDestroyedCallback) {
        suppressDestroyedCallback = false;
        return;
      }
      if (completed) {
        onComplete?.();
        return;
      }
      if (closedByButton || !completed) {
        onSkip?.();
      }
    }
  });

  return {
    available: true,
    start() {
      completed = false;
      closedByButton = false;
      tour.drive();
    },
    destroy({ silent = true } = {}) {
      suppressDestroyedCallback = silent;
      tour.destroy();
    }
  };
}
