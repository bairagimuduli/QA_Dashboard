/**
 * Gatling simulation classes under DarkKnight `src/gatling/java/simulations/apis/`.
 * Regenerate when new *Simulation / *DataGenerator classes are added in DarkKnight.
 *
 * `kind`: Data generators produce feeder JSON; simulations are normal Gatling runs.
 */

export type SimulationKind = "data-generator" | "simulation";

export type SimulationOption = {
  id: string;
  group: string;
  label: string;
  simulationClass: string;
  kind: SimulationKind;
  desc?: string;
};

function dg(
  group: string,
  className: string,
  desc?: string,
): SimulationOption {
  return {
    id: `${group}:${className}`,
    group,
    label: className,
    simulationClass: `simulations.apis.${group}.${className}`,
    kind: "data-generator",
    desc,
  };
}

function sim(group: string, className: string, desc?: string): SimulationOption {
  return {
    id: `${group}:${className}`,
    group,
    label: className,
    simulationClass: `simulations.apis.${group}.${className}`,
    kind: "simulation",
    desc,
  };
}

/** onboardingService.businessLoans — nested package */
function simBl(className: string, desc?: string): SimulationOption {
  const group = "onboardingService.businessLoans";
  return {
    id: `${group}:${className}`,
    group: "onboardingService · businessLoans",
    label: className,
    simulationClass: `simulations.apis.${group}.${className}`,
    kind: "simulation",
    desc,
  };
}

const RAW: SimulationOption[] = [
  dg("authService", "SignInFlowDataGenerator", "OTP → sign-in → token (feeder output)"),
  dg("authService", "SignUpFlowDataGenerator", "Sign-up feeder pipeline"),
  sim("authService", "AuthServiceSimulation"),
  sim("authService", "CheckAccountExistsSimulation"),
  sim("authService", "ProfessionChangeSimulation"),
  sim("authService", "SignUpFlowSimulation"),
  sim("authService", "ValidateTokenSimulation"),
  sim("authService", "VerifyAccountSimulation"),

  sim("autopayService", "AutopayFlowSimulation"),
  sim("autopayService", "GetAutopayFlowSimulation"),
  sim("autopayService", "SaveAutopayFlowSimulation"),
  sim("autopayService", "UpdateAutopayFlowSimulation"),

  dg("disbursementService", "DisbursementFlowDataGenerator", "Disbursement feeder prep"),
  sim("disbursementService", "CancelSanctionedLoanSimulation"),
  sim("disbursementService", "DisbursementFlowSimulation"),
  sim("disbursementService", "DisbursementParallelSimulation"),
  sim("disbursementService", "LoanListSimulation"),
  sim("disbursementService", "LoanMetadataSimulation"),
  sim("disbursementService", "RepaymentScheduleSimulation"),
  sim("disbursementService", "SanctionedLoansListSimulation"),
  sim("disbursementService", "UserConsentSimulation"),
  sim("disbursementService", "UserMetadataSimulation"),
  sim("disbursementService", "V1LoanMetadataSimulation"),
  sim("disbursementService", "V1RepaymentScheduleSimulation"),

  sim("onboardingService", "GetBasicInfoFlowSimulation"),
  sim("onboardingService", "GetKYCV2FlowSimulation"),
  sim("onboardingService", "GetProfileCompletionFlowSimulation"),
  sim("onboardingService", "OnboardingFlowSimulation"),

  simBl("BusinessDocumentsSimulation"),
  simBl("OnboardingBusinessLoansServiceSimulation"),
  simBl("ProfessionTypesBffSimulation"),
  simBl("ProfessionTypesRegistrySimulation"),
  simBl("RegistrySignInSimulation"),
  simBl("UserMetadataSimulation"),

  dg("repaymentService", "RepaymentLoanListFlowDataGenerator", "Repayment sign-in feeder prep"),
  sim("repaymentService", "LoanBreakupSimulation"),
  sim("repaymentService", "LoanDetailsSimulation"),
  sim("repaymentService", "LoanHistorySimulation"),
  sim("repaymentService", "LoanListSimulation"),
  sim("repaymentService", "LoanMetadataSimulation"),
  sim("repaymentService", "LoanOtherChargesSimulation"),
  sim("repaymentService", "PaidLoansSimulation"),
  sim("repaymentService", "RepaymentFlowSimulation"),
  sim("repaymentService", "TransactionSimulation"),
];

/** Sort: data generators first, then by label */
function sortOptions(list: SimulationOption[]): SimulationOption[] {
  return [...list].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "data-generator" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

/** Group key used for <optgroup> (stable ordering) */
const GROUP_ORDER: string[] = [
  "authService",
  "autopayService",
  "disbursementService",
  "onboardingService",
  "onboardingService · businessLoans",
  "repaymentService",
];

/**
 * Group options by `group` for <optgroup>. Known groups follow GROUP_ORDER; unknown groups (e.g. from GET /simulations) append after.
 */
export function getGroupedSimulationOptions(options: SimulationOption[] = RAW): Map<string, SimulationOption[]> {
  const map = new Map<string, SimulationOption[]>();
  for (const o of options) {
    const list = map.get(o.group) ?? [];
    list.push(o);
    map.set(o.group, list);
  }
  const ordered = new Map<string, SimulationOption[]>();
  for (const g of GROUP_ORDER) {
    const list = map.get(g);
    if (list?.length) ordered.set(g, sortOptions(list));
  }
  for (const [g, list] of map) {
    if (!ordered.has(g)) ordered.set(g, sortOptions(list));
  }
  return ordered;
}

export function getDefaultSimulationOptions(): SimulationOption[] {
  return sortOptions(RAW);
}

export function findSimulationOptionByClass(simulationClass: string): SimulationOption | undefined {
  return RAW.find((o) => o.simulationClass === simulationClass);
}
