from pydantic import BaseModel, Field


class RegisterDoctor(BaseModel):
    name: str = Field(..., description="Doctor full name", examples=["Dr. Ananya Rao"])
    email: str = Field(
        ..., description="Doctor email (must be unique)", examples=["doctor@clinic.com"]
    )
    age: int = Field(..., gt=0, description="Doctor age", examples=[35])
    gender: str = Field(..., description="Gender code: M, F, or O", examples=["F"])
    password: str = Field(
        ..., min_length=6, description="Login password", examples=["StrongPass123"]
    )


class RegisterPatient(BaseModel):
    name: str = Field(..., description="Patient full name", examples=["Rahul Mehta"])
    email: str = Field(
        ...,
        description="Patient email (must be unique)",
        examples=["patient@hospital.com"],
    )
    gender: str = Field(..., description="Gender code: M, F, or O", examples=["M"])
    age: int = Field(..., gt=0, description="Patient age", examples=[52])


class Login(BaseModel):
    email: str = Field(
        ...,
        description="Doctor email used during registration",
        examples=["doctor@clinic.com"],
    )
    password: str = Field(
        ..., description="Doctor account password", examples=["StrongPass123"]
    )
