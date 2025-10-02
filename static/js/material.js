// Global variables
let socket = null;
let isEvaluating = false;
let totalItems = 0;
let completedItems = 0;
let evaluationResults = [];
let availableDatasets = [];
let currentDataset = 'sample';

// Material Design Components
let textFields = [];
let selects = [];
let radios = [];
let linearProgresses = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMaterialComponents();
    initializeSocketIO();
    initializeTheme();
    checkSummarizerSupport();
    loadAvailableDatasets();
    initializeEventListeners();
    updateConfigPreview();
});

// Initialize Material Design Components
function initializeMaterialComponents() {
    // Initialize text fields
    document.querySelectorAll('.mdc-text-field').forEach(el => {
        const textField = new mdc.textField.MDCTextField(el);
        textFields.push(textField);
    });

    // Initialize select fields
    document.querySelectorAll('.mdc-select').forEach(el => {
        const select = new mdc.select.MDCSelect(el);
        selects.push(select);
        
        // Add change listener for configuration preview
        if (el.id === 'config-type' || el.id === 'config-length' || el.id === 'config-format') {
            select.listen('MDCSelect:change', updateConfigPreview);
        }
    });

    // Initialize radio buttons
    document.querySelectorAll('.mdc-radio').forEach(el => {
        const radio = new mdc.radio.MDCRadio(el);
        radios.push(radio);
    });

    // Initialize linear progress bars
    document.querySelectorAll('.mdc-linear-progress').forEach(el => {
        const progress = new mdc.linearProgress.MDCLinearProgress(el);
        linearProgresses.push(progress);
    });

    // Initialize ripples on buttons
    document.querySelectorAll('.mdc-button').forEach(el => {
        new mdc.ripple.MDCRipple(el);
    });

    // Initialize ripples on list items
    document.querySelectorAll('.mdc-list-item').forEach(el => {
        new mdc.ripple.MDCRipple(el);
    });

    // Initialize Bootstrap tooltips
    initializeTooltips();
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    // Dispose of existing tooltips first to avoid duplicates
    const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    existingTooltips.forEach(el => {
        const existingTooltip = bootstrap.Tooltip.getInstance(el);
        if (existingTooltip) {
            existingTooltip.dispose();
        }
    });
    
    // Initialize new tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            html: true,
            delay: { show: 500, hide: 100 },
            boundary: 'viewport'
        });
    });
}

// Initialize Socket.IO connection
function initializeSocketIO() {
    socket = io();
    
    socket.on('connect', function() {
        addLog('Connected to server', 'success');
    });
    
    socket.on('disconnect', function() {
        addLog('Disconnected from server', 'warning');
    });
    
    socket.on('progress_update', function(data) {
        // Use current/total for sequential numbering instead of article_id
        const currentArticle = data.current ? `Processing article ${data.current}/${data.total}` : 'Processing...';
        updateProgress(data.current, data.total, currentArticle);
    });
    
    socket.on('article_completed', function(data) {
        handleArticleCompleted(data);
    });
    
    socket.on('evaluation_completed', function(data) {
        handleEvaluationComplete(data);
    });
    
    socket.on('error', function(data) {
        addLog(`Error: ${data.message}`, 'error');
        setEvaluationState(false);
    });

    socket.on('downloadprogress', function(data) {
        console.log('Download progress:', data);
        updateDownloadProgress(data.loaded, data.total);
    });

    socket.on('evaluation_started', function(data) {
        addLog(`Evaluation started with ${data.total_articles} articles from ${data.dataset}`, 'success');
        updateProgress(0, data.total_articles, 'Starting...');
    });

    socket.on('log_update', function(data) {
        addLog(data.message, 'info');
    });

    socket.on('summarize_request', function(data) {
        // Handle summarization requests from backend
        handleSummarizeRequest(data);
    });
}

// Initialize theme system
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    console.log('Initializing theme system...', { themeToggle, themeIcon });
    
    if (!themeToggle || !themeIcon) {
        console.error('Theme toggle elements not found!');
        return;
    }
    
    // Get stored theme or default to auto
    const currentTheme = localStorage.getItem('theme') || 'auto';
    setTheme(currentTheme);
    
    // Remove any existing event listeners
    themeToggle.removeEventListener('click', handleThemeToggle);
    
    // Add fresh event listener
    themeToggle.addEventListener('click', handleThemeToggle);
    
    console.log('Theme system initialized');
}

function handleThemeToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Theme toggle clicked');
    
    // Get the stored theme (not the applied theme) to determine next state
    const currentStoredTheme = localStorage.getItem('theme') || 'auto';
    let newTheme;
    
    if (currentStoredTheme === 'light') {
        newTheme = 'dark';
    } else if (currentStoredTheme === 'dark') {
        newTheme = 'auto';
    } else { // auto
        newTheme = 'light';
    }
    
    console.log('Switching theme from', currentStoredTheme, 'to', newTheme);
    setTheme(newTheme);
}

function setTheme(theme) {
    const themeIcon = document.getElementById('theme-icon');
    
    console.log('Setting theme to:', theme);
    
    if (!themeIcon) {
        console.error('Theme icon element not found!');
        return;
    }
    
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const appliedTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', appliedTheme);
        themeIcon.textContent = 'brightness_auto';
        console.log('Applied auto theme:', appliedTheme);
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme);
        themeIcon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
        console.log('Applied theme:', theme);
    }
    
    localStorage.setItem('theme', theme);
}

// Initialize event listeners
function initializeEventListeners() {
    // Evaluation mode radio buttons
    document.querySelectorAll('input[name="evaluationMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const singleConfigOptions = document.getElementById('single-config-options');
            singleConfigOptions.style.display = this.value === 'single' ? 'block' : 'none';
        });
    });

    // Dataset selection
    const datasetSelect = selects.find(s => s.root.querySelector('#dataset-select'));
    if (datasetSelect) {
        datasetSelect.listen('MDCSelect:change', function() {
            currentDataset = datasetSelect.value;
            updateDatasetDescription();
        });
    }
}

