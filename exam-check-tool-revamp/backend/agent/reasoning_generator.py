from .imports import *
from typing import List, Tuple, Union
from .llm import get_llm
llm = get_llm()



def _get_reasoning_parallelized(student_answer_chunk:List[str],
                                marking_scheme: List[Tuple[str,Union[int,float]]],
                                score_gained:List[Union[int,float]],
                                relevant_theory: str,
                                course_name: str) -> List[str]:
    # call _get_reasoning in parallel format!
    results = [
                _get_reasoning(
                    student_answer_chunk[i],
                    marking_scheme[i],
                    score_gained[i],
                    relevant_theory,
                    course_name
                )
                for i in range(len(marking_scheme))
              ]
    
    # with Pool(processes=max_jobs_at_a_time) as pool:
        # results = pool.starmap(_get_reasoning,inputs)
    return results


def _get_reasoning(student_answer_chunk: str,
                   marking_scheme: Tuple[str, Union[int, float]],
                   score_gained : Union[int, float],
                   relevant_theory: str,
                   course_name: str) -> str:
    
    if student_answer_chunk.strip() == "": # no answer given 
        return "Nothing was provided to answer this part"

    if abs(score_gained - marking_scheme[1]) < 1e-2: # full marks scored! 
        return "Full score gained"
    
    prompt = """You are an expert on {course_name} evaluator providing detailed feedback on a student's answer. Your goal is to explain why the score was deducted based on the provided information.

Inputs:
student's answer : The student's response to the question.
marking scheme instruction and score : The official marking scheme that outlines the correct answer and the distribution of marks for each component.
score awarded : The score awarded to the student based on the marking scheme.
relevant theory: Any relevant theoretical concepts or key points required to answer the question correctly.

Provide a feedback response that summarizes the following points:

1) Which parts of the student's answer were correct and aligned with the marking scheme.
2) Which parts of the answer were incorrect, incomplete, or missing, leading to score deduction.
3) How the missing/incorrect portions relate to the relevant_theory.
4) Suggestions for improvement, including what the student could have added or modified to gain full marks.
"""
    
    system_prompt = ChatPromptTemplate(messages=[
        ("system",prompt),
        ("user","student's answer : {student_answer_chunk}\nmarking scheme instruction : {instruction}\nmax score : {max_score}\nscore awarded : {marks_gained}\nrelevant theory : {relevant_theory}")
                                                ]
                                      )
    inputs = {
              "course_name":course_name,
              "student_answer_chunk":student_answer_chunk,
              "instruction": marking_scheme[0],
              "max_score":marking_scheme[1],
              "marks_gained":score_gained,
              "relevant_theory":relevant_theory,
              }
    chain = system_prompt | llm | StrOutputParser()
    result = chain.invoke(input = inputs)#,config = {"callbacks": [langfuse_handler],"run_name":"reasoning-generator"})
    return result

    