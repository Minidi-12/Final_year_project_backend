import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from config import *
class DataProcessor:
    def __init__(self):
        self.scaler = StandardScaler()
        
    def process(self, docs: list) -> pd.DataFrame:
        if not docs:
            return pd.DataFrame()

        profiles_list = []
        for doc in docs:
            b_profile = doc.get('b_profile', [])
            profile   = b_profile[0] if isinstance(b_profile, list) and b_profile else {}
            govt = profile.get('GovtAllowance', [])
            if not isinstance(govt, list):
                govt = list(govt) if govt else []
            other_inc = profile.get('otherIncomeSources', [])

            if not isinstance(other_inc, list):
                other_inc = [other_inc] if other_inc else []

            chronic = profile.get('chronic_illness', {})
            if not isinstance(chronic, dict):
                chronic = {}

            try:
                urgency = int(profile.get('selfrated_urgency', 3))
            except (ValueError, TypeError):
                urgency = 3

            profiles_list.append({
                'gn_division'           : profile.get('gn_division', ''),
                'monthly_income'        : float(profile.get('monthly_income', 0) or 0),
                'GovtAllowance'         : govt,
                'otherIncomeSources'    : other_inc,
                'family_size'           : int(profile.get('family_size', 0) or 0),
                'children_under_18'     : int(profile.get('children_under_18', 0) or 0),
                'chronic_illness'       : chronic,
                'chronic_illness_exists': int(chronic.get('exists', False)),
                'regular_Healthcare_Access': bool(profile.get('regular_Healthcare_Access', False)),
                'disabilityInHousehold' : bool(profile.get('disabilityInHousehold', False)),
                'nearest_hospitalkm'    : float(profile.get('nearest_hospitalkm', 0) or 0),
                'childrenDroppedOut'    : bool(profile.get('childrenDroppedOut', False)),
                'distanceToSchoolKm'    : float(profile.get('distanceToSchoolKm', 0) or 0),
                'housing_type'          : profile.get('housing_type', ''),
                'housing_temporary'     : int(profile.get('housing_type', '') in
                                             ['temporary', 'no-fixed_shelter']),
                'safewater_access'      : bool(profile.get('safewater_access', False)),
                'sanitation_access'     : bool(profile.get('sanitation_access', False)),
                'electricity_access'    : bool(profile.get('electricity_access', False)),
                'selfrated_urgency'     : urgency,
                'gn_verified'           : bool(doc.get('gn_verified', False)),
                'status'                : doc.get('status', 'pending'),
            })

        df = pd.DataFrame(profiles_list)
        numeric_cols = ['monthly_income', 'family_size', 'children_under_18',
                        'nearest_hospitalkm', 'distanceToSchoolKm', 'selfrated_urgency']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        print(f"  Processed {len(df)} profiles — {len(df.columns)} fields each")
        return df

    def extract_scaled_features(self, profiles_df: pd.DataFrame):
        features = pd.DataFrame({
            'monthly_income'       : profiles_df['monthly_income'],
            'family_size'          : profiles_df['family_size'],
            'children_under_18'    : profiles_df['children_under_18'],
            'nearest_hospitalkm'   : profiles_df['nearest_hospitalkm'],
            'distanceToSchoolKm'   : profiles_df['distanceToSchoolKm'],
            'selfrated_urgency'    : profiles_df['selfrated_urgency'],
            'disabilityInHousehold': profiles_df['disabilityInHousehold'].astype(int),
            'safewater_access'     : profiles_df['safewater_access'].astype(int),
            'electricity_access'   : profiles_df['electricity_access'].astype(int),
            'sanitation_access'    : profiles_df['sanitation_access'].astype(int),
            'chronic_illness_exists': profiles_df['chronic_illness_exists'],
            'housing_temporary'    : profiles_df['housing_temporary'],
        })

        features = features.fillna(0)
        scaled   = self.scaler.fit_transform(features)

        print(f"  Feature matrix: {features.shape[0]} samples × "
              f"{features.shape[1]} features")
        return features, scaled