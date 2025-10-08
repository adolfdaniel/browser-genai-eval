# Article Extraction Tool - Usage Guide

## Overview
This tool extracts articles from HuggingFace datasets used in the evaluation application. It supports command-line arguments to select any dataset and specify the number of articles to extract.

## Installation
No additional installation needed - uses the existing virtual environment:
```bash
cd d:\edge-quality-eval
.\venv\Scripts\Activate.ps1  # If not already activated
```

## Basic Usage

### Show Help
```bash
python extract_top20_articles.py --help
```

### List Available Datasets
```bash
python extract_top20_articles.py --list
```

### Extract Default (20 articles from CNN/DailyMail)
```bash
python extract_top20_articles.py
```

### Extract Specific Number of Articles
```bash
# Extract 10 articles
python extract_top20_articles.py --count 10

# Or use short form
python extract_top20_articles.py -c 10
```

### Extract from Different Dataset
```bash
# Extract from CNN/DailyMail
python extract_top20_articles.py --dataset cnn_dailymail --count 50

# Or use short form
python extract_top20_articles.py -d cnn_dailymail -c 50
```

## Command-Line Arguments

| Argument | Short | Default | Description |
|----------|-------|---------|-------------|
| `--help` | `-h` | - | Show help message |
| `--list` | `-l` | - | List all available datasets and exit |
| `--dataset` | `-d` | `cnn_dailymail` | Dataset to extract from |
| `--count` | `-c` | `20` | Number of articles to extract |

## Available Datasets

### ✅ Working Datasets

#### CNN/DailyMail (`cnn_dailymail`)
- **Description**: News articles with human-written summaries
- **Version**: 3.0.0
- **Split**: test (11,490 articles)
- **Fields**: article, highlights
- **Status**: ✅ Fully functional

**Example:**
```bash
python extract_top20_articles.py -d cnn_dailymail -c 25
```

### ⚠️ Datasets with Compatibility Issues

The following datasets have compatibility issues with the newer HuggingFace datasets library:

#### XSum (`xsum`)
- **Description**: BBC articles with single-sentence summaries
- **Status**: ⚠️ Requires dataset format update
- **Alternative**: Use CNN/DailyMail for similar news content

#### Reddit TIFU (`reddit_tifu`)
- **Description**: Reddit posts with TL;DR summaries
- **Status**: ⚠️ Requires dataset format update

#### Multi-News (`multi_news`)
- **Description**: Multi-document news summarization
- **Status**: ⚠️ Requires dataset format update

## Output Files

The tool generates three files with the naming pattern: `{dataset}_top{count}_articles.*`

### 1. JSON File (`*_articles.json`)
Complete structured data with all metadata:
- Original dataset index
- Evaluation ID (0-based)
- Full article text
- Reference summary
- Character counts
- Dataset name

**Example:** `cnn_dailymail_top20_articles.json`

### 2. Text File (`*_articles.txt`)
Human-readable format with:
- Article headers with metadata
- Full article text
- Reference summaries
- Formatted for easy reading

**Example:** `cnn_dailymail_top20_articles.txt`

### 3. Summary File (`*_articles_summary.txt`)
Quick overview with:
- Article index and lengths
- First 150 characters of each article
- Statistics summary

**Example:** `cnn_dailymail_top20_articles_summary.txt`

## Examples

### Example 1: Default Extraction
Extract 20 articles from CNN/DailyMail:
```bash
python extract_top20_articles.py
```

**Output files:**
- `results/cnn_dailymail_top20_articles.json`
- `results/cnn_dailymail_top20_articles.txt`
- `results/cnn_dailymail_top20_articles_summary.txt`

### Example 2: Custom Count
Extract 50 articles for comprehensive testing:
```bash
python extract_top20_articles.py -c 50
```

**Output files:**
- `results/cnn_dailymail_top50_articles.json`
- `results/cnn_dailymail_top50_articles.txt`
- `results/cnn_dailymail_top50_articles_summary.txt`

