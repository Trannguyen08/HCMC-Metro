from apps.metro.models import MetroLine

class MetroService:
    def get_all_lines(self):
        return MetroLine.objects.all()
