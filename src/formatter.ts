import * as child_process from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { isWindows } from "./ktlintDownloader";

/**
 * Format Kotlin code using ktlint.
 *
 * @param code - The Kotlin source code to format
 * @param ktlintPath - Path to the ktlint executable
 * @param logger - Optional logger function
 * @param fileName - Optional file name to determine extension and rules
 * @returns The formatted code
 */
export async function formatKotlinCode(
  code: string,
  ktlintPath: string,
  logger: (message: string) => void = () => {},
  fileName: string = "temp.kt"
): Promise<string> {
  // Create a temporary file to avoid stdin issues and ensure correct file extension handling
  const tempDir = os.tmpdir();
  const extension = path.extname(fileName) || ".kt";
  const tempFilePath = path.join(tempDir, path.parse(fileName).name + extension);

  try {
    logger(`Running ktlint: ${ktlintPath} on ${tempFilePath}`);

    // Write code to temp file asynchronously
    await fs.promises.writeFile(tempFilePath, code);

    // Execute ktlint on the temp file
    // Using --format to modify the file in place
    // Using --log-level=error to suppress INFO logs
    // On Windows, use shell to execute .jar files
    await new Promise<void>((resolve, reject) => {
      const process = child_process.spawn(
        ktlintPath,
        ["--format", "--log-level=error", tempFilePath],
        {
          stdio: ["ignore", "pipe", "pipe"],
          shell: isWindows,
        }
      );

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("close", (exitCode) => {
        logger(`ktlint finished with exit code: ${exitCode}`);
        if (stderr) {
          logger(`ktlint stderr:\n${stderr}`);
        }
        if (stdout) {
          logger(`ktlint stdout:\n${stdout}`);
        }

        // Check for critical errors
        const hasParsingError =
          stderr.includes("Not a valid Kotlin file") ||
          stderr.includes("Can not parse input");

        if (hasParsingError) {
          reject(new Error(`Invalid Kotlin syntax: ${stderr.split("\n")[0]}`));
        } else if (exitCode !== 0 && stderr) {
          // If exit code is non-zero and there is stderr, it might be a real error
          // But ktlint sometimes returns non-zero for lint errors even after formatting
          // So we only reject if we can't read the file back or if it's a serious error
          logger(
            `ktlint exited with code ${exitCode}, but continuing to read file.`
          );
        }

        resolve();
      });

      process.on("error", (err) => {
        logger(`Process error: ${err}`);
        reject(err);
      });
    });

    // Read the formatted code back asynchronously
    if (fs.existsSync(tempFilePath)) {
      const formattedCode = await fs.promises.readFile(tempFilePath, "utf-8");
      logger(`Formatting successful (content length: ${formattedCode.length})`);
      return formattedCode;
    } else {
      throw new Error("Temporary file disappeared after formatting");
    }
  } catch (error) {
    throw new Error(`Error formatting code: ${error}`);
  } finally {
    // Cleanup temp file asynchronously
    if (fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (e) {
        logger(`Failed to delete temp file: ${e}`);
      }
    }
  }
}