// Check if Summarizer API is supported
async function checkSummarizerSupport() {
    const statusElement = document.getElementById('summarizer-status');
    const downloadSection = document.getElementById('download-section');
    
    try {
        // Check for the global Summarizer API (latest spec)
        if (typeof Summarizer !== 'undefined') {
            addLog('Found global Summarizer API', 'info');
            
            // Check availability
            if (typeof Summarizer.availability === 'function') {
                const availability = await Summarizer.availability();
                addLog('Availability check: ' + availability, 'info');
                
                if (availability === 'available') {
                    statusElement.innerHTML = `
                        <span class="material-icons text-success">check_circle</span>
                        API supported and model ready
                    `;
                    statusElement.className = 'status-indicator available';
                } else if (availability === 'downloadable') {
                    statusElement.innerHTML = `
                        <span class="material-icons text-warning">download</span>
                        API supported, model needs download
                    `;
                    statusElement.className = 'status-indicator checking';
                    downloadSection.style.display = 'block';
                } else if (availability === 'downloading') {
                    statusElement.innerHTML = `
                        <span class="material-icons text-warning">hourglass_empty</span>
                        API downloading, please wait...
                    `;
                    statusElement.className = 'status-indicator checking';
                    downloadSection.style.display = 'none';
                } else {
                    statusElement.innerHTML = `
                        <span class="material-icons text-danger">error</span>
                        API not available on this device
                    `;
                    statusElement.className = 'status-indicator unavailable';
                }
            } else {
                // Try to create a summarizer directly to test
                try {
                    const testSummarizer = await Summarizer.create({
                        sharedContext: "Test creation",
                        type: "tldr",
                        length: "short",
                        format: "plain-text"
                    });
                    if (testSummarizer) {
                        statusElement.innerHTML = `
                            <span class="material-icons text-success">check_circle</span>
                            API supported and ready (direct test)
                        `;
                        statusElement.className = 'status-indicator available';
                        testSummarizer.destroy && testSummarizer.destroy();
                        addLog('Direct Summarizer creation test successful', 'success');
                    }
                } catch (createError) {
                    throw createError;
                }
            }
        } else {
            throw new Error('Summarizer API not found');
        }
    } catch (error) {
        statusElement.innerHTML = `
            <span class="material-icons text-danger">error</span>
            API not supported: ${error.message}
        `;
        statusElement.className = 'status-indicator unavailable';
        addLog(`Summarizer API check failed: ${error.message}`, 'error');
    }
}

// Download model with progress tracking
async function downloadModel() {
    const downloadBtn = document.getElementById('download-model-btn');
    const progressContainer = document.getElementById('download-progress-container');
    const progressBar = document.getElementById('download-progress');
    const percentageSpan = document.getElementById('download-percentage');
    
    try {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <span class="material-icons mdc-button__icon">hourglass_empty</span>
            <span class="mdc-button__label">Downloading...</span>
        `;
        progressContainer.style.display = 'block';
        
        addLog('Starting model download...', 'info');
        
        // Create a monitor for download progress
        const monitor = (event) => {
            if (event.type === 'downloadprogress') {
                const percentage = (event.loaded / event.total) * 100;
                
                // Update progress bar
                const progress = event.loaded / event.total;
                progressBar.style.setProperty('--mdc-linear-progress-primary-half', progress);
                percentageSpan.textContent = `${Math.round(percentage)}%`;
                
                addLog(`Download progress: ${Math.round(percentage)}%`, 'info');
            }
        };
        
        // Create summarizer with monitor for real download progress
        const summarizer = await Summarizer.create({
            sharedContext: "Downloading model for summarization",
            type: 'tldr',
            length: 'short',
            format: 'plain-text',
            monitor: monitor
        });
        
        // Download complete
        progressContainer.style.display = 'none';
        downloadBtn.innerHTML = `
            <span class="material-icons mdc-button__icon">check</span>
            <span class="mdc-button__label">Downloaded</span>
        `;
        
        addLog('Model download completed successfully!', 'success');
        
        // Update status
        await checkSummarizerSupport();
        
    } catch (error) {
        addLog(`Download failed: ${error.message}`, 'error');
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <span class="material-icons mdc-button__icon">download</span>
            <span class="mdc-button__label">Download Model</span>
        `;
        progressContainer.style.display = 'none';
    }
}

// Test summarizer functionality
async function testSummarizer() {
    try {
        addLog('Testing Summarizer API...', 'info');
        
        const summarizer = await Summarizer.create({
            sharedContext: "A test to verify the summarization functionality is working correctly",
            type: 'tldr',
            length: 'short',
            format: 'plain-text'
        });
        
        const testText = "The quick brown fox jumps over the lazy dog. This is a simple test sentence to verify that the summarizer API is working correctly. The sentence contains common English words and should be easy to summarize.";
        
        const summary = await summarizer.summarize(testText);
        addLog(`Test successful! Summary: "${summary}"`, 'success');
        
        if (summarizer.destroy) {
            summarizer.destroy();
        }
    } catch (error) {
        addLog(`Test failed: ${error.message}`, 'error');
    }
}

// Load available datasets
async function loadAvailableDatasets() {
    try {
        const response = await fetch('/api/datasets');
        const data = await response.json();
        
        // Handle the response structure from the backend
        availableDatasets = data.datasets || data; // Support both formats
        const defaultDataset = data.default || 'sample';
        
        const datasetSelect = document.getElementById('dataset-select');
        const datasetMenu = document.getElementById('dataset-menu');
        
        // Clear existing options
        datasetSelect.innerHTML = '';
        datasetMenu.innerHTML = '';
        
        // Convert to array if it's an object
        let datasets = [];
        if (Array.isArray(availableDatasets)) {
            datasets = availableDatasets;
        } else if (typeof availableDatasets === 'object') {
            datasets = Object.entries(availableDatasets).map(([key, value]) => ({
                id: key,
                name: value.name || key,
                description: value.description || 'No description available'
            }));
        }
        
        // Add options
        if (datasets && datasets.length > 0) {
            datasets.forEach((dataset, index) => {
                const datasetId = dataset.id || dataset.key;
                const datasetName = dataset.name || dataset.id;
            
            // Add to hidden select
            const option = document.createElement('option');
            option.value = datasetId;
            option.textContent = datasetName;
            if (index === 0 || datasetId === defaultDataset) option.selected = true;
            datasetSelect.appendChild(option);
            
            // Add to Material Design menu
            const listItem = document.createElement('li');
            listItem.className = `mdc-list-item${(index === 0 || datasetId === defaultDataset) ? ' mdc-list-item--selected' : ''}`;
            listItem.setAttribute('data-value', datasetId);
            listItem.innerHTML = `
                <span class="mdc-list-item__ripple"></span>
                <span class="mdc-list-item__text">${datasetName}</span>
            `;
            datasetMenu.appendChild(listItem);
            });
        }
        
        // Store datasets in the format expected by other functions
        availableDatasets = datasets || [];
        
        // Reinitialize the select component
        const selectElement = document.querySelector('.mdc-select');
        if (selectElement) {
            const select = new mdc.select.MDCSelect(selectElement);
            select.listen('MDCSelect:change', function() {
                currentDataset = select.value;
                updateDatasetDescription();
            });
            
            // Update selects array
            selects = selects.filter(s => s.root !== selectElement);
            selects.push(select);
        }
        
        // Set initial dataset
        if (datasets.length > 0) {
            currentDataset = datasets[0].id || datasets[0].key;
            updateDatasetDescription();
        }
        
        addLog(`Loaded ${datasets.length} available datasets`, 'success');
    } catch (error) {
        addLog(`Failed to load datasets: ${error.message}`, 'error');
        
        // Fallback to sample dataset
        availableDatasets = [{
            id: 'sample',
            name: 'Sample Articles',
            description: 'Built-in sample articles for testing'
        }];
        currentDataset = 'sample';
        updateDatasetDescription();
    }
}

