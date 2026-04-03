from transformers import AutoModelForTokenClassification, AutoTokenizer

MODEL_NAME = "dslim/bert-base-NER"

AutoTokenizer.from_pretrained(MODEL_NAME)
AutoModelForTokenClassification.from_pretrained(MODEL_NAME)
