from django.db import migrations, models


def migrate_rejected_feedbacks(apps, schema_editor):
    Feedback = apps.get_model("feedback", "Feedback")
    Feedback.objects.filter(status="rejected").update(status="resolved")


class Migration(migrations.Migration):
    dependencies = [
        ("feedback", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(migrate_rejected_feedbacks, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="feedback",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Chờ xử lý"),
                    ("processing", "Đang xử lý"),
                    ("resolved", "Đã giải quyết"),
                ],
                default="pending",
                max_length=30,
            ),
        ),
    ]
