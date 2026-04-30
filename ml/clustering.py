import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from scipy.spatial.distance import pdist
from config import *
import os

class ClusterAnalyzer:
    def __init__(self):
        self.pca = PCA(n_components=2, random_state=RANDOM_STATE)
        self.linkage_matrix = None
        self.cluster_labels = None
        self.pca_coords = None
        self.optimal_distance = None
    
    def perform_pca(self, scaled_data):
        scaled_data = np.nan_to_num(scaled_data, nan=0.0, posinf=1.0, neginf=-1.0)
        
        # Fit PCA
        pca_coords = self.pca.fit_transform(scaled_data)
        self.pca_coords = pca_coords
        
        variance_explained = self.pca.explained_variance_ratio_
        print(f"PCA Variance Explained:")
        print(f"  Component 1: {variance_explained[0]:.2%}")
        print(f"  Component 2: {variance_explained[1]:.2%}")
        print(f"  Total: {sum(variance_explained):.2%}")
        
        return pca_coords
    
    def calculate_optimal_clusters(self, scaled_data, max_clusters=10):
        """
        Calculate optimal number of clusters using elbow method
        Find the distance threshold for cutting dendrogram
        """
        distances = pdist(scaled_data, metric='euclidean')
        Z = linkage(scaled_data, method='ward')
        
        # Calculate the distances at each merge
        last = Z[-max_clusters:, 2]
        last_rev = last[::-1]
        
        # Find elbow point (largest jump)
        idxs = np.arange(1, len(last) + 1)
        acceleration = np.diff(last_rev, 2)
        
        if len(acceleration) > 0:
            k = acceleration.argmax() + 2  # +2 because of double diff
            optimal_clusters = min(k, N_CLUSTERS)
        else:
            optimal_clusters = N_CLUSTERS
        
        # Calculate the distance threshold
        self.optimal_distance = last_rev[optimal_clusters - 1]
        
        print(f"\n=== OPTIMAL CLUSTERING ===")
        print(f"Recommended number of clusters: {optimal_clusters}")
        print(f"Distance threshold (cutoff): {self.optimal_distance:.2f}")
        print(f"Using N_CLUSTERS from config: {N_CLUSTERS}")
        
        return optimal_clusters, self.optimal_distance
    
    def hierarchical_clustering(self, scaled_data):
        self.linkage_matrix = linkage(scaled_data, method='ward')
        
        # Calculate optimal cutoff
        optimal_k, cutoff_distance = self.calculate_optimal_clusters(scaled_data)
        
        # Use configured N_CLUSTERS
        self.cluster_labels = fcluster(self.linkage_matrix, N_CLUSTERS, criterion='maxclust')
        
        print(f"\nClustered into {N_CLUSTERS} groups:")
        for i in range(1, N_CLUSTERS + 1):
            count = np.sum(self.cluster_labels == i)
            percentage = (count / len(self.cluster_labels)) * 100
            print(f"  Cluster {i}: {count} beneficiaries ({percentage:.1f}%)")
        
        return self.cluster_labels
        
    def plot_dendrogram(self):
        """
        Plot dendrogram with horizontal cutoff line showing cluster separation
        """
        if self.linkage_matrix is None:
            print("ERROR: Run hierarchical_clustering() first")
            return
        
        plt.figure(figsize=(14, 8))
        
        # Create dendrogram
        dend = dendrogram(
            self.linkage_matrix, 
            leaf_rotation=90., 
            leaf_font_size=8.,
            color_threshold=self.optimal_distance if self.optimal_distance else None
        )
        
        # Add horizontal cutoff line
        if self.optimal_distance:
            plt.axhline(y=self.optimal_distance, c='red', linestyle='--', 
                       linewidth=2, label=f'Cutoff (d={self.optimal_distance:.2f})')
            plt.legend(loc='upper right', fontsize=11)
        
        plt.title('Beneficiary Cluster Dendrogram — Ward Linkage', 
                 fontsize=16, fontweight='bold')
        plt.xlabel('Beneficiary Index', fontsize=12)
        plt.ylabel('Euclidean Distance (Ward)', fontsize=12)
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        plt.savefig(DENDROGRAM_PATH, dpi=150)
        plt.close()
        print(f"✓ Dendrogram saved: {DENDROGRAM_PATH}")
    
    def plot_pca_scatter(self, pca_coords, cluster_labels=None, title="PCA Visualization"):
        plt.figure(figsize=(10, 7))
        
        if cluster_labels is not None:
            colors = ['#ef4444', '#f97316', '#22c55e']
            for i in range(1, N_CLUSTERS + 1):
                mask = cluster_labels == i
                plt.scatter(
                    pca_coords[mask, 0],
                    pca_coords[mask, 1],
                    c=colors[i-1],
                    label=f'Cluster {i}',
                    alpha=0.7,
                    s=80,
                    edgecolors='black',
                    linewidth=0.5
                )
            plt.legend(title='Cluster', loc='best', fontsize=10)
            save_path = PCA_CLUSTER_PLOT_PATH
        else:
            plt.scatter(pca_coords[:, 0], pca_coords[:, 1], 
                       alpha=0.6, s=80, color='#3b82f6', edgecolors='black', linewidth=0.5)
            save_path = PCA_SCATTER_PLOT_PATH
        
        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel('Principal Component 1', fontsize=12)
        plt.ylabel('Principal Component 2', fontsize=12)
        plt.grid(alpha=0.3)
        plt.tight_layout()
        
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        plt.savefig(save_path, dpi=100)
        plt.close()
        print(f"✓ PCA plot saved: {save_path}")
    
    def get_cluster_statistics(self):
        if self.cluster_labels is None:
            print("ERROR: Run hierarchical_clustering() first")
            return None
        
        stats = {}
        for i in range(1, N_CLUSTERS + 1):
            count = np.sum(self.cluster_labels == i)
            percentage = (count / len(self.cluster_labels)) * 100
            stats[f'cluster_{i}'] = {
                'count': count,
                'percentage': percentage
            }
        
        return stats