// Update dataset description
function updateDatasetDescription() {
    const dataset = availableDatasets.find(d => (d.id || d.key) === currentDataset);
    const descriptionElement = document.getElementById('dataset-description');
    
    if (dataset && descriptionElement) {
        descriptionElement.textContent = dataset.description || 'No description available';
    }
}

// Update configuration preview
function updateConfigPreview() {
    if (!selects || selects.length === 0) {
        return;
    }
    
    const typeSelect = selects.find(s => s && s.root && s.root.querySelector('#config-type'));
    const lengthSelect = selects.find(s => s && s.root && s.root.querySelector('#config-length'));
    const formatSelect = selects.find(s => s && s.root && s.root.querySelector('#config-format'));
    
    if (typeSelect && lengthSelect && formatSelect && typeSelect.value && lengthSelect.value && formatSelect.value) {
        const config = `${typeSelect.value}_${lengthSelect.value}_${formatSelect.value}`;
        const preview = document.getElementById('config-preview');
        if (preview) {
            preview.textContent = config;
        }
    }
}

// Start evaluation
async function startEvaluation() {
    if (isEvaluating) return;
    
    const maxArticles = parseInt(document.getElementById('max-articles').value);
    const evaluationMode = document.querySelector('input[name="evaluationMode"]:checked').value;
    
    let config = null;
    if (evaluationMode === 'single') {
        // Find MDC selects by looking for their parent containers that contain the hidden selects
        const configContainer = document.querySelector('.row:has(#config-type)') || document.querySelector('.row').parentElement;
        let typeValue = 'tldr', lengthValue = 'short', formatValue = 'plain-text';
        
        // Try to find the MDC selects by their position/relationship to hidden selects
        const configSelects = selects.filter(select => {
            const container = select && select.root && select.root.parentElement;
            return container && container.querySelector('select[id^="config-"]');
        });
        
        console.log('Found config selects:', configSelects ? configSelects.length : 0);
        
        // Get values from the hidden native selects (they should have the correct values)
        const typeElement = document.getElementById('config-type');
        const lengthElement = document.getElementById('config-length'); 
        const formatElement = document.getElementById('config-format');
        
        if (typeElement) typeValue = typeElement.value;
        if (lengthElement) lengthValue = lengthElement.value;
        if (formatElement) formatValue = formatElement.value;
        
        // Also try to get values from MDC selects if available
        if (configSelects.length >= 3) {
            if (configSelects[0].value) typeValue = configSelects[0].value;
            if (configSelects[1].value) lengthValue = configSelects[1].value;
            if (configSelects[2].value) formatValue = configSelects[2].value;
        }
        
        config = {
            type: typeValue,
            length: lengthValue,
            format: formatValue
        };
        
        console.log('Single config mode - using config:', config);
    }
    
    setEvaluationState(true);
    clearResults();
    
    const requestData = {
        max_articles: maxArticles,
        selected_dataset: currentDataset,
        evaluation_mode: evaluationMode
    };
    
    // Only add selected_config for single mode
    if (evaluationMode === 'single' && config && config.type && config.length && config.format) {
        requestData.selected_config = `${config.type}_${config.length}_${config.format}`;
    }
    
    addLog(`Starting evaluation with ${maxArticles} articles from ${currentDataset} dataset`, 'info');
    if (config && config.type && config.length && config.format) {
        addLog(`Using single configuration: ${config.type}_${config.length}_${config.format}`, 'info');
    } else {
        addLog('Using all configurations mode', 'info');
    }
    
    console.log('Request data being sent:', requestData);
    
    try {
        const response = await fetch('/api/start_evaluation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        if (result.message && result.message.includes('started')) {
            addLog('Evaluation started successfully', 'success');
        } else {
            throw new Error(result.error || result.message || 'Failed to start evaluation');
        }
    } catch (error) {
        addLog(`Failed to start evaluation: ${error.message}`, 'error');
        setEvaluationState(false);
    }
}

// Stop evaluation
async function stopEvaluation() {
    try {
        const response = await fetch('/api/stop_evaluation', { method: 'POST' });
        const result = await response.json();
        
        if (result.message && result.message.includes('stopped')) {
            addLog('Evaluation stopped', 'warning');
            setEvaluationState(false);
        }
    } catch (error) {
        addLog(`Failed to stop evaluation: ${error.message}`, 'error');
    }
}

// Set evaluation state
function setEvaluationState(evaluating) {
    isEvaluating = evaluating;
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    startBtn.disabled = evaluating;
    stopBtn.disabled = !evaluating;
    
    if (evaluating) {
        startBtn.innerHTML = `
            <span class="material-icons mdc-button__icon">hourglass_empty</span>
            <span class="mdc-button__label">Evaluating...</span>
        `;
    } else {
        startBtn.innerHTML = `
            <span class="material-icons mdc-button__icon">play_arrow</span>
            <span class="mdc-button__label">Start Evaluation</span>
        `;
        updateProgress(0, 0, 'Ready to start');
    }
}

// Update progress
function updateProgress(completed, total, currentArticle) {
    completedItems = completed;
    totalItems = total;
    
    const progressText = document.getElementById('progress-text');
    const currentArticleElement = document.getElementById('current-article');
    const progressBar = document.getElementById('main-progress');
    
    if (progressText) {
        progressText.textContent = `${completed} / ${total}`;
    }
    
    if (currentArticleElement) {
        currentArticleElement.textContent = currentArticle;
    }
    
    if (progressBar && total > 0) {
        const progress = completed / total;
        progressBar.style.setProperty('--mdc-linear-progress-primary-half', progress);
    }
}

