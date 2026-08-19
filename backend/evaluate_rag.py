"""
RAG evaluation pipeline using RAGAS, with checkpointing so partial progress
survives a quota interruption.

"""
import json
import os
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_core.messages import SystemMessage, HumanMessage

from app.rag import get_retriever, get_embeddings
from app.llm import generate_reply
from app.prompts import build_system_prompt
from evaluation.eval_llm import HFChatModel

CHECKPOINT_PATH = "evaluation/checkpoint.json"


def load_test_set(path="evaluation/eval_dataset.json"):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_checkpoint():
    if os.path.exists(CHECKPOINT_PATH):
        with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_checkpoint(checkpoint):
    with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, indent=2)


def run_rag(question: str):
    retriever = get_retriever(k=4)
    docs = retriever.invoke(question)
    contexts = [d.page_content for d in docs]
    context_text = "\n\n---\n\n".join(contexts)

    system_prompt = build_system_prompt(context_text)
    messages = [SystemMessage(content=system_prompt), HumanMessage(content=question)]
    answer = generate_reply(messages)

    return answer, contexts


def build_eval_dataset(test_set):
    checkpoint = load_checkpoint()

    for item in test_set:
        q = item["question"]
        if q in checkpoint:
            print(f"Skipping (already done): {q}")
            continue
        print(f"Running RAG for: {q}")
        try:
            answer, contexts = run_rag(q)
            checkpoint[q] = {
                "answer": answer,
                "contexts": contexts,
                "ground_truth": item["ground_truth"],
            }
            save_checkpoint(checkpoint)
        except Exception as e:
            print(f"\nStopped early due to: {e}")
            print(f"Progress saved — {len(checkpoint)}/{len(test_set)} questions done.")
            print("Rerun this script later (e.g. after quota resets) to resume where it left off.")
            break

    questions, answers, contexts_list, ground_truths = [], [], [], []
    for item in test_set:
        q = item["question"]
        if q in checkpoint:
            questions.append(q)
            answers.append(checkpoint[q]["answer"])
            contexts_list.append(checkpoint[q]["contexts"])
            ground_truths.append(checkpoint[q]["ground_truth"])

    return Dataset.from_dict({
        "question": questions,
        "answer": answers,
        "contexts": contexts_list,
        "ground_truth": ground_truths,
    })


def main():
    test_set = load_test_set()
    print(f"Loaded {len(test_set)} evaluation questions.\n")

    dataset = build_eval_dataset(test_set)

    if len(dataset) == 0:
        print("No completed questions to evaluate yet. Run again once you have quota.")
        return

    print(f"\n{len(dataset)}/{len(test_set)} questions ready. Running RAGAS scoring...\n")

    eval_llm = LangchainLLMWrapper(HFChatModel())
    eval_embeddings = LangchainEmbeddingsWrapper(get_embeddings())

    result = evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        llm=eval_llm,
        embeddings=eval_embeddings,
    )

    print("\n=== RAGAS Evaluation Results (averaged) ===")
    print(result)

    df = result.to_pandas()
    df.to_csv("evaluation/results.csv", index=False)
    print("\nSaved detailed per-question results to evaluation/results.csv")


if __name__ == "__main__":
    main()