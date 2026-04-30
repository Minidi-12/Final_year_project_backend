import numpy as np
from config import *

class UrgencyScore: 
    def calculate_urgency_score(self, row, gn_verified=False):
        score = 0
        
        if row.get('monthly_income', 0) < LOW_INCOME_THRESHOLD:
            score += 15
        
        if (isinstance(row.get('chronic_illness', {}), dict) and 
            row.get('chronic_illness', {}).get('exists', False) and
            not row.get('regular_Healthcare_Access', False)):
            score += 15
        
        if not row.get('safewater_access', False) and not row.get('sanitation_access', False):
            score += 15
        
        if row.get('disabilityInHousehold', False):
            score += 15
        
        income = row.get('monthly_income', 0)
        if LOW_INCOME_THRESHOLD <= income < MEDIUM_INCOME_THRESHOLD:
            score += 10
        
        if not row.get('GovtAllowance', []) and not row.get('otherIncomeSources', []):
            score += 10
        
        if row.get('childrenDroppedOut', False):
            score += 10
        
        if row.get('nearest_hospitalkm', 0) > HOSPITAL_DISTANCE_THRESHOLD:
            score += 10
        
        if row.get('housing_type', '') in ['temporary', 'no-fixed_shelter']:
            score += 10
        
        if row.get('selfrated_urgency', 3) >= 4:
            score += 5
        
        if row.get('family_size', 0) > LARGE_FAMILY_SIZE_THRESHOLD and income < MEDIUM_INCOME_THRESHOLD:
            score += 5
        
        if not row.get('electricity_access', False):
            score += 5
        
        # Cap at 100 and apply GN verification bonus
        score = min(score, 100)
        if gn_verified:
            score = min(score * 1.2, 100)
        return round(score, 2)
    
    def get_urgency_label(self, score):
        if score >= HIGH_URGENCY_MIN:
            return 'High'
        elif score >= MODERATE_URGENCY_MIN:
            return 'Moderate'
        return 'Stable'
    
    def score_all_beneficiaries(self, df):
        scores = []
        labels = []
        
        for idx, row in df.iterrows():
            score = self.calculate_urgency_score(row, row.get('gn_verified', False))
            label = self.get_urgency_label(score)
            scores.append(score)
            labels.append(label)
        
        high = labels.count('High')
        moderate = labels.count('Moderate')
        stable = labels.count('Stable')
        
        print(f"\n=== URGENCY SCORING ===")
        print(f"Total: {len(scores)} beneficiaries")
        print(f"High: {high} | Moderate: {moderate} | Stable: {stable}")
        print(f"Range: {min(scores):.2f} - {max(scores):.2f} | Average: {np.mean(scores):.2f}")
        
        return scores, labels