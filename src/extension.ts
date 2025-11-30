import * as vscode from "vscode";
import { ensureKtlintExists } from "./ktlintDownloader";
import { formatKotlinCode } from "./formatter";

let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("Ktlint Formatter");
  outputChannel.appendLine("Activating Ktlint Formatter...");

  // Check and download ktlint if needed
  try {
    const ktlintPath = await ensureKtlintExists(context);
    outputChannel.appendLine(`Ktlint ready: ${ktlintPath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to initialize ktlint: ${error}`);
    outputChannel.appendLine(`Error: ${error}`);
    return;
  }

  // Register Document Formatter
  const formatter = vscode.languages.registerDocumentFormattingEditProvider(
    [
      { scheme: "file", language: "kotlin" },
      { scheme: "file", language: "kotlin-script" },
    ],
    {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): Promise<vscode.TextEdit[]> {
        try {
          const ktlintPath = await ensureKtlintExists(context);
          const formatted = await formatKotlinCode(
            document.getText(),
            ktlintPath,
            (message) => outputChannel.appendLine(message),
            document.fileName
          );

          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );

          // Show status bar message
          vscode.window.setStatusBarMessage("$(check) Ktlint: Formatted", 2000);

          return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (error) {
          outputChannel.appendLine(`Formatting error: ${error}`);
          vscode.window.setStatusBarMessage(
            "$(alert) Ktlint: Formatting Failed",
            3000
          );
          vscode.window.showErrorMessage(`Failed to format code: ${error}`);
          return [];
        }
      },
    }
  );

  context.subscriptions.push(formatter);
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine("Ktlint Formatter activated successfully!");
}

export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}
