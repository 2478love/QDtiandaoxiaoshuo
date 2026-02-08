import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  sanitizeHtml,
  sanitizeRichText,
  sanitizePlainText,
  isSafeUrl,
  sanitizeUrl,
} from './crypto';

describe('utils/crypto - HTML Escaping & Sanitization', () => {
  describe('escapeHtml', () => {
    it('should escape basic HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
      expect(escapeHtml("It's fine")).toBe('It&#039;s fine');
    });

    it('should escape angle brackets', () => {
      expect(escapeHtml('1 < 2 > 0')).toBe('1 &lt; 2 &gt; 0');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle string without special characters', () => {
      const input = 'Hello World 123';
      expect(escapeHtml(input)).toBe(input);
    });

    it('should prevent XSS in export scenarios', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain('<img');
      expect(escaped).not.toContain('onerror="');
      expect(escaped).toContain('&lt;img');
      expect(escaped).toContain('&quot;'); // Quotes are escaped
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
    });

    it('should remove script tags', () => {
      const input = '<p>Safe</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<script');
      expect(output).not.toContain('alert');
      expect(output).toContain('<p>Safe</p>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onclick');
      expect(output).toContain('Click me');
    });

    it('should remove iframe tags', () => {
      const input = '<p>Text</p><iframe src="evil.com"></iframe>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<iframe');
      expect(output).toContain('<p>Text</p>');
    });

    it('should allow safe links', () => {
      const input = '<a href="https://example.com">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).toContain('<a');
      expect(output).toContain('href');
    });

    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow rich text tags like ruby', () => {
      const input = '<ruby>漢<rt>かん</rt></ruby>';
      const output = sanitizeRichText(input);
      expect(output).toContain('<ruby>');
      expect(output).toContain('<rt>');
    });

    it('should allow subscript and superscript', () => {
      const input = 'H<sub>2</sub>O and x<sup>2</sup>';
      const output = sanitizeRichText(input);
      expect(output).toContain('<sub>');
      expect(output).toContain('<sup>');
    });

    it('should still remove dangerous tags', () => {
      const input = '<mark>Safe</mark><script>alert(1)</script>';
      const output = sanitizeRichText(input);
      expect(output).toContain('<mark>');
      expect(output).not.toContain('<script');
    });
  });

  describe('sanitizePlainText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizePlainText(input);
      expect(output).toBe('Hello World');
      expect(output).not.toContain('<');
    });

    it('should remove script tags and content', () => {
      const input = 'Text<script>alert(1)</script>More';
      const output = sanitizePlainText(input);
      expect(output).not.toContain('<script');
      expect(output).not.toContain('alert');
    });

    it('should handle nested tags', () => {
      const input = '<div><p><span>Nested</span></p></div>';
      const output = sanitizePlainText(input);
      expect(output).toBe('Nested');
    });

    it('should preserve text content', () => {
      const input = '<h1>Title</h1><p>Paragraph</p>';
      const output = sanitizePlainText(input);
      expect(output).toContain('Title');
      expect(output).toContain('Paragraph');
    });
  });

  describe('isSafeUrl', () => {
    it('should accept http URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('should accept https URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('should accept mailto URLs', () => {
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
    });

    it('should reject javascript URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data URLs', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should reject vbscript URLs', () => {
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('should handle relative URLs', () => {
      expect(isSafeUrl('/path/to/page')).toBe(true);
      expect(isSafeUrl('../relative')).toBe(true);
    });

    it('should reject javascript in relative URLs', () => {
      expect(isSafeUrl('javascript:void(0)')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return safe URLs unchanged', () => {
      const url = 'https://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('should return empty string for dangerous URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>')).toBe('');
    });

    it('should handle empty input', () => {
      expect(sanitizeUrl('')).toBe('');
    });

    it('should preserve relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    });
  });
});

describe('utils/crypto - Export Safety', () => {
  it('should safely escape chapter content for Word export', () => {
    const chapterContent = '<script>alert("XSS")</script><p>正常内容</p>';
    const escaped = escapeHtml(chapterContent);
    
    expect(escaped).not.toContain('<script');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('正常内容');
  });

  it('should safely escape novel title for PDF export', () => {
    const title = '小说标题<img src=x onerror=alert(1)>';
    const escaped = escapeHtml(title);
    
    expect(escaped).not.toContain('<img');
    expect(escaped).not.toContain('<img src=x onerror=alert(1)>'); // Full tag removed
    expect(escaped).toContain('小说标题');
    expect(escaped).toContain('&lt;img');
  });

  it('should handle multiple XSS vectors in export', () => {
    const content = `
      <script>alert(1)</script>
      <img src=x onerror=alert(2)>
      <a href="javascript:alert(3)">Link</a>
      <div onclick="alert(4)">Click</div>
    `;
    const escaped = escapeHtml(content);
    
    expect(escaped).not.toContain('<script');
    expect(escaped).not.toContain('<img src=x onerror=alert(2)>'); // Full tag escaped
    expect(escaped).not.toContain('href="javascript:'); // Quotes escaped
    expect(escaped).not.toContain('onclick="'); // Quotes escaped
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&lt;img');
    expect(escaped).toContain('&quot;'); // Quotes are escaped
  });

  it('should preserve Chinese characters in export', () => {
    const content = '这是一段中文内容，包含标点符号：《》、""\'\'';
    const escaped = escapeHtml(content);
    
    expect(escaped).toContain('这是一段中文内容');
    expect(escaped).toContain('《》');
    expect(escaped).toContain('、');
  });

  it('should handle mixed content safely', () => {
    const content = '正常文本<script>恶意代码</script>更多文本';
    const escaped = escapeHtml(content);
    
    expect(escaped).toContain('正常文本');
    expect(escaped).toContain('更多文本');
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});
