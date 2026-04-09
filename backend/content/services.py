import re
import json
import requests
from groq import Groq

MODEL = 'llama-3.3-70b-versatile'


def get_client(api_key):
    return Groq(api_key=api_key)


def _chat(client, messages):
    return client.chat.completions.create(model=MODEL, messages=messages)


def extract_video_id(url):
    for pattern in [r'v=([^&]+)', r'youtu\.be/([^?]+)', r'embed/([^?]+)']:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


def get_youtube_transcript(url, supadata_key):
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    res = requests.get(
        "https://api.supadata.ai/v1/youtube/transcript",
        params={'videoId': video_id, 'text': 'true'},
        headers={'x-api-key': supadata_key},
        timeout=30
    )
    if res.status_code != 200:
        raise ValueError(f"Supadata error: {res.text}")
    data = res.json()
    return data.get('content', '') or ' '.join([c.get('text', '') for c in data.get('chunks', [])])


def _decode_html(s):
    return s.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', "'")


def fix_flowchart_blocks(text):
    def replacer(m):
        code = m.group(1).strip().replace("'", '"')
        try:
            json.loads(code)
        except json.JSONDecodeError:
            pass
        return f'```flowchart\n{code}\n```'
    return re.sub(r'```flowchart\s*\n(.*?)```', replacer, text, flags=re.DOTALL)


def fix_tables(text):
    def expand(line):
        if line.count('|') < 4:
            return line
        parts = [p.strip() for p in line.split('|') if p.strip()]
        sep_indices = [i for i, p in enumerate(parts) if re.match(r'^[-: ]+$', p)]
        if not sep_indices:
            return line
        col_count = sep_indices[0]
        if col_count < 1:
            return line
        rows = []
        for i in range(0, len(parts), col_count):
            chunk = parts[i:i + col_count]
            if chunk:
                rows.append('| ' + ' | '.join(chunk) + ' |')
        return '\n'.join(rows)
    return '\n'.join(expand(line) for line in text.split('\n'))


def fix_chart_blocks(text):
    def replacer(m):
        code = _decode_html(m.group(1).strip())
        return f'```chart\n{code}\n```'
    return re.sub(r'```chart\n(.*?)```', replacer, text, flags=re.DOTALL)


def _parse_summary_response(text):
    summary = ""
    key_points = []
    if "SUMMARY:" in text:
        summary_part = text.split("SUMMARY:")[1]
        summary = summary_part.split("KEY_POINTS:")[0].strip() if "KEY_POINTS:" in summary_part else summary_part.strip()
    if "KEY_POINTS:" in text:
        kp_part = text.split("KEY_POINTS:")[1].strip()
        try:
            start = kp_part.index('[')
            end = kp_part.rindex(']') + 1
            parsed = json.loads(kp_part[start:end])
            for item in parsed:
                if isinstance(item, str):
                    key_points.append(item)
                elif isinstance(item, list) and item:
                    key_points.append(item[0] if isinstance(item[0], str) else str(item[0]))
                elif isinstance(item, dict):
                    key_points.append(item.get('text') or item.get('title') or item.get('name') or str(item))
        except (ValueError, json.JSONDecodeError):
            key_points = [line.strip('- ').strip() for line in kp_part.split('\n') if line.strip()]
    return summary, key_points


def _safe_trim(text, max_words=3000):
    non_ascii = sum(1 for c in text[:500] if ord(c) > 127)
    is_non_latin = (non_ascii / max(len(text[:500]), 1)) > 0.3
    limit = int(max_words * 0.4) if is_non_latin else max_words
    return ' '.join(text.split()[:limit])


def analyze_content(transcript, api_key):
    client = get_client(api_key)
    condensed = _safe_trim(transcript)
    prompt = f"""Analyze this content and return EXACTLY:
SUMMARY: <3-4 sentence summary>
KEY_POINTS: ["Topic One", "Topic Two"] (max 8 plain strings)
CHAT_CONTEXT: <A detailed structured summary covering ALL topics, concepts, examples, and key details from the content. Be thorough — this will be used to answer student questions. Include specific details, code examples mentioned, and explanations.>

Content: {condensed}"""
    response = _chat(client, [{"role": "user", "content": prompt}])
    text = response.choices[0].message.content
    summary, key_points = _parse_summary_response(text)
    chat_context = text.split('CHAT_CONTEXT:')[1].strip() if 'CHAT_CONTEXT:' in text else condensed
    return summary, key_points, transcript, chat_context


def stream_chat_response(transcript, conversation_history, user_message, api_key):
    client = get_client(api_key)
    history_text = '\n'.join([f"{m['role'].upper()}: {m['content'][:300]}" for m in conversation_history[-6:]])

    prompt = f"""You are a technical educator. Use the source content to understand the topic and answer the student's question. Adapt your response naturally to the topic type (setup/conceptual/mixed). Follow any format the student requests.

FORMATTING RULES:
- Use single backticks for ALL inline code: variable names, function names, keywords (e.g. `useState`, `map`, `const`)
- Only use triple backtick code blocks when showing multi-line code examples (3+ lines)
- NEVER use triple backticks for a single word or single line — use inline backtick instead
- Never wrap short expressions like `spread operator` or `...` in triple backtick blocks

## Source Content
{transcript}

## Conversation History
{history_text}

## Question
{user_message}"""

    response = _chat(client, [{"role": "user", "content": prompt}])
    full_text = response.choices[0].message.content
    full_text = re.sub(r'`([^`]+)`(```)', r'`\1`\n\2', full_text)
    full_text = re.sub(r'(```)`', r'\1\n`', full_text)
    full_text = fix_flowchart_blocks(full_text)
    full_text = fix_chart_blocks(full_text)
    full_text = fix_tables(full_text)

    chunk_size = 10
    for i in range(0, len(full_text), chunk_size):
        yield full_text[i:i + chunk_size]
