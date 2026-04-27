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
    
    def extract_features(self, df):
        features_list = []
        
        for idx, row in df.iterrows():
            b_profile = row.get('b_profile', [])
            if isinstance(b_profile, list) and len(b_profile) > 0:
                profile = b_profile[0]
            else:
                profile = {}
            
            # numeric and boolean fields
            features_list.append({
                'monthly_income': profile.get('monthly_income', 0),
                'family_size': profile.get('family_size', 0),
                'children_under_18': profile.get('children_under_18', 0),
                'nearest_hospitalkm': profile.get('nearest_hospitalkm', 0),
                'distanceToSchoolKm': profile.get('distanceToSchoolKm', 0),
                'selfrated_urgency': profile.get('selfrated_urgency', 3),
                'disabilityInHousehold': int(profile.get('disabilityInHousehold', False)),
                'safewater_access': int(profile.get('safewater_access', False)),
                'electricity_access': int(profile.get('electricity_access', False)),
                'sanitation_access': int(profile.get('sanitation_access', False)),
                'regular_Healthcare_Access': int(profile.get('regular_Healthcare_Access', False)),
                'childrenDroppedOut': int(profile.get('childrenDroppedOut', False)),
                'GovtAllowance_count': len(profile.get('GovtAllowance', [])),
                'otherIncomeSources_count': len(profile.get('otherIncomeSources', [])),
                'chronic_illness_exists': int(profile.get('chronic_illness', {}).get('exists', False)),
            })
        
        features = pd.DataFrame(features_list)
        
        features = features.fillna(features.mean())
        
        print(f"Extracted {features.shape[1]} features from {features.shape[0]} beneficiaries")
        print(f"Feature columns: {features.columns.tolist()}")

        return features
    
    def extract_beneficiary_profiles(self, df):
        profiles_list = []
        
        for idx, row in df.iterrows():
            b_profile = row.get('b_profile', [])
            profile = b_profile[0] if isinstance(b_profile, list) and len(b_profile) > 0 else {}
            
            profiles_list.append({
                'monthly_income': profile.get('monthly_income', 0),
                'chronic_illness': profile.get('chronic_illness', {}),
                'regular_Healthcare_Access': profile.get('regular_Healthcare_Access', False),
                'safewater_access': profile.get('safewater_access', False),
                'sanitation_access': profile.get('sanitation_access', False),
                'disabilityInHousehold': profile.get('disabilityInHousehold', False),
                'GovtAllowance': profile.get('GovtAllowance', {}),
                'otherIncomeSources': profile.get('otherIncomeSources', {}),
                'childrenDroppedOut': profile.get('childrenDroppedOut', False),
                'nearest_hospitalkm': profile.get('nearest_hospitalkm', 0),
                'housing_type': profile.get('housing_type', ''),
                'selfrated_urgency': profile.get('selfrated_urgency', 3),
                'family_size': profile.get('family_size', 0),
                'electricity_access': profile.get('electricity_access', False),
                'gn_verified': row.get('gn_verified', False),
            })
        
        profiles_df = pd.DataFrame(profiles_list)
        print(f"Extracted profiles for {len(profiles_df)} beneficiaries")
        return profiles_df
    
    def prepare_data(self):
        df = self.load_data()
        
        if len(df) == 0:
            raise ValueError("No data found in MongoDB. Please add beneficiary requests first.")
        
        beneficiary_profiles = self.extract_beneficiary_profiles(df)
        
        features = self.extract_features(df)
        
        # Scale features for clustering
        scaled_features = self.scaler.fit_transform(features)
        
        print(f"\n=== DATA PREPARATION COMPLETE ===")
        print(f"Total beneficiaries: {len(df)}")
        print(f"Features extracted: {features.shape[1]}")
        print(f"Scaled data shape: {scaled_features.shape}")
        print(f"Scaled data range: [{scaled_features.min():.4f}, {scaled_features.max():.4f}]")
        
        return df, features, scaled_features, self.collection, beneficiary_profiles