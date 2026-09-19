import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "solar_crm_tour_done";

const tourStyles = `
  .solar-crm-driver-popover {
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(11, 58, 99, 0.18), 0 4px 16px rgba(0,0,0,0.08);
    border: 1px solid #E2E8F0;
    padding: 0 !important;
    max-width: 340px;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }

  .solar-crm-driver-popover .driver-popover-title {
    background: linear-gradient(135deg, #0B3A63 0%, #005BAC 100%);
    color: #FFFFFF !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    padding: 16px 20px 14px !important;
    margin: 0 !important;
    letter-spacing: 0.2px;
    border-radius: 0 !important;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .solar-crm-driver-popover .driver-popover-description {
    color: #475569 !important;
    font-size: 13.5px !important;
    line-height: 1.65 !important;
    padding: 14px 20px 16px !important;
    margin: 0 !important;
    font-weight: 400;
  }

  .solar-crm-driver-popover .driver-popover-footer {
    padding: 12px 20px 16px !important;
    border-top: 1px solid #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F8FAFC;
  }

  .solar-crm-driver-popover .driver-popover-progress-text {
    color: #94A3B8 !important;
    font-size: 11px !important;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .solar-crm-driver-popover .driver-popover-prev-btn {
    background: transparent !important;
    border: 1.5px solid #CBD5E1 !important;
    color: #64748B !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    padding: 7px 14px !important;
    border-radius: 8px !important;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }

  .solar-crm-driver-popover .driver-popover-prev-btn:hover {
    border-color: #0B3A63 !important;
    color: #0B3A63 !important;
    background: #F0F7FF !important;
  }

  .solar-crm-driver-popover .driver-popover-next-btn {
    background: linear-gradient(135deg, #0B3A63 0%, #005BAC 100%) !important;
    border: none !important;
    color: #FFFFFF !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    padding: 7px 16px !important;
    border-radius: 8px !important;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 2px 8px rgba(11,58,99,0.25);
  }

  .solar-crm-driver-popover .driver-popover-next-btn:hover {
    box-shadow: 0 4px 14px rgba(11,58,99,0.35) !important;
    transform: translateY(-1px);
  }

  .solar-crm-driver-popover .driver-popover-close-btn {
    color: rgba(255,255,255,0.7) !important;
    font-size: 18px !important;
    position: absolute;
    top: 12px;
    right: 16px;
    cursor: pointer;
    transition: color 0.2s;
    background: none;
    border: none;
    line-height: 1;
  }

  .solar-crm-driver-popover .driver-popover-close-btn:hover {
    color: #FFFFFF !important;
  }

  .driver-overlay {
    background: rgba(11, 30, 55, 0.65) !important;
    backdrop-filter: blur(2px);
  }

  .driver-active-element {
    border-radius: 10px !important;
    box-shadow: 0 0 0 3px #38BDF8, 0 0 0 6px rgba(56, 189, 248, 0.2) !important;
  }

  .solar-crm-driver-popover .driver-popover-arrow-side-left .driver-popover-arrow {
    border-right-color: #0B3A63 !important;
  }
  .solar-crm-driver-popover .driver-popover-arrow-side-right .driver-popover-arrow {
    border-left-color: #0B3A63 !important;
  }
  .solar-crm-driver-popover .driver-popover-arrow-side-top .driver-popover-arrow {
    border-bottom-color: #0B3A63 !important;
  }
  .solar-crm-driver-popover .driver-popover-arrow-side-bottom .driver-popover-arrow {
    border-top-color: #0B3A63 !important;
  }
`;

const steps = [
  {
    popover: {
      title: "🌟 Welcome to Solar CRM!",
      description: "Your all-in-one platform to manage solar leads, track follow-ups, and grow your business. Let us show you around in just 60 seconds!",
      side: "over",
      align: "center",
    },
  },
  {
    element: "[data-tour='sidebar-dashboard']",
    popover: {
      title: "📊 Dashboard",
      description: "Your command center — see total leads, today's follow-ups, revenue won, and team performance at a glance.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-leads']",
    popover: {
      title: "⚡ Lead Management",
      description: "Add and manage every solar inquiry here. Assign leads to your sales team, track status, log follow-ups, and close deals faster.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-users']",
    popover: {
      title: "👥 User Management",
      description: "Build your sales team here. Add managers and sales executives, set reporting lines, and control access levels.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-reports']",
    popover: {
      title: "📈 Reports & Analytics",
      description: "Track your team's performance, conversion rates, lead sources, and monthly revenue trends — all in beautiful charts.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-settings']",
    popover: {
      title: "⚙️ Settings",
      description: "Set up your company profile, configure city/state lists, and customize the CRM to match your business workflow.",
      side: "right",
      align: "start",
    },
  },
  {
    popover: {
      title: "🚀 You are all set!",
      description: "Start by adding your first lead or inviting your sales team. Your growth journey begins now. Best of luck!",
      side: "over",
      align: "center",
    },
  },
];

const OnboardingTour = () => {
  useEffect(() => {
    // Inject styles
    const styleEl = document.createElement("style");
    styleEl.innerHTML = tourStyles;
    document.head.appendChild(styleEl);

    const done = localStorage.getItem(TOUR_KEY);
    if (done) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayColor: "rgba(11, 30, 55, 0.65)",
      stagePadding: 10,
      stageRadius: 10,
      popoverClass: "solar-crm-driver-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "🎉 Let's Go!",
      progressText: "{{current}} of {{total}}",
      steps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, "true");
        driverObj.destroy();
      },
    });

    const timer = setTimeout(() => driverObj.drive(), 1200);

    return () => {
      clearTimeout(timer);
      styleEl.remove();
    };
  }, []);

  return null;
};

export default OnboardingTour;
