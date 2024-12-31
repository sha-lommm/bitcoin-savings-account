# Time-Locked Bitcoin Savings Account

A Clarity smart contract implementation for time-locked Bitcoin savings accounts on the Stacks blockchain. This project enables users to lock their STX tokens for a predetermined period while earning rewards.

## Features

- Lock STX tokens for a specified duration
- Earn rewards based on lock duration
- Automatic reward calculation
- Secure withdrawal mechanism
- Time-lock enforcement

## Project Structure

```
bitcoin-savings/
├── contracts/        # Smart contract source files
├── tests/           # Test files using Vitest
└── ...
```

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Clarinet
- @stacks/transactions

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sha-lommm/bitcoin-savings.git
cd bitcoin-savings
```

2. Install dependencies:
```bash
npm install
```

3. Setup local development environment:
```bash
clarinet integrate
```

## Testing

Run the test suite:

```bash
npm test
```


## Smart Contract Interface

### Key Functions

1. Lock Funds
```clarity
(lock-funds (amount uint) (lock-period uint))
```

2. Withdraw
```clarity
(withdraw)
```

3. Calculate Rewards
```clarity
(calculate-rewards (account-owner principal))
```

### Error Codes

- `ERR-NOT-AUTHORIZED (u100)`: Unauthorized access
- `ERR-ALREADY-LOCKED (u101)`: Funds already locked
- `ERR-NO-ACTIVE-LOCK (u102)`: No active lock found
- `ERR-LOCK-NOT-EXPIRED (u103)`: Lock period not expired

## Security Considerations

- All functions include proper authorization checks
- Time-lock mechanisms are block-height based
- Reward calculations are overflow-protected
- Contract owner privileges are limited

## License

MIT License