// Handle article completed
function handleArticleCompleted(data) {
  const articleId =
    data.article_id !== undefined && data.article_id !== null
      ? data.article_id
      : 'Unknown';
  const config = data.configuration || data.config || 'unknown';
  const generatedSummary = data.generated_summary || data.summary || '';
  const referenceSummary = data.reference_summary || '';
  const rougeScores = data.rouge_scores || {};

  // Enhanced logging for debugging multiple configurations
  console.log('handleArticleCompleted called with data:', {
    articleId,
    config,
    generatedSummaryLength: generatedSummary ? generatedSummary.length : 0,
    referenceSummaryLength: referenceSummary ? referenceSummary.length : 0,
    hasRougeScores: rougeScores ? Object.keys(rougeScores).length > 0 : false,
    fullData: data,
  });

  addLog(`Article ${articleId} completed with config ${config}`, 'info');

  // Convert backend data format to frontend format
  const result = {
    article_id: articleId,
    config: config,
    generated_summary: generatedSummary,
    reference_summary: referenceSummary,
    rouge_scores: rougeScores,
    compression_ratio: data.compression_ratio,
    processing_time: data.processing_time,
    article_length: data.article_length,
  };

  evaluationResults.push(result);
  addResultToTable(result);
  updateSummaryMetrics();

  // Log the result data that we have (use generated summary for output logs)
  logOutputData(articleId, config, generatedSummary, rougeScores);

  // Force table scroll to show the new result
  const tableContainer = document.querySelector('.results-table-container');
  if (tableContainer) {
    // Small delay to ensure the row is rendered
    setTimeout(() => {
      tableContainer.scrollTop = tableContainer.scrollHeight;
    }, 100);
  }
}

// Handle evaluation complete
function handleEvaluationComplete(data) {
  addLog('Evaluation completed!', 'success');
  setEvaluationState(false);

  if (data.results && data.results.length > 0) {
    data.results.forEach((result) => {
      if (
        !evaluationResults.find(
          (r) =>
            r.article_id === result.article_id && r.config === result.config,
        )
      ) {
        evaluationResults.push(result);
        addResultToTable(result);
      }
    });
  }

  updateSummaryMetrics();
  showConfigurationAnalysis();
}

// Add result to table
function addResultToTable(result) {
  const tbody = document.getElementById('results-tbody');
  
  if (!tbody) {
    console.error('Results table body not found');
    return;
  }

  // Remove "No results" message
  if (tbody.children.length === 1 && tbody.children[0] && tbody.children[0].children.length === 1) {
    tbody.innerHTML = '';
  }

  const row = document.createElement('tr');
  row.className = 'mdc-data-table__row';
  row.setAttribute('role', 'row');

  const rouge1 = result.rouge_scores?.rouge1 ?? 'N/A';
  const rouge2 = result.rouge_scores?.rouge2 ?? 'N/A';
  const rougeL = result.rouge_scores?.rougeL ?? 'N/A';

  const rouge1Str = typeof rouge1 === 'number' ? rouge1.toFixed(3) : rouge1;
  const rouge2Str = typeof rouge2 === 'number' ? rouge2.toFixed(3) : rouge2;
  const rougeLStr = typeof rougeL === 'number' ? rougeL.toFixed(3) : rougeL;

  // Prepare tooltip content for generated summary
  const generatedSummary = result.generated_summary || 'N/A';
  const summaryPreview =
    generatedSummary.length > 100
      ? generatedSummary.substring(0, 100) + '...'
      : generatedSummary;
  const summaryTooltip =
    generatedSummary.length > 100
      ? `data-bs-toggle="tooltip" data-bs-placement="top" title="${escapeHtml(
          generatedSummary,
        )}"`
      : '';

  // Prepare tooltip content for reference summary
  const referenceSummary = result.reference_summary || 'N/A';
  const referencePreview =
    referenceSummary.length > 50
      ? referenceSummary.substring(0, 50) + '...'
      : referenceSummary;
  const referenceTooltip =
    referenceSummary.length > 50
      ? `data-bs-toggle="tooltip" data-bs-placement="top" title="${escapeHtml(
          referenceSummary,
        )}"`
      : '';

  // Prepare configuration tooltip
  const configTooltip = `data-bs-toggle="tooltip" data-bs-placement="top" title="Generated Summary: ${escapeHtml(
    summaryPreview,
  )}<br><br>Reference Summary: ${escapeHtml(referencePreview)}"`;

  row.innerHTML = `
        <td class="mdc-data-table__cell" role="cell">${result.article_id}</td>
        <td class="mdc-data-table__cell" role="cell">
            <code ${configTooltip}>${
    result.config || result.configuration || 'N/A'
  }</code>
        </td>
        <td class="mdc-data-table__cell" role="cell" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            title="Article: ${
              result.article_length || 'N/A'
            } chars | Summary: ${
    result.generated_summary ? result.generated_summary.length : 'N/A'
  } chars">
            ${result.article_length || 'N/A'}
        </td>
        <td class="mdc-data-table__cell" role="cell" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            title="ROUGE-1 measures unigram overlap between generated and reference summaries">
            ${rouge1Str}
        </td>
        <td class="mdc-data-table__cell" role="cell" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            title="ROUGE-2 measures bigram overlap between generated and reference summaries">
            ${rouge2Str}
        </td>
        <td class="mdc-data-table__cell" role="cell" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            title="ROUGE-L measures longest common subsequence between summaries">
            ${rougeLStr}
        </td>
        <td class="mdc-data-table__cell" role="cell" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            title="Compression ratio: ${
              result.compression_ratio
                ? result.compression_ratio.toFixed(2) + ':1'
                : 'N/A'
            } (original length ÷ summary length)">
            ${
              result.compression_ratio
                ? result.compression_ratio.toFixed(2)
                : 'N/A'
            }
        </td>
        <td class="mdc-data-table__cell" role="cell" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            title="Time taken to generate this summary">
            ${
              result.processing_time
                ? result.processing_time.toFixed(2) + 's'
                : 'N/A'
            }
        </td>
    `;

  tbody.appendChild(row);

  // Initialize tooltips for the new row
  initializeTooltips();

  // Add visual feedback for new row
  row.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
  setTimeout(() => {
    row.style.backgroundColor = '';
  }, 2000);
}

