CREATE TABLE IF NOT EXISTS resume_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    preview_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume Drafts Table (for saving work in progress)
CREATE TABLE IF NOT EXISTS resume_drafts (
    id SERIAL PRIMARY KEY,
    intern_id INTEGER REFERENCES intern_profiles(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES resume_templates(id),
    resume_data JSONB NOT NULL,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(intern_id, template_id)
);

-- Resume Downloads History Table
CREATE TABLE IF NOT EXISTS resume_downloads (
    id SERIAL PRIMARY KEY,
    intern_id INTEGER REFERENCES intern_profiles(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_downloads_intern 
ON resume_downloads(intern_id, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_resume_drafts_intern 
ON resume_drafts(intern_id);

-- Insert default templates
INSERT INTO resume_templates (name, description, category) VALUES
('Modern Professional', 'Clean and modern design with bold headers', 'professional'),
('Classic Traditional', 'Traditional format suitable for conservative industries', 'classic'),
('Creative Designer', 'Colorful and creative layout for designers', 'creative'),
('Minimalist Clean', 'Simple and elegant minimalist design', 'minimalist'),
('Elegant Executive', 'Sophisticated design for senior positions', 'elegant'),
('Technical Engineer', 'Technical-focused layout with skill highlights', 'technical'),
('Executive Leader', 'Premium design for C-level executives', 'executive'),
('Academic Scholar', 'Academic-focused with publications and research', 'academic'),
('Colorful Vibrant', 'Bold colors and modern typography', 'colorful'),
('Classic Simple', 'Simple two-column layout', 'classic')
ON CONFLICT (name) DO NOTHING;