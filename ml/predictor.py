from sklearn.linear_model import LinearRegression
import numpy as np
class UrgencyPredictor:
    def predict_3_months(self, row, current_score):

        monthly_income    = float(row.get('monthly_income', 0))
        has_support       = len(row.get('GovtAllowance', [])) > 0
        is_chronic        = row.get('chronic_illness_exists', 0)
        gn_verified       = int(row.get('gn_verified', False))
        status            = row.get('status', 'pending')
        income_pressure = max(0, (25000 - monthly_income) / 25000 * 10)
        support_relief  = -3 if has_support else 0
        chronic_drift   = 2 if is_chronic else 0
        verified_relief = -2 if gn_verified else 0

        monthly_drift = income_pressure + support_relief + chronic_drift + verified_relief

        past_scores = [
            max(0, current_score - monthly_drift * 3),
            max(0, current_score - monthly_drift * 2),
            max(0, current_score - monthly_drift),
            current_score
        ]

        X = np.array([[-3], [-2], [-1], [0]])
        y = np.array(past_scores)

        model = LinearRegression()
        model.fit(X, y)

        X_future = np.array([[1], [2], [3]])
        predicted = model.predict(X_future)

        predictions = []
        for month, score in enumerate(predicted, 1):
            if status == 'resolved':
                score = 0
            score = round(float(np.clip(score, 0, 100)), 2)
            predictions.append({'month': month, 'score': score})

        return predictions
    
    def predict_all(self, profiles_df, urgency_scores):
        all_predictions = []
        
        for pos, (_, row) in enumerate(profiles_df.iterrows()):
            if pos < len(urgency_scores):
                current_score = urgency_scores[pos]
                predictions = self.predict_3_months(row, current_score)
                all_predictions.append(predictions)
            else:
                all_predictions.append([])
        
        print(f"  Generated predictions for {len(all_predictions)} beneficiaries")
        return all_predictions