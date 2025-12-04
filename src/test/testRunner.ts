import * as path from 'path';
import * as fs from 'fs';
import { runTests } from '@vscode/test-electron';
import { globSync } from 'glob';

async function main() {
    let exitCode = 1;

    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        const testWorkspacePrefix: string = path.join('out', 'tmp-');
        console.log(`Creating temporary directory with prefix '${testWorkspacePrefix}'...`);
        const testWorkspace: string = fs.mkdtempSync(testWorkspacePrefix);
        console.log(`Created temporary directory '${testWorkspace}'.`);
        await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: [testWorkspace] });
        exitCode = 0;
    } catch (err) {
        console.error('Failed to run tests');
        console.error(err);
    }
    const tmpDirs = globSync('out/tmp-*');
    tmpDirs.forEach(dir => {
        console.log(`Removing temporary directory '${dir}'...`);
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Removed '${dir}'.`);
    })
    console.log(`Test run completed with exit code ${exitCode}`);
    process.exit(exitCode);
}

main();
