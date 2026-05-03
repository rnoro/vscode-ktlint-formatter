import * as assert from 'assert';
import * as vscode from 'vscode';

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

suite("Extension Test Suite", () => {

	let editor: vscode.TextEditor;
	const fileName = "test.kt";
	const textTobeFormatted = "fun main( ) {}"

	setup(async function () {
		const wsFolder = vscode.workspace.workspaceFolders![0].uri;
		const file = vscode.Uri.joinPath(wsFolder, fileName);
		await vscode.workspace.fs.writeFile(file, Buffer.from(textTobeFormatted));
		const doc = await vscode.workspace.openTextDocument(file);
		editor = await vscode.window.showTextDocument(doc);
		const extensionName = 'rnoro.vscode-ktlint-formatter';
		const vscodeKtlintExt = vscode.extensions.getExtension(extensionName);
		if (!vscodeKtlintExt) {
			throw new Error("Extension" + extensionName + "not found");
		}
		await vscodeKtlintExt.activate();
		await sleep(1000);
	});

	teardown(async function () {
		await editor.edit((editBuilder) => {
			const fullRange = new vscode.Range(
				editor.document.positionAt(0),
				editor.document.positionAt(editor.document.getText().length)
			);
			editBuilder.replace(fullRange, textTobeFormatted);
		});
	});

	test("Format Kotlin file", async function () {
		await vscode.commands.executeCommand("editor.action.formatDocument");
		await sleep(1000);
		const formattedText = editor.document.getText();
		assert.ok(
			formattedText.includes(`fun main()`),
			"Formatter did not fix function signature spacing"
		);

	});

	test("Format Kotlin file with custom ktlint version", async function () {
		const config = vscode.workspace.getConfiguration("ktlint");
		await config.update("version", "1.7.0", vscode.ConfigurationTarget.Global);
		await sleep(1000);
		await vscode.commands.executeCommand("editor.action.formatDocument");
		await sleep(1000);
		const formattedText = editor.document.getText();
		assert.ok(
			formattedText.includes(`fun main()`),
			"Formatter failed with custom version"
		);
	});
});
