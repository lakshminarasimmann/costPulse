"""
embeddings.py — ChromaDB setup and management for context notes.

Uses sentence-transformers (all-MiniLM-L6-v2) for local, free embeddings.
Stores notes in ChromaDB with rich metadata for filtered retrieval.
"""

import os
import logging
import warnings

# Suppress HuggingFace / transformers load reports and unauthenticated warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
warnings.filterwarnings("ignore")
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)

import chromadb
from chromadb.utils import embedding_functions
import pandas as pd
from backend.config import (
    CHROMA_DIR,
    CHROMA_COLLECTION,
    EMBEDDING_MODEL,
    CONTEXT_NOTES_FILE,
)


def get_embedding_function():
    """Get the sentence-transformer embedding function."""
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL,
    )


def get_chroma_client():
    """Get a persistent ChromaDB client, falling back to ephemeral client if read-only."""
    try:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        return chromadb.PersistentClient(path=str(CHROMA_DIR))
    except Exception as e:
        logging.getLogger(__name__).warning(f"ChromaDB persistent client failed ({e}), falling back to EphemeralClient.")
        return chromadb.EphemeralClient()


def initialize_vector_store(notes_file=None) -> chromadb.Collection:
    """
    Load context notes into ChromaDB with metadata.

    Each note is stored with:
    - document: the full note text (used for semantic search)
    - metadata: note_id, date, applies_to (for filtered retrieval)
    - id: the note_id

    Returns
    -------
    chromadb.Collection
        The initialized collection ready for queries.
    """
    notes_file = notes_file or CONTEXT_NOTES_FILE
    notes_df = pd.read_csv(notes_file)

    # Drop any empty rows
    notes_df = notes_df.dropna(subset=["note_id"])

    client = get_chroma_client()
    ef = get_embedding_function()

    # Delete existing collection if it exists (fresh start)
    try:
        client.delete_collection(CHROMA_COLLECTION)
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        embedding_function=ef,
    )

    # Prepare documents for insertion
    documents = []
    metadatas = []
    ids = []

    for _, row in notes_df.iterrows():
        note_id = str(row["note_id"]).strip()
        date = str(row["date"]).strip()
        applies_to = str(row["applies_to"]).strip()
        note_text = str(row["note"]).strip()

        # Create a rich document that combines all fields for better retrieval
        enriched_doc = (
            f"Note {note_id} ({date}): Applies to {applies_to}. {note_text}"
        )

        documents.append(enriched_doc)
        metadatas.append({
            "note_id": note_id,
            "date": date,
            "applies_to": applies_to,
            "original_note": note_text,
        })
        ids.append(note_id)

    # Add all notes to the collection
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids,
    )

    print(f"[Embeddings] Loaded {len(documents)} notes into ChromaDB")
    return collection


def get_collection() -> chromadb.Collection:
    """Get the existing ChromaDB collection (assumes already initialized)."""
    client = get_chroma_client()
    ef = get_embedding_function()
    return client.get_collection(
        name=CHROMA_COLLECTION,
        embedding_function=ef,
    )
