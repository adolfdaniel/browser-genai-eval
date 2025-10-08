# Quick Reference: Article Extraction Tool

## Quick Start
```bash
# List datasets
python extract_top20_articles.py --list

# Extract 20 from CNN/DailyMail (default)
python extract_top20_articles.py

# Extract custom count
python extract_top20_articles.py -c 50

# Extract from specific dataset
python extract_top20_articles.py -d cnn_dailymail -c 25
```

## Common Commands

| Task | Command |
|------|---------|
| Show help | `python extract_top20_articles.py -h` |
| List datasets | `python extract_top20_articles.py -l` |
| Default (20 articles) | `python extract_top20_articles.py` |
| 10 articles | `python extract_top20_articles.py -c 10` |
| 50 articles | `python extract_top20_articles.py -c 50` |
| Custom dataset | `python extract_top20_articles.py -d cnn_dailymail -c 30` |

## Output Files Pattern
```
results/{dataset}_top{count}_articles.json      # Structured data
results/{dataset}_top{count}_articles.txt       # Readable format
results/{dataset}_top{count}_articles_summary.txt  # Quick overview
```

## Examples
```bash
# Small test set
python extract_top20_articles.py -c 5

# Medium test set  
python extract_top20_articles.py -c 20

# Large evaluation set
python extract_top20_articles.py -c 50
```

## Datasets Status

| Dataset | Key | Status |
|---------|-----|--------|
| CNN/DailyMail | `cnn_dailymail` | ✅ Working |
| XSum (BBC) | `xsum` | ⚠️ Compatibility issue |
| Reddit TIFU | `reddit_tifu` | ⚠️ Compatibility issue |
| Multi-News | `multi_news` | ⚠️ Compatibility issue |

**Recommendation**: Use `cnn_dailymail` for reliable extractions.
