# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Welcome Back" [level=3] [ref=e5]
      - paragraph [ref=e6]: Sign in to your Apranova LMS account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - text: Email
        - textbox "Email" [ref=e10]:
          - /placeholder: student@example.com
          - text: alice@apranova.com
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - link "Forgot password?" [ref=e14] [cursor=pointer]:
            - /url: /auth/forgot-password
        - textbox "Password" [ref=e15]: Student123!
      - button "Sign In" [ref=e16] [cursor=pointer]
    - generic [ref=e18]:
      - text: Don't have an account?
      - link "Sign up" [ref=e19] [cursor=pointer]:
        - /url: /auth/signup
  - region "Notifications alt+T"
  - alert [ref=e20]
```