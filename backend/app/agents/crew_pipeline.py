from __future__ import annotations

import logging
from dataclasses import asdict

from app.agents.definitions import ALL_AGENTS, DIAGNOSER_AGENT, PLANNER_AGENT, RESOURCE_AGENT, REVIEWER_AGENT

logger = logging.getLogger(__name__)

try:
    from crewai import Agent, Crew, Process, Task
except Exception:  # noqa: BLE001
    Agent = Crew = Process = Task = None


def agent_specs() -> list[dict[str, str]]:
    return [asdict(agent) for agent in ALL_AGENTS]


def stage_prompts() -> dict[str, str]:
    return {
        "diagnoser": (
            f"{DIAGNOSER_AGENT.role}: {DIAGNOSER_AGENT.goal}\n"
            "Analyze concept-wise performance and identify prioritized weak concepts."
        ),
        "resource": (
            f"{RESOURCE_AGENT.role}: {RESOURCE_AGENT.goal}\n"
            "Map each weak concept to free resources only."
        ),
        "planner": (
            f"{PLANNER_AGENT.role}: {PLANNER_AGENT.goal}\n"
            "Create weekly plan with max 3 tasks/day and revision cycles."
        ),
        "reviewer": (
            f"{REVIEWER_AGENT.role}: {REVIEWER_AGENT.goal}\n"
            "Validate feasibility, progression, and revision coverage."
        ),
    }


def build_crewai_metadata_crew() -> object | None:
    """
    Builds CrewAI entities for architecture completeness/observability.
    Execution of LLM calls stays in LangChain services by design.
    """
    if not all([Agent, Task, Crew, Process]):
        logger.warning("CrewAI is unavailable; returning metadata-only mode.")
        return None

    diagnoser = Agent(
        role=DIAGNOSER_AGENT.role,
        goal=DIAGNOSER_AGENT.goal,
        backstory=DIAGNOSER_AGENT.backstory,
        verbose=False,
        allow_delegation=False,
    )
    resource = Agent(
        role=RESOURCE_AGENT.role,
        goal=RESOURCE_AGENT.goal,
        backstory=RESOURCE_AGENT.backstory,
        verbose=False,
        allow_delegation=False,
    )
    planner = Agent(
        role=PLANNER_AGENT.role,
        goal=PLANNER_AGENT.goal,
        backstory=PLANNER_AGENT.backstory,
        verbose=False,
        allow_delegation=False,
    )
    reviewer = Agent(
        role=REVIEWER_AGENT.role,
        goal=REVIEWER_AGENT.goal,
        backstory=REVIEWER_AGENT.backstory,
        verbose=False,
        allow_delegation=False,
    )

    tasks = [
        Task(description="Analyze weak concepts and misconceptions.", expected_output="Gap report.", agent=diagnoser),
        Task(description="Select free resources for weak concepts.", expected_output="Resource map.", agent=resource),
        Task(description="Draft weekly learning plan.", expected_output="Weekly learning plan.", agent=planner),
        Task(description="Validate plan quality and constraints.", expected_output="Validation report.", agent=reviewer),
    ]
    return Crew(agents=[diagnoser, resource, planner, reviewer], tasks=tasks, process=Process.sequential, verbose=False)

