# Privacy Policy

**Last Updated:** October 27, 2026  
**Project:** UDo (Desktop Application)  
**Data Architecture:** 100% Local-First (Offline by Design)  

---

## 1. Fundamental Privacy Commitment
**UDo** is built upon an unyielding principle of user privacy and absolute data sovereignty: **Your data belongs exclusively to you.**

The application does not collect, track, transmit, or process your information on any external server, third-party platform, or analytics service.

---

## 2. Data Collection: Absolute Zero (0%)
* **Zero Telemetry:** UDo contains no tracking SDKs, usage analytics (such as Google Analytics, PostHog, Mixpanel, or similar), or background crash-reporting tools that upload telemetry.
* **No User Accounts:** No sign-up, login, email address, or password is required.
* **Zero Advertising:** The application is 100% ad-free, tracking-free, and marketing-free.

---

## 3. Data Storage & Local Paths
All user data resides exclusively on your local machine's disk:

* **On Linux:**
  * Database & Notes: `~/.local/share/udo/`
  * Configurations & Preferences: `~/.config/udo/`
  * Attachments & Sketches: `~/.local/share/udo/attachments/`
* **On Windows:**
  * Data & Settings: `%APPDATA%\udo\`
* **On macOS:**
  * Data & Settings: `~/Library/Application Support/udo/`

---

## 4. Network Connections & Internet Access
UDo operates **100% autonomously and offline**. The only possible network interactions are:
1. **Software Update Checks (Optional):** If the user enables auto-updates, UDo queries the public GitHub Releases API solely to compare version tags (e.g., `v1.0.0` vs `v1.0.1`). No user data or note content is ever transmitted.
2. **External Link Navigation:** Clicking an external link card stored in a note triggers your operating system's default browser to open that destination URL.

---

## 5. Portability, Backups & Deletion
* **Complete Portability:** Export your entire database at any time in standard, open formats (`.json` or `.sqlite`) without proprietary vendor lock-in.
* **Instant Deletion:** You can purge all application data at any time via the "Reset Data" button or by deleting the local application directory. No residual data exists on any cloud server.

---

## 6. Regulatory Compliance (GDPR / CCPA)
Because UDo neither collects, stores, nor processes personal data on remote servers, it is compliant by design (**Privacy by Design**) with global privacy standards, including the European Union's General Data Protection Regulation (**GDPR**) and the California Consumer Privacy Act (**CCPA**).
