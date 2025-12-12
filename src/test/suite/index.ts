import { globSync } from 'glob';
import Mocha from 'mocha';
import * as Path from 'path';

export function run(): Promise<void> {
  const mocha: Mocha = new Mocha({
    ui: 'tdd',
    timeout: 30000,
  });

  const testsRoot: string = Path.resolve(__dirname, '..');
  const files: string[] = globSync('**/**.test.js', { cwd: testsRoot }).sort();
  files.forEach((x: string) => mocha.addFile(Path.resolve(testsRoot, x)));
  return new Promise<void>((resolve, reject) => {
    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (e: unknown) {
      console.error(e);
      reject(e);
    }
  });

}