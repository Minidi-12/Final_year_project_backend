import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class VolunteerProjectMatcher:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_URI"))
        self.db = self.client[os.getenv("MONGO_DB_NAME")]
        self.projects_collection = self.db['projects']
        self.volunteers_collection = self.db['volunteers']
        self.vectorizer = TfidfVectorizer(
            max_features=100,
            ngram_range=(1, 2),
            stop_words='english'
        )
        
    def load_projects(self):
        projects = list(self.projects_collection.find({'status': 'active'}))
        if not projects:
            print("WARNING: No active projects found")
            return pd.DataFrame()
        
        df = pd.DataFrame(projects)
        print(f" Loaded {len(df)} active projects")
        return df
    
    def prepare_project_skills_text(self, project):
        # Handle requiredSkills field
        skills = project.get('requiredSkills', [])
        if not isinstance(skills, list):
            skills = []
        
        description = project.get('description', '')
        category = project.get('category', '').replace('_', ' ')
        title = project.get('title', '')
        
        # Combine all text for better matching
        text = ' '.join(skills) + ' ' + category + ' ' + title + ' ' + description
        return text.lower().strip()
    
    def prepare_volunteer_skills_text(self, skills):
        if not isinstance(skills, list):
            return ''
        return ' '.join(skills).lower().strip()
    
    def compute_skill_embeddings(self, projects_df):
        """Generate TF-IDF embeddings for all projects"""
        print("\n GENERATING SKILL EMBEDDINGS ")
        
        if len(projects_df) == 0:
            print("No projects to process")
            return np.array([])
        
        # Prepare texts
        project_texts = []
        for idx, row in projects_df.iterrows():
            text = self.prepare_project_skills_text(row)
            project_texts.append(text)
            
            # Store skillsText in MongoDB
            self.projects_collection.update_one(
                {'_id': row['_id']},
                {'$set': {'skillsText': text}}
            )
        
        # Fit vectorizer on all project texts
        if project_texts:
            self.vectorizer.fit(project_texts)
            embeddings = self.vectorizer.transform(project_texts).toarray()
            
            # Store embeddings in MongoDB
            for idx, row in projects_df.iterrows():
                self.projects_collection.update_one(
                    {'_id': row['_id']},
                    {'$set': {'skillsEmbedding': embeddings[idx].tolist()}}
                )
            
            print(f" Generated embeddings for {len(project_texts)} projects")
            print(f"  Vocabulary size: {len(self.vectorizer.vocabulary_)}")
            return embeddings
        
        return np.array([])
    
    def find_matching_projects(self, volunteer_skills, top_n=5):
        """
        Find top N matching projects for given volunteer skills
        Returns: List of matching projects with scores
        """
        if not volunteer_skills or len(volunteer_skills) == 0:
            print("No skills provided for matching")
            return []
        
        # Load projects with embeddings
        projects = list(self.projects_collection.find({
            'status': 'active',
            'skillsEmbedding': {'$exists': True, '$ne': []}
        }))
        
        if not projects:
            print("No projects with embeddings found")
            return []
        
        # Prepare volunteer skills text
        volunteer_text = self.prepare_volunteer_skills_text(volunteer_skills)
        
        if not volunteer_text:
            print("Volunteer skills text is empty")
            return []
        
        # Transform volunteer skills using same vectorizer
        try:
            volunteer_embedding = self.vectorizer.transform([volunteer_text]).toarray()
        except Exception as e:
            print(f"Error transforming volunteer skills: {e}")
            return []
        
        # Get project embeddings
        project_embeddings = np.array([p['skillsEmbedding'] for p in projects])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(volunteer_embedding, project_embeddings)[0]
        
        # Get top N matches
        top_indices = np.argsort(similarities)[::-1][:top_n]
        
        matches = []
        for idx in top_indices:
            if similarities[idx] > 0:  # Only include positive matches
                project = projects[idx]
                
                # Find which skills matched
                matched_skills = []
                project_skills = project.get('requiredSkills', [])
                
                for skill in volunteer_skills:
                    for proj_skill in project_skills:
                        if (skill.lower() in proj_skill.lower() or 
                            proj_skill.lower() in skill.lower()):
                            if proj_skill not in matched_skills:
                                matched_skills.append(proj_skill)
                
                # Convert ObjectId to string
                project_id = str(project['_id'])
                
                matches.append({
                    'project_id': project_id,
                    'title': project['title'],
                    'category': project.get('category', ''),
                    'match_score': round(float(similarities[idx]) * 100, 2),
                    'matched_skills': matched_skills,
                    'required_skills': project_skills,
                    'location': project.get('location', ''),
                    'volunteers_needed': project.get('volunteers_needed', 0)
                })
        
        return matches
    
    def update_volunteer_recommendations(self, volunteer_id, matches):
        """Store recommended projects in volunteer document"""
        if not matches:
            return
        
        recommendations = [{
            'project_id': match['project_id'],
            'matchScore': match['match_score'],
            'matchedSkills': match['matched_skills']
        } for match in matches]
        
        # Update volunteer document
        result = self.volunteers_collection.update_one(
            {'_id': volunteer_id},
            {'$set': {
                'recommendedProjects': recommendations,
                'matchScore': matches[0]['match_score'] if matches else 0
            }}
        )
        
        return result.modified_count > 0
    
    def batch_compute_all_matches(self):
        """Compute matches for all volunteers"""
        print("\n BATCH MATCHING ALL VOLUNTEERS ")
        
        # First, compute embeddings for all projects
        projects_df = self.load_projects()
        if len(projects_df) == 0:
            print("No projects to match against")
            return
        
        self.compute_skill_embeddings(projects_df)
        
        # Get all volunteers (no status filter since your schema doesn't have it)
        volunteers = list(self.volunteers_collection.find({}))
        
        if not volunteers:
            print("No volunteers to match")
            return
        
        print(f"Found {len(volunteers)} volunteers")
        
        matched_count = 0
        for volunteer in volunteers:
            skills = volunteer.get('skills', [])
            if skills and len(skills) > 0:
                matches = self.find_matching_projects(skills, top_n=5)
                if matches:
                    updated = self.update_volunteer_recommendations(volunteer['_id'], matches)
                    if updated:
                        matched_count += 1
                        print(f"  ✓ {volunteer['name']}: {matches[0]['match_score']:.1f}% → {matches[0]['title']}")
        
        print(f"\n Successfully matched {matched_count}/{len(volunteers)} volunteers")
    
    def close(self):
        self.client.close()

def main():
    print(" VOLUNTEER-PROJECT MATCHING SYSTEM ")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    matcher = VolunteerProjectMatcher()
    
    try:
        matcher.batch_compute_all_matches()
        print("\n Matching complete")
        
    except Exception as e:
        print(f"\n ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        matcher.close()

if __name__ == "__main__":
    main()