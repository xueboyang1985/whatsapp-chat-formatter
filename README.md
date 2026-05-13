# WhatsApp Chat Formatter 💬

**Turn WhatsApp chat exports into clean Markdown, HTML, TXT, CSV, or JSON — 100% in your browser.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-25d366?style=flat-square)](https://xueboyang1985.github.io/whatsapp-chat-formatter/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)]()

> 🚀 **Live site**: [xueboyang1985.github.io/whatsapp-chat-formatter](https://xueboyang1985.github.io/whatsapp-chat-formatter/)

## ✨ Features

| Feature | Free | PRO |
|---|---|---|
| Messages per export | 100 messages | Unlimited |
| Export formats | Markdown, HTML, TXT, CSV, JSON | All formats + ZIP parsing |
| Date range filter | ✅ | ✅ |
| Sender filter | ✅ | ✅ |
| Statistics dashboard | ✅ | ✅ |
| System message detection | ✅ | ✅ |
| Multi-line message support | ✅ | ✅ |
| 100% local (no upload) | ✅ | ✅ |
| ZIP export with media | — | ✅ |
| Priority support | — | ✅ |

## 🎯 Why This Tool?

WhatsApp's built-in chat export produces a plain `.txt` file that's hard to read and share. This tool transforms it into:

- **Markdown** – For Notion, Obsidian, GitHub, or documentation
- **HTML** – Styled like WhatsApp chat bubbles, printable and shareable
- **CSV** – For Excel, Google Sheets, or data analysis
- **JSON** – For programmatic processing
- **TXT** – Cleaned up plain text with timestamps

## 🚀 Quick Start

1. Open WhatsApp → open a chat → tap the contact/group name → **Export Chat**
2. Choose **Without Media** → save the `.txt` file
3. Go to [WhatsApp Chat Formatter](https://xueboyang1985.github.io/whatsapp-chat-formatter/) and drag the file onto the page
4. Preview, filter, and export

## 🧩 Project Structure

```
whatsapp-chat-formatter/
  web/
    index.html      — Main tool page
    style.css       — WhatsApp-themed styles
    parser.js       — Chat parsing & export engine
    app.js          — Application logic & UI
    guide.html      — User guide & FAQ
    robots.txt      — SEO
    sitemap.xml     — SEO
  guide.html        — Redirect to web/guide.html
```

## 🛠 Tech Stack

- Vanilla JavaScript (no frameworks, no dependencies)
- CSS with WhatsApp green theme (#075e54 / #25d366)
- Zero server dependencies — everything runs in the browser

## 📄 License

MIT — do whatever you want.

## 🙏 Support

If you find this tool useful, consider [upgrading to PRO](https://xuebo8.gumroad.com/l/iwropv) ($9.99 one-time) to unlock unlimited exports and priority support.
