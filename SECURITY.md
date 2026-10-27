# Security Policy

## Supported Versions

Security updates and patches are actively maintained for the following versions of **UDo**:

| Version | Supported |
| :--- | :--- |
| 1.0.x | :white_check_mark: |
| < 1.0.0 | :x: |

---

## Reporting Vulnerabilities

Security is a primary focus. If you discover a vulnerability in UDo, please report it responsibly and **do not open a public GitHub issue**.

### Disclosure Procedure
1. Send a detailed report via the maintainer's contact channel or submit a private report via **GitHub Security Advisories** on the repository's Security tab.
2. Please include:
   * A clear summary of the vulnerability.
   * Reproduction steps or a minimal Proof of Concept (PoC).
   * Affected operating systems (Linux / Windows / macOS).
   * Estimated severity and impact.

### Our Commitment
* We will acknowledge receipt of your disclosure within **48 hours**.
* We will provide a timeline for patch development and release verification.
* We will formally credit your responsible disclosure in release notes unless anonymity is preferred.

---

## Development Security Guidelines

1. **Audited Dependencies:** Continuous automated scans using `npm audit` and `cargo audit` in CI/CD pipelines to prevent known CVEs.
2. **Principle of Least Privilege:** Tauri security capabilities (`tauri.conf.json`) are scoped strictly to application data directories without open network or shell access.
