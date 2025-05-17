from .imports import * 

class InputsForReasoningVerifier(BaseModel):
    reasoning: List[str]
    student_answer_chunks : List[str]
    score_assigned : List[Union[int,float]]
    marking_scheme:List[Tuple[str,Union[int,float]]]  
    
    @model_validator(mode='after')
    def logical_validation(self)->Self:
        if not (len(self.reasoning) == len(self.student_answer_chunks    ) and
                len(self.reasoning) ==     len(self.marking_scheme       ) and 
                len(self.reasoning) ==     len(self.score_assigned       )):
            raise PydanticCustomError(
                'LengthMismatchError',
                f'''Inputs provided are not matching their expected lengths : 
                reasoning : {len(self.reasoning)}
                student answer chunks : {len(self.student_answer_chunks)}
                marking scheme : {len(self.marking_scheme)}
                score assigned : {len(self.score_assigned)}
                '''
            )
            
        return self
    
    