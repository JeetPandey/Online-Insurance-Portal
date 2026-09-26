from django.core.management.base import BaseCommand

from apps.policies.models import PolicyDetailMaster


DEMO_PLANS = [
    {
        "plan_no": 1001,
        "category": "LIFE",
        "policy_name": "Family Term Protection",
        "description": "Affordable term life cover to help protect your family's financial future.",
        "policy_premium": "12000.00",
        "policy_term": 20,
        "minimum_age": 18,
        "maximum_age": 60,
        "features": ["Life cover during the policy term", "Annual premium payment", "Simple online application"],
    },
    {
        "plan_no": 1002,
        "category": "LIFE",
        "policy_name": "Life Savings Plan",
        "description": "A long-term life plan combining protection with a maturity benefit.",
        "policy_premium": "18000.00",
        "policy_term": 15,
        "minimum_age": 18,
        "maximum_age": 55,
        "features": ["Life cover", "Fixed policy term", "Maturity benefit as per plan terms"],
    },
    {
        "plan_no": 2001,
        "category": "HEALTH",
        "policy_name": "Individual Health Cover",
        "description": "A yearly health insurance plan for eligible individual customers.",
        "policy_premium": "8500.00",
        "policy_term": 1,
        "minimum_age": 18,
        "maximum_age": 65,
        "features": ["Individual health cover", "Annual renewal", "Online application and servicing"],
    },
    {
        "plan_no": 2002,
        "category": "HEALTH",
        "policy_name": "Family Health Cover",
        "description": "A yearly health plan designed to cover a family under one policy.",
        "policy_premium": "16000.00",
        "policy_term": 1,
        "minimum_age": 18,
        "maximum_age": 60,
        "features": ["Family health cover", "Annual renewal", "Online application and servicing"],
    },
]


class Command(BaseCommand):
    help = "Add or refresh the sample life and health plans used for local testing."

    def handle(self, *args, **options):
        payment_types = ["Credit Card", "Debit Card", "Demand Draft", "Internet Banking"]
        for values in DEMO_PLANS:
            plan_no = values["plan_no"]
            plan_values = {
                **values,
                "payment_mode": "Annual",
                "payment_type": payment_types,
                "terms_and_conditions": "Sample academic project plan. Benefits and premium are for demonstration only.",
                "is_active": True,
                "is_delete": False,
            }
            PolicyDetailMaster.objects.update_or_create(plan_no=plan_no, defaults=plan_values)
        self.stdout.write(self.style.SUCCESS(f"Ready: {len(DEMO_PLANS)} sample policies are active."))
