import sys
import numpy as np
from datetime import datetime
from data_processor import DataProcessor
from clustering import ClusterAnalyzer
from urgency_score import UrgencyScore
from ml_model import MLUrgencyModel
from hybrid_score import HybridUrgencyScorer
from predictor import UrgencyPredictor
from config import N_CLUSTERS, OUTPUT_DIR
import os

def main():
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        # Step 1: Load and prepare data
        processor = DataProcessor()
        df, features, scaled_data, collection, beneficiary_profiles = processor.prepare_data()
        
        print(f"DATA QUALITY CHECK")
        print(f"DataFrame shape: {df.shape}")
        print(f"Features shape: {features.shape}")
        print(f"Beneficiary profiles: {len(beneficiary_profiles)}")
        
        # Step 2: PCA and Clustering
        
        cluster_analyzer = ClusterAnalyzer()
        pca_coords = cluster_analyzer.perform_pca(scaled_data)
        cluster_analyzer.plot_pca_scatter(pca_coords, title="PCA Visualization (Before Clustering)")
        
        cluster_labels = cluster_analyzer.hierarchical_clustering(scaled_data)
        cluster_analyzer.plot_dendrogram()
        cluster_analyzer.plot_pca_scatter(pca_coords, cluster_labels, title="PCA Visualization (Clustered)")
        
        # Step 3: Train ML Model (if enough data)
        
        ml_model = MLUrgencyModel()
        use_ml = False
        
        if len(beneficiary_profiles) >= 10:
            print(f"Training ML model with synthetic data augmentation...")
            urgency_scorer = UrgencyScore()
            feature_importance = ml_model.train(beneficiary_profiles, urgency_scorer, use_synthetic=True)
            use_ml = True
        else:
            print(f"WARNING: Only {len(beneficiary_profiles)} samples. Need at least 10 to train ML.")
            print(f"Using rule-based scoring only.")
        
        # Step 4: Hybrid Urgency Scoring
        
        hybrid_scorer = HybridUrgencyScorer(rule_weight=0.6, ml_weight=0.4)
        if use_ml:
            hybrid_scorer.ml_model = ml_model
        
        urgency_scores, urgency_labels, score_details = hybrid_scorer.score_all_beneficiaries(
            beneficiary_profiles, 
            use_ml=use_ml
        )
        
        # Step 5: Future Predictions
        
        predictor = UrgencyPredictor()
        predictions = predictor.predict_all(df, urgency_scores)
        
        # Step 6: Update MongoDB

        update_count = 0
        
        for idx, row in df.iterrows():
            doc_id = row['_id']
            
            update_data = {
                'clusterId': int(cluster_labels[idx]),
                'urgency_score': urgency_scores[idx],
                'urgency_label': urgency_labels[idx],
                'Predictions': predictions[idx],
                'pca_x': float(pca_coords[idx, 0]),
                'pca_y': float(pca_coords[idx, 1]),
                'ml_details': score_details[idx],
                'generated_at': datetime.now()
            }
            
            collection.update_one(
                {'_id': doc_id},
                {'$set': update_data}
            )
            update_count += 1
        
        print(f" Updated {update_count} records in MongoDB")
        
        # Step 7: Summary Report
        print(f"Total Beneficiaries Processed: {len(df)}")
        print(f"Clustering: {N_CLUSTERS} clusters identified")
        print(f"PCA Variance Captured: {cluster_analyzer.pca.explained_variance_ratio_.sum():.1%}")
        print(f"ML Model: {'Trained ✓' if use_ml else 'Not used (insufficient data)'}")
        print(f"Urgency Distribution:")
        print(f" High: {urgency_labels.count('High')}")
        print(f" Moderate: {urgency_labels.count('Moderate')}")
        print(f" Stable: {urgency_labels.count('Stable')}")
        print(f"\nOutputs saved to: {OUTPUT_DIR}/")
        print(f"Model saved to: models/urgency_classifier.pkl")
        print(f"\n Pipeline completed successfully!")
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"\n ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()