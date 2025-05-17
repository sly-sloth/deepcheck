from .imports import *
from .chunk_answers import _chunk_student_answers_parallel
from .grade_answers import _grade_student_answers_parallel
from .reasoning_generator import _get_reasoning_parallelized
from .input_data_structure import InputDataStructure
from typing import List, Tuple, Union, TypedDict


class AgentState(TypedDict):
    course_name : str
    student_answer : str
    relevant_theory : str
    marking_scheme : List[Tuple[str,Union[int,float]]]
    total_score : Union[int,float]
    question:str
    student_answer_chunks : List[str] = []
    sample_answer : str 
    student_marks_chunkwise : List[Union[int,float]]
    total_score_gained : Union[int,float] = 0.0
    teacher_reasoning : List[str] = None

    
def validate_inputs(state:AgentState)->AgentState:
    '''Sole purpose is to validate the inputs that'll be used in computations. '''
    print("---------------INSIDE VALIDATE INPUTS---------------")
    inputs_to_validate = {
    "marking_scheme"  : state['marking_scheme'],
    "total_marks"  : state['total_score'],
    "question"  : state['question'],
    "sample_answer"  : state['sample_answer'],
    "relevant_theory"  : state['relevant_theory'],
    "student_answer"  : state['student_answer'],
    }
    # print(inputs_to_validate)
    InputDataStructure.model_validate(inputs_to_validate) # only calling to check the input structure consistency. 
    
    return{
        
          }
    
def chunk_answers(state:AgentState)->AgentState:
    # Node for chunking student's answers : 
    print("-------------Inside chunk answers-------------")
    student_answer = state['student_answer']
    marking_scheme  = state['marking_scheme']
    chunks = _chunk_student_answers_parallel(student_answer= student_answer,
                                  marking_scheme=marking_scheme)
    # print(chunks)
    assert len(chunks)==len(marking_scheme),f"length mismatch nigga"
    return {
                'student_answer_chunks':chunks,
           }



def grade_answers(state:AgentState)->AgentState:
    print("-------------Inside grade answers-------------")
    chunks = state['student_answer_chunks']
    marking_scheme = state['marking_scheme']
    relevant_theory = state['relevant_theory']
    total_score = state['total_score']
    marking = _grade_student_answers_parallel(student_answer=chunks,
                                     marking_scheme=marking_scheme,
                                     relevant_theory=relevant_theory,
                                     total_score=total_score)
    
    
    return {
                "student_marks_chunkwise" : marking
           }
    
    


def get_reasoning(state:AgentState)->AgentState:
    

    print("-------------Inside get reasoning-------------")
    student_answer_chunks  = state['student_answer_chunks']    
    marking_scheme  = state['marking_scheme']
    student_marks_chunkwise  = state['student_marks_chunkwise']
    relevant_theory  = state['relevant_theory']
    course_name  = state['course_name']
    # print(len(student_answer_chunks))
    # print(len(marking_scheme))
    assert len(marking_scheme) == len(student_answer_chunks)
    result = _get_reasoning_parallelized(
                                        student_answer_chunk = student_answer_chunks,
                                        marking_scheme = marking_scheme,
                                        score_gained = student_marks_chunkwise,
                                        relevant_theory = relevant_theory,
                                        course_name = course_name,
                                        )
    return {
                "teacher_reasoning" : result,
           }
    

def calculate_score(state:AgentState)->AgentState:
    print("-----------calculating marks-------------")
    student_marks_chunkwise = state['student_marks_chunkwise']
    total_score_gained = sum(student_marks_chunkwise)
    
    return{
                'total_score_gained':total_score_gained  
          }



def transition_chunk_answers__grade_answers(state:AgentState)->Literal['grade_answers']:
    
    return 'grade_answers'

def transition_grade_answers__get_reasoning(state:AgentState)->Literal['get_reasoning']:
    return 'get_reasoning'

def transition_get_reasoning__calculate_score(stage:AgentState)->Literal['calculate_score']:
    return 'calculate_score'






workflow = StateGraph(AgentState)
workflow.add_node(validate_inputs,"validate_inputs")
workflow.add_node(chunk_answers,"chunk_answers")
workflow.add_node(grade_answers,"grade_answers")
workflow.add_node(get_reasoning,"get_reasoning")
workflow.add_node(calculate_score,"calculate_score")
workflow.add_edge(START,"validate_inputs")
workflow.add_edge("validate_inputs","chunk_answers")

workflow.add_conditional_edges("chunk_answers",transition_chunk_answers__grade_answers,{
'grade_answers':'grade_answers'
                                                                                       }                              )
workflow.add_conditional_edges("grade_answers",transition_grade_answers__get_reasoning,{
'get_reasoning':'get_reasoning'
                                                                                       }                              )
workflow.add_conditional_edges("get_reasoning",transition_get_reasoning__calculate_score,{
'calculate_score':'calculate_score'
                                                                                       }                              )
workflow.add_edge("calculate_score",END)

# workflow will be the one that will be imported from the file
# 