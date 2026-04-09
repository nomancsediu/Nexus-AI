<div align="center">

<h1>Nexus</h1>

<p><i>Paste a YouTube link or raw text — AI reads it, summarizes it, and answers your questions about it.</i></p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nexus.abdnoman.com-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://nexus.abdnoman.com)

</div>

---

## Overview

Nexus is a full-stack AI learning assistant where you drop a YouTube URL or paste any text — the rest is handled automatically. The backend fetches the transcript via Supadata, sends it to Groq's LLaMA model for analysis, and streams responses back in real time.

Built to demonstrate production-grade concepts: streaming HTTP responses, in-memory caching, SSE (Server-Sent Events), Python generators, and a clean React frontend with math and flowchart rendering.

---

## Core Features

<div align="center">

| Feature | Description |
|---|---|
| YouTube Transcript | Fetches full transcript from any YouTube video via Supadata API |
| AI Analysis | Groq LLaMA generates summary, key points, and a rich chat context |
| Streaming Chat | Responses stream token-by-token using SSE and Python generators |
| In-Memory Cache | MD5-keyed cache avoids redundant AI calls for the same content |
| Raw Text Support | Paste any article, notes, or transcript directly |
| Math Rendering | KaTeX renders inline and block math expressions |
| Flowchart Rendering | Mermaid-powered flowcharts rendered from AI output |
| Chart Support | Recharts-based data visualizations from AI responses |
| Syntax Highlighting | Code blocks with language-aware syntax highlighting |
| API Key Modal | Groq and Supadata keys stored locally — no backend auth needed |

</div>

---

## Tech Stack

### Backend

<p>
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white"/>
  <img src="https://img.shields.io/badge/DRF-ff1709?style=for-the-badge&logo=django&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq_LLaMA-F54E27?style=for-the-badge&logo=meta&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supadata-000000?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gunicorn-499848?style=for-the-badge&logo=gunicorn&logoColor=white"/>
</p>

### Frontend

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white"/>
  <img src="https://img.shields.io/badge/KaTeX-008080?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/Mermaid-FF3670?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logoColor=white"/>
</p>

### Deployment

<p>
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black"/>
  <img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white"/>
</p>

---

## System Architecture

<div align="center">

![System Architecture](screenshots/system-architecture.png)

</div>

---

## Live Demo

> **[nexus.abdnoman.com](https://nexus.abdnoman.com)** — No setup needed. Just bring your own Groq and Supadata API keys.

---

<div align="center">

**Abdullah Al Noman** · CSE Student · Full Stack Developer

[![GitHub](https://img.shields.io/badge/GitHub-nomancsediu-181717?style=flat-square&logo=github)](https://github.com/nomancsediu)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-nomanit-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/nomanit)
[![Portfolio](https://img.shields.io/badge/Portfolio-abdnoman.com-000000?style=flat-square&logo=globe)](https://abdnoman.com)

</div>
