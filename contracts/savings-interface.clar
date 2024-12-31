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