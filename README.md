# E Kalyan's Cloud & DevOps Architect Portfolio System

This repository contains the source code for my interactive DevOps & Platform Engineering portfolio dashboard. Designed to stand out to top-tier technology recruiters, this single-page dashboard highlights production-level systems thinking, automation, and platform reliability.

Live Profile: [github.com/kalyanace44](https://github.com/kalyanace44)

---

## ⚡ Key Interactive Experiences

### 1. Active SRE Failover Simulator
To demonstrate real-world systems recovery, the telemetry panel includes a **"Simulate Region Outage"** button. Pushing this button triggers:
*   An simulated outage in `ap-south-1` (Mumbai).
*   Live diagnostic logs in the terminal console directing the user to run the recovery script.
*   The terminal becomes responsive to the script invocation command.

### 2. Zsh Shell Prompt Interactivity (Failover Script)
Typing `./dr_failover.py --direction mum-to-hyd` in the alert state initiates a step-by-step interactive CLI prompt flow:
*   The prompt dynamically asks you to confirm database promotion, Redis switches, EBS volume mounts, Vault credentials injections, Kubernetes service rollout restarts, and DNS latency updates.
*   Typing `y` or `n` progresses the failover and dynamically updates the dashboard gauges in real time.

### 3. Zsh Console Sandbox Commands
The dashboard mounts a terminal simulation that tracks standard commands, navigation, and file inspection:
*   `help` - Lists command capabilities.
*   `ls` - Lists files in the current folder.
*   `cd [dir]` - Navigates directories (`projects/`).
*   `cat [file]` - Inspects file data (e.g. `cat skills.json`, `cat projects/mcp_platform.md`).
*   `about` - Executive summary of E Kalyan.
*   `skills` - Outputs categorized cloud/Kubernetes skills.
*   `experience` - Detailed professional timeline.
*   `resume` - Outputs clean text resume layout.
*   `contact` - Outputs email and LinkedIn details.
*   `clear` - Wipes terminal logs.
*   *Supports tab-autocomplete and command history navigation (Up/Down arrow keys).*

### 4. Dynamic Tool Highlighting Timeline
Hovering over any job entry on the professional timeline (Vegapay, Justdial, Tech Mahindra) dynamically highlights the exact skills and tools in the Technical Competency Matrix that were utilized during that role.

---

## 🚀 How to Preview & Deploy (GitHub Pages)

### Local Preview
Double-click the `index.html` file or launch a simple local Python server:
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

### GitHub Pages Deployment
1.  Create a public repository named **`kalyanace44.github.io`** on GitHub.
2.  Push these files directly to the root of the repository:
    ```bash
    git init
    git add index.html README.md
    git commit -m "Initial commit of interactive portfolio"
    git branch -M main
    git remote add origin git@github.com:kalyanace44/kalyanace44.github.io.git
    git push -u origin main
    ```
3.  Your interactive dashboard will be live at `https://kalyanace44.github.io/`!
