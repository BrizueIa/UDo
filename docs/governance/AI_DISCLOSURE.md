# Artificial Intelligence Co-Development Disclosure (AI Disclosure)

**Project:** UDo  
**Last Updated:** October 27, 2026  
**Standard:** Responsible Open Source AI Co-Development  

---

## 1. Transparency of Authorship
In accordance with ethical open-source standards, we disclose that **UDo** has been developed through a pair programming paradigm assisted by Artificial Intelligence (specifically via **Google Antigravity** and advanced Gemini models).

---

## 2. Human Responsibility & Oversight
* **Human Verification & Code Review:** Every line of code, architecture pattern, user interface component, and security configuration proposed by AI tools is reviewed, tested, refactored, and approved by human maintainers.
* **Rigorous Quality Control:** Unverified AI-generated code is never merged without passing strict TypeScript checks, Rust compiler checks (`cargo check`), automated test suites, and dependency audits.
* **Ultimate Responsibility:** Moral authorship, governance, product roadmap decisions, and technical liability rest solely with the project's human maintainers.

---

## 3. Defense Against Hallucinated or Vulnerable Dependencies
* Every dependency added to `package.json` and `Cargo.toml` is verified against official registries (**npm** and **crates.io**).
* We strictly prohibit unverified libraries, ensuring no hallucinated or vulnerable packages (*slopsquatting*) are introduced.

---

## 4. Licensing & Intellectual Property
* **Originality:** Code comprises original implementations, public domain components, or permissively licensed open-source libraries.
* **Open Source Commitment:** The resulting codebase is delivered under the project's official open-source license (Apache License 2.0), granting the community full rights to inspect, audit, modify, and distribute it.

---

## 5. Guidelines for AI-Assisted Community Contributions
Community contributors are welcome to leverage AI assistance, subject to the following rules:
1. **Mandatory Author Verification:** Pull request (PR) authors must thoroughly understand and be able to explain all submitted code. Automated, untested PR dumps will be closed.
2. **PR Disclosure:** Contributors are requested to note in the PR description if generative AI tools assisted in creating the changes.
3. **License Respect:** Code copied by AI tools from incompatible or proprietary repositories must never be submitted.
