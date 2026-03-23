import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

sql_commands = [
    "ALTER TABLE news_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE",
    "UPDATE news_categories SET slug = 'thong-bao' WHERE name = 'Thông báo' AND slug IS NULL",
    "UPDATE news_categories SET slug = 'su-kien' WHERE name = 'Sự kiện' AND slug IS NULL",
    "UPDATE news_categories SET slug = 'khuyen-mai' WHERE name = 'Khuyến mãi' AND slug IS NULL",
    "UPDATE news_categories SET slug = 'huong-dan' WHERE name = 'Hướng dẫn' AND slug IS NULL",
    "UPDATE news_categories SET slug = 'tin-chung' WHERE name = 'Tin chung' AND slug IS NULL",
    "UPDATE news_categories SET slug = 'giao-thong' WHERE name = 'Giao thông' AND slug IS NULL",
    "UPDATE news_categories SET slug = 'uu-dai' WHERE name = 'Ưu đãi' AND slug IS NULL",
]

with connection.cursor() as cursor:
    for cmd in sql_commands:
        try:
            cursor.execute(cmd)
            print(f"Executed: {cmd}")
        except Exception as e:
            print(f"Failed: {cmd} - {str(e)}")
