import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import * as os from "os";

const KTLINT_VERSION = "1.8.0";
const KTLINT_BASE_URL = `https://github.com/pinterest/ktlint/releases/download/${KTLINT_VERSION}`;
const MAX_REDIRECTS = 5;

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
  const storageDir = context.globalStorageUri.fsPath;

  if (isWindows) {
    // Windows: Download both ktlint.bat and ktlint (JAR)
    const batPath = path.join(storageDir, "ktlint.bat");
    const jarPath = path.join(storageDir, "ktlint");

    // Check if both files exist
    if (!fs.existsSync(batPath) || !fs.existsSync(jarPath)) {
      await downloadKtlintForWindows(storageDir, batPath, jarPath);
    }

    return batPath;
  } else {
    // Unix/Mac: Download ktlint only
    const ktlintPath = path.join(storageDir, "ktlint");

    if (!fs.existsSync(ktlintPath)) {
      await downloadKtlint(storageDir, ktlintPath);
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
  ktlintPath: string
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
      await downloadFile(`${KTLINT_BASE_URL}/ktlint`, ktlintPath, progress);
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
  jarPath: string
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
      await downloadFile(`${KTLINT_BASE_URL}/ktlint.bat`, batPath, progress);

      // Download ktlint (JAR)
      progress.report({ increment: 50, message: "Downloading ktlint..." });
      await downloadFile(`${KTLINT_BASE_URL}/ktlint`, jarPath, progress);
    }
  );
}

/**
 * Helper function to download a file with redirect support.
 */
function downloadFile(
  url: string,
  destPath: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  redirectCount = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`Too many redirects while downloading: ${url}`));
      return;
    }

    const client = getHttpClient(url);
    const request = client.get(url, (response) => {
      // Handle redirects
      if (
        response.statusCode === 301 ||
        response.statusCode === 302 ||
        response.statusCode === 307 ||
        response.statusCode === 308
      ) {
        const redirectUrl = response.headers.location;
        response.resume();

        if (!redirectUrl) {
          reject(new Error(`Redirect response missing Location header: ${url}`));
          return;
        }

        const resolvedRedirectUrl = resolveRedirectUrl(url, redirectUrl);
        downloadFile(resolvedRedirectUrl, destPath, progress, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        fs.unlink(destPath, () => {}); // Delete partial file
        reject(
          new Error(`Download failed with status code: ${response.statusCode}`)
        );
        return;
      }

      const file = fs.createWriteStream(destPath);
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

      file.on("finish", () => {
        file.close();
        // Make executable (skip on Windows)
        try {
          if (!isWindows) {
            fs.chmodSync(destPath, 0o755);
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
      fs.unlink(destPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

export function resolveRedirectUrl(baseUrl: string, redirectUrl: string): string {
  return new URL(redirectUrl, baseUrl).toString();
}

function getHttpClient(url: string): typeof http | typeof https {
  const protocol = new URL(url).protocol;
  return protocol === "http:" ? http : https;
}
