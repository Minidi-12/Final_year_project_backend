import numpy as np

class UrgencyPredictor:
    def predict_3_months(self, row, current_score):
        status = row.get('status', 'pending')
        gn_verified = row.get('gn_verified', False)
        
        predictions = []
        
        for month in range(1, 4):
            if status == 'resolved':
                # Resolved cases go to 0
                predicted_score = 0
            elif current_score > 70 and status == 'pending':
                # High urgency cases worsen without intervention
                increase = np.random.randint(5, 8)
                predicted_score = min(current_score + (increase * month), 100)
            elif 50 <= current_score <= 70 and not gn_verified:
                # Medium urgency with no verification
                increase = np.random.randint(3, 6)
                predicted_score = min(current_score + (increase * month), 100)
            elif current_score < 50:
                # Low urgency cases - stable or slight decrease
                GovtAllowance = row.get('GovtAllowance', {})
                has_support = isinstance(GovtAllowance, dict) and GovtAllowance.get('receiving', False)
                
                if has_support:
                    predicted_score = max(current_score - 2, 0)
                else:
                    predicted_score = current_score
            else:
                predicted_score = current_score
            
            predictions.append({
                'month': month,
                'score': round(predicted_score, 2)
            })
        
        return predictions

    def predict_all(self, df, urgency_scores):
        all_predictions = []
        
        for idx, row in df.iterrows():
            current_score = urgency_scores[idx]
            predictions = self.predict_3_months(row, current_score)
            all_predictions.append(predictions)
        
        print(f"Generated predictions for {len(all_predictions)} beneficiaries")
        
        return all_predictions