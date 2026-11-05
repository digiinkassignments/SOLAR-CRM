// ============================================================
// Real-world Solar EPC Project Execution Stages (PM Surya Ghar Standard)
// 10 Exact Sequential Lifecycle Stages
// ============================================================

export const STAGES = [
  "Order Closed",
  "DISCOM Application",
  "Pre-Install Inspection",
  "Procurement",
  "Installation In Progress",
  "Commissioning",
  "Subsidy Applied",
  "Subsidy Received",
  "Handover Done",
  "Warranty Period",
];

export const STAGE_CONFIG = {
  "Order Closed": {
    label: "Order Closed",
    shortLabel: "Order Closed",
    step: 1,
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#3B82F6",
    description: "Deal won & advance payment confirmed from customer",
  },
  "DISCOM Application": {
    label: "DISCOM Application",
    shortLabel: "DISCOM App",
    step: 2,
    color: "#0284C7",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    dot: "#0EA5E9",
    description: "DISCOM registration, net meter application & feasibility approval",
  },
  "Pre-Install Inspection": {
    label: "Pre-Install Inspection",
    shortLabel: "Pre-Install",
    step: 3,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#8B5CF6",
    description: "Site survey verification, shadow analysis & final Bill of Materials (BOM)",
  },
  "Procurement": {
    label: "Procurement",
    shortLabel: "Procurement",
    step: 4,
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
    description: "Panels, inverter, structure & BOS dispatch from inventory",
  },
  "Installation In Progress": {
    label: "Installation In Progress",
    shortLabel: "Installation",
    step: 5,
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FFEDD5",
    dot: "#F97316",
    description: "Structure erection, solar modules mounting, inverter & AC/DC wiring",
  },
  "Commissioning": {
    label: "Commissioning",
    shortLabel: "Commissioning",
    step: 6,
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    dot: "#6366F1",
    description: "DISCOM inspection, bi-directional net meter installation & plant grid sync",
  },
  "Subsidy Applied": {
    label: "Subsidy Applied",
    shortLabel: "Subsidy Filed",
    step: 7,
    color: "#0891B2",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    dot: "#06B6D4",
    description: "Commissioning certificate uploaded to PM Surya Ghar National Portal",
  },
  "Subsidy Received": {
    label: "Subsidy Received",
    shortLabel: "Subsidy Credited",
    step: 8,
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    dot: "#22C55E",
    description: "Direct DBT subsidy successfully credited into customer bank account",
  },
  "Handover Done": {
    label: "Handover Done",
    shortLabel: "Handover Done",
    step: 9,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    dot: "#10B981",
    description: "System documentation, customer training, warranty cards & sign-off",
  },
  "Warranty Period": {
    label: "Warranty Period",
    shortLabel: "Warranty / AMC",
    step: 10,
    color: "#0D9488",
    bg: "#F0FDFA",
    border: "#99F6E4",
    dot: "#14B8A6",
    description: "25-year panel performance warranty & routine AMC health visits",
  },
};

export const getStageIndex = (stageName) => {
  const idx = STAGES.indexOf(stageName);
  return idx !== -1 ? idx : 0;
};

export const getProgressPercent = (stageName) => {
  const idx = getStageIndex(stageName);
  return Math.min(100, Math.round(((idx + 1) / STAGES.length) * 100));
};

export const getStageConfig = (stageName) => {
  return STAGE_CONFIG[stageName] || {
    label: stageName || "Order Closed",
    shortLabel: stageName || "Order Closed",
    step: 1,
    color: "#64748B",
    bg: "#F1F5F9",
    border: "#CBD5E1",
    dot: "#94A3B8",
    description: "Project execution stage",
  };
};
