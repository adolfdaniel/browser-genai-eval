#!/usr/bin/env python3
"""
Test script to verify the Browser Summarization Quality Evaluation setup.
"""

import sys
import os
import importlib.util

def test_imports():
    """Test if all required packages can be imported"""
    required_packages = [
        'flask',
        'flask_socketio', 
        'pandas',
        'datasets',
        'evaluate',
        'rouge_score',
        'numpy',
        'requests'
    ]
    
    print("🧪 Testing package imports...")
    failed_imports = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package}")
        except ImportError as e:
            print(f"  ❌ {package}: {e}")
            failed_imports.append(package)
    
    return failed_imports

def test_config():
    """Test if configuration file is valid"""
    print("\n🔧 Testing configuration...")
    try:
        import config
        print(f"  ✅ Configuration loaded")
        print(f"  📊 Max articles: {config.MAX_ALLOWED_ARTICLES}")
        print(f"  ⏱️  Timeout: {config.SUMMARIZER_TIMEOUT}s")
        print(f"  📁 Results dir: {config.RESULTS_DIR}")
        return True
    except Exception as e:
        print(f"  ❌ Configuration error: {e}")
        return False

def test_directories():
    """Test if required directories exist or can be created"""
    print("\n📁 Testing directory structure...")
    directories = ['templates', 'results']
    
    for directory in directories:
        if os.path.exists(directory):
            print(f"  ✅ {directory}/ exists")
        else:
            try:
                os.makedirs(directory, exist_ok=True)
                print(f"  ✅ {directory}/ created")
            except Exception as e:
                print(f"  ❌ Failed to create {directory}/: {e}")
                return False
    return True

def test_sample_data():
    """Test sample data loading"""
    print("\n📊 Testing sample data...")
    try:
        import config
        sample_articles = config.SAMPLE_ARTICLES
        print(f"  ✅ {len(sample_articles)} sample articles available")
        
        for i, article in enumerate(sample_articles):
            if 'id' in article and 'article' in article and 'reference_summary' in article:
                print(f"  ✅ Article {i+1}: Valid structure")
            else:
                print(f"  ❌ Article {i+1}: Missing required fields")
                return False
        return True
    except Exception as e:
        print(f"  ❌ Sample data error: {e}")
        return False

def test_rouge_scorer():
    """Test ROUGE scorer functionality"""
    print("\n📝 Testing ROUGE scorer...")
    try:
        from rouge_score import rouge_scorer
        scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        
        # Test with sample text
        reference = "The cat sat on the mat"
        hypothesis = "A cat was sitting on a mat"
        scores = scorer.score(reference, hypothesis)
        
        print(f"  ✅ ROUGE scorer working")
        print(f"  📊 Sample ROUGE-1: {scores['rouge1'].fmeasure:.3f}")
        return True
    except Exception as e:
        print(f"  ❌ ROUGE scorer error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Browser Summarization Quality Evaluation - Setup Test")
    print("=" * 60)
    
    # Test imports
    failed_imports = test_imports()
    
    # Test configuration
    config_ok = test_config()
    
    # Test directories
    dirs_ok = test_directories()
    
    # Test sample data
    data_ok = test_sample_data()
    
    # Test ROUGE scorer
    rouge_ok = test_rouge_scorer()
    
    print("\n" + "=" * 60)
    print("📋 Test Summary:")
    
    if failed_imports:
        print(f"❌ Missing packages: {', '.join(failed_imports)}")
        print("   Run: pip install -r requirements.txt")
    else:
        print("✅ All packages imported successfully")
    
    if config_ok:
        print("✅ Configuration is valid")
    else:
        print("❌ Configuration has issues")
    
    if dirs_ok:
        print("✅ Directory structure is ready")
    else:
        print("❌ Directory structure has issues")
    
    if data_ok:
        print("✅ Sample data is valid")
    else:
        print("❌ Sample data has issues")
    
    if rouge_ok:
        print("✅ ROUGE evaluation is working")
    else:
        print("❌ ROUGE evaluation has issues")
    
    print("\n🎯 Next steps:")
    if not failed_imports and config_ok and dirs_ok and data_ok and rouge_ok:
        print("  🎉 All tests passed! You're ready to run the application.")
        print("  🚀 Run: python app.py")
        print("  🌐 Then open: http://localhost:5000")
    else:
        print("  🔧 Fix the issues above before running the application")
        if failed_imports:
            print("  📦 Install missing packages first")
    
    print("\n⚠️  Remember:")
    print("  🌐 Use a Chrome/Edge browser with Summarizer API support")
    print("  🔬 Enable experimental features in chrome://flags/ if needed")

if __name__ == "__main__":
    main()
