# Installation Guide for Mimris-Modeling-App

## Prerequisites

### System Requirements
- **OS**: Linux/macOS/Windows (64-bit)
- **RAM**: 8GB+ (16GB recommended for AI workflows)
- **Storage**: 10GB+ free space (models/cache intensive)

### Dependencies
1. **Node.js 18+** 
2. **Next.js 12+** 
3. **Redux** (for state management)


---

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/your-org/active-knowledge-modeling.git
cd active-knowledge-modeling
```

### 2. Backend Setup (Python)
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate  # Windows

# Install core dependencies
pip install -r requirements.txt

# Install AI extensions (choose based on hardware)
pip install -r requirements-ai-gpu.txt  # For NVIDIA GPUs
# OR
pip install -r requirements-ai-cpu.txt   # CPU-only
```

### 3. Frontend Setup (React/TypeScript)
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Database Configuration
```bash
# Using Docker (recommended)
docker-compose up -d postgres redis

# OR manual setup:
# Create PostgreSQL database 'akm_db'
# Configure credentials in .env (see below)
```

---

## Configuration

### Environment Variables (`.env`)
```ini
# AI Services
OPENAI_API_KEY=your-key-here  # For NLP suggestions
TORCH_DEVICE=cuda  # or "cpu"

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=akm_db
DB_USER=akm_user
DB_PASSWORD=secure_password

# Real-Time Collaboration
REDIS_URL=redis://localhost:6379
WEBSOCKET_CORS_ORIGINS=http://localhost:3000
```

### Initialize Database
```bash
python -m alembic upgrade head
```

---

## Running the Application

### Start Services
```bash
# Terminal 1: Backend API
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Collaboration Worker (optional)
celery -A app.tasks worker --loglevel=info
```

Access at: `http://localhost:3000`

---

## Troubleshooting

### Common Issues
- **Missing AI Dependencies**: Run `python -c "import torch; print(torch.cuda.is_available())"` to verify GPU support
- **Port Conflicts**: Change default ports in `.env` (API_PORT, FRONTEND_PORT)
- **Collaboration Errors**: Ensure Redis is running (`docker ps`)

---

## Optional Features

### Cloud Deployment (AWS)
```bash
# Package with Docker
docker build -t akm-app .

# Deploy using ECS/EKS:
# - Attach GPU-enabled instances
# - Configure RDS/ElastiCache
```

### Local AI Model Cache
```bash
python -m spacy download en_core_web_lg
python -c "from transformers import pipeline; pipeline('text-generation', model='gpt2')"
```

---

**Next**: See [QUICKSTART.md](QUICKSTART.md) for first-steps tutorial.
```

This guide balances technical depth with user-friendliness, covering:  
- **AI/ML-specific needs** (GPU vs CPU paths)  
- **Real-time collaboration stack** (WebSocket/Redis)  
- **Flexible deployment** (local Docker vs cloud)  

