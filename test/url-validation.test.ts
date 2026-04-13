import { describe, it, expect } from 'bun:test';
import { validateNavigationUrl } from '../src/url-validation';

describe('validateNavigationUrl', () => {
  it('allows http URLs', async () => {
    await expect(validateNavigationUrl('http://example.com')).resolves.toBeUndefined();
  });

  it('allows https URLs', async () => {
    await expect(validateNavigationUrl('https://example.com/path?q=1')).resolves.toBeUndefined();
  });

  it('allows localhost', async () => {
    await expect(validateNavigationUrl('http://localhost:3000')).resolves.toBeUndefined();
  });

  it('allows 127.0.0.1', async () => {
    await expect(validateNavigationUrl('http://127.0.0.1:8080')).resolves.toBeUndefined();
  });

  it('allows private IPs', async () => {
    await expect(validateNavigationUrl('http://192.168.1.1')).resolves.toBeUndefined();
  });

  it('blocks file:// scheme', async () => {
    await expect(validateNavigationUrl('file:///etc/passwd')).rejects.toThrow(/scheme.*not allowed/i);
  });

  it('blocks javascript: scheme', async () => {
    await expect(validateNavigationUrl('javascript:alert(1)')).rejects.toThrow(/scheme.*not allowed/i);
  });

  it('blocks data: scheme', async () => {
    await expect(validateNavigationUrl('data:text/html,<h1>hi</h1>')).rejects.toThrow(/scheme.*not allowed/i);
  });

  it('blocks AWS/GCP metadata endpoint', async () => {
    await expect(validateNavigationUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks GCP metadata hostname', async () => {
    await expect(validateNavigationUrl('http://metadata.google.internal/computeMetadata/v1/')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks Azure metadata hostname', async () => {
    await expect(validateNavigationUrl('http://metadata.azure.internal/metadata/instance')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks metadata hostname with trailing dot', async () => {
    await expect(validateNavigationUrl('http://metadata.google.internal./computeMetadata/v1/')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks metadata IP in hex form', async () => {
    await expect(validateNavigationUrl('http://0xA9FEA9FE/')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks metadata IP in decimal form', async () => {
    await expect(validateNavigationUrl('http://2852039166/')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks metadata IP in octal form', async () => {
    await expect(validateNavigationUrl('http://0251.0376.0251.0376/')).rejects.toThrow(/cloud metadata/i);
  });

  it('blocks IPv6 metadata with brackets', async () => {
    await expect(validateNavigationUrl('http://[fd00::]/')).rejects.toThrow(/cloud metadata/i);
  });

  it('throws on malformed URLs', async () => {
    await expect(validateNavigationUrl('not-a-url')).rejects.toThrow(/Invalid URL/i);
  });

  // ─── Trusted Hosts (BROWSE_TRUSTED_HOSTS) ─────────────────

  describe('trustedHosts', () => {
    const trusted = new Set(['localhost', '192.168.1.5']);

    it('allows HTTPS to a trusted hostname', async () => {
      await expect(validateNavigationUrl('https://localhost:8443/app', trusted)).resolves.toBeUndefined();
    });

    it('allows HTTPS to a trusted IP', async () => {
      await expect(validateNavigationUrl('https://192.168.1.5/api', trusted)).resolves.toBeUndefined();
    });

    it('blocks HTTPS to an untrusted host', async () => {
      await expect(validateNavigationUrl('https://evil.com', trusted)).rejects.toThrow(/not in BROWSE_TRUSTED_HOSTS/i);
    });

    it('still allows HTTP to any host (no cert involved)', async () => {
      await expect(validateNavigationUrl('http://evil.com', trusted)).resolves.toBeUndefined();
    });

    it('supports host:port pinning', async () => {
      const pinned = new Set(['localhost:8443']);
      await expect(validateNavigationUrl('https://localhost:8443/', pinned)).resolves.toBeUndefined();
      await expect(validateNavigationUrl('https://localhost:9999/', pinned)).rejects.toThrow(/not in BROWSE_TRUSTED_HOSTS/i);
    });

    it('hostname-only entry trusts all ports', async () => {
      const hostnameOnly = new Set(['localhost']);
      await expect(validateNavigationUrl('https://localhost:8443/', hostnameOnly)).resolves.toBeUndefined();
      await expect(validateNavigationUrl('https://localhost:9999/', hostnameOnly)).resolves.toBeUndefined();
    });
  });
});
