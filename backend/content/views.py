from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from .services import get_youtube_transcript, analyze_content, stream_chat_response
import json
import hashlib

_cache = {}

def _cache_key(source_type, source_url, raw_text):
    raw = f"{source_type}:{source_url}:{raw_text[:200]}"
    return hashlib.md5(raw.encode()).hexdigest()


def get_api_key(request):
    key = request.headers.get('X-Groq-Api-Key', '').strip()
    if not key:
        raise ValueError('Groq API key is required.')
    return key

def get_supadata_key(request):
    key = request.headers.get('X-Supadata-Api-Key', '').strip()
    if not key:
        raise ValueError('Supadata API key is required.')
    return key


class ProcessContentView(APIView):
    def post(self, request):
        try:
            api_key = get_api_key(request)
            supadata_key = get_supadata_key(request)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        source_type = request.data.get('source_type')
        source_url = request.data.get('source_url', '')
        raw_text = request.data.get('raw_text', '')

        try:
            if source_type == 'youtube':
                transcript = get_youtube_transcript(source_url, supadata_key)
            else:
                transcript = raw_text

            if not transcript:
                return Response({'error': 'No content to process'}, status=400)

            key = _cache_key(source_type, source_url, raw_text)
            if key in _cache:
                return Response(_cache[key])

            try:
                summary, key_points, condensed, chat_context = analyze_content(transcript, api_key)
            except Exception as e:
                if '429' in str(e):
                    return Response({'error': 'Groq rate limit hit — wait a moment and try again.'}, status=429)
                raise

            result = {
                'transcript': condensed,
                'summary': summary,
                'key_points': key_points,
                'chat_context': chat_context,
            }
            _cache[key] = result
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class ChatStreamView(APIView):
    def post(self, request):
        try:
            api_key = get_api_key(request)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        user_message = request.data.get('message', '').strip()
        transcript = request.data.get('transcript', '')
        history = request.data.get('history', [])

        if not user_message:
            return Response({'error': 'message required'}, status=400)

        _api_key = str(api_key)

        def event_stream():
            try:
                for chunk in stream_chat_response(transcript, history, user_message, _api_key):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'chunk': f'Error: {str(e)}'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-Groq-Api-Key'
        return response
