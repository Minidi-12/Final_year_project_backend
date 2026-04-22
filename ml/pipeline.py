import sys
import numpy as np
from datetime import datetime
from data_processor import DataProcessor
from clustering import ClusterAnalyzer
from urgency_score import UrgencyScore
from predictor import UrgencyPredictor

def main():
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        processor = DataProcessor()
        df, features, scaled_data, collection = processor.prepare_data()
        
        # DEBUG: Check data quality
        print(f"\n=== DATA QUALITY CHECK ===")
        print(f"DataFrame shape: {df.shape}")
        print(f"Features shape: {features.shape}")
        print(f"Scaled data shape: {scaled_data.shape}")
        print(f"Scaled data min/max: {scaled_data.min():.4f} / {scaled_data.max():.4f}")
        print(f"Scaled data contains NaN: {np.any(np.isnan(scaled_data))}")
        print(f"Features variance:\n{np.var(scaled_data, axis=0)}\n")
        
        # PCA
        cluster_analyzer = ClusterAnalyzer()
        pca_coords = cluster_analyzer.perform_pca(scaled_data)
        cluster_analyzer.plot_pca_scatter(pca_coords, title="PCA Visualization (Before Clustering)")
        
        # Hierarchical Clustering
        cluster_labels = cluster_analyzer.hierarchical_clustering(scaled_data)
        cluster_analyzer.plot_dendrogram()
        cluster_analyzer.plot_pca_scatter(pca_coords, cluster_labels, title="PCA Visualization (Clustered)")
        
        # Urgency Scoring
        scorer = UrgencyScore()
        urgency_scores, urgency_labels = scorer.score_all_beneficiaries(df)
        
        # 3-Month Predictions
        predictor = UrgencyPredictor()
        predictions = predictor.predict_all(df, urgency_scores)
        
        # Write Results Back to MongoDB
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
                'generated_at': datetime.now()
            }
            
            collection.update_one(
                {'_id': doc_id},
                {'$set': update_data}
            )
            update_count += 1
        
        print(f" Updated {update_count} records in MongoDB")
        
    except Exception as e:
        print(f"\n ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()