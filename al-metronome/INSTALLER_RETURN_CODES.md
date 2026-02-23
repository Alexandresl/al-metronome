# AL Metronome - Installer Return Codes

The AL Metronome desktop application is packaged using `electron-builder`, which utilizes the **NSIS (Nullsoft Scriptable Install System)** as its underlying installer technology for Windows `.exe` deployments.

When executed in silent mode via the Microsoft Store ingestion engine, the installer will return the standard NSIS exit codes as outlined below:

| Return Code | Description                    | Resolution / Meaning                                                                            |
| :---------- | :----------------------------- | :---------------------------------------------------------------------------------------------- |
| **0**       | Normal execution / Success     | The installation, update, or uninstallation completed successfully without errors.              |
| **1**       | Installation aborted by user   | The user (or the calling process) canceled the installation before completion.                  |
| **2**       | Installation aborted by script | A fatal error occurred within the installer script, preventing the installation from finishing. |

**Additional Notes for Automated Deployment:**

- The installer is fully self-contained and does not require external network requests during the installation process.
- No system reboots are forced or requested by the installer (codes 1641 or 3010 do not apply).
