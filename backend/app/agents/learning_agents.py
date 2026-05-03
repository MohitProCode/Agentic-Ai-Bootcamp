from crewai import Agent, Task, Crew, Process
from app.core.config import settings
import os

# Set environment variable for Ollama
os.environ["OLLAMA_HOST"] = "http://localhost:11434"

# CrewAI 1.14+ uses string format: "provider/model"
llm_config = f"ollama/{settings.OLLAMA_MODEL.replace(':latest', '')}"

# Agent 1: Learning Profiler
learning_profiler = Agent(
    role='Learning Profiler & Skill Analyzer',
    goal='Deeply understand learner background, goals, current skills, and optimal learning patterns',
    backstory="""You are an expert educational psychologist with 15 years of experience in 
    personalized learning. You excel at identifying skill gaps, learning styles, and creating 
    detailed learner profiles through conversation and assessment analysis.""",
    llm=llm_config,
    verbose=True,
    allow_delegation=False
)

# Agent 2: Curriculum Architect
curriculum_architect = Agent(
    role='Curriculum Architect & Learning Path Designer',
    goal='Design optimal, personalized learning paths with clear milestones and prerequisites',
    backstory="""You are a veteran instructional designer who has created curricula for 
    top tech bootcamps. You understand learning progression, prerequisite chains, and 
    how to structure knowledge for maximum retention.""",
    llm=llm_config,
    verbose=True,
    allow_delegation=False
)

# Agent 3: Quiz Master
quiz_master = Agent(
    role='Adaptive Quiz Master & Assessment Specialist',
    goal='Generate contextual, adaptive assessments that accurately measure understanding',
    backstory="""You are an assessment design expert specializing in adaptive testing. 
    You create questions that adjust difficulty based on performance and provide 
    insightful feedback that promotes learning.""",
    llm=llm_config,
    verbose=True,
    allow_delegation=False
)

# Agent 4: Content Curator
content_curator = Agent(
    role='Content Curator & Resource Specialist',
    goal='Find and recommend the best learning resources tailored to individual needs',
    backstory="""You are a master librarian and content strategist who knows every 
    quality learning resource on the internet. You match resources to learning styles, 
    skill levels, and specific knowledge gaps.""",
    llm=llm_config,
    verbose=True,
    allow_delegation=False
)

# Agent 5: Progress Analyst
progress_analyst = Agent(
    role='Progress Analyst & Learning Pattern Expert',
    goal='Track learning patterns, predict outcomes, and identify areas needing attention',
    backstory="""You are a data scientist specializing in educational analytics. 
    You identify trends, predict learning outcomes, and provide actionable insights 
    to optimize the learning journey.""",
    llm=llm_config,
    verbose=True,
    allow_delegation=False
)

# Agent 6: AI Mentor
ai_mentor = Agent(
    role='AI Learning Mentor & Motivational Coach',
    goal='Provide personalized guidance, explanations, and motivation to keep learners engaged',
    backstory="""You are a compassionate and knowledgeable mentor who has guided 
    thousands of learners to success. You explain complex concepts simply, provide 
    encouragement, and adapt your communication style to each learner.""",
    llm=llm_config,
    verbose=True,
    allow_delegation=True
)

