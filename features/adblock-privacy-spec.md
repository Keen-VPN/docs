# AdBlock & Privacy: Technical Specification

## 1. Blocking Levels

We offer three distinct levels of protection to balance usability and privacy.

### Level 1: Basic (The "Sanity" Filter)

* **Goal**: Block malicious domains (Phishing, Malware) and intrusive ads without breaking sites.
* **Lists**:
  * `StevenBlack/hosts` (Unified/Malware)
* **False Positive Rate**: Near Zero.

### Level 2: Recommended (Data Saver & Privacy)

* **Goal**: Block trackers and most ads.
* **Lists**:
  * Above lists +
  * `StevenBlack/hosts` (Adware)
  * `Privacy-Preserving-Analytics` blocking.
* **Note**: This is the default.

### Level 3: Aggressive (Total Silence)

* **Goal**: Block everything non-essential.
* **Lists**:
  * Above lists +
  * `Social Media Trackers` (Facebook, Twitter pixels).
  * `Cosmetic Filters` (CSS hiding rules - *Client Side only if WebView, otherwise DNS only*).
* **Risk**: May break login flows (e.g., "Login with Google").

## 2. Blocklist Management (Backend -> Client)

* **Format**: Binary Bloom Filter (or optimized Prefix Trie).
  * *Why?* A 100k domain text list is 2MB. A Bloom Filter is ~200KB.
* **Update Cycle**:
    1. **Backend**: Aggregates lists from public sources daily. Verifies integrity. Compiles to Binary format.
    2. **CDN**: Serves the binary blobs (versioned).
    3. **Client**: Checks for new version via cheap HEAD request on App Launch and Background Fetch.
    4. **Differential Updates**: Only download diff chunks if possible (future optimization).

## 3. Local Whitelisting

* These are stored in `AppGroup/exceptions.json` and checked *before* the Bloom Filter.

## 4. User Visualization (The Value Dashboard)

* **Goal**: Make the invisible visible. Users should feel "protected" even when the app is quiet.
* **Stats to Display**:
  * **Live Counter**: "Protected you from N trackers today."
  * **Time Machine**: Graphs showing blocked threats over 24h / 7d / 30d.
  * **Bandwidth Saver**: "You saved 150MB of data this month (approx $5 of mobile data)."
  * **Speed Booster**: "Web pages loaded 1.2s faster on average."
  * **Percentile**: "You are in the top 10% of protected users." (Requires OPT-IN for community stats).
