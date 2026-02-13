import * as assert from 'assert';
import { resolveRedirectUrl } from '../../ktlintDownloader';

suite('ktlintDownloader', () => {
  test('resolveRedirectUrl resolves relative redirect locations', () => {
    const resolved = resolveRedirectUrl(
      'https://github.com/pinterest/ktlint/releases/download/1.8.0/ktlint',
      '/pinterest/ktlint/releases/download/1.8.0/ktlint?raw=1'
    );

    assert.strictEqual(
      resolved,
      'https://github.com/pinterest/ktlint/releases/download/1.8.0/ktlint?raw=1'
    );
  });

  test('resolveRedirectUrl keeps absolute redirects unchanged', () => {
    const resolved = resolveRedirectUrl(
      'https://github.com/pinterest/ktlint/releases/download/1.8.0/ktlint',
      'https://objects.githubusercontent.com/file'
    );

    assert.strictEqual(resolved, 'https://objects.githubusercontent.com/file');
  });
});
