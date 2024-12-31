;; Rewards calculation contract

;; Define constants
(define-constant REWARD-RATE u5) ;; 5% annual reward rate
(define-constant ANNUAL-BLOCKS u52560) ;; Approximate blocks in a year

;; Error constants
(define-constant ERR-CALCULATION-FAILED (err u200))

;; Calculate reward amount based on lock duration and amount
(define-read-only (calculate-reward (amount uint) (lock-duration uint))
    (let
        (
            (reward-multiplier (/ (* REWARD-RATE lock-duration) ANNUAL-BLOCKS))
            (reward-amount (/ (* amount reward-multiplier) u100))
        )
        (ok reward-amount)
    )
)

;; Get current reward rate
(define-read-only (get-reward-rate)
    (ok REWARD-RATE)
)

;; Get annual blocks
(define-read-only (get-annual-blocks)
    (ok ANNUAL-BLOCKS)
)