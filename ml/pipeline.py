import numpy as np
import pandas as pd
from pymongo import MongoClient
from config import (
    MONGO_URI, MONGO_DB_NAME, COLLECTION_NAME,
    RANDOM_STATE, RULE_BASED_WEIGHT, ML_WEIGHT,
    OUTPUT_DIR
)
from district_analysis import DistrictPovertyIndex, run as run_district_analysis
from data_processor import DataProcessor
from urgency_score import UrgencyScore
from ml_model import MLUrgencyModel
from hybrid_score import HybridUrgencyScorer
from clustering import ClusterAnalyzer         
from predictor import UrgencyPredictor         


def connect_db():
    client = MongoClient(MONGO_URI)
    db     = client[MONGO_DB_NAME]
    print(f" Connected to MongoDB — database: {MONGO_DB_NAME}")
    return db


def load_profiles(db):
    collection = db[COLLECTION_NAME]
    docs       = list(collection.find({}))
    print(f"  Loaded {len(docs)} documents from '{COLLECTION_NAME}'")

    processor = DataProcessor()
    profiles  = processor.process(docs)         
    return profiles, docs, processor


def run_pipeline():

    print("\n[STEP 1] District Poverty Analysis")
    run_district_analysis()
    dpi = DistrictPovertyIndex("outputs/district_poverty_index.json")

    print("\n[STEP 2] Loading profiles from MongoDB")
    db                        = connect_db()
    profiles_df, docs, processor = load_profiles(db)

    if len(profiles_df) == 0:
        print("  No profiles found. Exiting.")
        return

    print("\n[STEP 3] Rule-Based Urgency Scoring + District Bonus")
    urgency_scorer = UrgencyScore()
    rule_scores, rule_labels = urgency_scorer.score_all_beneficiaries(
        profiles_df, district_index=dpi
    )

    print("\n[STEP 4] ML Urgency Model (Random Forest)")
    ml_model = MLUrgencyModel()
    if not ml_model.load_model():
        print("  Training new model")
        ml_model.train(profiles_df, urgency_scorer, use_synthetic=True)

    print(f"\n[STEP 5] Hybrid Scoring "
          f"({int(RULE_BASED_WEIGHT*100)}% Rules + {int(ML_WEIGHT*100)}% ML)")
    hybrid_scorer          = HybridUrgencyScorer(
        rule_weight=RULE_BASED_WEIGHT,
        ml_weight=ML_WEIGHT
    )
    hybrid_scorer.ml_model = ml_model 

    final_scores  = []
    final_labels  = []
    final_details = []

    for _, row in profiles_df.iterrows():
        score, label, details = hybrid_scorer.score_beneficiary(
            row, use_ml=True
        )
        bonus = dpi.get_bonus(row.get("gn_division", ""))
        if bonus > 0:
            score                    = min(score + bonus, 100)
            details["district_bonus"] = bonus
            details["district"]       = dpi.get_district(
                row.get("gn_division", "")
            )
        final_scores.append(round(score, 2))
        final_labels.append(urgency_scorer.get_urgency_label(score))
        final_details.append(details)

    high     = final_labels.count('High')
    moderate = final_labels.count('Moderate')
    stable   = final_labels.count('Stable')
    print(f"  High: {high} | Moderate: {moderate} | Stable: {stable}")
    print(f"  Range: {min(final_scores):.1f} – {max(final_scores):.1f} | "
          f"Avg: {np.mean(final_scores):.1f}")

    print("\n[STEP 6] Hierarchical Clustering + PCA")
    _, scaled_data   = processor.extract_scaled_features(profiles_df)
    cluster_analyzer = ClusterAnalyzer()
    cluster_results  = cluster_analyzer.analyze(profiles_df, scaled_data)

    print("\n[STEP 7] 3-Month Urgency Predictions")
    predictor   = UrgencyPredictor()
    predictions = predictor.predict_all(profiles_df, final_scores)

    print("\n[STEP 8] Writing results to MongoDB")
    collection = db[COLLECTION_NAME]
    updated    = 0

    for i, doc in enumerate(docs):
        if i >= len(final_scores):
            break

        cluster_info = cluster_results[i] if i < len(cluster_results) else {}
        gn_division  = doc.get("b_profile", [{}])[0].get("gn_division", "")

        update = {
            "$set": {
                "urgency_score"    : final_scores[i],
                "urgency_label"    : final_labels[i],
                "ml_details"       : final_details[i],
                "pca_x"            : cluster_info.get("pca_x", 0.0),
                "pca_y"            : cluster_info.get("pca_y", 0.0),
                "clusterId"        : cluster_info.get("cluster_id", 1),
                "Predictions"      : predictions[i] if i < len(predictions) else [],
                "district_dpi"     : dpi.get_dpi(dpi.get_district(gn_division)),
                "district_cluster" : dpi.get_cluster(gn_division),
            }
        }

        result = collection.update_one({"_id": doc["_id"]}, update)
        if result.modified_count > 0:
            updated += 1

    print(f"  Updated {updated}/{len(docs)} documents")

    print("\n" + "=" * 60)
    print("  PIPELINE COMPLETE")
    print(f"  Profiles processed : {len(profiles_df)}")
    print(f"  High urgency       : {high}")
    print(f"  Moderate urgency   : {moderate}")
    print(f"  Stable             : {stable}")
    print(f"  DB updated         : {updated} documents")
    print("=" * 60)

    return {
        "scores"  : final_scores,
        "labels"  : final_labels,
        "updated" : updated,
    }


if __name__ == "__main__":
    run_pipeline()