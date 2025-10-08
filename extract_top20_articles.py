"""
Extract articles from HuggingFace datasets used in evaluation.

This script loads any of the configured datasets and extracts articles
that pass the length filter. Supports all datasets configured in config.py.
"""

import json
import argparse
import os
from datasets import load_dataset

# Configuration from config.py - all available datasets
AVAILABLE_DATASETS = {
    'cnn_dailymail': {
        'name': 'CNN/DailyMail',
        'dataset_name': 'cnn_dailymail',
        'version': '3.0.0',
        'split': 'test',
        'article_field': 'article',
        'summary_field': 'highlights',
        'description': 'News articles with human-written summaries'
    },
    'xsum': {
        'name': 'XSum (BBC)',
        'dataset_name': 'xsum',
        'version': None,
        'split': 'test',
        'article_field': 'document',
        'summary_field': 'summary',
        'description': 'BBC articles with single-sentence summaries'
    },
    'reddit_tifu': {
        'name': 'Reddit TIFU',
        'dataset_name': 'reddit_tifu',
        'version': 'long',
        'split': 'test',
        'article_field': 'documents',
        'summary_field': 'tldr',
        'description': 'Reddit posts with TL;DR summaries'
    },
    'multi_news': {
        'name': 'Multi-News',
        'dataset_name': 'multi_news',
        'version': None,
        'split': 'test',
        'article_field': 'document',
        'summary_field': 'summary',
        'description': 'Multi-document news summarization'
    }
}

MAX_ARTICLE_LENGTH = 4000

def extract_articles(dataset_key='cnn_dailymail', max_articles=20):
    """Extract articles from specified dataset."""
    
    if dataset_key not in AVAILABLE_DATASETS:
        print(f"❌ Error: Unknown dataset '{dataset_key}'")
        print(f"Available datasets: {', '.join(AVAILABLE_DATASETS.keys())}")
        return []
    
    dataset_config = AVAILABLE_DATASETS[dataset_key]
    
    print(f"Dataset: {dataset_config['name']}")
    print(f"Description: {dataset_config['description']}")
    print(f"Loading {dataset_config['dataset_name']} ", end="")
    if dataset_config['version']:
        print(f"version {dataset_config['version']} ", end="")
    print(f"({dataset_config['split']} split)...")
    print(f"Filtering articles with length < {MAX_ARTICLE_LENGTH} characters")
    print(f"Target: {max_articles} articles")
    print("-" * 80)
    
    # Load dataset (same as app.py)
    if dataset_config['version']:
        dataset = load_dataset(
            dataset_config['dataset_name'], 
            dataset_config['version'], 
            split=dataset_config['split']
        )
    else:
        dataset = load_dataset(
            dataset_config['dataset_name'], 
            split=dataset_config['split']
        )
    
    print(f"Total articles in dataset: {len(dataset)}")
    print(f"Starting extraction...")
    print("-" * 80)
    
    # Filter articles (same logic as app.py)
    filtered_articles = []
    skipped_count = 0
    for i, article in enumerate(dataset):
        article_text = article[dataset_config['article_field']]
        summary_text = article[dataset_config['summary_field']]
        
        # Handle different data types (string vs list)
        if isinstance(article_text, list):
            article_text = ' '.join(article_text)
        if isinstance(summary_text, list):
            summary_text = ' '.join(summary_text)
        
        # Skip if article is too long
        if len(article_text) >= MAX_ARTICLE_LENGTH:
            skipped_count += 1
            continue
            
        if len(filtered_articles) < max_articles:
            filtered_articles.append({
                'index': i,  # Original index in dataset
                'eval_id': len(filtered_articles),  # ID used in evaluation (0-19)
                'article': article_text,
                'reference_summary': summary_text,
                'article_length': len(article_text),
                'summary_length': len(summary_text),
                'dataset': dataset_key
            })
            
            # Print progress
            print(f"Article {len(filtered_articles):2d}: Index {i:5d} | "
                  f"Length: {len(article_text):4d} chars | "
                  f"Summary: {len(summary_text):3d} chars")
        else:
            # We have enough articles, stop processing
            break
    
    print("-" * 80)
    print(f"Extracted {len(filtered_articles)} articles")
    print(f"Skipped {skipped_count} articles (too long: >= {MAX_ARTICLE_LENGTH} chars)")
    print(f"Processed {i + 1} total articles from dataset")
    
    return filtered_articles


