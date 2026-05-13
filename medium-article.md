# WhatsApp Chat Exporter: Turn Your Chats into Clean Documents

If you've ever tried to export a WhatsApp chat, you know the pain. WhatsApp gives you a plain `.txt` file that looks like a jumbled mess of brackets, timestamps, and names. It's readable, barely, but try sharing it with someone or importing it into another tool — good luck.

I built a free tool that fixes this.

## What It Does

[WhatsApp Chat Formatter](https://xueboyang1985.github.io/whatsapp-chat-formatter/) takes your WhatsApp exported `.txt` file and converts it into clean, usable formats:

- **Markdown** — Perfect for Notion, Obsidian, GitHub, or documentation
- **HTML** — Styled like WhatsApp chat bubbles, printable and shareable
- **CSV** — Import into Excel or Google Sheets for analysis
- **JSON** — Structured data for developers
- **Plain Text** — Cleaned up with consistent formatting

## How to Use It

1. Open WhatsApp → open a chat → tap the contact/group name → **Export Chat**
2. Choose **Without Media** → save the `.txt` file
3. Go to [the tool](https://xueboyang1985.github.io/whatsapp-chat-formatter/) and drag the file onto the page
4. Preview, filter by date or sender, and export

That's it. No account, no signup, no upload.

## Who Is This For?

- **Journalists** archiving source conversations
- **Freelancers** organizing client chats
- **Researchers** analyzing communication patterns
- **Legal professionals** documenting conversations
- **Anyone** who wants to keep a readable backup of their chats

## Privacy First

This is the part I'm most proud of: **everything runs in your browser**. Your chat file never touches a server. The page works even after you go offline. There's no analytics, no tracking, no data collection.

## The Tech

Vanilla JavaScript. Zero dependencies. One HTML file, one CSS file, two JS files. It even works without internet after the first load — perfect for privacy-conscious users.

## Free vs PRO

The free version handles the first 100 messages with all features. PRO ($9.99 one-time) unlocks unlimited messages and ZIP export support.

---

Try it: https://xueboyang1985.github.io/whatsapp-chat-formatter/
