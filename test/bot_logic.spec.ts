import { describe, it, expect } from 'vitest';
import { normalizeText, processMessageText, rewriteUrl } from '../src/index';

describe('Bot Logic', () => {
    describe('normalizeText', () => {
        it('normalizes full-width characters', () => {
            expect(normalizeText('ｈｅｌｌｏ')).toBe('hello');
        });
    });

    describe('rewriteUrl', () => {
        it('fixes Twitter/X links', () => {
            expect(rewriteUrl('https://x.com/user/status/123')).toBe('https://vxtwitter.com/user/status/123');
            expect(rewriteUrl('https://twitter.com/user/status/123')).toBe('https://vxtwitter.com/user/status/123');
        });

        it('fixes Instagram links', () => {
            expect(rewriteUrl('https://instagram.com/p/123')).toBe('https://ddinstagram.com/p/123');
            expect(rewriteUrl('https://www.instagram.com/reel/123')).toBe('https://ddinstagram.com/reel/123');
        });

        it('fixes TikTok links', () => {
            expect(rewriteUrl('https://tiktok.com/@user/video/123')).toBe('https://vxtiktok.com/@user/video/123');
        });

         it('fixes Reddit links', () => {
            expect(rewriteUrl('https://reddit.com/r/pics/123')).toBe('https://rxddit.com/r/pics/123');
        });

        it('fixes Pixiv links', () => {
            expect(rewriteUrl('https://pixiv.net/artworks/123')).toBe('https://pixiv.net/artworks/123');
        });

        it('fixes Discord links', () => {
            expect(rewriteUrl('discord.gg/invite')).toBe('https://discord.gg/invite');
        });
        
        it('converts handles to twitter links', () => {
            expect(rewriteUrl('@elonmusk')).toBe('https://twitter.com/elonmusk');
        });
        
        it('ignores other links', () => {
            expect(rewriteUrl('https://google.com')).toBe(null);
        });
    });
    
    describe('processMessageText', () => {
        it('extracts and fixes multiple links', () => {
            const text = 'Check this https://x.com/123 and this https://instagram.com/abc';
            const result = processMessageText(text);
            expect(result).toHaveLength(2);
            expect(result).toContain('https://vxtwitter.com/123');
            expect(result).toContain('https://ddinstagram.com/abc');
        });

        it('handles messily formatted links', () => {
             const text = 'linkdiscord: discord . gg / 123';
             const result = processMessageText(text);
             expect(result).toContain('https://discord.gg/123');
        });
        
        it('handles handles', () => {
            const text = 'Follow @user on twitter';
            const results = processMessageText(text);
            expect(results).toContain('https://twitter.com/user');
        });
    });
});
