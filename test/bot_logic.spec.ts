import { describe, it, expect } from 'vitest';
import { normalizeText, repairLinks, convertToFixupX } from '../src/index';

describe('Bot Logic', () => {
    describe('normalizeText', () => {
        it('normalizes full-width characters', () => {
            expect(normalizeText('ｈｅｌｌｏ')).toBe('hello');
        });
    });

    describe('repairLinks', () => {
        it('fixes Twitter/X links', () => {
            expect(repairLinks('https://x.com/user/status/123')).toBe('https://vxtwitter.com/user/status/123');
            expect(repairLinks('https://twitter.com/user/status/123')).toBe('https://vxtwitter.com/user/status/123');
        });

        it('fixes protocol spaces', () => {
            const cases = [
                'http s://example.com',
                'https :/ /example.com',
                'h ttps://example.com',
                'ht tps://example.com',
                'htt ps://example.com',
                'https ://example.com'
            ];
            cases.forEach(c => {
                expect(repairLinks(c)).toBe('https://example.com');
            });
            expect(repairLinks('h ttp://example.com')).toBe('http://example.com');
        });

        it('fixes incomplete protocols', () => {
            expect(repairLinks('http example.com')).toBe('http://example.com');
            expect(repairLinks('https google.com')).toBe('https://google.com');
            expect(repairLinks('://twitter.com')).toBe('https://vxtwitter.com');
            expect(repairLinks('//pixiv.net')).toBe('https://pixiv.net');
            expect(repairLinks('h ttp s google.com')).toBe('https://google.com');
        });

        it('does not fix protocol-like strings that are not followed by a domain', () => {
             // If there's no domain-like structure after, it shouldn't aggressively fix it
             expect(repairLinks('http just some text')).toBe('http just some text');
             expect(repairLinks('://')).toBe('://');
        });

        it('fixes Pixiv links', () => {
             // Note: current regex for pixiv is specific to artworks and newline
             const text = 'https://pixiv.net/\nartworks/123';
             expect(repairLinks(text)).toBe('https://pixiv.net/artworks/123');
        });

        it('fixes Discord links', () => {
            expect(repairLinks('discord . gg/invite')).toBe('https://discord.gg/invite');
        });
        
        it('converts handles to twitter links', () => {
            expect(repairLinks('@elonmusk')).toBe('https://twitter.com/elonmusk');
        });

        it('fixes domain-less X/Twitter status references', () => {
            expect(repairLinks('(X) /elonmusk/status/123')).toBe('https://vxtwitter.com/elonmusk/status/123');
            expect(repairLinks('(X) elonmusk/status/123')).toBe('https://vxtwitter.com/elonmusk/status/123');
            expect(repairLinks('(x) elonmusk/status/123')).toBe('https://vxtwitter.com/elonmusk/status/123');
            expect(repairLinks('elonmusk/status/123')).toBe('https://vxtwitter.com/elonmusk/status/123');
        });

        it('does not re-mangle an already-complete status URL', () => {
            expect(repairLinks('https://twitter.com/user/status/123')).toBe('https://vxtwitter.com/user/status/123');
        });

        it('does not swallow trailing punctuation into a domain-less status reference', () => {
            expect(repairLinks('(X) elonmusk/status/123)')).toBe('https://vxtwitter.com/elonmusk/status/123)');
        });
    });

    describe('convertToFixupX', () => {
        it('converts to fixupx', () => {
             expect(convertToFixupX('https://x.com/user')).toBe('https://fixupx.com/user');
        });

        it('handles protocol spaces in fixupx', () => {
             expect(convertToFixupX('h ttps://x.com/user')).toBe('https://fixupx.com/user');
        });

        it('fixes domain-less X/Twitter status references', () => {
            expect(convertToFixupX('(X) /elonmusk/status/123')).toBe('https://fixupx.com/elonmusk/status/123');
            expect(convertToFixupX('(X) elonmusk/status/123')).toBe('https://fixupx.com/elonmusk/status/123');
            expect(convertToFixupX('(x) elonmusk/status/123')).toBe('https://fixupx.com/elonmusk/status/123');
            expect(convertToFixupX('elonmusk/status/123')).toBe('https://fixupx.com/elonmusk/status/123');
        });

        it('does not re-mangle an already-complete status URL', () => {
            expect(convertToFixupX('https://twitter.com/user/status/123')).toBe('https://fixupx.com/user/status/123');
        });
    });
});
