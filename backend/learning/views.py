from rest_framework.views import APIView
from rest_framework.response import Response
from .models import LearningSession
from .serializers import LearningSessionSerializer


class SessionDetailView(APIView):
    def get(self, request, session_id):
        try:
            session = LearningSession.objects.prefetch_related('messages').get(id=session_id)
            return Response(LearningSessionSerializer(session).data)
        except LearningSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, session_id):
        try:
            session = LearningSession.objects.get(id=session_id)
            session.content_source.delete()  # cascades to session + messages
            return Response(status=204)
        except LearningSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class AllSessionsView(APIView):
    def get(self, request):
        sessions = LearningSession.objects.select_related('content_source').order_by('-created_at')
        data = [{
            'id': s.id,
            'created_at': s.created_at,
            'weak_points': s.weak_points if isinstance(s.weak_points, list) else [],
            'content_source__source_type': s.content_source.source_type,
            'content_source__summary': s.content_source.summary,
        } for s in sessions]
        return Response(data)
