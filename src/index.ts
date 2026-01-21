export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const SECRETBOT = env.SECRETBOT;
		const TOKEN = env.TELEGRAM_BOT_TOKEN;
		const PATHAPI = '/telegram';
		const TELEGRAM_API = 'https://api.telegram.org/bot' + `${TOKEN}`;
		const url = new URL(request.url);

		if (url.pathname === PATHAPI) {
			if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRETBOT) {
				return new Response('403 Forbidden Error', { status: 403 });
			}

			const update: any = await request.json();

			if (!update.message || !update.message.text) {
				console.log('No text message found in update.');
				return new Response('Ok');
			}

			const message: any = update.message;
			const text = message.text;

			const responseText = repairLinks(text);
			const responseFixup = convertToFixupX(text);
			const responesevxTwitter = convertTovxTwitter(text);

			const links = responseText.match(/https?:\/\/\S+/g) || [];
			const linkx = responseFixup.match(/https?:\/\/\S+/g) || [];
			const linkxv = responesevxTwitter.match(/https?:\/\/\S+/g) || [];

			const allLinks = [...links, ...linkx, ...linkxv];
			const uniqueLinks = [...new Set(allLinks)];

			for (const link of uniqueLinks) {
				await fetch(TELEGRAM_API + '/sendMessage', {
					method: 'POST',
					headers: { 'content-type': 'application/json;charset=UTF-8' },
					body: JSON.stringify({
						chat_id: update.message.chat.id,
						text: link,
					}),
				});
			}

			return new Response('OK');
		}

		return new Response('Hello World');
	},
};

function normalizeText(text: string) {
	return text.normalize('NFKC');
}

function preClean(text: string): string {
	let cleaned = normalizeText(text);
	cleaned = cleaned.replace(/\(\s*\.\s*\)/g, '.');
	cleaned = cleaned.replace(/\(\s*com\s*\)/gi, 'com');
	cleaned = cleaned.replace(/(\w+)\s*\.\s*(\w+)/g, '$1.$2');
	cleaned = cleaned.replace(/(Artist:|Cr\.|linkdiscord:)/gi, '');
	return cleaned;
}

function repairLinks(text: string) {
	let cleaned = preClean(text);
	cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?pixiv\.net\/?\s*\n\s*artworks/gi, 'https://pixiv.net/artworks');
	cleaned = cleaned.replace(/(https?:\/\/)?discord\s*\.gg/gi, 'https://discord.gg');
	cleaned = cleaned.replace(/@(\w+)/g, 'https://twitter.com/$1');
	return cleaned.replace(/(https?:\/\/[^\s]+)/g, ' $1 ').trim();
}

function convertToFixupX(text: string) {
	let cleaned = preClean(text);
	cleaned = cleaned.replace(/(https?:\/\/)?(x\.com|twitter\.com)/g, 'https://fixupx.com');
	return cleaned.replace(/(https?:\/\/[^\s]+)/g, ' $1 ').trim();
}

function convertTovxTwitter(text: string) {
	let cleaned = preClean(text);
	cleaned = cleaned.replace(/(https?:\/\/)?(x\.com|twitter\.com)/g, 'https://vxtwitter.com');
	return cleaned.replace(/(https?:\/\/[^\s]+)/g, ' $1 ').trim();
}