// Helper function to escape HTML for tooltips
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;');
}

// Update summary metrics
function updateSummaryMetrics() {
  const totalArticlesElement = document.getElementById('total-articles');
  const totalConfigsElement = document.getElementById('total-configs');
  const avgRouge1Element = document.getElementById('avg-rouge1');
  const avgRouge2Element = document.getElementById('avg-rouge2');
  const avgRougeLElement = document.getElementById('avg-rougeL');
  const bestConfigElement = document.getElementById('best-config');

  // Count unique articles and configs
  const uniqueArticles = new Set(evaluationResults.map((r) => r.article_id))
    .size;
  const uniqueConfigs = new Set(evaluationResults.map((r) => r.config)).size;

  // Calculate averages for results with valid ROUGE scores
  const validResults = evaluationResults.filter(
    (r) =>
      r.rouge_scores &&
      typeof r.rouge_scores.rouge1 === 'number' &&
      typeof r.rouge_scores.rouge2 === 'number' &&
      typeof r.rouge_scores.rougeL === 'number',
  );

  let avgRouge1 = 0,
    avgRouge2 = 0,
    avgRougeL = 0;
  if (validResults.length > 0) {
    avgRouge1 =
      validResults.reduce((sum, r) => sum + r.rouge_scores.rouge1, 0) /
      validResults.length;
    avgRouge2 =
      validResults.reduce((sum, r) => sum + r.rouge_scores.rouge2, 0) /
      validResults.length;
    avgRougeL =
      validResults.reduce((sum, r) => sum + r.rouge_scores.rougeL, 0) /
      validResults.length;
  }

  // Find best configuration
  let bestConfig = 'N/A';
  if (validResults.length > 0) {
    const bestResult = validResults.reduce((best, current) =>
      current.rouge_scores.rouge1 > best.rouge_scores.rouge1 ? current : best,
    );
    bestConfig = bestResult.config;
  }

  // Update elements
  if (totalArticlesElement) totalArticlesElement.textContent = uniqueArticles;
  if (totalConfigsElement) totalConfigsElement.textContent = uniqueConfigs;
  if (avgRouge1Element) avgRouge1Element.textContent = avgRouge1.toFixed(3);
  if (avgRouge2Element) avgRouge2Element.textContent = avgRouge2.toFixed(3);
  if (avgRougeLElement) avgRougeLElement.textContent = avgRougeL.toFixed(3);
  if (bestConfigElement) bestConfigElement.textContent = bestConfig;

  // Reinitialize tooltips for updated content
  initializeTooltips();
}

// Show configuration analysis
function showConfigurationAnalysis() {
  const configComparison = document.getElementById('config-comparison');
  const chartsContainer = document.getElementById('config-charts-container');

  if (evaluationResults.length === 0) return;

  configComparison.style.display = 'block';
  chartsContainer.innerHTML = '';

  // Group results by configuration
  const configGroups = {};
  evaluationResults.forEach((result) => {
    if (!result.rouge_scores || typeof result.rouge_scores.rouge1 !== 'number')
      return;

    if (!configGroups[result.config]) {
      configGroups[result.config] = [];
    }
    configGroups[result.config].push(result);
  });

  // Create summary chart
  const chartDiv = document.createElement('div');
  chartDiv.className = 'config-chart';
  chartDiv.innerHTML = `
        <h3 class="mdc-typography--subtitle1">Configuration Performance</h3>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Configuration</th>
                        <th>Articles</th>
                        <th>Avg ROUGE-1</th>
                        <th>Avg ROUGE-2</th>
                        <th>Avg ROUGE-L</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(configGroups)
                      .map(([config, results]) => {
                        const avgRouge1 =
                          results.reduce(
                            (sum, r) => sum + r.rouge_scores.rouge1,
                            0,
                          ) / results.length;
                        const avgRouge2 =
                          results.reduce(
                            (sum, r) => sum + r.rouge_scores.rouge2,
                            0,
                          ) / results.length;
                        const avgRougeL =
                          results.reduce(
                            (sum, r) => sum + r.rouge_scores.rougeL,
                            0,
                          ) / results.length;

                        return `
                            <tr>
                                <td><code>${config}</code></td>
                                <td>${results.length}</td>
                                <td>${avgRouge1.toFixed(3)}</td>
                                <td>${avgRouge2.toFixed(3)}</td>
                                <td>${avgRougeL.toFixed(3)}</td>
                            </tr>
                        `;
                      })
                      .join('')}
                </tbody>
            </table>
        </div>
    `;

  chartsContainer.appendChild(chartDiv);
}

// Clear results
function clearResults() {
  evaluationResults = [];

  const tbody = document.getElementById('results-tbody');
  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center text-muted p-4">No results yet</td></tr>';

  updateSummaryMetrics();

  const configComparison = document.getElementById('config-comparison');
  configComparison.style.display = 'none';

  // Clear data logs as well when starting a new evaluation
  clearInputLogs();
  clearOutputLogs();
}

