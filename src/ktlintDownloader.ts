import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import * as os from "os";

const DEFAULT_KTLINT_VERSION = "1.8.0";

export const isWindows = os.platform() === "win32";

/**
 * Ensure ktlint binary exists. Downloads it if not present.
 *
 * @param context - VS Code extension context
 * @returns Path to the ktlint executable
 */
export async function ensureKtlintExists(
  context: vscode.ExtensionContext
): Promise<string> {
  const config = vscode.workspace.getConfiguration("ktlint");
  const version = config.get<string>("version") || DEFAULT_KTLINT_VERSION;
  const baseUrl = `https://github.com/pinterest/ktlint/releases/download/${version}`;
  const storageDir = context.globalStorageUri.fsPath;
  const versionDir = path.join(storageDir, version);

  if (isWindows) {
    // Windows: Download both ktlint.bat and ktlint (JAR)
    const batPath = path.join(versionDir, "ktlint.bat");
    const jarPath = path.join(versionDir, "ktlint");

    // Check if both files exist
    if (!fs.existsSync(batPath) || !fs.existsSync(jarPath)) {
      await downloadKtlintForWindows(versionDir, batPath, jarPath, baseUrl);
    }

    return batPath;
  } else {
    // Unix/Mac: Download ktlint only
    const ktlintPath = path.join(versionDir, "ktlint");

    if (!fs.existsSync(ktlintPath)) {
      await downloadKtlint(versionDir, ktlintPath, baseUrl);
    }

    return ktlintPath;
  }
}

/**
 * Download ktlint binary from GitHub releases.
 *
 * @param storageDir - Directory to store the binary
 * @param ktlintPath - Full path where ktlint will be saved
 */
export async function downloadKtlint(
  storageDir: string,
  ktlintPath: string,
  baseUrl: string
): Promise<void> {
  // Create storage directory if it doesn't exist
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading ktlint...",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0, message: "Starting download" });
      await downloadFile(`${baseUrl}/ktlint`, ktlintPath, progress);
    }
  );
}

/**
 * Download ktlint for Windows (both .bat wrapper and ktlint JAR).
 *
 * @param storageDir - Directory to store the files
 * @param batPath - Full path where ktlint.bat will be saved
 * @param jarPath - Full path where ktlint (JAR) will be saved
 */
async function downloadKtlintForWindows(
  storageDir: string,
  batPath: string,
  jarPath: string,
  baseUrl: string
): Promise<void> {
  // Create storage directory if it doesn't exist
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Downloading ktlint for Windows...",
      cancellable: false,
    },
    async (progress) => {
      // Download ktlint.bat
      progress.report({ increment: 0, message: "Downloading ktlint.bat..." });
      await downloadFile(`${baseUrl}/ktlint.bat`, batPath, progress);

      // Download ktlint (JAR)
      progress.report({ increment: 50, message: "Downloading ktlint..." });
      await downloadFile(`${baseUrl}/ktlint`, jarPath, progress);
    }
  );
}

/**
 * Helper function to download a file with redirect support.
 */
function downloadFile(
  url: string,
  destPath: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = https.get(url, (response) => {
      // Handle redirects
      if (
        response.statusCode === 301 ||
        response.statusCode === 302 ||
        response.statusCode === 307 ||
        response.statusCode === 308
      ) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadFile(redirectUrl, destPath, progress)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {}); // Delete partial file
        reject(
          new Error(`Download failed with status code: ${response.statusCode}`)
        );
        return;
      }

      const totalSize = parseInt(response.headers["content-length"] || "0", 10);
      let downloadedSize = 0;

      response.on("data", (chunk) => {
        downloadedSize += chunk.length;
        const percentage =
          totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
        progress.report({
          message: `${Math.round(percentage)}%`,
        });
      });

      response.pipe(file);

      file.on("finish", async () => {
        file.close();
        // Make executable (skip on Windows)
        try {
          if (!isWindows) {
            fs.chmodSync(destPath, 0o755);
            await new Promise(resolve => setTimeout(resolve, 100)); // Ensure chmod takes effect before resolving
          }
        } catch (e) {
          // Ignore chmod errors
        }
        progress.report({ increment: 100, message: "Complete" });
        resolve();
      });

      file.on("error", (err) => {
        file.close();
        fs.unlink(destPath, () => {}); // Delete partial file
        reject(err);
      });
    });

    request.on("error", (err) => {
      file.close();
      fs.unlink(destPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}
