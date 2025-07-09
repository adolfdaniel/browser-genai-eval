import os
import json
import asyncio
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import pandas as pd
from datasets import load_dataset
import evaluate
from rouge_score import rouge_scorer
import threading
import time
import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = config.SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global variables for evaluation state
evaluation_state = {
    'is_running': False,
    'current_article': 0,
    'total_articles': 0,
    'results': [],
    'logs': []
}

class SummarizationEvaluator:
    def __init__(self):
        self.rouge_scorer = rouge_scorer.RougeScorer(config.ROUGE_METRICS, use_stemmer=config.USE_STEMMER)
        self.results = []
        
    def load_dataset(self, dataset_key='cnn_dailymail', max_articles=config.DEFAULT_MAX_ARTICLES):
        """Load dataset with configurable dataset type"""
        try:
            if dataset_key not in config.AVAILABLE_DATASETS:
                logger.warning(f"Unknown dataset {dataset_key}, falling back to sample articles")
                return self._get_sample_articles(max_articles)
            
            dataset_config = config.AVAILABLE_DATASETS[dataset_key]
            
            # Handle sample dataset specially
            if dataset_key == 'sample':
                return self._get_sample_articles(max_articles)
            
            # Load from HuggingFace datasets
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
            
            # Filter articles to stay under character limit
            filtered_articles = []
            for i, article in enumerate(dataset):
                article_text = article[dataset_config['article_field']]
                summary_text = article[dataset_config['summary_field']]
                
                # Handle different data types (string vs list)
                if isinstance(article_text, list):
                    article_text = ' '.join(article_text)
                if isinstance(summary_text, list):
                    summary_text = ' '.join(summary_text)
                
                if len(article_text) < config.MAX_ARTICLE_LENGTH and len(filtered_articles) < max_articles:
                    filtered_articles.append({
                        'id': i,
                        'article': article_text,
                        'reference_summary': summary_text,
                        'dataset': dataset_key
                    })
            
            logger.info(f"Loaded {len(filtered_articles)} articles from {dataset_config['name']}")
            return filtered_articles
        except Exception as e:
            logger.error(f"Error loading dataset {dataset_key}: {e}")
            return self._get_sample_articles(max_articles)
    
    def _get_sample_articles(self, max_articles):
        """Fallback sample articles if dataset loading fails"""
        sample_count = min(max_articles, len(config.SAMPLE_ARTICLES))
        articles = []
        for i, article in enumerate(config.SAMPLE_ARTICLES[:sample_count]):
            articles.append({
                **article,
                'dataset': 'sample'
            })
        return articles
    
    def calculate_rouge_scores(self, reference, generated):
        """Calculate ROUGE scores for evaluation"""
        scores = self.rouge_scorer.score(reference, generated)
        return {
            'rouge1': scores['rouge1'].fmeasure,
            'rouge2': scores['rouge2'].fmeasure,
            'rougeL': scores['rougeL'].fmeasure
        }

evaluator = SummarizationEvaluator()

@app.route('/')
def index():
    return render_template('index_material.html')

@app.route('/basic')
def basic():
    return render_template('index.html')

@app.route('/api/datasets')
def get_datasets():
    """Get available datasets"""
    return jsonify({
        'datasets': config.AVAILABLE_DATASETS,
        'default': config.DEFAULT_DATASET
    })

@app.route('/api/start_evaluation', methods=['POST'])
def start_evaluation():
    global evaluation_state
    
    if evaluation_state['is_running']:
        return jsonify({'error': 'Evaluation already running'}), 400
    
    max_articles = request.json.get('max_articles', config.DEFAULT_MAX_ARTICLES)
    max_articles = min(max_articles, config.MAX_ALLOWED_ARTICLES)  # Enforce maximum limit
    
    evaluation_mode = request.json.get('evaluation_mode', 'single')
    selected_config = request.json.get('selected_config', 'tldr_short_plain-text')
    selected_dataset = request.json.get('selected_dataset', config.DEFAULT_DATASET)
    
    # Validate dataset
    if selected_dataset not in config.AVAILABLE_DATASETS:
        return jsonify({'error': f'Invalid dataset: {selected_dataset}'}), 400
    
    # Store evaluation configuration in global state
    evaluation_state['evaluation_mode'] = evaluation_mode
    evaluation_state['selected_config'] = selected_config
    evaluation_state['selected_dataset'] = selected_dataset
    
    # Start evaluation in background thread
    thread = threading.Thread(target=run_evaluation, args=(max_articles,))
    thread.start()
    
    return jsonify({
        'message': 'Evaluation started', 
        'max_articles': max_articles,
        'evaluation_mode': evaluation_mode,
        'selected_config': selected_config if evaluation_mode == 'single' else None,
        'selected_dataset': selected_dataset
    })

