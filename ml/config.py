import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# Clustering Parameters
N_CLUSTERS = 3
RANDOM_STATE = 42

# Urgency Thresholds (Rule-Based)
LOW_INCOME_THRESHOLD = 10000
MEDIUM_INCOME_THRESHOLD = 50000
HOSPITAL_DISTANCE_THRESHOLD = 10
LARGE_FAMILY_SIZE_THRESHOLD = 5

HIGH_URGENCY_MIN = 70    
MODERATE_URGENCY_MIN = 40

# ML Model Parameters
MIN_SAMPLES_FOR_ML = 10  # Minimum real samples needed to train ML
SYNTHETIC_DATA_RATIO = 5  # Generate 5x synthetic data for each real sample
ML_TEST_SPLIT = 0.2
ML_CROSS_VAL_FOLDS = 5

# Hybrid Scoring Weights
RULE_BASED_WEIGHT = 0.6  # 60% weight to rule-based
ML_WEIGHT = 0.4          # 40% weight to ML predictions

# Output Paths
OUTPUT_DIR = "outputs"
DENDROGRAM_PATH = f'{OUTPUT_DIR}/dendrogram.png'
PCA_SCATTER_PLOT_PATH = f'{OUTPUT_DIR}/pca_scatter_plot.png'
PCA_CLUSTER_PLOT_PATH = f'{OUTPUT_DIR}/pca_cluster_plot.png'
FEATURE_IMPORTANCE_PATH = f'{OUTPUT_DIR}/feature_importance.png'

# Model Save Path
MODEL_DIR = "models"
ML_MODEL_PATH = f'{MODEL_DIR}/urgency_classifier.pkl'