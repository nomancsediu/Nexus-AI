from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ContentSource
from .serializers import ContentSourceSerializer
from .services import get_youtube_transcript, analyze_content, stream_chat_response
from learning.models import LearningSession, Message
import json


def get_api_key(request):
    key = request.headers.get('X-Groq-Api-Key', '').strip()
    if not key:
        raise ValueError('Groq API key is required. Please set your API key.')
    return key


class ProcessContentView(APIView):
    def post(self, request):
        try:
            api_key = get_api_key(request)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        source_type = request.data.get('source_type')
        source_url = request.data.get('source_url', '')
        raw_text = request.data.get('raw_text', '')

        try:
            if source_type == 'youtube':
                transcript = get_youtube_transcript(source_url)
            else:
                transcript = raw_text

            if not transcript:
                return Response({'error': 'No content to process'}, status=400)

            summary, key_points = analyze_content(transcript, api_key)

            source = ContentSource.objects.create(
                source_type=source_type,
                source_url=source_url or None,
                raw_text=raw_text or None,
                transcript=transcript,
                summary=summary,
                key_points=key_points,
            )

            session = LearningSession.objects.create(content_source=source)

            return Response({
                'content_id': source.id,
                'session_id': session.id,
                'summary': summary,
                'key_points': key_points,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class ChatStreamView(APIView):
    def options(self, request, *args, **kwargs):
        from django.http import HttpResponse
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-Groq-Api-Key'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        return response

    def post(self, request):
        try:
            api_key = get_api_key(request)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        session_id = request.data.get('session_id')
        user_message = request.data.get('message', '').strip()

        if not session_id or not user_message:
            return Response({'error': 'session_id and message required'}, status=400)

        try:
            session = LearningSession.objects.get(id=session_id)
        except LearningSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        Message.objects.create(session=session, role='user', content=user_message)
        history = list(session.messages.order_by('created_at').values('role', 'content'))
        transcript = session.content_source.transcript
        _api_key = str(api_key)

        def event_stream():
            full_response = ''
            try:
                for chunk in stream_chat_response(transcript, history, user_message, _api_key):
                    full_response += chunk
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as e:
                import traceback
                traceback.print_exc()
                yield f"data: {json.dumps({'chunk': f'Error: {str(e)}'})}\n\n"
            try:
                Message.objects.create(session=session, role='assistant', content=full_response)
                confusion_keywords = ['confused', "don't understand", 'not clear', 'what do you mean', 'explain again']
                if any(kw in user_message.lower() for kw in confusion_keywords):
                    session.weak_points = session.weak_points or []
                    session.weak_points.append(user_message[:200])
                    session.save()
            except Exception:
                pass
            yield f"data: {json.dumps({'done': True})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-Groq-Api-Key'
        return response
