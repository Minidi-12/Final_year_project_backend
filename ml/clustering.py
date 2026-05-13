import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from scipy.spatial.distance import pdist
from config import *
import os
class ClusterAnalyzer:
    def __init__(self):
        self.pca              = PCA(n_components=2, random_state=RANDOM_STATE)
        self.linkage_matrix   = None
        self.cluster_labels   = None
        self.pca_coords       = None
        self.optimal_distance = None

    def analyze(self, profiles_df: pd.DataFrame,
                scaled_data: np.ndarray) -> list:

        pca_coords = self.perform_pca(scaled_data)

        cluster_labels = self.hierarchical_clustering(scaled_data)

        self.plot_dendrogram()
        self.plot_pca_scatter(pca_coords,
                              title="PCA Visualization (Before Clustering)")
        self.plot_pca_scatter(pca_coords, cluster_labels,
                              title="PCA Visualization (Clustered)")

        results = []
        for i in range(len(profiles_df)):
            results.append({
                'pca_x'     : float(pca_coords[i, 0]),
                'pca_y'     : float(pca_coords[i, 1]),
                'cluster_id': int(cluster_labels[i]),
            })
        return results

    def perform_pca(self, scaled_data: np.ndarray) -> np.ndarray:
        scaled_data  = np.nan_to_num(scaled_data,
                                     nan=0.0, posinf=1.0, neginf=-1.0)
        pca_coords   = self.pca.fit_transform(scaled_data)
        self.pca_coords = pca_coords

        variance     = self.pca.explained_variance_ratio_
        print(f"\nPCA Variance Explained:")
        print(f"  Component 1 : {variance[0]:.2%}")
        print(f"  Component 2 : {variance[1]:.2%}")
        print(f"  Total       : {sum(variance):.2%}")
        return pca_coords

    def _find_optimal_cutoff(self, scaled_data: np.ndarray,
                             max_k: int = 10) -> float:
        Z    = self.linkage_matrix
        last = Z[-max_k:, 2][::-1]

        acceleration = np.diff(last, 2)
        k = acceleration.argmax() + 2 if len(acceleration) > 0 else N_CLUSTERS
        k = min(k, N_CLUSTERS)

        cutoff = last[k - 1]
        return float(cutoff)

    def hierarchical_clustering(self, scaled_data: np.ndarray) -> np.ndarray:
        self.linkage_matrix = linkage(scaled_data, method='ward')

        self.optimal_distance = self._find_optimal_cutoff(scaled_data)
        self.cluster_labels   = fcluster(
            self.linkage_matrix, N_CLUSTERS, criterion='maxclust'
        )

        print(f"\nHierarchical Clustering (Ward linkage):")
        print(f"  Optimal cutoff  : {self.optimal_distance:.2f}")
        print(f"  N clusters used : {N_CLUSTERS}")
        for i in range(1, N_CLUSTERS + 1):
            count   = np.sum(self.cluster_labels == i)
            pct     = count / len(self.cluster_labels) * 100
            print(f"  Cluster {i}      : {count} beneficiaries ({pct:.1f}%)")

        return self.cluster_labels

    def plot_dendrogram(self):
        if self.linkage_matrix is None:
            return

        plt.figure(figsize=(14, 8))
        dendrogram(
            self.linkage_matrix,
            leaf_rotation=90.,
            leaf_font_size=8.,
            color_threshold=self.optimal_distance or 0,
        )
        if self.optimal_distance:
            plt.axhline(y=self.optimal_distance, c='red', linestyle='--',
                        linewidth=2,
                        label=f'Cutoff (d={self.optimal_distance:.2f})')
            plt.legend(loc='upper right', fontsize=11)

        plt.title('Beneficiary Cluster Dendrogram - Ward Linkage',
                  fontsize=16, fontweight='bold')
        plt.xlabel('Beneficiary Index', fontsize=12)
        plt.ylabel('Euclidean Distance (Ward)', fontsize=12)
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        plt.savefig(DENDROGRAM_PATH, dpi=150)
        plt.close()
        print(f" Dendrogram saved: {DENDROGRAM_PATH}")

    def plot_pca_scatter(self, pca_coords: np.ndarray,
                         cluster_labels: np.ndarray = None,
                         title: str = "PCA Visualization"):
        plt.figure(figsize=(10, 7))
        colors = ['#ef4444', '#f97316', '#22c55e']

        if cluster_labels is not None:
            for i in range(1, N_CLUSTERS + 1):
                mask = cluster_labels == i
                plt.scatter(
                    pca_coords[mask, 0], pca_coords[mask, 1],
                    c=colors[i - 1], label=f'Cluster {i}',
                    alpha=0.7, s=80,
                    edgecolors='black', linewidth=0.5
                )
            plt.legend(title='Cluster', loc='best', fontsize=10)
            save_path = PCA_CLUSTER_PLOT_PATH
        else:
            plt.scatter(
                pca_coords[:, 0], pca_coords[:, 1],
                alpha=0.6, s=80, color='#3b82f6',
                edgecolors='black', linewidth=0.5
            )
            save_path = PCA_SCATTER_PLOT_PATH

        plt.title(title, fontsize=16, fontweight='bold')
        plt.xlabel('Principal Component 1', fontsize=12)
        plt.ylabel('Principal Component 2', fontsize=12)
        plt.grid(alpha=0.3)
        plt.tight_layout()

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        plt.savefig(save_path, dpi=100)
        plt.close()
        print(f"PCA plot saved: {save_path}")

    def get_cluster_statistics(self) -> dict:
        if self.cluster_labels is None:
            return {}
        stats = {}
        for i in range(1, N_CLUSTERS + 1):
            count = int(np.sum(self.cluster_labels == i))
            stats[f'cluster_{i}'] = {
                'count'     : count,
                'percentage': round(count / len(self.cluster_labels) * 100, 1),
            }
        return stats