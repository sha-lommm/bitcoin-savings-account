import { describe, expect, it } from "vitest";
import { uintCV } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

describe("Rewards Contract Tests", () => {
  it("ensures simnet is initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("calculates reward correctly for 1 year lock", () => {
    const amount = uintCV(1000);
    const lockDuration = uintCV(52560);
    const { result } = simnet.callReadOnlyFn(
      "rewards",
      "calculate-reward",
      [amount, lockDuration],
      address1
    );

    expect(result).toBeOk(uintCV(50)); // 5% of 1000 STX
  });

  it("returns the reward rate", () => {
    const { result } = simnet.callReadOnlyFn(
      "rewards",
      "get-reward-rate",
      [],
      address1
    );
    expect(result).toBeOk(uintCV(5));
  });

  it("returns the annual blocks", () => {
    const { result } = simnet.callReadOnlyFn(
      "rewards",
      "get-annual-blocks",
      [],
      address1
    );
    expect(result).toBeOk(uintCV(52560));
  });
});
