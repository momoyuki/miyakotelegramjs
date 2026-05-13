export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const SECRETBOT = env.SECRETBOT;
		const TOKEN = env.TELEGRAM_BOT_TOKEN;
		const PATHAPI = "/telegram";
		const TELEGRAM_API = "https://api.telegram.org/bot" + TOKEN;
		const url = new URL(request.url);
		if (url.pathname === PATHAPI) {
			if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== SECRETBOT) {
				return new Response("403 Forbidden Error", { status: 403 });
			}
			let update: any;
			try {
				update = await request.json();
			} catch (err) {
				return new Response("Bad Request", { status: 400 });
			}

			if (!update.message || !update.message.text) {
				console.log("No text message found in update.");
				return new Response("Ok");
			}

			const message: any = update.message;
			const text = message.text;
			const responseText = repairLinks(text);
			const responseFixup = convertToFixupX(text);
			const links = responseText.match(/https?:\/\/\S+/g) || [];
			const linkx = responseFixup.match(/https?:\/\/\S+/g) || [];

			const fetchPromises = [];

			for (const link of links) {
				console.log("Found link:", link);
				fetchPromises.push(
					fetch(TELEGRAM_API + "/sendMessage", {
						method: "POST",
						headers: {
							"content-type": "application/json;charset=UTF-8"
						},
						body: JSON.stringify({
							"chat_id": update.message.chat.id,
							"text": link
						})
					})
				);
			}

			for (const link of linkx) {
				console.log("Found link:", link);
				fetchPromises.push(
					fetch(TELEGRAM_API + "/sendMessage", {
						method: "POST",
						headers: {
							"content-type": "application/json;charset=UTF-8"
						},
						body: JSON.stringify({
							"chat_id": update.message.chat.id,
							"text": link
						})
					})
				);
			}

			await Promise.all(fetchPromises);
			return new Response("Ok");
		}
		return new Response("Hello World!");
	}
};
export function normalizeText(text: string) {
	return text.normalize("NFKC");
}

function performCommonRepairs(text: string): string {
	let cleaned = normalizeText(text);

	cleaned = cleaned.replace(/\(\s*\.\s*\)/g, ".");
	cleaned = cleaned.replace(/\(\s*com\s*\)/gi, "com");
	cleaned = cleaned.replace(/(\w+)\s*\.\s*(\w+)/g, "$1.$2");

	cleaned = cleaned.replace(/((?:h\s*t\s*t\s*p(?:\s*s)?|:\s*\/\s*\/+|\/\s*\/+)[^a-z0-9]*)([a-z0-9-.\(\)]+\.[a-z]{2,}[^\s]*)/gi, (match, pPart, dPart) => {
		const lowP = pPart.toLowerCase();
		let protocol = "https://";
		if (/h\s*t\s*t\s*p/i.test(lowP)) {
			protocol = /s/i.test(lowP) ? "https://" : "http://";
		}
		return protocol + dPart;
	});
	cleaned = cleaned.replace(/(https?)\s*:\s*\/\s*\/+/gi, "$1://");

	return cleaned;
}

export function repairLinks(text: string) {
	let cleaned = performCommonRepairs(text);

	cleaned = cleaned.replace(/(https?:\/\/[^\s]+)/g, " $1 ").trim();
	cleaned = cleaned.replace(/(https?:\/\/)?(x\.com|twitter\.com)/g, "https://vxtwitter.com");
	cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?pixiv\.net\/?\s*\n\s*artworks/gi, "https://pixiv.net/artworks");
	cleaned = cleaned.replace(/@(\w+)/g, "https://twitter.com/$1");
	cleaned = cleaned.replace(/(https?:\/\/)?discord\s*\.gg/gi, "https://discord.gg");
	cleaned = cleaned.replace(/(Artist:|Cr\.|linkdiscord:)/gi, "");
	return cleaned.trim();
}

export function convertToFixupX(text: string) {
	let cleaned = performCommonRepairs(text);
	if (!/(x\.com|twitter\.com)/i.test(cleaned)) {
		return "";
	}
	cleaned = cleaned.replace(/(https?:\/\/)?(x\.com|twitter\.com)/g, "https://fixupx.com");
	return cleaned.trim();
}