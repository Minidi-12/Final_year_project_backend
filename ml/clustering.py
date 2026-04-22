import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from config import *
import os

class ClusterAnalyzer:
    def __init__(self):
        self.pca = PCA(n_components=2, random_state=RANDOM_STATE)
        self.linkage_matrix = None
        self.cluster_labels = None
    
    def perform_pca(self, scaled_data):
        #Reduce dimensions to 2D for visualization
        # Check for zero variance or invalid data
        if np.any(np.isnan(scaled_data)) or np.any(np.isinf(scaled_data)):
            print("WARNING: Found NaN or Inf values in scaled data!")
            scaled_data = np.nan_to_num(scaled_data, nan=0.0, posinf=1.0, neginf=-1.0)
        
        col_var = np.var(scaled_data, axis=0)
        if np.all(col_var == 0):
            print("ERROR: All features have zero variance. Check your data preprocessing!")
            print(f"Scaled data shape: {scaled_data.shape}")
            print(f"Scaled data sample:\n{scaled_data[:3]}")
        
        pca_coords = self.pca.fit_transform(scaled_data)
        variance_explained = self.pca.explained_variance_ratio_
        
        # Handle NaN in variance explained
        variance_explained = np.nan_to_num(variance_explained, nan=0.0)
        
        print(f"  Component 1 explains: {variance_explained[0]:.2%} of variance")
        print(f"  Component 2 explains: {variance_explained[1]:.2%} of variance")
        print(f"  Total variance explained: {sum(variance_explained):.2%}")
        return pca_coords
    
    def hierarchical_clustering(self, scaled_data):
        #Perform hierarchical clustering using Ward linkage
        self.linkage_matrix = linkage(scaled_data, method='ward')
        self.cluster_labels = fcluster(self.linkage_matrix, N_CLUSTERS, criterion='maxclust')
        print(f"Cluster in to {N_CLUSTERS} clusters")
        for i in range(1, N_CLUSTERS + 1):
            count = np.sum(self.cluster_labels == i)
            print(f"  Cluster {i}: {count} beneficiaries")
        return self.cluster_labels
        
    def plot_dendrogram(self):
        plt.figure(figsize=(14, 7))
        dendrogram(self.linkage_matrix, leaf_rotation=90., leaf_font_size=8.)
        plt.title('Beneficiary Cluster Analysis — Ward Linkage', fontsize=16, fontweight='bold')
        plt.xlabel('Beneficiary Index', fontsize=12)
        plt.ylabel('Distance', fontsize=12)
        plt.tight_layout()
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        plt.savefig(DENDROGRAM_PATH)
        plt.close()
        print(f"Dendrogram saved to {DENDROGRAM_PATH}")
    
    def plot_pca_scatter(self, pca_coords, cluster_labels=None, title="PCA Visualization"):
        plt.figure(figsize=(10, 7))
        if cluster_labels is not None:
            #colour by cluster
            colors = ['#ef4444', '#f97316', '#22c55e']
            for i in range(1, N_CLUSTERS + 1):
                mask = cluster_labels == i
                plt.scatter(
                    pca_coords[mask, 0],
                    pca_coords[mask, 1],
                    c=colors[i-1],
                    label=f'Cluster {i}',
                    alpha=0.6,
                    s=50
                )
            plt.legend()
            save_path = PCA_CLUSTER_PLOT_PATH
        else:
            # Single color
            plt.scatter(pca_coords[:, 0], pca_coords[:, 1], alpha=0.6, s=50)
            save_path = PCA_SCATTER_PLOT_PATH
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel('Principal Component 1', fontsize=12)
        plt.ylabel('Principal Component 2', fontsize=12)
        plt.legend(title='Cluster', loc='best')
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(save_path)
        plt.close()
        print(f"PCA scatter plot saved to {save_path}")