def save_articles_to_files(articles, dataset_key, max_articles):
    """Save articles to separate text and JSON files."""
    
    dataset_name = AVAILABLE_DATASETS[dataset_key]['name']
    filename_prefix = f"{dataset_key}_top{max_articles}"
    
    # Create results directory if it doesn't exist
    results_dir = os.path.join(os.getcwd(), 'results')
    os.makedirs(results_dir, exist_ok=True)
    
    # Save as JSON with all metadata
    json_path = os.path.join(results_dir, f'{filename_prefix}_articles.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Saved JSON to: {json_path}")
    
    # Save as readable text file
    text_path = os.path.join(results_dir, f'{filename_prefix}_articles.txt')
    with open(text_path, 'w', encoding='utf-8') as f:
        f.write("=" * 100 + "\n")
        f.write(f"TOP {max_articles} ARTICLES FROM {dataset_name.upper()} DATASET\n")
        f.write("=" * 100 + "\n\n")
        
        for article in articles:
            f.write(f"\n{'='*100}\n")
            f.write(f"ARTICLE {article['eval_id'] + 1} (Dataset Index: {article['index']})\n")
            f.write(f"{'='*100}\n\n")
            
            f.write(f"Article Length: {article['article_length']} characters\n")
            f.write(f"Summary Length: {article['summary_length']} characters\n\n")
            
            f.write("ARTICLE TEXT:\n")
            f.write("-" * 100 + "\n")
            f.write(article['article'])
            f.write("\n" + "-" * 100 + "\n\n")
            
            f.write("REFERENCE SUMMARY (HIGHLIGHTS):\n")
            f.write("-" * 100 + "\n")
            f.write(article['reference_summary'])
            f.write("\n" + "-" * 100 + "\n\n")
    
    print(f"✅ Saved readable text to: {text_path}")
    
    # Save summaries of each article
    summary_path = os.path.join(results_dir, f'{filename_prefix}_articles_summary.txt')
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write(f"SUMMARY OF TOP {max_articles} ARTICLES - {dataset_name.upper()}\n")
        f.write("=" * 100 + "\n\n")
        
        for article in articles:
            f.write(f"{article['eval_id'] + 1:2d}. Index {article['index']:5d} | "
                   f"Length: {article['article_length']:4d} chars | "
                   f"Summary: {article['summary_length']:3d} chars\n")
            f.write(f"    First 150 chars: {article['article'][:150].replace(chr(10), ' ')}...\n\n")
    
    print(f"✅ Saved article summary to: {summary_path}")


def print_statistics(articles):
    """Print statistics about the articles."""
    
    article_lengths = [a['article_length'] for a in articles]
    summary_lengths = [a['summary_length'] for a in articles]
    
    print("\n" + "=" * 80)
    print("STATISTICS")
    print("=" * 80)
    print(f"Total articles: {len(articles)}")
    print(f"\nArticle lengths:")
    print(f"  Min: {min(article_lengths)} chars")
    print(f"  Max: {max(article_lengths)} chars")
    print(f"  Avg: {sum(article_lengths) / len(article_lengths):.1f} chars")
    print(f"\nSummary lengths:")
    print(f"  Min: {min(summary_lengths)} chars")
    print(f"  Max: {max(summary_lengths)} chars")
    print(f"  Avg: {sum(summary_lengths) / len(summary_lengths):.1f} chars")
    print("=" * 80)


def list_available_datasets():
    """Display all available datasets."""
    print("\n" + "=" * 80)
    print("AVAILABLE DATASETS")
    print("=" * 80)
    for key, config in AVAILABLE_DATASETS.items():
        print(f"\n{key}:")
        print(f"  Name: {config['name']}")
        print(f"  Description: {config['description']}")
        print(f"  Dataset: {config['dataset_name']}")
        if config['version']:
            print(f"  Version: {config['version']}")
        print(f"  Split: {config['split']}")
    print("\n" + "=" * 80)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Extract articles from HuggingFace datasets for evaluation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract default 20 articles from CNN/DailyMail
  python extract_top20_articles.py
  
  # Extract 50 articles from XSum dataset
  python extract_top20_articles.py --dataset xsum --count 50
  
  # Extract 10 articles from Reddit TIFU
  python extract_top20_articles.py -d reddit_tifu -c 10
  
  # List all available datasets
  python extract_top20_articles.py --list
        """
    )
    
    parser.add_argument(
        '-d', '--dataset',
        type=str,
        default='cnn_dailymail',
        choices=list(AVAILABLE_DATASETS.keys()),
        help='Dataset to extract from (default: cnn_dailymail)'
    )
    
    parser.add_argument(
        '-c', '--count',
        type=int,
        default=20,
        help='Number of articles to extract (default: 20)'
    )
    
    parser.add_argument(
        '-l', '--list',
        action='store_true',
        help='List all available datasets and exit'
    )
    
    args = parser.parse_args()
    
    # Handle --list flag
    if args.list:
        list_available_datasets()
        exit(0)
    
    try:
        print("\n" + "=" * 80)
        print("ARTICLE EXTRACTION TOOL")
        print("=" * 80)
        print()
        
        # Extract articles
        articles = extract_articles(args.dataset, args.count)
        
        if not articles:
            print("\n❌ No articles extracted. Exiting.")
            exit(1)
        
        # Print statistics
        print_statistics(articles)
        
        # Save to files
        print("\nSaving articles to files...")
        save_articles_to_files(articles, args.dataset, args.count)
        
        print("\n✅ Done! Check the results folder for the extracted articles.")
        print(f"   Files saved with prefix: {args.dataset}_top{args.count}_articles.*")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user. Exiting.")
        exit(1)
    except RuntimeError as e:
        if "Dataset scripts are no longer supported" in str(e):
            print(f"\n❌ Error loading dataset: {e}")
            print("\n💡 This dataset requires updating to the new HuggingFace format.")
            print("   Try using 'cnn_dailymail' or 'multi_news' instead.")
        else:
            print(f"\n❌ Runtime error: {e}")
            import traceback
            traceback.print_exc()
        exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
