import numpy as np
from config import *

class UrgencyScore:
    def calculate_urgency_score(self, row, gn_verified=False):
        score = 0
        
        # High urgency triggers (15 points each)
        if row.get('monthly_income', 0) < LOW_INCOME_THRESHOLD:
            score += 15

        chronic_illness = row.get('chronic_illness', {})
        if isinstance(chronic_illness, dict) and chronic_illness.get('exists', False):
            if not row.get('regular_Healthcare_Access', False):
                score += 15
        
        if not row.get('safewater_access', False) and not row.get('sanitation_access', False):
            score += 15
        
        if row.get('disabilityInHousehold', False):
            score += 15
        
        # Medium urgency triggers (10 points each)
        income = row.get('monthly_income', 0)
        if LOW_INCOME_THRESHOLD <= income < MEDIUM_INCOME_THRESHOLD:
            score += 10
        
        GovtAllowance = row.get('GovtAllowance', {})
        otherIncomeSources = row.get('otherIncomeSources', {})
        if (not isinstance(GovtAllowance, dict) or not GovtAllowance.get('receiving', False)) and \
           (not isinstance(otherIncomeSources, dict) or not otherIncomeSources.get('receiving', False)):
            score += 10
        
        if row.get('childrenDroppedOut', False):
            score += 10
        
        if row.get('nearest_hospitalkm', 0) > HOSPITAL_DISTANCE_THRESHOLD:
            score += 10
        
        housing_type = row.get('housing_type','')
        if housing_type in ['temporary', 'no-fixed_shelter']:
            score +=10
        
        # LOW urgency triggers (5 points each)
        if row.get('selfrated_urgency', 3) >= 4:
            score += 5
        
        if row.get('family_size', 0) > LARGE_FAMILY_SIZE_THRESHOLD and income < MEDIUM_INCOME_THRESHOLD:
            score += 5
        
        if not row.get('electricity_access', False):
            score += 5
        
        score = min(score, 100)
        
        if gn_verified:
            score = min(score * 1.2, 100)
        
        return round(score,2)
    
    def get_urgency_label(self, score):
        if score >= HIGH_URGENCY_MIN:
            return 'High'
        elif score >= MODERATE_URGENCY_MIN:
            return 'Moderate'
        else:
            return 'Stable'
    
    def score_all_beneficiaries(self, df):
        scores = []
        labels = []
        
        for idx, row in df.iterrows():
            gn_verified = row.get('gn_verified', False)
            score = self.calculate_urgency_score(row, gn_verified)
            label = self.get_urgency_label(score)
            
            scores.append(score)
            labels.append(label)
        
        print(f"Scored {len(scores)} beneficiaries")
        
        high_count = labels.count('High')
        moderate_count = labels.count('Moderate')
        stable_count = labels.count('Stable')
        
        print(f"  High urgency: {high_count}")
        print(f"  Moderate urgency: {moderate_count}")
        print(f"  Stable: {stable_count}")
        
        return scores, labels