### Example 3: Small Sample
Extract just 5 articles for quick testing:
```bash
python extract_top20_articles.py -c 5
```

### Example 4: Different Dataset (if compatible)
```bash
# This may fail with newer HuggingFace library
python extract_top20_articles.py -d xsum -c 10
```

## Understanding the Output

### Statistics Display
```
================================================================================
STATISTICS
================================================================================
Total articles: 20

Article lengths:
  Min: 630 chars
  Max: 3717 chars
  Avg: 2239.9 chars

Summary lengths:
  Min: 104 chars
  Max: 328 chars
  Avg: 183.5 chars
================================================================================
```

### Extraction Progress
```
Article  1: Index     0 | Length: 3612 chars | Summary: 233 chars
Article  2: Index     1 | Length: 2331 chars | Summary: 214 chars
...
```

### Final Summary
```
Extracted 20 articles
Skipped 5 articles (too long: >= 4000 chars)
Processed 25 total articles from dataset
```

## Filtering Rules

The tool applies the same filtering rules as the main application:
- **Max article length**: 4,000 characters
- **Sequential selection**: Takes first N articles that pass the filter
- **Same logic**: Matches exactly what `app.py` uses for evaluation

## Troubleshooting

### Error: "Dataset scripts are no longer supported"
**Cause**: Some datasets haven't been updated to the new HuggingFace format.

**Solution**: Use CNN/DailyMail instead:
```bash
python extract_top20_articles.py -d cnn_dailymail -c 20
```

### Error: "Unknown dataset"
**Cause**: Invalid dataset name.

**Solution**: List available datasets:
```bash
python extract_top20_articles.py --list
```

### Error: "No articles extracted"
**Cause**: All articles in the dataset exceed the 4,000 character limit.

**Solution**: This shouldn't happen with CNN/DailyMail. Check if the dataset loaded correctly.

### KeyboardInterrupt
**Cause**: User pressed Ctrl+C during extraction.

**Result**: Partial extraction - no files saved. Run again to complete.

## Integration with Main Application

The extracted articles match exactly what the main application uses:
1. **Same dataset configuration** from `config.py`
2. **Same filtering logic** (< 4,000 characters)
3. **Same field mappings** (article, highlights)
4. **Sequential selection** (first N that pass filter)

You can use these extracted articles to:
- Verify evaluation behavior
- Manual quality checks
- Share test cases
- Debug specific articles
- Create custom test sets

## Performance Notes

- **CNN/DailyMail**: Fast loading, ~5-10 seconds for 20 articles
- **Large counts**: Linear time - extracting 100 articles takes ~5x longer than 20
- **Memory**: Minimal - only keeps filtered articles in memory
- **Disk space**: ~100KB per 20 articles (JSON + text files)

## Advanced Usage

### Batch Extraction
Extract multiple sets for comparison:
```bash
python extract_top20_articles.py -c 10
python extract_top20_articles.py -c 20
python extract_top20_articles.py -c 50
```

### JSON Processing
Use the JSON output for custom analysis:
```python
import json

with open('results/cnn_dailymail_top20_articles.json') as f:
    articles = json.load(f)

for article in articles:
    print(f"Article {article['eval_id']}: {article['article_length']} chars")
```

## Future Enhancements

Potential improvements:
- [ ] Support for custom article length filters
- [ ] Random sampling option (not just first N)
- [ ] CSV export format
- [ ] Article ID range selection
- [ ] Dataset repair/update for incompatible formats
- [ ] Multiple dataset extraction in one run
- [ ] Parallel processing for large extractions

## Related Files

- **Main application**: `app.py`
- **Configuration**: `config.py`, `config_production.py`
- **Output directory**: `results/`
- **This script**: `extract_top20_articles.py`

## Support

For issues or questions:
1. Check the error message carefully
2. Try with CNN/DailyMail dataset first (most reliable)
3. Verify virtual environment is activated
4. Check `results/` folder permissions