@app.route('/api/stop_evaluation', methods=['POST'])
def stop_evaluation():
    global evaluation_state
    evaluation_state['is_running'] = False
    return jsonify({'message': 'Evaluation stopped'})

@app.route('/api/results')
def get_results():
    return jsonify(evaluation_state['results'])

@app.route('/api/export_results')
def export_results():
    if evaluation_state['results']:
        df = pd.DataFrame(evaluation_state['results'])
        
        # Create results directory if it doesn't exist
        os.makedirs(config.RESULTS_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(config.RESULTS_DIR, 
                               config.EXPORT_FILENAME_FORMAT.format(timestamp=timestamp))
        
        df.to_csv(filename, index=False)
        log_message(f"Results exported to {filename}")
        return jsonify({'message': f'Results exported to {filename}', 'filename': filename})
    return jsonify({'error': 'No results to export'})

def run_evaluation(max_articles):
    global evaluation_state
    
    evaluation_state['is_running'] = True
    evaluation_state['current_article'] = 0
    evaluation_state['results'] = []
    
    # Get selected dataset
    selected_dataset = evaluation_state.get('selected_dataset', config.DEFAULT_DATASET)
    
    # Load dataset
    articles = evaluator.load_dataset(selected_dataset, max_articles)
    evaluation_state['total_articles'] = len(articles)
    
    dataset_name = config.AVAILABLE_DATASETS.get(selected_dataset, {}).get('name', selected_dataset)
    log_message(f"Starting evaluation process with {dataset_name} dataset...")
    socketio.emit('evaluation_started', {
        'total_articles': len(articles),
        'dataset': dataset_name
    })
    
    for i, article in enumerate(articles):
        if not evaluation_state['is_running']:
            break
            
        evaluation_state['current_article'] = i + 1
        
        log_message(f"Processing article {i + 1}/{len(articles)}")
        socketio.emit('progress_update', {
            'current': i + 1,
            'total': len(articles),
            'article_id': article['id']
        })
        
        # Request summarization from browser
        results = request_browser_summarization(article)
        
        if results:
            # Handle both single results and multiple results
            if isinstance(results, list):
                for result in results:
                    evaluation_state['results'].append(result)
                    socketio.emit('article_completed', result)
            else:
                evaluation_state['results'].append(results)
                socketio.emit('article_completed', results)
        
        time.sleep(config.PROGRESS_UPDATE_INTERVAL)  # Configurable delay between requests
    
    evaluation_state['is_running'] = False
    log_message("Evaluation completed!")
    socketio.emit('evaluation_completed', {'total_results': len(evaluation_state['results'])})

def request_browser_summarization(article):
    """Request summarization from browser and evaluate"""
    try:
        evaluation_mode = evaluation_state.get('evaluation_mode', 'single')
        
        if evaluation_mode == 'single':
            # Use the selected configuration
            selected_config = evaluation_state.get('selected_config', 'tldr_short_plain-text')
            configurations = [selected_config]
        else:
            # Use all configurations
            types = ['tldr', 'key-points', 'teaser', 'headline']
            lengths = ['short', 'medium', 'long']
            formats = ['plain-text', 'markdown']
            configurations = [f"{t}_{l}_{f}" for t in types for l in lengths for f in formats]
        
        results = []
        for config in configurations:
            log_message(f"Requesting {config} summarization for article {article['id']}")
            
            # Create a unique request ID
            request_suffix = f"_{config}"
            request_id = f"req_{article['id']}{request_suffix}_{int(time.time())}"
            
            # Store the request in the pending requests
            if not hasattr(wait_for_browser_response, 'pending_requests'):
                wait_for_browser_response.pending_requests = {}
            
            wait_for_browser_response.pending_requests[request_id] = {
                'article': article,
                'config': config,
                'result': None,
                'completed': False
            }
            
            # Emit request to browser
            socketio.emit('summarize_request', {
                'request_id': request_id,
                'article_id': article['id'],
                'text': article['article'],
                'configuration': config
            })
            
            # Wait for browser response
            result = wait_for_browser_response(article, config)
            if result:
                results.append(result)
        
        # Return single result for single mode, list for all mode
        if evaluation_mode == 'single':
            return results[0] if results else None
        else:
            return results
        
    except Exception as e:
        log_message(f"Error processing article {article['id']}: {str(e)}")
        return []

def wait_for_browser_response(article, config=None, timeout=30):
    """Wait for browser to return summarization result"""
    # Find the request ID for this article and config
    request_suffix = f"_{config}" if config else ""
    request_key_prefix = f"req_{article['id']}{request_suffix}_"
    
    # Find the matching request ID (most recent one)
    request_id = None
    if hasattr(wait_for_browser_response, 'pending_requests'):
        matching_requests = [req_id for req_id in wait_for_browser_response.pending_requests 
                           if req_id.startswith(request_key_prefix)]
        if matching_requests:
            request_id = max(matching_requests)  # Get the most recent one
    
    if not request_id:
        log_message(f"No pending request found for article {article['id']}, config: {config}")
        return create_mock_result(article, config)
    
    # Wait for response
    start_time = time.time()
    while time.time() - start_time < timeout:
        if request_id in wait_for_browser_response.pending_requests and wait_for_browser_response.pending_requests[request_id]['completed']:
            result = wait_for_browser_response.pending_requests[request_id]['result']
            del wait_for_browser_response.pending_requests[request_id]
            return result
        time.sleep(0.1)
    
    # Timeout - clean up and return mock result
    if request_id in wait_for_browser_response.pending_requests:
        del wait_for_browser_response.pending_requests[request_id]
    log_message(f"Timeout waiting for browser response for article {article['id']}, config: {config}")
    return create_mock_result(article, config)

def create_mock_result(article, config=None):
    """Create mock evaluation result for demonstration"""
    # Mock browser summary (used as fallback when browser API fails)
    config_desc = f" using {config} configuration" if config else ""
    mock_summary = f"This article discusses key topics related to article {article['id']}{config_desc}. The main points cover important aspects of the subject matter."
    
    # Calculate ROUGE scores
    rouge_scores = evaluator.calculate_rouge_scores(
        article['reference_summary'], 
        mock_summary
    )
    
    return {
        'article_id': article['id'],
        'configuration': config or 'unknown',
        'article_length': len(article['article']),
        'reference_summary': article['reference_summary'],
        'generated_summary': mock_summary,
        'rouge_scores': rouge_scores,
        'timestamp': datetime.now().isoformat(),
        'source': 'mock_fallback'
    }

def log_message(message):
    """Add message to logs"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    evaluation_state['logs'].append(log_entry)
    logger.info(message)
    socketio.emit('log_update', {'message': log_entry})

@socketio.on('connect')
def handle_connect():
    log_message("Client connected")
    emit('status_update', evaluation_state)

@socketio.on('disconnect')
def handle_disconnect():
    log_message("Client disconnected")

@socketio.on('summarization_result')
def handle_summarization_result(data):
    """Handle summarization result from browser"""
    request_id = data.get('request_id')
    article_id = data.get('article_id')
    generated_summary = data.get('summary', '')
    error_message = data.get('error')
    
    log_message(f"Received summarization for article {article_id} (request: {request_id})")
    
    # Find the pending request
    if hasattr(wait_for_browser_response, 'pending_requests') and request_id in wait_for_browser_response.pending_requests:
        request_data = wait_for_browser_response.pending_requests[request_id]
        article = request_data['article']
        config = request_data.get('config')
        
        if error_message:
            log_message(f"Error in browser summarization: {error_message}")
            result = create_mock_result(article, config)  # Fallback to mock
        else:
            # Calculate actual ROUGE scores with browser summary
            rouge_scores = evaluator.calculate_rouge_scores(
                article['reference_summary'], 
                generated_summary
            )
            
            result = {
                'article_id': article['id'],
                'configuration': config or 'unknown',
                'article_length': len(article['article']),
                'reference_summary': article['reference_summary'],
                'generated_summary': generated_summary,
                'rouge_scores': rouge_scores,
                'timestamp': datetime.now().isoformat(),
                'source': 'browser_api'
            }
        
        # Mark as completed
        request_data['result'] = result
        request_data['completed'] = True
        
    emit('summarization_acknowledged', {'request_id': request_id, 'article_id': article_id})

if __name__ == '__main__':
    # Create results directory
    os.makedirs(config.RESULTS_DIR, exist_ok=True)
    
    log_message("Starting summarization evaluation server...")
    log_message(f"Configuration: Max articles={config.MAX_ALLOWED_ARTICLES}, Timeout={config.SUMMARIZER_TIMEOUT}s")
    socketio.run(app, host=config.SERVER_HOST, port=config.SERVER_PORT, debug=config.DEBUG_MODE)
