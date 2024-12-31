;; Interface definition for Savings Account
(define-trait savings-account-trait 
    (
        ;; Lock funds with amount and period
        (transfer? (uint uint) (response bool uint))
        
        ;; Withdraw funds
        (withdraw () (response uint uint))
        
        ;; Get account balance
        (get-balance (principal) (response uint uint))
        
        ;; Get lock expiry time
        (get-lock-time (principal) (response uint uint))
        
        ;; Get calculated rewards
        (get-rewards (principal) (response uint uint))
    )
)

;; Import interface
(impl-trait .savings-interface.savings-account-trait)

;; Constants for lock period and validation
(define-constant MIN-LOCK-MONTHS u3)
(define-constant MAX-LOCK-MONTHS u36) ;; 3 years maximum
(define-constant BLOCKS-PER-MONTH u4320) ;; Approximate blocks in a month (144 blocks per day * 30 days)

;; Error Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-LOCKED (err u101))
(define-constant ERR-NO-ACTIVE-LOCK (err u102))
(define-constant ERR-LOCK-NOT-EXPIRED (err u103))
(define-constant ERR-INVALID-AMOUNT (err u104))
(define-constant ERR-INVALID-LOCK-PERIOD (err u105))

;; Data Maps
(define-map savings-accounts
    principal
    {
        balance: uint,
        lock-until: uint,
        start-height: uint,
        reward-claimed: bool
    }
)

;; Public Functions
(define-public (transfer? (amount uint) (lock-period uint))
    (begin
        ;; Validate input parameters
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Validate lock period in months
        (asserts! (and 
            (>= lock-period MIN-LOCK-MONTHS) 
            (<= lock-period MAX-LOCK-MONTHS)
        ) ERR-INVALID-LOCK-PERIOD)

        (let
            (
                (current-height stacks-block-height)
                (lock-until (+ current-height (* lock-period BLOCKS-PER-MONTH)))
                (sender tx-sender)
            )
            ;; Check if account already exists
            (asserts! (is-none (map-get? savings-accounts sender)) ERR-ALREADY-LOCKED)
            
            ;; Validate transfer amount against sender's balance
            (try! (stx-transfer? amount sender (as-contract tx-sender)))
            
            ;; Set savings account with validated data
            (map-set savings-accounts
                sender
                {
                    balance: amount,
                    lock-until: lock-until,
                    start-height: current-height,
                    reward-claimed: false
                }
            )
            
            (ok true)
        )
    )
)

;; Withdraw function
(define-public (withdraw)
    (let
        (
            (sender tx-sender)
            (savings-data (unwrap! (map-get? savings-accounts sender) ERR-NO-ACTIVE-LOCK))
            (current-height stacks-block-height)
        )
        ;; Check if lock period has expired
        (asserts! (>= current-height (get lock-until savings-data)) ERR-LOCK-NOT-EXPIRED)
        
        ;; Check if rewards have already been claimed
        (asserts! (not (get reward-claimed savings-data)) ERR-ALREADY-LOCKED)
        
        (let
            (
                (lock-duration (- (get lock-until savings-data) (get start-height savings-data)))
                (reward-result (contract-call? .rewards calculate-reward 
                                (get balance savings-data) 
                                lock-duration))
            )
            ;; Handle reward calculation
            (let
                (
                    (reward-amount (unwrap! reward-result ERR-NOT-AUTHORIZED))
                    (total-amount (+ (get balance savings-data) reward-amount))
                )
                ;; Transfer total amount back to sender
                (try! (as-contract (stx-transfer? total-amount tx-sender sender)))
                
                ;; Remove the savings account entry
                (map-delete savings-accounts sender)
                
                (ok total-amount)
            )
        )
    )
)

;; Getter Functions with robust error handling
(define-public (get-balance (who principal))
    (match (map-get? savings-accounts who)
        savings-data (ok (get balance savings-data))
        (ok u0)
    )
)

(define-public (get-lock-time (who principal))
    (match (map-get? savings-accounts who)
        savings-data (ok (get lock-until savings-data))
        (ok u0)
    )
)

(define-public (get-rewards (who principal))
    (match (map-get? savings-accounts who)
        savings-data 
            (let
                (
                    (lock-duration (- (get lock-until savings-data) (get start-height savings-data)))
                    (reward-result (contract-call? .rewards calculate-reward 
                                    (get balance savings-data) 
                                    lock-duration))
                )
                (if (is-ok reward-result)
                    (ok (unwrap-panic reward-result))
                    (ok u0)
                )
            )
        (ok u0)
    )
)