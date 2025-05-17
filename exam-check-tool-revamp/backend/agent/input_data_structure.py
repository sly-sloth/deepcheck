from .imports import * 

class InputDataStructure(BaseModel):
    '''
    - `marking_scheme` : A list of tuples/list that contains 2 elements
    
                        - A string that contains the instructions / actual marking scheme.
                        - An integer / float that represents the marks associated with the corresponding marking scheme. 
                        - Example :
                        ```python
 [['section 1',0.5],['section 2',2],['section 3',1]]
                        ```
                        
    - `total_marks`    : An integer or a float representing the total score associated with the question
    
    - `question`       : A string that contains the question that's being asked. 
    
    - `sample_answer`  : A string containing a sample answer provided by the teacher 
    
    - `student_answer` : A string containing answer given by the student    
    
    - `relevant_theory`: A string containing relevant theory given by the teacher to answer the question
    
    '''
    marking_scheme:List[Tuple[str,Union[int,float]]]       
    total_marks: Union[int,float]
    question:str
    sample_answer : str
    relevant_theory : str
    student_answer : str

    @model_validator(mode='after')
    def validate_logical_sections(self)->Self:
        total_sum = 0.0
        for i in range(len(self.marking_scheme)):
            
            # if the marks alloted in the marking scheme is zero, then raise this error
            if int(self.marking_scheme[i][1]) == 0:
                raise PydanticCustomError('ZeroMarksError',
                                          f'The input marking scheme `{self.marking_scheme[i][0]}` has been assigned 0 marks')
            
            # if the string instruction passed in the marking scheme is empty then raise this error
            if self.marking_scheme[i][0].strip() == "":
                raise PydanticCustomError('EmptySchemeError',
                                          f'The input marking scheme has empty marking scheme')

            total_sum+=float(self.marking_scheme[i][1])
            
        # finally if the difference between the total_sum 
        # ( calculated from the marking_schema ) 
        # and the total_marks( from the total_marks field ) 
        # is more than 0.01 then raise a totalling error. 
        # This 0.01 value is set just for the sake of handling floating precision nothing else. 
         
        if abs(float(total_sum) - float(self.total_marks)) >1e-2:
            
            raise PydanticCustomError(
                'TotallingMismatchError',
                f'Totalling in the marking scheme is {total_sum}, but total marks is {self.total_marks}.'
            )
        # if the sample answer is empty 
        if self.sample_answer.strip() == '':
            raise PydanticCustomError(
                'EmptySampleError', 
                'Found sample answer field empty.'
            )
        # if the question is empty 
        if self.question.strip() == '':
            raise PydanticCustomError(
                'EmptyQuestionError',
                'Found question field empty.'
            )
        # if the relevant theory is empty
        if self.relevant_theory.strip() == '':
            raise PydanticCustomError(
                'EmptyRelevantTheory',
                'Found relevant theory field empty.'
            )
        # if all good then return the data. 
        return self



# Testing 

# testing_dict = {
#     'marking_scheme' : [['section 1',0.5],['section 2',2],['section 3',1]],
#     'total_marks' : 3.5,
#     'question' : 'Question',
#     'sample_answer' : 'sample_answer',
#     'relevant_theory' : 'Some long sample theory', 
#     'student_answer' : 'sample_student_answer', 
# }

# testing_input = InputDataStructure.model_validate(testing_dict)
