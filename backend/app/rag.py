import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from app.config import settings

_embeddings = None
_vectorstore = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=settings.embedding_model)
    return _embeddings


def load_documents(docs_dir: str):
    """Loads .txt and .pdf files from the docs directory."""
    docs = []

    txt_loader = DirectoryLoader(
        docs_dir, glob="**/*.txt", loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"}, show_progress=True,
    )
    docs.extend(txt_loader.load())

    pdf_loader = DirectoryLoader(
        docs_dir, glob="**/*.pdf", loader_cls=PyPDFLoader, show_progress=True,
    )
    docs.extend(pdf_loader.load())

    return docs


def build_vectorstore(docs_dir: str = None, persist_dir: str = None):
    """
    Loads documents, chunks them, embeds them, and persists a Chroma collection.
    Run this via ingest.py whenever your source documents change.
    """
    docs_dir = docs_dir or settings.docs_dir
    persist_dir = persist_dir or settings.vectorstore_dir

    raw_docs = load_documents(docs_dir)
    if not raw_docs:
        raise ValueError(
            f"No documents found in {docs_dir}. Add .txt or .pdf files before ingesting."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(raw_docs)

    embeddings = get_embeddings()

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir,
        collection_name="medical_docs",
    )
    return vectorstore, len(chunks)


def get_vectorstore():
    """Loads the persisted Chroma collection (does NOT re-ingest)."""
    global _vectorstore
    if _vectorstore is None:
        persist_dir = settings.vectorstore_dir
        if not os.path.isdir(persist_dir) or not os.listdir(persist_dir):
            raise RuntimeError(
                f"Vector store not found at '{persist_dir}'. "
                f"Run `python ingest.py` first to build it."
            )
        _vectorstore = Chroma(
            persist_directory=persist_dir,
            embedding_function=get_embeddings(),
            collection_name="medical_docs",
        )
    return _vectorstore


def get_retriever(k: int = 4):
    vectorstore = get_vectorstore()
    return vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": k})