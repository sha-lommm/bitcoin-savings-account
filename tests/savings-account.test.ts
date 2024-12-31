import { describe, test, expect, beforeEach } from "vitest";

// Define ResponseType enum
enum ResponseType {
  OK = "ok",
  ERROR = "error",
}

// Mock types to match Clarity contract
interface SavingsAccount {
  balance: number;
  lockUntil: number;
  startHeight: number;
  rewardClaimed: boolean;
}

// Mock contract client
class MockContractClient {
  private savingsAccounts: Map<string, SavingsAccount> = new Map();
  private currentBlockHeight: number = 0;

  constructor() {
    this.resetState();
  }

  resetState() {
    this.savingsAccounts.clear();
    this.currentBlockHeight = 0;
  }

  setBlockHeight(height: number) {
    this.currentBlockHeight = height;
  }

  async transfer(
    sender: string,
    amount: number,
    lockPeriod: number
  ): Promise<{ type: ResponseType; value: any }> {
    // Validation checks
    if (amount <= 0) {
      return { type: ResponseType.ERROR, value: 104 }; // ERR-INVALID-AMOUNT
    }

    if (lockPeriod < 3 || lockPeriod > 36) {
      return { type: ResponseType.ERROR, value: 105 }; // ERR-INVALID-LOCK-PERIOD
    }

    if (this.savingsAccounts.has(sender)) {
      return { type: ResponseType.ERROR, value: 101 }; // ERR-ALREADY-LOCKED
    }

    const blocksPerMonth = 4320;
    const lockUntil = this.currentBlockHeight + lockPeriod * blocksPerMonth;

    this.savingsAccounts.set(sender, {
      balance: amount,
      lockUntil,
      startHeight: this.currentBlockHeight,
      rewardClaimed: false,
    });

    return { type: ResponseType.OK, value: true };
  }

  async getBalance(address: string): Promise<{ type: ResponseType; value: any }> {
    const account = this.savingsAccounts.get(address);
    return { type: ResponseType.OK, value: account ? account.balance : 0 };
  }

  async getLockTime(address: string): Promise<{ type: ResponseType; value: any }> {
    const account = this.savingsAccounts.get(address);
    return { type: ResponseType.OK, value: account ? account.lockUntil : 0 };
  }

  async withdraw(sender: string): Promise<{ type: ResponseType; value: any }> {
    const account = this.savingsAccounts.get(sender);

    if (!account) {
      return { type: ResponseType.ERROR, value: 102 }; // ERR-NO-ACTIVE-LOCK
    }

    if (this.currentBlockHeight < account.lockUntil) {
      return { type: ResponseType.ERROR, value: 103 }; // ERR-LOCK-NOT-EXPIRED
    }

    if (account.rewardClaimed) {
      return { type: ResponseType.ERROR, value: 106 }; // ERR-REWARD-ALREADY-CLAIMED
    }

    // Mock reward calculation (simplified for testing)
    const rewardRate = 0.1; // 10% reward rate for testing
    const rewardAmount = Math.floor(account.balance * rewardRate);
    const totalAmount = account.balance + rewardAmount;

    this.savingsAccounts.delete(sender);
    return { type: ResponseType.OK, value: totalAmount };
  }
}

describe("Savings Account Contract Tests", () => {
  let contractClient: MockContractClient;
  const testAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

  beforeEach(() => {
    contractClient = new MockContractClient();
  });

  describe("transfer", () => {
    test("should successfully lock funds with valid parameters", async () => {
      const result = await contractClient.transfer(testAddress, 1000, 12);
      expect(result.type).toBe(ResponseType.OK);
      expect(result.value).toBe(true);
    });

    test("should reject zero amount", async () => {
      const result = await contractClient.transfer(testAddress, 0, 12);
      expect(result.type).toBe(ResponseType.ERROR);
      expect(result.value).toBe(104); // ERR-INVALID-AMOUNT
    });

    test("should reject invalid lock period", async () => {
      const result = await contractClient.transfer(testAddress, 1000, 37);
      expect(result.type).toBe(ResponseType.ERROR);
      expect(result.value).toBe(105); // ERR-INVALID-LOCK-PERIOD
    });

    test("should reject if account already locked", async () => {
      await contractClient.transfer(testAddress, 1000, 12);
      const result = await contractClient.transfer(testAddress, 500, 6);
      expect(result.type).toBe(ResponseType.ERROR);
      expect(result.value).toBe(101); // ERR-ALREADY-LOCKED
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      await contractClient.transfer(testAddress, 1000, 12);
    });

    test("should reject withdrawal before lock period expires", async () => {
      const result = await contractClient.withdraw(testAddress);
      expect(result.type).toBe(ResponseType.ERROR);
      expect(result.value).toBe(103); // ERR-LOCK-NOT-EXPIRED
    });

    test("should allow withdrawal after lock period", async () => {
      contractClient.setBlockHeight(4320 * 13); // Set block height after 13 months
      const result = await contractClient.withdraw(testAddress);
      expect(result.type).toBe(ResponseType.OK);
      expect(result.value).toBeGreaterThan(1000); // Should include rewards
    });

    test("should reject withdrawal for non-existent account", async () => {
      const result = await contractClient.withdraw("ST2NONEXISTENT");
      expect(result.type).toBe(ResponseType.ERROR);
      expect(result.value).toBe(102); // ERR-NO-ACTIVE-LOCK
    });
  });

  describe("getters", () => {
    test("should return correct balance for existing account", async () => {
      await contractClient.transfer(testAddress, 1000, 12);
      const result = await contractClient.getBalance(testAddress);
      expect(result.type).toBe(ResponseType.OK);
      expect(result.value).toBe(1000);
    });

    test("should return zero balance for non-existent account", async () => {
      const result = await contractClient.getBalance("ST2NONEXISTENT");
      expect(result.type).toBe(ResponseType.OK);
      expect(result.value).toBe(0);
    });

    test("should return correct lock time for existing account", async () => {
      await contractClient.transfer(testAddress, 1000, 12);
      const result = await contractClient.getLockTime(testAddress);
      const blocksPerMonth = 4320;
      expect(result.type).toBe(ResponseType.OK);
      expect(result.value).toBe(blocksPerMonth * 12); // 12 months worth of blocks
    });
  });
});
