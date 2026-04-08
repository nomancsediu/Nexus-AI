import re
import json
import time
from groq import Groq
from youtube_transcript_api import YouTubeTranscriptApi

MODEL = 'llama-3.1-8b-instant'


def get_client(api_key):
    return Groq(api_key=api_key)


def _chat(client, messages, retries=3):
    for i in range(retries):
        try:
            return client.chat.completions.create(model=MODEL, messages=messages)
        except Exception as e:
            if '429' in str(e) and i < retries - 1:
                m = re.search(r'(\d+\.?\d*)s', str(e))
                time.sleep(float(m.group(1)) + 1 if m else 5)
            else:
                raise


def extract_video_id(url):
    for pattern in [r'v=([^&]+)', r'youtu\.be/([^?]+)', r'embed/([^?]+)']:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


def get_youtube_transcript(url):
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    fetcher = YouTubeTranscriptApi()
    try:
        transcript = fetcher.fetch(video_id)
    except Exception:
        transcript_list = fetcher.list(video_id)
        try:
            transcript = transcript_list.find_generated_transcript(
                [t.language_code for t in transcript_list]
            ).fetch()
        except Exception:
            transcript = transcript_list.find_manually_created_transcript(
                [t.language_code for t in transcript_list]
            ).fetch()
    return ' '.join([t.text for t in transcript])



def _decode_html(s):
    return s.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', "'")


def _clean_mermaid_code(code):
    code = _decode_html(code.strip())
    code = re.sub(r'^```mermaid\s*', '', code)
    code = re.sub(r'```\s*$', '', code).strip()
    # strip ALL edge labels: -->|anything| or -->|anything|>
    code = re.sub(r'-->\s*\|[^|]*\|>?', '-->', code)
    lines = []
    for line in code.splitlines():
        # remove () and special chars from node labels only
        line = re.sub(r'\[([^\]]*)\]', lambda m: '[' + re.sub(r'[(){}|<>:!^]', '', m.group(1)) + ']', line)
        lines.append(line)
    return '\n'.join(lines)


def fix_flowchart_blocks(text):
    def replacer(m):
        code = m.group(1).strip()
        # ensure it's valid JSON, fix single quotes
        code = code.replace("'", '"')
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
        parts = [p.strip() for p in line.split('|')]
        parts = [p for p in parts if p != '']
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
            # flatten nested arrays, extract strings only
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


def analyze_content(transcript, api_key):
    client = get_client(api_key)
    CHUNK_SIZE = 12000
    chunks = [transcript[i:i+CHUNK_SIZE] for i in range(0, len(transcript), CHUNK_SIZE)]

    if len(chunks) == 1:
        combined_transcript = transcript
    else:
        chunk_summaries = []
        for chunk in chunks:
            r = _chat(client, [{"role": "user", "content": f"Summarize this content section in 2-3 sentences, capturing all key ideas:\n\n{chunk}"}])
            chunk_summaries.append(r.choices[0].message.content.strip())
        combined_transcript = "\n\n".join(chunk_summaries)

    prompt = f"""Analyze this content and return:
1. A concise summary (3-4 sentences)
2. Key topics as a flat JSON array of strings (2-5 words each) — each item must be a plain string, NOT an array or object. Max 12 items.

Format your response EXACTLY as:
SUMMARY: <summary text>
KEY_POINTS: ["Topic One", "Topic Two", "Topic Three"]

Content: {combined_transcript}"""

    response = _chat(client, [{"role": "user", "content": prompt}])
    text = response.choices[0].message.content
    return _parse_summary_response(text)


def stream_chat_response(transcript, conversation_history, user_message, api_key):
    client = get_client(api_key)
    history_text = '\n'.join([f"{m['role'].upper()}: {m['content'][:500]}" for m in conversation_history[-4:]])

    prompt = f"""You are a world-class CS educator, senior software engineer, and technical writer. Your mission is to give the student the most COMPLETE, DETAILED, and ACCURATE explanation possible — leaving absolutely nothing out. If the topic requires knowledge beyond the provided content, use your full training knowledge to fill in the gaps.

## CRITICAL INSTRUCTION
- Cover EVERYTHING about the topic. Do NOT summarize or skip details.
- If the topic has subtopics, cover ALL of them in depth.
- If you are unsure about something, reason through it carefully using first principles.
- Treat every question as if the student needs to become an expert on this topic after reading your response.
- Length does not matter — completeness does. A long, thorough answer is always better.

## Your Response Must Always Include:

### 1. Core Concept
- Start with a clear 1-2 sentence definition
- Explain the WHY — why does this exist, what problem does it solve
- Explain the HOW — internal mechanics, how it works under the hood, step by step
- Cover ALL variants, types, and subtypes (e.g. for sorting: bubble, merge, quick, heap, etc.)
- Cover edge cases, limitations, gotchas, and common misconceptions
- Use **bold** for key terms, *italic* for emphasis
- Use ##/### headers to organize every section

### 2. Real-Life Analogy
- Give a vivid, concrete real-world analogy that makes the concept instantly click
- Example: "A HashMap is like a library index card system — instead of scanning every book, you jump directly to the exact shelf"

### 3. Real-World Usage
- Name SPECIFIC real systems that use this (Google, Netflix, Linux kernel, PostgreSQL, Redis, etc.)
- Explain exactly HOW and WHY they use it
- Cover multiple use cases across different domains
- Mention when NOT to use it and what to use instead

### 4. Code Example
- Always include clean, well-commented code for technical topics
- Show the full implementation, not just a snippet
- Include multiple examples if there are multiple variants
- Add time/space complexity as inline comments
- Use the most relevant language (Python for algorithms, JS for web, etc.)
- Fenced code blocks with language tag for ALL code

### 5. Complexity & Performance Analysis
- ALWAYS use LaTeX for complexity: $O(1)$, $O(n)$, $O(n^2)$, $O(\log n)$, $O(n \log n)$
- Explain best case, average case, and worst case separately
- Explain space complexity too

### 6. Comparison Table
- Always end with a detailed comparison/summary table
- Compare all variants, tradeoffs, use cases side by side
- Include columns: Time Complexity, Space Complexity, Use Case, Pros, Cons

## Formatting Rules
- Inline code ONLY for: actual code, function/method names, variable names, CLI commands, file names
- NEVER inline code for concept names, architecture terms, or general nouns
- No filler phrases, no repetition, no "great question!"
- NEVER include a diagram or chart unless the user explicitly asks for one

## Source Content
{transcript[:4000]}

## Conversation History
{history_text}

## Student Question
{user_message}

Provide the most COMPLETE, DETAILED, EXPERT-LEVEL response possible. Cover everything. Miss nothing."""

    # collect full response first, sanitize mermaid blocks, then stream
    response = _chat(client, [{"role": "user", "content": prompt}])
    full_text = response.choices[0].message.content
    full_text = fix_flowchart_blocks(full_text)
    full_text = fix_chart_blocks(full_text)
    full_text = fix_tables(full_text)

    # stream word by word for UI effect
    chunk_size = 10
    for i in range(0, len(full_text), chunk_size):
        yield full_text[i:i + chunk_size]
