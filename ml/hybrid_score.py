import numpy as np
from urgency_score import UrgencyScore
from ml_model import MLUrgencyModel

class HybridUrgencyScorer:
    """
    Combines rule-based scoring with ML predictions
    Rule-based provides baseline, ML adds learned adjustments
    """
    def __init__(self, rule_weight=0.6, ml_weight=0.4):
        self.rule_scorer = UrgencyScore()
        self.ml_model = MLUrgencyModel()
        self.rule_weight = rule_weight
        self.ml_weight = ml_weight
        
        # Mapping labels to numerical scores
        self.label_to_score = {
            'High': 80,
            'Moderate': 50,
            'Stable': 20
        }
    
    def score_beneficiary(self, profile, use_ml=True):
        """
        Calculate hybrid urgency score
        """
        # Get rule-based score
        rule_score = self.rule_scorer.calculate_urgency_score(
            profile, 
            profile.get('gn_verified', False)
        )
        
        if not use_ml or not self.ml_model.is_trained:
            # ML not available, use rule-based only
            label = self.rule_scorer.get_urgency_label(rule_score)
            return rule_score, label, {'method': 'rule_based_only'}
        
        # Get ML prediction
        try:
            ml_label, ml_probabilities = self.ml_model.predict(profile)
            ml_score = self.label_to_score[ml_label]
            
            # Combine scores (weighted average)
            hybrid_score = (self.rule_weight * rule_score) + (self.ml_weight * ml_score)
            hybrid_score = round(min(hybrid_score, 100), 2)
            
            # Determine final label
            hybrid_label = self.rule_scorer.get_urgency_label(hybrid_score)
            
            details = {
                'method': 'hybrid',
                'rule_score': rule_score,
                'ml_score': ml_score,
                'ml_label': ml_label,
                'ml_confidence': ml_probabilities,
                'weights': {'rule': self.rule_weight, 'ml': self.ml_weight}
            }
            
            return hybrid_score, hybrid_label, details
            
        except Exception as e:
            print(f"ML prediction failed: {e}. Using rule-based only.")
            label = self.rule_scorer.get_urgency_label(rule_score)
            return rule_score, label, {'method': 'rule_based_fallback'}
    
    def score_all_beneficiaries(self, profiles_df, use_ml=True):
        """
        Score all beneficiaries using hybrid approach
        """
        scores = []
        labels = []
        details_list = []
        
        for idx, row in profiles_df.iterrows():
            score, label, details = self.score_beneficiary(row, use_ml)
            scores.append(score)
            labels.append(label)
            details_list.append(details)
        
        # Print statistics
        high = labels.count('High')
        moderate = labels.count('Moderate')
        stable = labels.count('Stable')
        
        method = details_list[0]['method'] if details_list else 'unknown'
        
        print(f"\n=== HYBRID URGENCY SCORING ({method.upper()}) ===")
        print(f"Total: {len(scores)} beneficiaries")
        print(f"High: {high} | Moderate: {moderate} | Stable: {stable}")
        print(f"Range: {min(scores):.2f} - {max(scores):.2f} | Average: {np.mean(scores):.2f}")
        
        if method == 'hybrid':
            print(f"Scoring Method: {self.rule_weight*100:.0f}% Rule-Based + {self.ml_weight*100:.0f}% ML")
        
        return scores, labels, details_list