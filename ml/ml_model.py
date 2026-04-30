import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os
from config import *

class MLUrgencyModel:
    def __init__(self):
        self.model = None
        self.feature_names = None
        self.is_trained = False
        
    def generate_synthetic_data(self, real_profiles, n_synthetic=100):
        """
        Generate synthetic beneficiary data based on real data distributions
        """
        print(f"\n=== GENERATING SYNTHETIC DATA ===")
        print(f"Real samples: {len(real_profiles)}")
        
        synthetic_data = []
        
        # Analyze real data distributions
        income_mean = real_profiles['monthly_income'].mean()
        income_std = real_profiles['monthly_income'].std()
        family_mean = real_profiles['family_size'].mean()
        
        np.random.seed(RANDOM_STATE)
        
        for i in range(n_synthetic):
            # Generate realistic values based on distributions
            monthly_income = max(0, np.random.normal(income_mean, income_std))
            family_size = np.random.randint(2, 9)
            
            # Logical constraints
            chronic_illness_prob = 0.3 if monthly_income < LOW_INCOME_THRESHOLD else 0.15
            chronic_illness_exists = np.random.choice([True, False], p=[chronic_illness_prob, 1-chronic_illness_prob])
            
            # Low income → likely has government support
            govt_allowance_prob = 0.7 if monthly_income < MEDIUM_INCOME_THRESHOLD else 0.3
            has_govt_allowance = np.random.choice([True, False], p=[govt_allowance_prob, 1-govt_allowance_prob])
            
            synthetic_record = {
                'monthly_income': monthly_income,
                'family_size': family_size,
                'children_under_18': np.random.randint(0, family_size),
                'nearest_hospitalkm': np.random.uniform(1, 25),
                'distanceToSchoolKm': np.random.uniform(0.5, 15),
                'selfrated_urgency': np.random.randint(1, 6),
                'disabilityInHousehold': np.random.choice([True, False], p=[0.2, 0.8]),
                'safewater_access': np.random.choice([True, False], p=[0.6, 0.4]),
                'electricity_access': np.random.choice([True, False], p=[0.75, 0.25]),
                'sanitation_access': np.random.choice([True, False], p=[0.65, 0.35]),
                'regular_Healthcare_Access': np.random.choice([True, False], p=[0.5, 0.5]),
                'childrenDroppedOut': np.random.choice([True, False], p=[0.25, 0.75]),
                'chronic_illness': {'exists': chronic_illness_exists},
                'GovtAllowance': ['Samurdhi'] if has_govt_allowance else [],
                'otherIncomeSources': [],
                'housing_type': np.random.choice(['owned', 'rented', 'temporary', 'no-fixed_shelter'], 
                                                  p=[0.5, 0.3, 0.15, 0.05]),
                'gn_verified': False
            }
            
            synthetic_data.append(synthetic_record)
        
        synthetic_df = pd.DataFrame(synthetic_data)
        print(f"Generated {len(synthetic_df)} synthetic samples")
        
        return synthetic_df
    
    def prepare_ml_features(self, profiles_df):
        """
        Extract features for ML model
        """
        features = pd.DataFrame({
            'monthly_income': profiles_df['monthly_income'],
            'family_size': profiles_df['family_size'],
            'children_under_18': profiles_df.get('children_under_18', 0),
            'nearest_hospitalkm': profiles_df['nearest_hospitalkm'],
            'distanceToSchoolKm': profiles_df.get('distanceToSchoolKm', 0),
            'selfrated_urgency': profiles_df['selfrated_urgency'],
            'disabilityInHousehold': profiles_df['disabilityInHousehold'].astype(int),
            'safewater_access': profiles_df['safewater_access'].astype(int),
            'electricity_access': profiles_df['electricity_access'].astype(int),
            'sanitation_access': profiles_df['sanitation_access'].astype(int),
            'regular_Healthcare_Access': profiles_df['regular_Healthcare_Access'].astype(int),
            'childrenDroppedOut': profiles_df['childrenDroppedOut'].astype(int),
            'chronic_illness_exists': profiles_df['chronic_illness'].apply(
                lambda x: int(x.get('exists', False)) if isinstance(x, dict) else 0
            ),
            'has_govt_allowance': profiles_df['GovtAllowance'].apply(
                lambda x: int(len(x) > 0) if isinstance(x, list) else 0
            ),
            'housing_temporary': profiles_df['housing_type'].apply(
                lambda x: int(x in ['temporary', 'no-fixed_shelter'])
            )
        })
        
        self.feature_names = features.columns.tolist()
        return features
    
    def train(self, real_profiles, urgency_scorer, use_synthetic=True):
        """
        Train ML model on real + synthetic data
        """
        print(f"\n=== TRAINING ML MODEL ===")
        
        # Prepare real data
        real_features = self.prepare_ml_features(real_profiles)
        
        # Calculate urgency labels using rule-based system
        real_labels = []
        for idx, row in real_profiles.iterrows():
            score = urgency_scorer.calculate_urgency_score(row)
            label = urgency_scorer.get_urgency_label(score)
            real_labels.append(label)
        
        # Combine with synthetic data if enabled
        if use_synthetic and len(real_profiles) < 50:
            synthetic_profiles = self.generate_synthetic_data(real_profiles, n_synthetic=100)
            synthetic_features = self.prepare_ml_features(synthetic_profiles)
            
            # Label synthetic data using rule-based system
            synthetic_labels = []
            for idx, row in synthetic_profiles.iterrows():
                score = urgency_scorer.calculate_urgency_score(row)
                label = urgency_scorer.get_urgency_label(score)
                synthetic_labels.append(label)
            
            # Combine
            X = pd.concat([real_features, synthetic_features], ignore_index=True)
            y = real_labels + synthetic_labels
            
            print(f"Training data: {len(real_labels)} real + {len(synthetic_labels)} synthetic = {len(y)} total")
        else:
            X = real_features
            y = real_labels
            print(f"Training data: {len(y)} samples (real only)")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
        )
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            class_weight='balanced'
        )
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"\nModel Performance:")
        print(f"  Training Accuracy: {train_score:.2%}")
        print(f"  Testing Accuracy: {test_score:.2%}")
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5)
        print(f"  Cross-Val Accuracy: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")
        
        # Detailed metrics
        y_pred = self.model.predict(X_test)
        print(f"\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\nTop 10 Most Important Features:")
        for idx, row in importance_df.head(10).iterrows():
            print(f"  {row['feature']}: {row['importance']:.4f}")
        
        # Save model
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.model, 'models/urgency_classifier.pkl')
        print(f"\n✓ Model saved to models/urgency_classifier.pkl")
        
        return importance_df
    
    def predict(self, profile):
        """
        Predict urgency label for a single beneficiary
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet! Call train() first.")
        
        features = self.prepare_ml_features(pd.DataFrame([profile]))
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        # Map to class names
        classes = self.model.classes_
        prob_dict = {cls: prob for cls, prob in zip(classes, probabilities)}
        
        return prediction, prob_dict
    
    def predict_all(self, profiles_df):
        """
        Predict urgency labels for all beneficiaries
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet! Call train() first.")
        
        features = self.prepare_ml_features(profiles_df)
        predictions = self.model.predict(features)
        probabilities = self.model.predict_proba(features)
        
        return predictions, probabilities
    
    def load_model(self, path='models/urgency_classifier.pkl'):
        """
        Load a previously trained model
        """
        if os.path.exists(path):
            self.model = joblib.load(path)
            self.is_trained = True
            print(f"✓ Model loaded from {path}")
            return True
        return False