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
    {
        "plan_no": 1003,
        "category": "LIFE",
        "policy_name": "Monthly Life Starter",
        "description": "A sample life cover plan with a smaller premium collected each month.",
        "policy_premium": "1250.00",
        "policy_term": 10,
        "minimum_age": 18,
        "maximum_age": 50,
        "features": ["Monthly premium billing", "Life cover during the plan term", "Online policy servicing"],
        "payment_mode": "Monthly",
    },
    {
        "plan_no": 2003,
        "category": "HEALTH",
        "policy_name": "Monthly Health Assist",
        "description": "A sample health plan with convenient monthly premium payments.",
        "policy_premium": "950.00",
        "policy_term": 1,
        "minimum_age": 18,
        "maximum_age": 60,
        "features": ["Monthly premium billing", "Annual policy review", "Online renewal"],
        "payment_mode": "Monthly",
    },
    {
        "plan_no": 1004,
        "category": "LIFE",
        "policy_name": "Family Secure Plus",
        "description": "A sample annual life cover plan for customers looking for longer-term protection.",
        "policy_premium": "22000.00",
        "policy_term": 25,
        "minimum_age": 21,
        "maximum_age": 55,
        "features": ["Annual premium billing", "Long-term life cover", "Named beneficiary support"],
    },
    {
        "plan_no": 2004,
        "category": "HEALTH",
        "policy_name": "Essential Health Annual",
        "description": "A sample yearly health plan with straightforward annual renewal.",
        "policy_premium": "11000.00",
        "policy_term": 1,
        "minimum_age": 18,
        "maximum_age": 65,
        "features": ["Annual premium billing", "Individual health cover", "Online claim contact details"],
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
                "payment_mode": values.get("payment_mode", "Annual"),
                "payment_type": payment_types,
                "terms_and_conditions": "Sample academic project plan. Benefits and premium are for demonstration only.",
                "is_active": True,
                "is_delete": False,
            }
            PolicyDetailMaster.objects.update_or_create(plan_no=plan_no, defaults=plan_values)
        self.stdout.write(self.style.SUCCESS(f"Ready: {len(DEMO_PLANS)} sample policies are active."))
