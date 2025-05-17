'''Import everything at a single place , just write
```python

from imports import *
```
and enjoy

'''



import os 
# from langfuse.callback import CallbackHandler
from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts  import ChatPromptTemplate
from langchain_core.prompts.chat  import MessagesPlaceholder
from langchain_core.messages import AIMessage,HumanMessage,SystemMessage
from pydantic import BaseModel,model_validator,Field
from pydantic_core import PydanticCustomError
from typing import List,Union,Literal,OrderedDict,TypedDict,Tuple,Any,Annotated
from typing_extensions import Self
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from multiprocessing import Pool
from langchain_groq import ChatGroq
from typing import List, Dict, Tuple, Union
import json
import re
load_dotenv()
openai_api_key = os.getenv("OPENAI_PERSONAL_API_KEY")
google_api_key = os.getenv("GEMINI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")
max_retries_for_LLM_calling = 5
max_jobs_at_a_time = os.cpu_count() # get the number of cpu we can get for parallel processing. 

# langfuse_handler = CallbackHandler(
#     public_key="pk-lf-a93c2f9e-bdad-4894-9df4-849c2dcecd40",
#     secret_key="sk-lf-68ec77bd-c471-4401-a427-e91637a3840f",
#     host="http://localhost:3000"
# )
