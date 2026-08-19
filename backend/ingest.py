"""
Run this script whenever you add/update documents in data/medical_docs/.
Usage: python ingest.py
"""
from app.rag import build_vectorstore

if __name__ == "__main__":
    print("Building vector store from documents...")
    vectorstore, num_chunks = build_vectorstore()
    print(f"Done. Indexed {num_chunks} chunks into Chroma at the configured persist directory.")