export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const SECRETBOT = env.SECRETBOT;
		const TOKEN = env.TELEGRAM_BOT_TOKEN;
		const PATHAPI = "/telegram";
		const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
		const url = new URL(request.url);

		if (url.pathname === PATHAPI) {
			if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== SECRETBOT) {
				return new Response("403 Forbidden Error", { status: 403 });
			}

			let update: any;
			try {
				update = await request.json();
			} catch (e) {
				return new Response("Bad Request", { status: 400 });
			}

			if (!update.message || !update.message.text) {
				console.log("No text message found in update.");
				return new Response("Ok");
			}

			const message = update.message;
			const text = message.text;
			const chatId = message.chat.id;

			const processedLinks = processMessageText(text);

			if (processedLinks.length > 0) {
				await Promise.all(processedLinks.map(link =>
					sendMessage(TELEGRAM_API, chatId, link)
				));
			}

			return new Response("Ok");
		}
		return new Response("Hello World!");
	}
};

async function sendMessage(apiUrl: string, chatId: number | string, text: string) {
	console.log(`Sending message to ${chatId}: ${text}`);
	await fetch(`${apiUrl}/sendMessage`, {
		method: "POST",
		headers: {
			"content-type": "application/json;charset=UTF-8"
		},
		body: JSON.stringify({
			"chat_id": chatId,
			"text": text
		})
	});
}

export function normalizeText(text: string): string {
	return text.normalize("NFKC");
}

export function rewriteUrl(url: string): string | null {
	let cleanUrl = url.trim();

    // Twitter User @handle => link
    if (cleanUrl.match(/^@(\w+)$/)) {
        return `https://twitter.com/${cleanUrl.substring(1)}`;
    }

	// Twitter/X => vxtwitter
	if (cleanUrl.match(/https?:\/\/(x\.com|twitter\.com)/)) {
		return cleanUrl.replace(/https?:\/\/(x\.com|twitter\.com)/, "https://vxtwitter.com");
	}

	// Pixiv
	if (cleanUrl.match(/https?:\/\/(www\.)?pixiv\.net\/?[\s\/]+artworks/i)) {
		return cleanUrl.replace(/https?:\/\/(www\.)?pixiv\.net\/?[\s\/]+artworks/i, "https://pixiv.net/artworks");
	}

	// Instagram => ddinstagram
	if (cleanUrl.match(/https?:\/\/(www\.)?instagram\.com/)) {
		return cleanUrl.replace(/https?:\/\/(www\.)?instagram\.com/, "https://ddinstagram.com");
	}

	// TikTok => vxtiktok
	if (cleanUrl.match(/https?:\/\/(www\.)?tiktok\.com/)) {
		return cleanUrl.replace(/https?:\/\/(www\.)?tiktok\.com/, "https://vxtiktok.com");
	}

	// Reddit => rxddit
	if (cleanUrl.match(/https?:\/\/(www\.)?reddit\.com/)) {
		return cleanUrl.replace(/https?:\/\/(www\.)?reddit\.com/, "https://rxddit.com");
	}
    
    // Discord
    if (cleanUrl.match(/(https?:\/\/)?discord\.gg/i)) {
        return cleanUrl.replace(/(https?:\/\/)?discord\.gg/i, "https://discord.gg");
    }

	return null;
}

export function processMessageText(text: string): string[] {
	let cleaned = normalizeText(text);
    const results: string[] = [];

    // Global cleanups for broken links
    cleaned = cleaned.replace(/(Artist:|Cr\.|linkdiscord:)/gi, "");
    cleaned = cleaned.replace(/\(\s*com\s*\)/gi, "com");
    cleaned = cleaned.replace(/(\w+)\s*\.\s*(\w+)/g, "$1.$2");
    cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?pixiv\.net\/?\s*\n\s*artworks/gi, "https://pixiv.net/artworks");
    cleaned = cleaned.replace(/(https?:\/\/)?discord\s*\.gg/gi, "https://discord.gg");
    cleaned = cleaned.replace(/\s+\/\s+/g, "/");

    // Fix broken protocol spacing globally
    cleaned = cleaned.replace(/http\s+s\s*:\/\//gi, "https://");
    cleaned = cleaned.replace(/(https?)\s+:\/\//gi, "$1://");
    
    // Re-split after global fixes that might have merged tokens
    const fixedTokens = cleaned.split(/\s+/);
    const urlRegex = /^https?:\/\//i;

    for (const token of fixedTokens) {
        const fixed = rewriteUrl(token);
        if (fixed) {
            results.push(fixed);
        } else if (token.match(urlRegex)) {
            // It's a URL but didn't need fixing, keep it.
            results.push(token);
        }
    }
    
    if (results.length === 0) {
        console.log(`No links found in message: '${text}' using clean: '${cleaned}'`);
    }

    return [...new Set(results)];
}