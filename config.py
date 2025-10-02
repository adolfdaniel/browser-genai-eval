"""
Configuration settings for the Browser Summarization Quality Evaluation project.
"""

# Server Configuration
SERVER_HOST = 'localhost'
SERVER_PORT = 5000
DEBUG_MODE = True
SECRET_KEY = 'your-secret-key-change-this-in-production'

# Dataset Configuration
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
    },
    'sample': {
        'name': 'Sample Articles',
        'dataset_name': 'sample',
        'version': None,
        'split': None,
        'article_field': 'article',
        'summary_field': 'reference_summary',
        'description': 'Built-in sample articles for testing'
    }
}

# Default dataset
DEFAULT_DATASET = 'cnn_dailymail'
DATASET_NAME = "cnn_dailymail"  # Keep for backward compatibility
DATASET_VERSION = "3.0.0"
DATASET_SPLIT = "test"
MAX_ARTICLE_LENGTH = 4000  # Maximum characters per article
DEFAULT_MAX_ARTICLES = 20   # Default number of articles to process
MAX_ALLOWED_ARTICLES = 50   # Maximum articles user can select

# Evaluation Configuration
ROUGE_METRICS = ['rouge1', 'rouge2', 'rougeL']
USE_STEMMER = True
SUMMARIZER_TIMEOUT = 240  # Seconds to wait for browser response
SUMMARIZER_MAX_RETRIES = 1  # Retry up to 1 time on timeout (less aggressive for dev)
SUMMARIZER_RETRY_DELAY = 2  # Wait 2 seconds between retries

# Browser Summarizer Configuration (based on latest MDN spec)
SUMMARIZER_CONFIG = {
    'sharedContext': 'Summarize news articles for quality evaluation, focusing on key facts and main points',
    'type': 'tl;dr',  # Options: 'tl;dr', 'key-points', 'teaser', 'headline'
    'format': 'plain-text',  # Options: 'plain-text', 'markdown'
    'length': 'short'  # Options: 'short', 'medium', 'long'
}

# File Paths
RESULTS_DIR = 'results'
EXPORT_FILENAME_FORMAT = 'summarization_results_{timestamp}.csv'

# UI Configuration
LOG_MAX_ENTRIES = 1000  # Maximum log entries to keep in memory
PROGRESS_UPDATE_INTERVAL = 1  # Seconds between progress updates

# Sample Articles (fallback when dataset loading fails)
SAMPLE_ARTICLES = [
    {
        'id': 1,
        'article': """
        The tech industry has seen remarkable growth in artificial intelligence applications over the past year. 
        Companies are investing billions of dollars in AI research and development, with particular focus on 
        large language models and computer vision technologies. Major tech giants like Google, Microsoft, 
        and OpenAI are leading the charge in developing more sophisticated AI systems that can understand 
        and generate human-like text, analyze images, and even write code. This rapid advancement has sparked 
        both excitement about the potential benefits and concerns about the ethical implications of AI technology. 
        Experts predict that AI will continue to transform various industries, from healthcare and finance 
        to education and entertainment, in the coming years. The investment in AI infrastructure has reached 
        unprecedented levels, with venture capital funding flowing into AI startups at record rates. 
        However, concerns about job displacement, privacy, and the concentration of AI power in a few 
        large corporations continue to grow among policymakers and the general public.
        """,
        'reference_summary': "Tech industry invests billions in AI development, with major companies leading advancement in language models and computer vision, raising both opportunities and ethical concerns about job displacement and corporate concentration."
    },
    {
        'id': 2,
        'article': """
        Climate change continues to be one of the most pressing global challenges of our time. Scientists 
        worldwide are reporting unprecedented changes in weather patterns, rising sea levels, and increasing 
        temperatures. The latest IPCC report highlights the urgent need for immediate action to reduce 
        greenhouse gas emissions and transition to renewable energy sources. Many countries have committed 
        to achieving net-zero emissions by 2050, but experts argue that current efforts are insufficient 
        to limit global warming to 1.5 degrees Celsius above pre-industrial levels. The report emphasizes 
        the importance of international cooperation and coordinated efforts to address this global crisis.
        Renewable energy technologies like solar and wind have become increasingly cost-competitive with 
        fossil fuels, leading to rapid adoption in many regions. However, the transition requires massive 
        infrastructure investments and significant changes to energy systems worldwide. The economic 
        implications of climate action are substantial, but economists argue that the cost of inaction 
        would be far greater, potentially leading to trillions in damages from extreme weather events, 
        agricultural disruption, and mass migration.
        """,
        'reference_summary': "Scientists report urgent climate crisis requiring immediate action to reduce emissions and transition to renewable energy, with current efforts insufficient to meet warming targets despite growing renewable adoption and economic imperatives."
    },
    {
        'id': 3,
        'article': """
        The global supply chain disruptions that began during the COVID-19 pandemic continue to affect 
        businesses and consumers worldwide. Shipping delays, semiconductor shortages, and labor constraints 
        have forced companies to rethink their supply chain strategies. Many organizations are now focusing 
        on building more resilient and diversified supply networks rather than optimizing purely for cost 
        efficiency. The semiconductor shortage has particularly impacted the automotive industry, with 
        major manufacturers forced to halt production at various facilities. This has led to increased 
        prices for new vehicles and longer wait times for consumers. Experts suggest that supply chain 
        normalization may take several more years, as companies work to rebuild inventory levels and 
        establish more stable supplier relationships. The crisis has also accelerated adoption of digital 
        supply chain technologies, including AI-powered demand forecasting and blockchain-based tracking 
        systems. Companies are investing heavily in supply chain visibility tools to better anticipate 
        and respond to future disruptions.
        """,
        'reference_summary': "COVID-19 pandemic triggered ongoing global supply chain disruptions affecting businesses worldwide, forcing companies to prioritize resilience over cost efficiency while investing in digital tracking and forecasting technologies."
    }
]
