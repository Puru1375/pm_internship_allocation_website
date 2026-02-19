const fs = require('fs');

const SKILL_KEYWORDS = [
  // Programming Languages (with variations)
  { name: "Python", patterns: ["python"] },
  { name: "Java", patterns: ["\\bjava\\b", "java script"] }, // Avoid "JavaScript"
  { name: "JavaScript", patterns: ["javascript", "js\\b", "\\bjs\\b"] },
  { name: "TypeScript", patterns: ["typescript", "ts\\b", "\\bts\\b"] },
  { name: "C++", patterns: ["c\\+\\+", "cpp\\b"] },
  { name: "C#", patterns: ["c#", "csharp"] },
  { name: "Ruby", patterns: ["\\bruby\\b"] },
  { name: "PHP", patterns: ["\\bphp\\b"] },
  { name: "Go", patterns: ["\\bgo\\b", "golang"] },
  { name: "Rust", patterns: ["\\brust\\b"] },
  { name: "Kotlin", patterns: ["kotlin"] },
  { name: "Swift", patterns: ["swift"] },
  { name: "Scala", patterns: ["scala"] },
  { name: "R", patterns: ["\\br\\b", "r programming"] }, // More specific R matching
  
  // Frontend
  { name: "React", patterns: ["react", "reactjs"] },
  { name: "Vue", patterns: ["\\bvue\\b", "vuejs", "vue\\.js"] },
  { name: "Angular", patterns: ["angular", "angularjs"] },
  { name: "Svelte", patterns: ["svelte"] },
  { name: "HTML", patterns: ["html[45]?", "\\bhtml\\b"] },
  { name: "CSS", patterns: ["\\bcss[23]?\\b"] },
  { name: "Tailwind CSS", patterns: ["tailwind", "tailwindcss"] },
  { name: "Bootstrap", patterns: ["bootstrap"] },
  { name: "SASS", patterns: ["sass", "scss"] },
  { name: "Redux", patterns: ["redux"] },
  { name: "Next.js", patterns: ["next\\.js", "nextjs"] },
  { name: "Webpack", patterns: ["webpack"] },
  { name: "Vite", patterns: ["\\bvite\\b"] },
  
  // Backend
  { name: "Node.js", patterns: ["node\\.js", "nodejs", "\\bnode\\b"] },
  { name: "Express", patterns: ["express\\.js", "expressjs"] },
  { name: "Django", patterns: ["django"] },
  { name: "Flask", patterns: ["flask"] },
  { name: "FastAPI", patterns: ["fastapi"] },
  { name: "Spring Boot", patterns: ["spring boot", "springboot"] },
  { name: "Spring", patterns: ["\\bspring\\b"] },
  { name: "GraphQL", patterns: ["graphql"] },
  { name: "REST API", patterns: ["rest api", "restful", "rest"] },
  
  // Databases
  { name: "SQL", patterns: ["\\bsql\\b"] },
  { name: "PostgreSQL", patterns: ["postgres", "postgresql"] },
  { name: "MySQL", patterns: ["mysql", "my\\.sql"] },
  { name: "MongoDB", patterns: ["mongodb", "mongo"] },
  { name: "Redis", patterns: ["redis"] },
  { name: "Elasticsearch", patterns: ["elasticsearch"] },
  { name: "Firebase", patterns: ["firebase"] },
  { name: "Oracle", patterns: ["oracle"] },
  
  // DevOps & Cloud
  { name: "Docker", patterns: ["docker"] },
  { name: "Kubernetes", patterns: ["kubernetes", "k8s"] },
  { name: "AWS", patterns: ["aws", "amazon web services"] },
  { name: "Azure", patterns: ["azure", "microsoft azure"] },
  { name: "GCP", patterns: ["gcp", "google cloud"] },
  { name: "CI/CD", patterns: ["ci/cd", "cicd", "continuous integration"] },
  { name: "Jenkins", patterns: ["jenkins"] },
  { name: "GitLab", patterns: ["gitlab"] },
  { name: "GitHub", patterns: ["github"] },
  
  // Tools & Technologies
  { name: "Git", patterns: ["\\bgit\\b"] },
  { name: "Jira", patterns: ["jira"] },
  { name: "Agile", patterns: ["agile"] },
  { name: "Scrum", patterns: ["scrum"] },
  { name: "Linux", patterns: ["linux"] },
  { name: "Windows", patterns: ["windows"] },
  { name: "Figma", patterns: ["figma"] },
  
  // Data & ML
  { name: "Machine Learning", patterns: ["machine learning", "ml\\b"] },
  { name: "TensorFlow", patterns: ["tensorflow"] },
  { name: "PyTorch", patterns: ["pytorch"] },
  { name: "Keras", patterns: ["keras"] },
  { name: "Pandas", patterns: ["pandas"] },
  { name: "NumPy", patterns: ["numpy"] },
  { name: "Data Analysis", patterns: ["data analysis"] },
  
  // Testing
  { name: "Jest", patterns: ["jest"] },
  { name: "Mocha", patterns: ["mocha"] },
  { name: "Selenium", patterns: ["selenium"] },
  { name: "Cypress", patterns: ["cypress"] },
  
  // Soft Skills
  { name: "Communication", patterns: ["communication"] },
  { name: "Leadership", patterns: ["leadership", "leader"] },
  { name: "Problem-solving", patterns: ["problem.solving", "problem solving"] },
  { name: "Teamwork", patterns: ["teamwork", "team work"] },
  
  // Other
  { name: "Microservices", patterns: ["microservices", "micro-services"] },
  { name: "API", patterns: ["\\bapi\\b"] },
  { name: "RabbitMQ", patterns: ["rabbitmq"] },
  { name: "Excel", patterns: ["excel", "ms excel"] },
  { name: "Word", patterns: ["\\bword\\b", "ms word"] },
  { name: "PowerPoint", patterns: ["powerpoint"] }
];

exports.extractSkillsFromPdf = async (filePath) => {
  try {
    console.log('Parsing Resume for Skills...');
    
    // Read file as buffer and try to extract text
    const buffer = fs.readFileSync(filePath);
    
    // Convert buffer to string - PDFs have some readable text
    let fileContent = buffer.toString('latin1').toLowerCase();
    
    // Also try utf8
    const utf8Content = buffer.toString('utf-8').toLowerCase();
    fileContent = (fileContent + ' ' + utf8Content).toLowerCase();
    
    // Remove special characters but preserve word boundaries
    fileContent = fileContent.replace(/[_\-]/g, ' ');

    const foundSkills = new Set();

    SKILL_KEYWORDS.forEach(skillObj => {
      // Try each pattern for this skill
      const found = skillObj.patterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(fileContent);
      });
      
      if (found) {
        foundSkills.add(skillObj.name);
      }
    });

    console.log('✅ Found:', Array.from(foundSkills));
    return Array.from(foundSkills);

  } catch (err) {
    console.error("Resume Parse Error:", err);
    return [];
  }
};