// Export results
function exportResults() {
  if (evaluationResults.length === 0) {
    addLog('No results to export', 'warning');
    return;
  }

  const csvContent = [
    [
      'Article ID',
      'Configuration',
      'Article Length',
      'Generated Summary',
      'Generated Summary Length',
      'Reference Summary',
      'Reference Summary Length',
      'ROUGE-1',
      'ROUGE-2',
      'ROUGE-L',
      'Compression Ratio',
      'Processing Time',
    ],
    ...evaluationResults.map((result) => [
      result.article_id,
      result.config,
      result.article_length || '',
      // Escape quotes and newlines in summary text for CSV
      result.generated_summary
        ? `"${result.generated_summary
            .replace(/"/g, '""')
            .replace(/\n/g, '\\n')}"`
        : '',
      result.generated_summary ? result.generated_summary.length : '',
      // Escape quotes and newlines in reference summary text for CSV
      result.reference_summary
        ? `"${result.reference_summary
            .replace(/"/g, '""')
            .replace(/\n/g, '\\n')}"`
        : '',
      result.reference_summary ? result.reference_summary.length : '',
      result.rouge_scores?.rouge1 ?? '',
      result.rouge_scores?.rouge2 ?? '',
      result.rouge_scores?.rougeL ?? '',
      result.compression_ratio ?? '',
      result.processing_time ?? '',
    ]),
  ]
    .map((row) => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `summarization_results_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:.]/g, '-')}.csv`;
  a.click();

  URL.revokeObjectURL(url);
  addLog('Results exported to CSV', 'success');
}

// Logging functions
function addLog(message, type = 'info') {
    const logs = document.getElementById('logs');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="text-muted">${timestamp}</span> ${message}`;
    
    logs.appendChild(logEntry);
    logs.scrollTop = logs.scrollHeight;
}

function logInputData(articleId, inputText) {
  const inputLogs = document.getElementById('input-logs');
  const timestamp = new Date().toLocaleTimeString();

  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry info';
  logEntry.setAttribute('data-article-id', articleId); // Add data attribute for tracking

  // Enhanced article display with better formatting
  const wordCount = inputText.split(/\s+/).length;
  const charCount = inputText.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  // Create a more intelligent truncation
  let displayText = inputText;
  let showExpandButton = false;

  if (inputText.length > 300) {
    // Find a good break point (end of sentence or paragraph)
    let truncateAt = 300;
    const sentenceBreak = inputText.lastIndexOf('.', 300);
    const paragraphBreak = inputText.lastIndexOf('\n', 300);

    if (sentenceBreak > 200) {
      truncateAt = sentenceBreak + 1;
    } else if (paragraphBreak > 200) {
      truncateAt = paragraphBreak;
    }

    displayText = inputText.substring(0, truncateAt).trim() + '...';
    showExpandButton = true;
  }

  // Format the text for better readability
  const formattedText = displayText
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p class="mb-2">')
    .replace(/$/, '</p>');

  const hasTooltip = inputText.length > 300;
  const tooltipAttrs = hasTooltip
    ? `data-bs-toggle="tooltip" data-bs-placement="top" title="${escapeHtml(
        'Click to view full article',
      )}"`
    : '';

  logEntry.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
                <strong>Article ${articleId}</strong> 
                <span class="text-muted">${timestamp}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <small class="text-muted">
                    ${charCount.toLocaleString()} chars • ${wordCount.toLocaleString()} words • ${readingTime} min read
                </small>
                <button class="btn btn-outline-secondary btn-sm copy-btn" 
                        onclick="copyToClipboard(this, '${escapeHtml(
                          inputText,
                        ).replace(/'/g, "\\'")}')"
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Copy full article to clipboard">
                    <span class="material-icons" style="font-size: 14px;">content_copy</span>
                </button>
            </div>
        </div>
        <div class="article-content" data-full-text="${escapeHtml(
          inputText,
        )}" ${tooltipAttrs}>
            <div class="article-text ${
              inputText.length > 300 ? 'expandable' : ''
            }">${formattedText}</div>
            ${
              showExpandButton
                ? `
                <button class="btn btn-link btn-sm p-0 mt-2 expand-article-btn" 
                        onclick="toggleArticleExpansion(this)"
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Click to expand/collapse full article">
                    <span class="material-icons align-middle me-1">expand_more</span>
                    Show full article
                </button>
            `
                : ''
            }
        </div>
    `;

  inputLogs.appendChild(logEntry);
  inputLogs.scrollTop = inputLogs.scrollHeight;

  // Initialize tooltips for new content
  if (hasTooltip || showExpandButton) {
    initializeTooltips();
  }
}

function logOutputData(articleId, config, summary, rougeScores) {
  const outputLogs = document.getElementById('output-logs');
  const timestamp = new Date().toLocaleTimeString();

  const rouge1 = rougeScores?.rouge1 ?? 'N/A';
  const rouge2 = rougeScores?.rouge2 ?? 'N/A';
  const rougeL = rougeScores?.rougeL ?? 'N/A';

  // Enhanced summary display
  const summaryWordCount = summary.split(/\s+/).length;
  const summaryCharCount = summary.length;

  // Check if we already have an entry for this article
  const existingArticleEntry = outputLogs.querySelector(
    `[data-article-id="${articleId}"]`,
  );

  if (existingArticleEntry) {
    // Add this configuration result to the existing article entry
    const configResult = document.createElement('div');
    configResult.className = 'config-result mt-2 p-3';
    configResult.style.borderLeft = '3px solid #2196f3';
    configResult.style.backgroundColor = 'rgba(33,150,243,0.05)';
    configResult.style.borderRadius = '0 4px 4px 0';

    // Enhanced summary truncation
    let displaySummary = summary;
    let showSummaryExpandButton = false;

    if (summary.length > 200) {
      let truncateAt = 200;
      const sentenceBreak = summary.lastIndexOf('.', 200);

      if (sentenceBreak > 100) {
        truncateAt = sentenceBreak + 1;
      }

      displaySummary = summary.substring(0, truncateAt).trim() + '...';
      showSummaryExpandButton = true;
    }

    const formattedSummary = displaySummary
      .replace(/\n\n/g, '</p><p class="mb-1">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-1">')
      .replace(/$/, '</p>');

    const hasSummaryTooltip = summary.length > 200;
    const summaryTooltipAttrs = hasSummaryTooltip
      ? `data-bs-toggle="tooltip" data-bs-placement="top" title="Click to expand/collapse summary"`
      : '';

    configResult.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <strong>Config:</strong> <code class="bg-light px-2 py-1 rounded">${config}</code>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <small class="text-muted">${timestamp}</small>
                    <button class="btn btn-outline-secondary btn-sm copy-btn" 
                            onclick="copyToClipboard(this, '${escapeHtml(
                              summary,
                            ).replace(/'/g, "\\'")}')"
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Copy summary to clipboard">
                        <span class="material-icons" style="font-size: 14px;">content_copy</span>
                    </button>
                </div>
            </div>
            <div class="mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="text-primary">Summary:</strong>
                    <small class="text-muted">${summaryCharCount} chars • ${summaryWordCount} words</small>
                </div>
                <div class="summary-content" data-full-text="${escapeHtml(
                  summary,
                )}" ${summaryTooltipAttrs}>
                    <div class="summary-text ${
                      summary.length > 200 ? 'expandable' : ''
                    } bg-light p-2 rounded">${formattedSummary}</div>
                    ${
                      showSummaryExpandButton
                        ? `
                        <button class="btn btn-link btn-sm p-0 mt-1 expand-summary-btn" 
                                onclick="toggleSummaryExpansion(this)"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Click to expand/collapse full summary">
                            <span class="material-icons align-middle me-1">expand_more</span>
                            Show full summary
                        </button>
                    `
                        : ''
                    }
                </div>
            </div>
            <div class="rouge-scores">
                <strong class="text-success">ROUGE Scores:</strong>
                <span class="badge bg-primary me-1" data-bs-toggle="tooltip" title="ROUGE-1: Unigram overlap">R1: ${
                  typeof rouge1 === 'number' ? rouge1.toFixed(3) : rouge1
                }</span>
                <span class="badge bg-info me-1" data-bs-toggle="tooltip" title="ROUGE-2: Bigram overlap">R2: ${
                  typeof rouge2 === 'number' ? rouge2.toFixed(3) : rouge2
                }</span>
                <span class="badge bg-success" data-bs-toggle="tooltip" title="ROUGE-L: Longest common subsequence">RL: ${
                  typeof rougeL === 'number' ? rougeL.toFixed(3) : rougeL
                }</span>
            </div>
        `;
    existingArticleEntry.appendChild(configResult);

    // Initialize tooltips for new content
    if (hasSummaryTooltip || showSummaryExpandButton) {
      initializeTooltips();
    }
  } else {
    // Create new article entry
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry success';
    logEntry.setAttribute('data-article-id', articleId);

    // Enhanced summary truncation for new entries
    let displaySummary = summary;
    let showSummaryExpandButton = false;

    if (summary.length > 200) {
      let truncateAt = 200;
      const sentenceBreak = summary.lastIndexOf('.', 200);

      if (sentenceBreak > 100) {
        truncateAt = sentenceBreak + 1;
      }

      displaySummary = summary.substring(0, truncateAt).trim() + '...';
      showSummaryExpandButton = true;
    }

    const formattedSummary = displaySummary
      .replace(/\n\n/g, '</p><p class="mb-1">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-1">')
      .replace(/$/, '</p>');

    const hasSummaryTooltip = summary.length > 200;
    const summaryTooltipAttrs = hasSummaryTooltip
      ? `data-bs-toggle="tooltip" data-bs-placement="top" title="Click to expand/collapse summary"`
      : '';

    logEntry.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <strong>Article ${articleId}</strong> 
                    <span class="text-muted">${timestamp}</span>
                </div>
                <button class="btn btn-outline-secondary btn-sm copy-btn" 
                        onclick="copyToClipboard(this, '${escapeHtml(
                          summary,
                        ).replace(/'/g, "\\'")}')"
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Copy summary to clipboard">
                    <span class="material-icons" style="font-size: 14px;">content_copy</span>
                </button>
            </div>
            <div class="config-result p-3" style="border-left: 3px solid #2196f3; background-color: rgba(33,150,243,0.05); border-radius: 0 4px 4px 0;">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>Config:</strong> <code class="bg-light px-2 py-1 rounded">${config}</code>
                </div>
                <div class="mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong class="text-primary">Summary:</strong>
                        <small class="text-muted">${summaryCharCount} chars • ${summaryWordCount} words</small>
                    </div>
                    <div class="summary-content" data-full-text="${escapeHtml(
                      summary,
                    )}" ${summaryTooltipAttrs}>
                        <div class="summary-text ${
                          summary.length > 200 ? 'expandable' : ''
                        } bg-light p-2 rounded">${formattedSummary}</div>
                        ${
                          showSummaryExpandButton
                            ? `
                            <button class="btn btn-link btn-sm p-0 mt-1 expand-summary-btn" 
                                    onclick="toggleSummaryExpansion(this)"
                                    data-bs-toggle="tooltip" 
                                    data-bs-placement="top" 
                                    title="Click to expand/collapse full summary">
                                <span class="material-icons align-middle me-1">expand_more</span>
                                Show full summary
                            </button>
                        `
                            : ''
                        }
                    </div>
                </div>
                <div class="rouge-scores">
                    <strong class="text-success">ROUGE Scores:</strong>
                    <span class="badge bg-primary me-1" data-bs-toggle="tooltip" title="ROUGE-1: Unigram overlap">R1: ${
                      typeof rouge1 === 'number' ? rouge1.toFixed(3) : rouge1
                    }</span>
                    <span class="badge bg-info me-1" data-bs-toggle="tooltip" title="ROUGE-2: Bigram overlap">R2: ${
                      typeof rouge2 === 'number' ? rouge2.toFixed(3) : rouge2
                    }</span>
                    <span class="badge bg-success" data-bs-toggle="tooltip" title="ROUGE-L: Longest common subsequence">RL: ${
                      typeof rougeL === 'number' ? rougeL.toFixed(3) : rougeL
                    }</span>
                </div>
            </div>
        `;
    outputLogs.appendChild(logEntry);

    // Initialize tooltips for new content
    if (hasSummaryTooltip || showSummaryExpandButton) {
      initializeTooltips();
    }
  }

  outputLogs.scrollTop = outputLogs.scrollHeight;
}

function clearLogs() {
  document.getElementById('logs').innerHTML = '';
}

function clearInputLogs() {
  document.getElementById('input-logs').innerHTML = '';
}

function clearOutputLogs() {
  document.getElementById('output-logs').innerHTML = '';
}

// Toggle article expansion
function toggleArticleExpansion(button) {
  const articleContent = button.closest('.article-content');
  const articleText = articleContent.querySelector('.article-text');
  const fullText = articleContent.getAttribute('data-full-text');
  const icon = button.querySelector('.material-icons');
  const buttonText =
    button.querySelector('span:last-child') || button.lastChild;

  if (articleText.classList.contains('expanded')) {
    // Collapse
    const originalText = fullText.substring(0, 300);
    let truncateAt = 300;
    const sentenceBreak = originalText.lastIndexOf('.', 300);
    const paragraphBreak = originalText.lastIndexOf('\n', 300);

    if (sentenceBreak > 200) {
      truncateAt = sentenceBreak + 1;
    } else if (paragraphBreak > 200) {
      truncateAt = paragraphBreak;
    }

    const displayText = fullText.substring(0, truncateAt).trim() + '...';
    const formattedText = displayText
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-2">')
      .replace(/$/, '</p>');

    articleText.innerHTML = formattedText;
    articleText.classList.remove('expanded');
    icon.textContent = 'expand_more';
    buttonText.textContent = ' Show full article';
    button.setAttribute('title', 'Click to expand full article');
  } else {
    // Expand
    const formattedText = fullText
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-2">')
      .replace(/$/, '</p>');

    articleText.innerHTML = formattedText;
    articleText.classList.add('expanded');
    icon.textContent = 'expand_less';
    buttonText.textContent = ' Hide full article';
    button.setAttribute('title', 'Click to collapse article');
  }

  // Update tooltip
  initializeTooltips();
}

// Toggle summary expansion
function toggleSummaryExpansion(button) {
  const summaryContent = button.closest('.summary-content');
  const summaryText = summaryContent.querySelector('.summary-text');
  const fullText = summaryContent.getAttribute('data-full-text');
  const icon = button.querySelector('.material-icons');
  const buttonText =
    button.querySelector('span:last-child') || button.lastChild;

  if (summaryText.classList.contains('expanded')) {
    // Collapse
    const originalText = fullText.substring(0, 200);
    let truncateAt = 200;
    const sentenceBreak = originalText.lastIndexOf('.', 200);

    if (sentenceBreak > 100) {
      truncateAt = sentenceBreak + 1;
    }

    const displayText = fullText.substring(0, truncateAt).trim() + '...';
    const formattedText = displayText
      .replace(/\n\n/g, '</p><p class="mb-1">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-1">')
      .replace(/$/, '</p>');

    summaryText.innerHTML = formattedText;
    summaryText.classList.remove('expanded');
    icon.textContent = 'expand_more';
    buttonText.textContent = ' Show full summary';
    button.setAttribute('title', 'Click to expand full summary');
  } else {
    // Expand
    const formattedText = fullText
      .replace(/\n\n/g, '</p><p class="mb-1">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-1">')
      .replace(/$/, '</p>');

    summaryText.innerHTML = formattedText;
    summaryText.classList.add('expanded');
    icon.textContent = 'expand_less';
    buttonText.textContent = ' Hide full summary';
    button.setAttribute('title', 'Click to collapse summary');
  }

  // Update tooltip
  initializeTooltips();
}

// Copy text to clipboard
async function copyToClipboard(button, text) {
  try {
    // Decode HTML entities
    const decodedText = text
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    await navigator.clipboard.writeText(decodedText);

    // Provide visual feedback
    const originalIcon = button.querySelector('.material-icons');
    const originalTooltip = button.getAttribute('title');

    // Change icon and tooltip to show success
    originalIcon.textContent = 'check';
    button.setAttribute('title', 'Copied to clipboard!');
    button.classList.add('btn-success');
    button.classList.remove('btn-outline-secondary');

    // Reset after 2 seconds
    setTimeout(() => {
      originalIcon.textContent = 'content_copy';
      button.setAttribute('title', originalTooltip);
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-secondary');

      // Reinitialize tooltips to update the text
      initializeTooltips();
    }, 2000);

    // Update tooltip immediately
    initializeTooltips();

    // Log successful copy
    console.log('Text copied to clipboard successfully');
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err);

    // Fallback for older browsers or when clipboard API is not available
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        // Show success feedback using fallback method
        const originalIcon = button.querySelector('.material-icons');
        const originalTooltip = button.getAttribute('title');

        originalIcon.textContent = 'check';
        button.setAttribute('title', 'Copied to clipboard!');
        button.classList.add('btn-success');
        button.classList.remove('btn-outline-secondary');

        setTimeout(() => {
          originalIcon.textContent = 'content_copy';
          button.setAttribute('title', originalTooltip);
          button.classList.remove('btn-success');
          button.classList.add('btn-outline-secondary');
          initializeTooltips();
        }, 2000);

        initializeTooltips();
        console.log('Text copied to clipboard using fallback method');
      } else {
        throw new Error('Fallback copy method failed');
      }
    } catch (fallbackErr) {
      console.error('Fallback copy method also failed:', fallbackErr);

      // Show error feedback
      const originalIcon = button.querySelector('.material-icons');
      const originalTooltip = button.getAttribute('title');

      originalIcon.textContent = 'error';
      button.setAttribute(
        'title',
        'Copy failed - please select and copy manually',
      );
      button.classList.add('btn-danger');
      button.classList.remove('btn-outline-secondary');

      setTimeout(() => {
        originalIcon.textContent = 'content_copy';
        button.setAttribute('title', originalTooltip);
        button.classList.remove('btn-danger');
        button.classList.add('btn-outline-secondary');
        initializeTooltips();
      }, 3000);

      initializeTooltips();
    }
  }
}

// Handle summarization request from backend
async function handleSummarizeRequest(data) {
  const { request_id, article_id, text, configuration } = data;

  try {
    addLog(
      `Processing summarization request for article ${article_id} with ${configuration}`,
      'info',
    );

    // Log the input text only once per article (check if we already logged this article)
    const existingInputLogs = document.getElementById('input-logs');
    const articleAlreadyLogged = existingInputLogs.querySelector(
      `[data-article-id="${article_id}"]`,
    );

    if (!articleAlreadyLogged) {
      logInputData(article_id, text);
    }

    // Parse configuration string (e.g., "tldr_short_plain-text")
    const [type, length, format] = configuration.split('_');

    // Create summarizer with the specified configuration
    const summarizer = await Summarizer.create({
      sharedContext: `Summarizing article ${article_id}`,
      type: type || 'tldr',
      length: length || 'short',
      format: format || 'plain-text',
    });

    // Generate summary
    const summary = await summarizer.summarize(text);

    // Send result back to backend
    socket.emit('summarization_result', {
      request_id: request_id,
      article_id: article_id,
      summary: summary,
    });

    // Clean up
    if (summarizer.destroy) {
      summarizer.destroy();
    }

    addLog(
      `Summary generated for article ${article_id}: "${summary.substring(
        0,
        100,
      )}..."`,
      'success',
    );
  } catch (error) {
    addLog(
      `Failed to generate summary for article ${article_id}: ${error.message}`,
      'error',
    );

    // Send error back to backend
    socket.emit('summarization_result', {
      request_id: request_id,
      article_id: article_id,
      error: error.message,
    });
  }
}

// Make functions globally accessible for HTML onclick handlers
window.testSummarizer = testSummarizer;
window.startEvaluation = startEvaluation;
window.stopEvaluation = stopEvaluation;
window.exportResults = exportResults;
window.clearResults = clearResults;
window.downloadModel = downloadModel;
window.toggleArticleExpansion = toggleArticleExpansion;
window.toggleSummaryExpansion = toggleSummaryExpansion;
window.copyToClipboard = copyToClipboard;
