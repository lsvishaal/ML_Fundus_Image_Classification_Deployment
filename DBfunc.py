import sqlite3
from contextlib import contextmanager
from pathlib import Path
from gloabal_vars import INPUT_DIR, OUTPUT_DIR
import base64


@contextmanager
def get_db():
    db_path = "ml_app.db"

    Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # allows dict-like access
    conn.execute("PRAGMA foreign_keys = ON;")

    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:

    with get_db() as conn:
        conn.executescript("""
        
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            age INTEGER NOT NULL CHECK(age > 0),
            gender TEXT NOT NULL CHECK(gender IN ('M', 'F', 'O')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        
        CREATE TABLE IF NOT EXISTS patients (
            patient_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            age INTEGER NOT NULL CHECK(age > 0),
            gender TEXT NOT NULL CHECK(gender IN ('M', 'F', 'O')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        
        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id TEXT PRIMARY KEY,
            
            doctor_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
                           
            patient_inference TEXT NOT NULL,
                           
            fundus_input_path TEXT NOT NULL,
            fundus_output_path TEXT NOT NULL,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_doctor 
        ON transactions(doctor_id);

        CREATE INDEX IF NOT EXISTS idx_transactions_patient 
        ON transactions(patient_id);

        CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
        ON transactions(created_at);
        """)

    print("Database initialized successfully.")

SQL_NEW_DOCTOR="""INSERT INTO doctors (
    doctor_id,
    name,
    age,
    gender,
    email,
    password_hash
) VALUES (?, ?, ?, ?, ?, ?);"""
def create_new_doctor(doctor_id:str, name:str, email:str, age:int, gender:str, password_hash:str):
    try:
        with get_db() as conn:
            cursor=conn.cursor()
            cursor.execute(SQL_NEW_DOCTOR,(doctor_id,name,age,gender,email, password_hash))
    except Exception as e:
        raise ValueError("Problem in create new doctors function with problem:",e)

SQL_NEW_PATIENT="""INSERT INTO patients (
    patient_id,
    name,
    age,
    gender,
    email
) VALUES (?, ?, ?, ?, ?);"""
def create_new_patient(patient_id:str, name:str, email:str, age:int, gender:str):
    try:
        with get_db() as conn:
            cursor=conn.cursor()
            cursor.execute(SQL_NEW_PATIENT,(patient_id,name,age,gender,email))
    except Exception as e:
        raise ValueError("Problem in create new patient function with problem:",e)

SQL_NEW_TRANSACTION="""INSERT INTO transactions (
    transaction_id,
    doctor_id,
    patient_id,
    patient_inference,
    fundus_input_path,
    fundus_output_path
) VALUES (?, ?, ?, ?, ?, ?);"""
def new_transaction(transaction_id:str, doctor_id:str, patient_id:str, patient_inference:str, fundus_input_path:str, fundus_output_path:str):
    try:
        with get_db() as conn:
            cursor= conn.cursor()
            cursor.execute(SQL_NEW_TRANSACTION,(transaction_id,doctor_id,patient_id,patient_inference,fundus_input_path, fundus_output_path))
    except Exception as e:
        raise ValueError("Error in creating a new patient transaction: ",e)

SQL_GET_PASSWORD_AND_DOCTOR_ID= "SELECT password_hash, doctor_id from doctors WHERE email = ?;"
def get_password_hash_for_matching_email(email:str):
    try:
        with get_db() as conn:
            cursor= conn.cursor()
            resultant=cursor.execute(SQL_GET_PASSWORD_AND_DOCTOR_ID,(email,)).fetchone()
            if resultant:
                return resultant['password_hash'],resultant["doctor_id"]
            else:
                raise ValueError("Supplied EmailID doesnt exist")
    except Exception as e:
        raise ValueError("Error in validating password: ",e)
    
SQL_EXISTS_RECORD_DOCTOR="""
    SELECT 1 
    FROM doctors
    WHERE doctor_id = ?;
"""
def doctor_exists(doctor_id:str):
    try:
        with get_db() as conn:
            cursor=conn.cursor()
            result = cursor.execute(SQL_EXISTS_RECORD_DOCTOR,(doctor_id,)).fetchone()
            if result is not None:
                return True
            else:
                return False
    except Exception as e:
        raise ValueError("Error in checking Doctor Record ",e)

SQL_EXISTS_RECORD_PATIENT="""
    SELECT 1 
    FROM patients
    WHERE patient_id = ?
"""
def patient_exists(patient_id:str):
    try:
        with get_db() as conn:
            cursor=conn.cursor()
            result = cursor.execute(SQL_EXISTS_RECORD_PATIENT,(patient_id,)).fetchone()
            if result is not None:
                return True
            else:
                return False
    except Exception as e:
        raise ValueError("Error in checking Patient Record ",e)


