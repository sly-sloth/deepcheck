from .imports import *
def get_llm(name : Literal['chatgpt','gemini','llama','deepseek'] = 'deepseek'):
    '''
    - A function that tells you about the avaialble llms that we can use 
    - just add the name of the LLM that's avaialbe in the docstring and this will
    return you an instance of the required llm.
    '''
    
    if(name =='deepseek'):
        return ChatGroq(model = 'deepseek-r1-distill-llama-70b',api_key=groq_api_key,temperature=0.0)
    elif(name == 'chatgpt'):
        return ChatOpenAI(model = 'gpt-4o-mini',api_key=openai_api_key,temperature=0.0)
    elif(name == 'gemini'):
        return ChatGoogleGenerativeAI(model='gemini-1.5-flash',api_key=google_api_key,temperature=0.0)
    elif(name == 'llama'):
        return ChatOllama(model = 'llama3.2:1b',temperature=0.0)
    