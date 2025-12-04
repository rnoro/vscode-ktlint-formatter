import * as assert from 'assert';
import * as vscode from 'vscode';

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

suite("Extension Test Suite", () => {

	let editor: vscode.TextEditor;

	setup(async function () {
		const wsFolder = vscode.workspace.workspaceFolders![0].uri;
		const file = vscode.Uri.joinPath(wsFolder, "test.kt");
		await vscode.workspace.fs.writeFile(file, Buffer.from(`fun main( ) {}`));
		const doc = await vscode.workspace.openTextDocument(file);
		editor = await vscode.window.showTextDocument(doc);
		const extensionName = 'rnoro.vscode-ktlint-formatter';
		const vscodeKtlintExt = vscode.extensions.getExtension(extensionName);
		if (!vscodeKtlintExt) {
			throw new Error("Extension" + extensionName + "not found");
		}
		await vscodeKtlintExt.activate();
		await sleep(2000);
	});

	test("Format Kotlin file", async function () {
		await vscode.commands.executeCommand("editor.action.formatDocument");
		await sleep(2000);
		const formattedText = editor.document.getText();
		assert.ok(
			formattedText.includes(`fun main()`),
			"Formatter did not fix function signature spacing"
		);

	});
});