SQL_GET_RECORDS_ALL_PATIENT="""
SELECT patient_id, name, email, age, gender FROM patients
"""
def get_all_records_of_all_patient():
    try:
        with get_db() as conn:
            cursor= conn.cursor()
            rows = cursor.execute(SQL_GET_RECORDS_ALL_PATIENT).fetchall()
        big_result =[]
        for row in rows:
            (
                patient_id,
                name,
                email,
                age,
                gender
            )= row
            result={}
            result["patient_id"]=patient_id
            result["name"]=name
            result["email"]=email
            result["age"]=age
            result["gender"]=gender
            big_result.append(result)
        return big_result
    except Exception as e:
        raise ValueError("Database error: ",e)
    pass

SQL_GET_RECORDS_ALL_DOCTORS="SELECT doctor_id, name, email  FROM  doctors"
def get_all_records_of_all_doctors():
    try:
        with get_db() as conn:
            cursor= conn.cursor()
            rows=cursor.execute(SQL_GET_RECORDS_ALL_DOCTORS).fetchall()
        big_result =[]
        for row in rows:
                (
                    doctor_id,
                    name,
                    email,
                )= row
                result={}
                result["doctor_id"]=doctor_id
                result["name"]=name
                result["email"]=email
                big_result.append(result)
        return big_result
    except Exception as e:
        raise ValueError("Database error: ",e)

SQL_GET_DOCTOR_PATIENT_TRANSACTIONS = """
SELECT 
    p.patient_id,
    p.name,
    p.email,
    p.age,
    p.gender,
    t.transaction_id,
    t.patient_inference,
    t.fundus_input_path,
    t.fundus_output_path,
    t.created_at
FROM transactions t
JOIN patients p ON t.patient_id = p.patient_id
WHERE t.doctor_id = ?
ORDER BY p.patient_id, t.created_at DESC;
"""
def get_doctor_patient_transactions(doctor_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(
            SQL_GET_DOCTOR_PATIENT_TRANSACTIONS,
            (doctor_id,)
        ).fetchall()

    result = {}

    for row in rows:
        (
            patient_id,
            name,
            email,
            age,
            gender,
            transaction_id,
            inference,
            input_path,
            output_path,
            created_at,
        ) = row

        if patient_id not in result:
            result[patient_id] = {
                "patient_id": patient_id,
                "name": name,
                "email": email,
                "age": age,
                "gender": gender,
                "transactions": []
            }

        result[patient_id]["transactions"].append({
            "transaction_id": transaction_id,
            "disease_detected": inference,
            "fundus_input_path": input_path,
            "fundus_output_path": output_path,
            "created_at": created_at
        })

    return list(result.values())

SQL_CHECK_INPUT_IMAGE="SELECT 1 FROM transactions WHERE fundus_input_path = ? ;"
SQL_CHECK_OUTPUT_IMAGE="SELECT 1 FROM transactions WHERE fundus_output_path = ? ;"
def get_image_from_transactions(image_name:str):
    try:
        if image_name[:5]=="INPUT":
            with get_db() as conn:
                cursor = conn.cursor()
                result = cursor.execute(SQL_CHECK_INPUT_IMAGE,(image_name,)).fetchone()
            if result is not None:
                input_file_path= INPUT_DIR / image_name
                if input_file_path.is_file():
                    with open(input_file_path,"rb") as buffer:
                        buffer_bytes=buffer.read()
                    input_image_file= base64.b64encode(buffer_bytes).decode("utf-8")
                    return input_image_file
                else:
                    raise ValueError("Couldnt access file")
            else:
                raise ValueError("Imagefile not in records")

        elif image_name[:6] == "OUTPUT":
            print("good")
            with get_db() as conn:
                cursor = conn.cursor()
                result = cursor.execute(SQL_CHECK_OUTPUT_IMAGE,(image_name,)).fetchone()
                print("ok",result)
            if result is not None:
                output_file_path = OUTPUT_DIR / image_name
                if output_file_path.is_file():
                    with open(output_file_path,"rb") as buffer:
                        buffer_bytes=buffer.read()
                    output_image_file= base64.b64encode(buffer_bytes).decode("utf-8")
                    return output_image_file
                else:
                    raise ValueError("Couldnt access file")
            else:
                raise ValueError("Imagefile not in records")
        else:
            raise ValueError("File name , not according to compliance")

    except ValueError:
        raise
    except Exception as e:
        raise ValueError("Value Error")
    pass



# get_all_doctor_id()

# doctor_exists("abcd")
# patient_exists("dcba")
# print(get_image_from_tranastinons(image_name="INPUTPAT202602500555EC30DA.jpg"))
# print(get_image_from_tranastinons(image_name="OUTPUTPAT202602500555EC30DA.png"))
# print(get_all_records_of_all_patient())