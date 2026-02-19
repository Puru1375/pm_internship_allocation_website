from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

app = FastAPI()

# Load the AI Model once on startup (This might take a moment to download on first run)
print("⏳ Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Loaded!")

class MatchRequest(BaseModel):
    student_text: str
    job_text: str

@app.get("/")
def read_root():
    return {"message": "AI Microservice is Active"}

@app.post("/calculate-score")
def calculate_score(data: MatchRequest):
    # 1. Convert text to Vector Embeddings
    embeddings1 = model.encode(data.student_text, convert_to_tensor=True)
    embeddings2 = model.encode(data.job_text, convert_to_tensor=True)

    # 2. Calculate Cosine Similarity (0 to 1)
    cosine_scores = util.cos_sim(embeddings1, embeddings2)
    
    # 3. Convert to Percentage (0 to 100)
    match_percentage = float(cosine_scores[0][0]) * 100

    return {
        "score": round(match_percentage, 2),
        "status": "Success"
    }