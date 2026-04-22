import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from pymongo import MongoClient
from config import *

class DataProcessor:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client[MONGO_DB_NAME]
        self.collection = self.db[COLLECTION_NAME]
        self.scaler = StandardScaler()

    def load_data(self):
        data = list(self.collection.find())
        df = pd.DataFrame(data)
        return df

    def preprocess_data(self, df):
        # Handle missing values
        df.fillna(df.mean(), inplace=True)

        # Scale features
        features = df.drop(columns=['target'])
        target = df['target']
        
        scaled_features = self.scaler.fit_transform(features)
        
        return scaled_features, target

    def process(self):
        df = self.load_data()
        X, y = self.preprocess_data(df)
        return X, y
    
    def extract_features(self, df):
        features_list = []
        
        for idx, row in df.iterrows():
            # Get b_profile (it's a list, get first element)
            b_profile = row['b_profile']
            if isinstance(b_profile, list) and len(b_profile) > 0:
                profile = b_profile[0]
            else:
                profile = {}
            
            # Safely extract numeric fields
            def get_value(key, default=0):
                return profile.get(key, default)
            
            def get_bool_value(key, default=False):
                val = profile.get(key, default)
                return 1 if val else 0
            
            def get_list_len(key, default=0):
                val = profile.get(key, [])
                return len(val) if isinstance(val, list) else 0
            
            features_list.append({
                'monthly_income': get_value('monthly_income', 0),
                'family_size': get_value('family_size', 0),
                'children_under_18': get_value('children_under_18', 0),
                'nearest_hospitalkm': get_value('nearest_hospitalkm', 0),
                'distanceToSchoolKm': get_value('distanceToSchoolKm', 0),
                'selfrated_urgency': get_value('selfrated_urgency', 3),
                'disabilityInHousehold': get_bool_value('disabilityInHousehold', False),
                'safewater_access': get_bool_value('safewater_access', False),
                'electricity_access': get_bool_value('electricity_access', False),
                'sanitation_access': get_bool_value('sanitation_access', False),
                'regular_Healthcare_Access': get_bool_value('regular_Healthcare_Access', False),
                'childrenDroppedOut': get_bool_value('childrenDroppedOut', False),
                'GovtAllowance': get_list_len('GovtAllowance', 0),
                'otherIncomeSources': get_list_len('otherIncomeSources', 0),
                'chronic_illness': 1 if profile.get('chronic_illness', {}).get('exists', False) else 0,
            })
        
        features = pd.DataFrame(features_list)
        
        # One-hot encode employment_type and housing_type if they have variation
        if 'employment_type' in df.columns or any(
            isinstance(p, dict) and 'employment_type' in p 
            for profile_list in df['b_profile'] 
            for p in (profile_list if isinstance(profile_list, list) else [])
        ):
            emp_types = [
                (b_profile[0].get('employment_type', 'Unknown') if isinstance(b_profile, list) and len(b_profile) > 0 else 'Unknown')
                for b_profile in df['b_profile']
            ]
            emp_dummies = pd.get_dummies(emp_types, prefix='emp', dtype=int)
            features = pd.concat([features, emp_dummies], axis=1)
        
        if 'housing_type' in df.columns or any(
            isinstance(p, dict) and 'housing_type' in p 
            for profile_list in df['b_profile'] 
            for p in (profile_list if isinstance(profile_list, list) else [])
        ):
            housing_types = [
                (b_profile[0].get('housing_type', 'Unknown') if isinstance(b_profile, list) and len(b_profile) > 0 else 'Unknown')
                for b_profile in df['b_profile']
            ]
            housing_dummies = pd.get_dummies(housing_types, prefix='house', dtype=int)
            features = pd.concat([features, housing_dummies], axis=1)
        
        # Fill remaining NaNs
        features = features.fillna(features.median())
        
        # Remove zero-variance columns
        zero_var_cols = [col for col in features.columns if features[col].var() == 0]
        if zero_var_cols:
            print(f"WARNING: Removing {len(zero_var_cols)} zero-variance columns: {zero_var_cols}")
            features = features.drop(columns=zero_var_cols)
        
        if features.shape[1] == 0:
            print("ERROR: No features extracted! Falling back to default features for clustering.")
            # Create synthetic features based on available data
            features = pd.DataFrame({
                'urgency_score': pd.to_numeric(df.get('urgency_score', 2), errors='coerce').fillna(2),
                'clusterId': pd.to_numeric(df.get('clusterId', 1), errors='coerce').fillna(1),
            })
        
        print(f"Extracted {features.shape[1]} features from nested data")
        print(f"Feature columns: {features.columns.tolist()}")

        self.feature_columns = features.columns.tolist()
        return features
    
    def prepare_data(self):
        df = self.load_data()
        collection = self.collection
        
        if len(df) == 0:
            raise ValueError("No data found in MongoDB. Please add beneficiary requests first.")
        
        features = self.extract_features(df)
        
        print(f"\n=== FEATURE EXTRACTION ===")
        print(f"Features shape: {features.shape}")
        print(f"Features sample:\n{features.head()}")
        print(f"Features dtypes:\n{features.dtypes}")
        print(f"Features with zero variance: {[col for col in features.columns if features[col].var() == 0]}")
        
        # Check for missing values
        missing_count = features.isnull().sum().sum()
        if missing_count > 0:
            print(f"WARNING: Found {missing_count} missing values after extraction")
            features = features.fillna(features.median())
        
        scaled_features = self.scaler.fit_transform(features)
        
        print(f"Scaled data shape: {scaled_features.shape}")
        print(f"Scaled data min/max: {scaled_features.min():.6f} / {scaled_features.max():.6f}")
        print(f"Scaled data variance: {np.var(scaled_features, axis=0)}")
        
        return df, features, scaled_features, collection