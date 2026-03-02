from pydantic import BaseModel

class RegisterDoctor(BaseModel):
    name:str
    email:str
    age:int
    gender:str
    password:str

class RegisterPatient(BaseModel):
    name:str
    email:str
    gender:str
    age:int

class Login(BaseModel):
    email:str
    password:str

class InferenceInput(BaseModel):
    pass