def create_profiling_crew(user_input: dict):
    """Create crew for initial learner profiling"""
    
    profile_task = Task(
        description=f"""Analyze this learner's information and create a detailed profile:
        - Target Role: {user_input.get('target_role', 'Not specified')}
        - Experience Level: {user_input.get('experience_level', 'Beginner')}
        - Weekly Hours: {user_input.get('weekly_hours', 10)}
        - Learning Style: {user_input.get('learning_style', 'Mixed')}
        - Focus Topics: {', '.join(user_input.get('focus_topics', []))}
        - Goals: {user_input.get('goals', 'General skill improvement')}
        
        Create a comprehensive learner profile including:
        1. Skill level assessment
        2. Learning style preferences
        3. Recommended learning pace
        4. Key areas to focus on
        5. Potential challenges to watch for
        """,
        agent=learning_profiler,
        expected_output="A detailed learner profile in JSON format with skill_level, learning_style, pace, focus_areas, and challenges"
    )
    
    crew = Crew(
        agents=[learning_profiler],
        tasks=[profile_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew

def create_curriculum_crew(profile: dict, topic: str):
    """Create crew for curriculum design"""
    
    curriculum_task = Task(
        description=f"""Design a personalized learning curriculum for:
        Topic: {topic}
        Learner Profile: {profile}
        
        Create a structured learning path with:
        1. Weekly breakdown (4 weeks)
        2. Daily learning objectives
        3. Prerequisite concepts
        4. Estimated time per module
        5. Milestone checkpoints
        6. Progressive difficulty curve
        """,
        agent=curriculum_architect,
        expected_output="A structured curriculum in JSON format with weeks, days, topics, time_estimates, and milestones"
    )
    
    crew = Crew(
        agents=[curriculum_architect],
        tasks=[curriculum_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew

def create_quiz_crew(topic: str, difficulty: str, num_questions: int, previous_performance: dict = None):
    """Create crew for adaptive quiz generation"""
    
    performance_context = ""
    if previous_performance:
        performance_context = f"""
        Previous Performance:
        - Accuracy: {previous_performance.get('accuracy', 0)}%
        - Weak Areas: {', '.join(previous_performance.get('weak_areas', []))}
        - Strong Areas: {', '.join(previous_performance.get('strong_areas', []))}
        """
    
    quiz_task = Task(
        description=f"""Generate an adaptive quiz:
        Topic: {topic}
        Difficulty: {difficulty}
        Number of Questions: {num_questions}
        {performance_context}
        
        Create questions that:
        1. Test understanding at appropriate difficulty
        2. Cover key concepts progressively
        3. Include 4 options per question
        4. Provide detailed explanations
        5. Adapt to previous performance if available
        
        Format each question as JSON with: question_id, prompt, options (with option_id and text), correct_option_id, explanation, difficulty, concept_tested
        """,
        agent=quiz_master,
        expected_output=f"A JSON array of {num_questions} quiz questions with all required fields"
    )
    
    crew = Crew(
        agents=[quiz_master],
        tasks=[quiz_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew

def create_content_crew(topic: str, skill_level: str, learning_style: str):
    """Create crew for content curation"""
    
    content_task = Task(
        description=f"""Curate learning resources for:
        Topic: {topic}
        Skill Level: {skill_level}
        Learning Style: {learning_style}
        
        Recommend 8-10 resources including:
        1. Video tutorials (YouTube, Udemy style)
        2. Written articles/documentation
        3. Interactive tutorials/exercises
        4. Project ideas
        5. Community resources
        
        For each resource provide: title, type, duration, description, difficulty, url (use realistic examples), and why it matches the learner
        """,
        agent=content_curator,
        expected_output="A JSON array of 8-10 curated resources with all metadata"
    )
    
    crew = Crew(
        agents=[content_curator],
        tasks=[content_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew

def create_analysis_crew(quiz_results: dict, learning_history: dict):
    """Create crew for progress analysis"""
    
    analysis_task = Task(
        description=f"""Analyze learning progress:
        Recent Quiz Results: {quiz_results}
        Learning History: {learning_history}
        
        Provide insights on:
        1. Skill mastery levels by topic
        2. Learning velocity and pace
        3. Weak concepts needing reinforcement
        4. Strong areas to build upon
        5. Predicted time to goal completion
        6. Recommended next steps
        """,
        agent=progress_analyst,
        expected_output="A detailed analysis report in JSON format with mastery_levels, weak_concepts, strong_concepts, recommendations, and predictions"
    )
    
    crew = Crew(
        agents=[progress_analyst],
        tasks=[analysis_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew

def create_mentor_crew(user_question: str, learner_context: dict):
    """Create crew for AI mentoring"""
    
    mentor_task = Task(
        description=f"""Provide mentoring for this question:
        Question: {user_question}
        Learner Context: {learner_context}
        
        Respond as a supportive mentor:
        1. Answer the question clearly and concisely
        2. Relate to their current learning journey
        3. Provide examples relevant to their level
        4. Suggest next steps or related concepts
        5. Encourage and motivate
        """,
        agent=ai_mentor,
        expected_output="A friendly, informative mentor response"
    )
    
    crew = Crew(
        agents=[ai_mentor],
        tasks=[mentor_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew

def create_gap_analysis_crew(quiz_session: dict, topic: str):
    """Create crew for gap analysis after quiz"""
    
    gap_task = Task(
        description=f"""Analyze knowledge gaps from quiz performance:
        Topic: {topic}
        Quiz Results: {quiz_session}
        
        Identify:
        1. Specific concepts where learner struggled
        2. Severity of each gap (0-1 score)
        3. Root causes (prerequisite missing, complexity, etc.)
        4. Recommended remediation approach
        5. Estimated time to fill each gap
        """,
        agent=progress_analyst,
        expected_output="A gap analysis report in JSON with weak_concepts array containing concept, weakness_score, root_cause, and remediation"
    )
    
    curriculum_task = Task(
        description=f"""Based on the gap analysis, create a remediation plan:
        Topic: {topic}
        
        Design a focused learning plan to address gaps:
        1. Prioritized concept list
        2. Week-by-week remediation schedule
        3. Practice exercises for each gap
        4. Checkpoints to verify improvement
        """,
        agent=curriculum_architect,
        expected_output="A remediation curriculum in JSON format"
    )
    
    content_task = Task(
        description=f"""Find resources specifically for gap remediation:
        Topic: {topic}
        
        Curate targeted resources for weak concepts:
        1. Beginner-friendly explanations
        2. Visual/interactive content
        3. Practice problems
        4. Real-world examples
        """,
        agent=content_curator,
        expected_output="A JSON array of gap-focused resources"
    )
    
    crew = Crew(
        agents=[progress_analyst, curriculum_architect, content_curator],
        tasks=[gap_task, curriculum_task, content_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew
