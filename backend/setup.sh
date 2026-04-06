#!/bin/bash

echo "========================================="
echo "ShapeFit Backend Setup Script"
echo "========================================="
echo

# Check Python version
echo "Step 1: Checking Python version..."
python check_python_version.py
echo

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Step 2: Creating virtual environment..."
    python -m venv venv
    echo "✓ Virtual environment created"
else
    echo "Step 2: Virtual environment already exists"
fi
echo

# Activate virtual environment
echo "Step 3: Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo

# Install dependencies
echo "Step 4: Installing dependencies..."
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi
echo

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Step 5: Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "  Please edit .env with your database credentials"
    echo "  Current DATABASE_URL: $(grep DATABASE_URL .env)"
    echo
    read -p "Press Enter to continue after editing .env..."
else
    echo "Step 5: .env file already exists"
fi
echo

# Check PostgreSQL connection
echo "Step 6: Checking PostgreSQL connection..."
if ! psql -U postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo "⚠ Cannot connect to PostgreSQL. Please ensure:"
    echo "  - PostgreSQL is running"
    echo "  - Database 'shapefit' exists"
    echo "  - Credentials in .env are correct"
    echo
    read -p "Press Enter to continue anyway..."
fi

# Initialize database
echo "Step 7: Initializing database..."
python init_db.py
if [ $? -eq 0 ]; then
    echo "✓ Database initialized"
else
    echo "✗ Failed to initialize database"
    exit 1
fi
echo

# Create coach account
echo "Step 8: Creating coach account..."
python create_coach.py
echo

# Generate QR code
echo "Step 9: Generating coach QR code..."
python generate_qr.py
echo

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo
echo "Next steps:"
echo "1. Start backend server:"
echo "   uvicorn app.main:app --reload"
echo
echo "2. Test API:"
echo "   python test_api.py"
echo
echo "3. Setup mobile app:"
echo "   cd ../mobile"
echo "   npm install"
echo "   npx expo start"
echo
