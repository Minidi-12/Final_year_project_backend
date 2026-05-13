import numpy as np
from config import *
class UrgencyScore:
    def calculate_urgency_score(self, row, gn_verified=False,
                                district_index=None):
        score = 0

        if row.get('monthly_income', 0) < LOW_INCOME_THRESHOLD:
            score += 12

        if (isinstance(row.get('chronic_illness', {}), dict) and
                row.get('chronic_illness', {}).get('exists', False) and
                not row.get('regular_Healthcare_Access', False)):
            score += 12

        if (not row.get('safewater_access', False) and
                not row.get('sanitation_access', False)):
            score += 12

        if row.get('disabilityInHousehold', False):
            score += 12

        income = row.get('monthly_income', 0)
        if LOW_INCOME_THRESHOLD <= income < MEDIUM_INCOME_THRESHOLD:
            score += 8

        if (not row.get('GovtAllowance', []) and
                not row.get('otherIncomeSources', [])):
            score += 8

        if row.get('childrenDroppedOut', False):
            score += 8

        if row.get('nearest_hospitalkm', 0) > HOSPITAL_DISTANCE_THRESHOLD:
            score += 8

        if row.get('housing_type', '') in ['temporary', 'no-fixed_shelter']:
            score += 8

        if row.get('selfrated_urgency', 3) >= 4:
            score += 4

        if (row.get('family_size', 0) > LARGE_FAMILY_SIZE_THRESHOLD and
                income < MEDIUM_INCOME_THRESHOLD):
            score += 4

        if not row.get('electricity_access', False):
            score += 4

        score = min(score, 100)

        if gn_verified:
            score = min(score * 1.2, 100)

        if district_index is not None:
            gn_division = row.get('gn_division', '')
            bonus       = district_index.get_bonus(gn_division)
            district    = district_index.get_district(gn_division)
            dpi         = district_index.get_dpi(district)
            cluster     = district_index.get_cluster(gn_division)

            if bonus > 0:
                print(
                    f"   District bonus +{bonus:.1f} pts | "
                    f"GN: {gn_division} → {district} | "
                    f"DPI: {dpi:.1f} | Cluster: {cluster}"
                )
            score = min(score + bonus, 100)

        return round(score, 2)

    def get_urgency_label(self, score):
        if score >= HIGH_URGENCY_MIN:
            return 'High'
        elif score >= MODERATE_URGENCY_MIN:
            return 'Moderate'
        return 'Stable'

    def score_all_beneficiaries(self, df, district_index=None):
        scores = []
        labels = []

        for idx, row in df.iterrows():
            score = self.calculate_urgency_score(
                row,
                gn_verified=row.get('gn_verified', False),
                district_index=district_index
            )
            label = self.get_urgency_label(score)
            scores.append(score)
            labels.append(label)

        high     = labels.count('High')
        moderate = labels.count('Moderate')
        stable   = labels.count('Stable')

        print(f"\n URGENCY SCORING")
        print(f"Total: {len(scores)} beneficiaries")
        print(f"High: {high} | Moderate: {moderate} | Stable: {stable}")
        if scores:
            print(f"Range: {min(scores):.2f} - {max(scores):.2f} | "
                  f"Average: {np.mean(scores):.2f}")
        if district_index is not None:
            print("District bonus applied: YES (DCS Mar 2026 poverty lines)")

        return scores, labels