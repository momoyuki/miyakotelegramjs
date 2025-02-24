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
			const update: any = await request.json();
			const message: any = update.message;
			const text = message.text;
			const responseText = fixupLink(text);
			const responseFixup = fixupX(text);
			const links = responseText.match(/https?:\/\/\S+/g) || [];
			const linkx = responseFixup.match(/https?:\/\/\S+/g) || [];
			console.log("Found links:", links);
			
			for (const link of links) {
				await fetch(
					TELEGRAM_API + "/sendMessage",
					{
						method: "POST",
						headers: {
							"content-type": "application/json;charset=UTF-8"
						},
						body: JSON.stringify({
							"chat_id": update.message.chat.id,
							"text": link
						})
					}
				);
			}

			for (const link of linkx) {
				await fetch(
					TELEGRAM_API + "/sendMessage",
					{
						method: "POST",
						headers: {
							"content-type": "application/json;charset=UTF-8"
						},
						body: JSON.stringify({
							"chat_id": update.message.chat.id,
							"text": link
						})
					}
				);
			}
			return new Response("Ok");
		}
		return new Response("Hello World");
	}
};
function fullToHalf(text: string) {
	return text.normalize("NFKC");
}
function fixupLink(text: string) {
	let cleaned = fullToHalf(text);
	cleaned = cleaned.replace(/\(\s*com\s*\)/gi, "com");
	cleaned = cleaned.replace(/(\w+)\s*\.\s*(\w+)/g, "$1.$2");
	cleaned = cleaned.replace(/(https?:\/\/[^\s]+)/g, " $1 ").trim();
	cleaned = cleaned.replace(/(https?:\/\/)?(x\.com|twitter\.com)/g, "https://vxtwitter.com");
	cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?pixiv\.net\/?\s*\n\s*artworks/gi, "https://pixiv.net/artworks");
	cleaned = cleaned.replace(/@(\w+)/g, "https://twitter.com/$1");
	cleaned = cleaned.replace(/(https?:\/\/)?discord\s*\.gg/gi, "https://discord.gg");
	cleaned = cleaned.replace(/(Artist:|Cr\.|linkdiscord:)/gi, "");
	return cleaned.trim();
}

function fixupX(text: string) {
	let cleaned = fullToHalf(text);
	cleaned = cleaned.replace(/(https?:\/\/)?(x\.com|twitter\.com)/g, "https://fixupx.com");
	return cleaned.trim();
}