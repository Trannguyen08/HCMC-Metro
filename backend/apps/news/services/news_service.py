from apps.news.models import News, NewsCategory

class NewsService:
    def get_published_news(self, category_id=None, exclude_id=None, limit=None):
        news = News.objects.filter(is_published=True).order_by("-published_at")
        
        if category_id:
            news = news.filter(category_id=category_id)
            
        if exclude_id:
            try:
                news = news.exclude(id=exclude_id)
            except ValueError:
                pass
                
        if limit and limit.isdigit():
            news = news[:int(limit)]
            
        return news

    def get_news_detail_by_slug(self, slug):
        return News.objects.filter(slug=slug, is_published=True).first()

    def get_all_news_admin(self):
        return News.objects.all().order_by("-created_at")

    def create_news(self, validated_data):
        return News.objects.create(**validated_data)
        
    def get_news_by_id(self, pk):
        try:
            return News.objects.get(pk=pk)
        except News.DoesNotExist:
            return None

    def update_news(self, news, validated_data):
        for key, value in validated_data.items():
            setattr(news, key, value)
        news.save()
        return news

    def delete_news(self, news):
        news.delete()

    def get_all_categories(self):
        return NewsCategory.objects.all()
