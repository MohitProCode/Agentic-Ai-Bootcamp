from app.models import FreeResource


FREE_RESOURCE_CATALOG: list[FreeResource] = [
    FreeResource(
        resource_id="py-docs-tutorial",
        title="The Python Tutorial",
        url="https://docs.python.org/3/tutorial/",
        provider="Python Software Foundation",
        resource_type="documentation",
        concept_tags=["python fundamentals", "data_types", "list_comprehension", "functions"],
        estimated_minutes=45,
        notes="Official documentation with progressive examples.",
    ),
    FreeResource(
        resource_id="realpython-lists",
        title="Python Lists and Tuples",
        url="https://realpython.com/python-lists-tuples/",
        provider="Real Python",
        resource_type="article",
        concept_tags=["python fundamentals", "data_types"],
        estimated_minutes=35,
        notes="Concept reinforcement for mutable and immutable collections.",
    ),
    FreeResource(
        resource_id="fastapi-async",
        title="FastAPI Async Docs",
        url="https://fastapi.tiangolo.com/async/",
        provider="FastAPI",
        resource_type="documentation",
        concept_tags=["python fundamentals", "asyncio_basics", "api_design"],
        estimated_minutes=30,
        notes="Practical intro to async/await in backend services.",
    ),
    FreeResource(
        resource_id="ml-crash-course",
        title="Machine Learning Crash Course",
        url="https://developers.google.com/machine-learning/crash-course",
        provider="Google Developers",
        resource_type="course",
        concept_tags=["machine learning", "train_test_split", "bias_variance", "gradient_descent"],
        estimated_minutes=60,
        notes="Hands-on and beginner-friendly ML curriculum.",
    ),
    FreeResource(
        resource_id="statquest-bias-variance",
        title="StatQuest: Bias and Variance",
        url="https://www.youtube.com/watch?v=EuBBz3bI-aA",
        provider="StatQuest",
        resource_type="video",
        concept_tags=["machine learning", "bias_variance"],
        estimated_minutes=20,
        notes="Clear conceptual explanation with visual intuition.",
    ),
    FreeResource(
        resource_id="3b1b-gradient-descent",
        title="Gradient Descent, How Neural Networks Learn",
        url="https://www.3blue1brown.com/lessons/gradient-descent",
        provider="3Blue1Brown",
        resource_type="video",
        concept_tags=["machine learning", "gradient_descent"],
        estimated_minutes=30,
        notes="Strong visual explanation of optimization dynamics.",
    ),
    FreeResource(
        resource_id="khan-probability",
        title="Khan Academy Probability and Statistics",
        url="https://www.khanacademy.org/math/statistics-probability",
        provider="Khan Academy",
        resource_type="course",
        concept_tags=["machine learning", "math_foundations", "data_analysis"],
        estimated_minutes=50,
        notes="Great for learner-specific statistics refreshers.",
    ),
]


def list_resources() -> list[FreeResource]:
    return [resource.model_copy(deep=True) for resource in FREE_RESOURCE_CATALOG]

