# Miyako Telegram JS 🤖

โปรเจคนี้คือ Telegram Bot ที่สร้างขึ้นด้วย **Cloudflare Workers** (TypeScript) โดยมีหน้าที่หลักคือการตรวจสอบและแก้ไขลิงก์ (URL Repair) ที่ถูกส่งเข้ามาในแชท เพื่อให้การแสดงผล Preview (Rich Embed) ทำงานได้ดีขึ้น หรือเปลี่ยนลิงก์ไปยังบริการที่รองรับการแสดงผลที่ดีกว่า

## คุณสมบัติหลัก (Features)

* **Link Repairing**: แก้ไขลิงก์ที่พิมพ์มาผิดหรือมีการเว้นวรรคแปลกๆ เช่น `http s://`, `( . )`, `( com )` ให้กลายเป็นลิงก์ที่ถูกต้อง
* **Social Media Optimization**:
  * เปลี่ยนลิงก์ `twitter.com` หรือ `x.com` เป็น `vxtwitter.com` หรือ `fixupx.com` เพื่อให้แสดงผล Preview บน Telegram ได้ครบถ้วน (เช่น วิดีโอหรือรูปภาพหลายรูป)
  * รองรับการจัดการลิงก์ Pixiv, Discord และการแปลง Twitter Handle (`@username`) ให้เป็นลิงก์อัตโนมัติ
* **Unicode Normalization**: รองรับการแปลงตัวอักษรแบบ Full-width ให้เป็นตัวอักษรปกติ (NFKC)
* **Label Stripping**: ลบข้อความส่วนเกิน เช่น `Artist:`, `Cr.`, `linkdiscord:` ออกจากข้อความโดยอัตโนมัติ

## เทคโนโลยีที่ใช้ (Tech Stack)

* **Runtime**: Cloudflare Workers
* **Language**: TypeScript
* **Tooling**: Wrangler CLI
* **Testing**: Vitest

## การติดตั้งและใช้งาน (Setup & Usage)

1. **Clone โปรเจค**:

    ```bash
    git clone https://github.com/momoyuki/miyakotelegramjs
    cd miyakotelegramjs
    ```

2. **ติดตั้ง Dependencies**:

    ```bash
    npm install
    ```

3. **ตั้งค่า Environment Variables**:
    สร้างไฟล์ `.dev.vars` (สำหรับการทดสอบ Local) หรือตั้งค่า Secrets บน Cloudflare:
    * `TELEGRAM_BOT_TOKEN`: Token ของ Bot ที่ได้จาก @BotFather
    * `SECRETBOT`: Token ลับสำหรับตรวจสอบ Webhook (ส่งผ่าน Header `X-Telegram-Bot-Api-Secret-Token`)

4. **รันคำสั่งต่างๆ**:
    * `npm run dev`: รันเซิร์ฟเวอร์จำลองบนเครื่อง Local
    * `npm run test`: รัน Unit Test ด้วย Vitest
    * `npm run deploy`: Deploy โปรเจคขึ้น Cloudflare Workers

## โครงสร้างโปรเจค

* `src/index.ts`: ไฟล์หลักที่เก็บ Logic ของ Bot และการประมวลผล Webhook
* `test/`: โฟลเดอร์เก็บไฟล์ทดสอบ (Unit Tests)
* `wrangler.json`: ไฟล์ตั้งค่าสำหรับ Cloudflare Workers

## การทำงานของ Webhook

Bot จะรอรับ Request ที่ Path `/telegram` และตรวจสอบ Secret Token ก่อนประมวลผลข้อความ หากพบลิงก์ที่ตรงตามเงื่อนไข จะส่งลิงก์ที่แก้ไขแล้วกลับไปยัง Chat ต้นทางทันที
