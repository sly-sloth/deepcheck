from .imports import *
from .llm import get_llm
llm = get_llm() 

class grade_student_output_llm(BaseModel):
    '''Used to define the output structure of the llm's output for the grade_student function'''
    marks : Union[int,float]= Field(description=" the marks gained by the student for a given marking scheme parameter.")
    @model_validator(mode='after')
    def logical_validation(self)->Self:
        if self.marks< 0  : # Score assigned shouldn't be negative thought it can be zero
            raise PydanticCustomError(
                'NegativeScoreError',
                f'''The score calculated for the current answer is negative'''
            )
                    
        return self # if all goes well 


class grade_student_final_outut(BaseModel):
    marks_list : List[grade_student_output_llm] # this one actually auto-validates the incomming inputs from the llm's output . So sort of double check .
    total_score : Union[int,float]
    @model_validator(mode='after')
    def logical_validation(self)->Self:
        totalling = 0.0
        for marks in self.marks_list:
            totalling += marks.marks
        
        if totalling > self.total_score: # if sum of all marks for every chunk is greater than the total possible score for that question
            raise PydanticCustomError('MarksOverflow',
                                      f'''The totalling for the answer came out to be {totalling} which is greater than the max possibe score {self.total_score}''')
        return self
            
    


def _grade_student_answers_parallel(
                    student_answer : List[str],
                    marking_scheme : List[Tuple[str,Union[int,float]]],
                    relevant_theory : str,
                    total_score : Union[int,float]
                 )->List[Union[int,float]]:
    
    
    results = [
               _grade_student_answers(student_answer[i],
                      marking_scheme[i],
                      relevant_theory
                     ) 
                     for i in range(len(student_answer))
              ]
    # with Pool(processes=max_jobs_at_a_time) as pool:
        # results = pool.starmap(_grade_student_answers,inputs)
    # 
    final_validated_output = grade_student_final_outut(marks_list=results,total_score=total_score)
    
    return [final_validated_output.marks_list[i].marks for i in range(len(final_validated_output.marks_list))]

def _grade_student_answers(
                    student_answer : str,
                    marking_scheme : Tuple[str,Union[int,float]],
                    relevant_theory : str,
                 )->grade_student_output_llm:
    
    if student_answer.strip() == '':
        return grade_student_output_llm(marks=0)
    
    prompt = ChatPromptTemplate(messages = [
SystemMessage("""You are highly experienced teacher who is assigned the task of 
evaluating the student's answer against a marking scheme. If you need some clarification,
you're supposed refer to the provided reference theory. Further more, provide clear
reasoning for you answer. 
Adhere to the following rules: 
- Don't assign negative marks. 
- Don't assign score beyond the maximum possible marks. 
- The reasoning should be proper and rational. 
- Only use the provided theory for getting clarification in case of a doubt.
"""),
("human","MARKING SCHEME : {marking_scheme}\nMAXIMUM SCORE : {max_score}\nSTUDENT ANSWER : {student_answer}\nREFERENCE THEORY : {reference_theory}")

                                           ]
             )
    inputs_to_llm = {
                        "marking_scheme":marking_scheme[0],
                        "max_score":marking_scheme[1],
                        "student_answer":student_answer,
                        "reference_theory":relevant_theory,
                }    
                    
    chain = prompt | llm.with_structured_output(grade_student_output_llm)
    result = chain.invoke(input=inputs_to_llm) # returns a grade_student_output_llm type object with the marks as an attribute. 
    return result