// Initialize Socket.IO connection
const socket = io();

// Global variables
let evaluationRunning = false;
let summarizerSupported = false;
let currentSummarizer = null;
let results = [];
let configResults = new Map(); // Store results by configuration
let availableDatasets = {}; // Store available datasets

// Summarizer configuration options
const SUMMARIZER_CONFIGS = {
    types: ['tldr', 'key-points', 'teaser', 'headline'],
    lengths: ['short', 'medium', 'long'],
    formats: ['plain-text', 'markdown']
};

// Check browser summarizer support on page load
document.addEventListener('DOMContentLoaded', async function() {
    await checkSummarizerSupport();
    await loadAvailableDatasets();
});

async function loadAvailableDatasets() {
    try {
        const response = await fetch('/api/datasets');
        const data = await response.json();
        
        availableDatasets = data.datasets;
        const defaultDataset = data.default;
        
        // Populate dataset select dropdown
        const datasetSelect = document.getElementById('dataset-select');
        datasetSelect.innerHTML = '';
        
        for (const [key, dataset] of Object.entries(availableDatasets)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = dataset.name;
            if (key === defaultDataset) {
                option.selected = true;
            }
            datasetSelect.appendChild(option);
        }
        
        // Update description for default selection
        updateDatasetDescription();
        
        // Add change event listener
        datasetSelect.addEventListener('change', updateDatasetDescription);
        
        addLog('Loaded available datasets');
    } catch (error) {
        addLog('Error loading datasets: ' + error.message);
    }
}

function updateDatasetDescription() {
    const datasetSelect = document.getElementById('dataset-select');
    const descriptionDiv = document.getElementById('dataset-description');
    
    const selectedDataset = datasetSelect.value;
    if (selectedDataset && availableDatasets[selectedDataset]) {
        descriptionDiv.textContent = availableDatasets[selectedDataset].description;
    } else {
        descriptionDiv.textContent = 'Select a dataset to see description';
    }
}

async function checkSummarizerSupport() {
    const statusDiv = document.getElementById('summarizer-status');
    
    try {
        // Check for the global Summarizer API (latest spec)
        if (typeof Summarizer !== 'undefined') {
            addLog('Found global Summarizer API');
            
            // Check availability
            if (typeof Summarizer.availability === 'function') {
                const availability = await Summarizer.availability();
                addLog('Availability check: ' + availability);
                
                if (availability === 'available') {
                    statusDiv.innerHTML = '✅ Summarizer API is supported and ready';
                    statusDiv.className = 'summarizer-status status-supported';
                    summarizerSupported = true;
                } else if (availability === 'downloadable') {
                    statusDiv.innerHTML = '⏳ Summarizer API is supported but needs download';
                    statusDiv.className = 'summarizer-status status-supported';
                    summarizerSupported = false; // Don't mark as supported until downloaded
                    showDownloadSection(true);
                } else if (availability === 'downloading') {
                    statusDiv.innerHTML = '⏳ Summarizer API is downloading, please wait...';
                    statusDiv.className = 'summarizer-status status-supported';
                    summarizerSupported = false; // Don't mark as supported until download complete
                    showDownloadSection(false); // Hide download button during automatic download
                } else if (availability === 'unavailable') {
                    statusDiv.innerHTML = '❌ Summarizer API is not available on this device';
                    statusDiv.className = 'summarizer-status status-not-supported';
                } else {
                    statusDiv.innerHTML = `❌ Summarizer API availability: ${availability}`;
                    statusDiv.className = 'summarizer-status status-not-supported';
                }
                
                // If availability looks good, test creation to be sure
                if (summarizerSupported) {
                    try {
                        addLog('Testing Summarizer creation after availability check...');
                        const testSummarizer = await Summarizer.create({
                            sharedContext: "Test creation",
                            type: "tldr",
                            length: "short",
                            format: "plain-text"
                        });
                        if (testSummarizer) {
                            statusDiv.innerHTML = '✅ Summarizer API is ready and tested';
                            testSummarizer.destroy && testSummarizer.destroy();
                            addLog('✅ Summarizer creation test successful');
                            showDownloadSection(false); // Hide download section when ready
                        }
                    } catch (createError) {
                        statusDiv.innerHTML = '❌ Summarizer creation failed: ' + createError.message;
                        statusDiv.className = 'summarizer-status status-not-supported';
                        summarizerSupported = false;
                        addLog('❌ Summarizer creation test failed: ' + createError.message);
                    }
                }
            } else {
                // Try to create a summarizer directly to test
                try {
                    const testSummarizer = await Summarizer.create();
                    if (testSummarizer) {
                        statusDiv.innerHTML = '✅ Summarizer API is working (direct test)';
                        statusDiv.className = 'summarizer-status status-supported';
                        summarizerSupported = true;
                        testSummarizer.destroy && testSummarizer.destroy();
                        addLog('Direct Summarizer creation test successful');
                    }
                } catch (createError) {
                    statusDiv.innerHTML = '❌ Summarizer API create failed: ' + createError.message;
                    statusDiv.className = 'summarizer-status status-not-supported';
                    addLog('Direct Summarizer creation failed: ' + createError.message);
                }
            }
        } else {
            statusDiv.innerHTML = '❌ Summarizer API is not supported in this browser';
            statusDiv.className = 'summarizer-status status-not-supported';
            addLog('No Summarizer API found');
        }
    } catch (error) {
        statusDiv.innerHTML = '❌ Error checking Summarizer API support: ' + error.message;
        statusDiv.className = 'summarizer-status status-not-supported';
        addLog('Error in checkSummarizerSupport: ' + error.message);
    }
}

async function testSummarizer() {
    if (!summarizerSupported) {
        alert('Summarizer API is not supported in this browser');
        return;
    }

    try {
        addLog('Testing Summarizer API...');
        
        // Use the global Summarizer API (latest spec)
        const summarizer = await Summarizer.create({
            sharedContext: "A test to verify the summarization functionality is working correctly",
            type: "tldr",
            length: "short",
            format: "plain-text"
        });
        
        const testText = "This is a comprehensive test article to verify that the browser's summarization API is working correctly. The API should be able to generate a concise and accurate summary of this text, capturing the main points and key information. This test helps ensure that the browser implementation of the Summarizer API is functioning as expected and can handle text processing tasks effectively. The summarization process involves analyzing the input text, identifying key themes and important information, and then generating a condensed version that maintains the essential meaning while being significantly shorter than the original content.";
        
        addLog('Generating test summary...');
        const summary = await summarizer.summarize(testText);
        
        alert('✅ Test successful!\n\nOriginal text length: ' + testText.length + ' characters\nSummary length: ' + summary.length + ' characters\n\nSummary: ' + summary);
        addLog('✅ Summarizer test completed successfully');
        
        // Clean up
        if (summarizer.destroy) {
            summarizer.destroy();
        }
    } catch (error) {
        alert('❌ Test failed: ' + error.message);
        addLog('❌ Summarizer test failed: ' + error.message);
    }
}

async function startEvaluation() {
    if (!summarizerSupported) {
        alert('Cannot start evaluation: Summarizer API not supported');
        return;
    }

    const maxArticles = document.getElementById('max-articles').value;
    const evaluationMode = document.querySelector('input[name="evaluationMode"]:checked').value;
    const selectedDataset = document.getElementById('dataset-select').value;
    
    let selectedConfig = null;
    if (evaluationMode === 'single') {
        const type = document.getElementById('config-type').value;
        const length = document.getElementById('config-length').value;
        const format = document.getElementById('config-format').value;
        selectedConfig = `${type}_${length}_${format}`;
    }
    
    try {
        const response = await fetch('/api/start_evaluation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                max_articles: parseInt(maxArticles),
                evaluation_mode: evaluationMode,
                selected_config: selectedConfig,
                selected_dataset: selectedDataset
            })
        });

        if (response.ok) {
            evaluationRunning = true;
            updateUI();
            const datasetName = availableDatasets[selectedDataset]?.name || selectedDataset;
            addLog(`Evaluation started in ${evaluationMode} mode with ${datasetName} dataset${selectedConfig ? ` using configuration: ${selectedConfig}` : ''}`);
            
            // Clear previous results
            results = [];
            configResults.clear();
            updateResultsSummary();
            updateResultsTable();
            
            // Show/hide configuration comparison based on mode
            const configComparison = document.getElementById('config-comparison');
            if (evaluationMode === 'all') {
                configComparison.style.display = 'block';
            } else {
                configComparison.style.display = 'none';
            }
        } else {
            const error = await response.json();
            alert('Error starting evaluation: ' + error.error);
        }
    } catch (error) {
        alert('Error starting evaluation: ' + error.message);
    }
}

async function stopEvaluation() {
    try {
        const response = await fetch('/api/stop_evaluation', {
            method: 'POST'
        });

        if (response.ok) {
            evaluationRunning = false;
            updateUI();
            addLog('Evaluation stopped');
        }
    } catch (error) {
        alert('Error stopping evaluation: ' + error.message);
    }
}

async function exportResults() {
    try {
        const response = await fetch('/api/export_results');
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            addLog('Results exported successfully');
        } else {
            alert('Error exporting results: ' + result.error);
        }
    } catch (error) {
        alert('Error exporting results: ' + error.message);
    }
}

function updateUI() {
    document.getElementById('start-btn').disabled = evaluationRunning;
    document.getElementById('stop-btn').disabled = !evaluationRunning;
}

function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    const logsDiv = document.getElementById('logs');
    logsDiv.innerHTML += logEntry + '<br>';
    logsDiv.scrollTop = logsDiv.scrollHeight;
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

function addInputLog(articleId, text) {
    const timestamp = new Date().toLocaleTimeString();
    const inputLogsDiv = document.getElementById('input-logs');
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <div class="log-entry-header">[${timestamp}] Article ${articleId}</div>
        <div class="log-entry-content">${text.substring(0, 500)}${text.length > 500 ? '...' : ''}</div>
        <small class="text-muted">Length: ${text.length} characters</small>
    `;
    
    inputLogsDiv.appendChild(logEntry);
    inputLogsDiv.scrollTop = inputLogsDiv.scrollHeight;
}

function addOutputLog(articleId, summary, inputLength, configuration = null) {
    const timestamp = new Date().toLocaleTimeString();
    const outputLogsDiv = document.getElementById('output-logs');
    
    const compressionRatio = inputLength > 0 ? ((inputLength - summary.length) / inputLength * 100).toFixed(1) : 0;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <div class="log-entry-header">[${timestamp}] Summary for Article ${articleId}${configuration ? ` (${configuration})` : ''}</div>
        <div class="log-entry-content">${summary}</div>
        <small class="text-muted">
            Length: ${summary.length} characters | 
            Compression: ${compressionRatio}% | 
            Ratio: ${inputLength}:${summary.length}
        </small>
    `;
    
    outputLogsDiv.appendChild(logEntry);
    outputLogsDiv.scrollTop = outputLogsDiv.scrollHeight;
}

function updateProgress(current, total) {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    document.getElementById('progress-bar').style.width = percentage + '%';
    document.getElementById('progress-text').textContent = `${current} / ${total}`;
}

function updateResultsSummary() {
    if (results.length === 0) {
        document.getElementById('total-articles').textContent = '0';
        document.getElementById('total-configs').textContent = '0';
        document.getElementById('avg-rouge1').textContent = '0.00';
        document.getElementById('avg-rouge2').textContent = '0.00';
        document.getElementById('avg-rougeL').textContent = '0.00';
        document.getElementById('best-config').textContent = 'N/A';
        return;
    }

    // Filter results that have rouge_scores
    const validResults = results.filter(r => r.rouge_scores);
    
    if (validResults.length === 0) {
        document.getElementById('total-articles').textContent = results.length.toString();
        document.getElementById('total-configs').textContent = '0';
        document.getElementById('avg-rouge1').textContent = 'N/A';
        document.getElementById('avg-rouge2').textContent = 'N/A';
        document.getElementById('avg-rougeL').textContent = 'N/A';
        document.getElementById('best-config').textContent = 'N/A';
        return;
    }

    const avgRouge1 = validResults.reduce((sum, r) => sum + r.rouge_scores.rouge1, 0) / validResults.length;
    const avgRouge2 = validResults.reduce((sum, r) => sum + r.rouge_scores.rouge2, 0) / validResults.length;
    const avgRougeL = validResults.reduce((sum, r) => sum + r.rouge_scores.rougeL, 0) / validResults.length;

    // Count unique articles and configurations
    const uniqueArticles = new Set(results.map(r => r.article_id)).size;
    const uniqueConfigs = new Set(results.map(r => r.configuration).filter(c => c)).size;

    document.getElementById('total-articles').textContent = uniqueArticles;
    document.getElementById('total-configs').textContent = uniqueConfigs;
    document.getElementById('avg-rouge1').textContent = avgRouge1.toFixed(3);
    document.getElementById('avg-rouge2').textContent = avgRouge2.toFixed(3);
    document.getElementById('avg-rougeL').textContent = avgRougeL.toFixed(3);

    // Find best configuration
    if (configResults.size > 0) {
        let bestConfig = null;
        let bestScore = -1;
        
        for (const [config, scores] of configResults) {
            const avgScore = (scores.rouge1 + scores.rouge2 + scores.rougeL) / 3;
            if (avgScore > bestScore) {
                bestScore = avgScore;
                bestConfig = config;
            }
        }
        
        document.getElementById('best-config').textContent = bestConfig || 'N/A';
    }
}

function updateConfigurationAnalysis() {
    if (configResults.size === 0) return;

    const container = document.getElementById('config-charts-container');
    container.innerHTML = '';

    // Create charts for each metric
    const metrics = ['rouge1', 'rouge2', 'rougeL'];
    const metricNames = ['ROUGE-1', 'ROUGE-2', 'ROUGE-L'];

    metrics.forEach((metric, index) => {
        const chartDiv = document.createElement('div');
        chartDiv.className = 'config-chart';
        
        const title = document.createElement('h6');
        title.textContent = `${metricNames[index]} Scores by Configuration`;
        chartDiv.appendChild(title);

        // Sort configurations by score
        const sortedConfigs = Array.from(configResults.entries())
            .sort((a, b) => b[1][metric] - a[1][metric]);

        const maxScore = Math.max(...sortedConfigs.map(([_, scores]) => scores[metric]));

        sortedConfigs.forEach(([config, scores]) => {
            const score = scores[metric];
            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

            const barContainer = document.createElement('div');
            barContainer.className = 'config-bar';

            const barFill = document.createElement('div');
            barFill.className = 'config-bar-fill';
            barFill.style.width = percentage + '%';

            const label = document.createElement('span');
            label.className = 'config-bar-label';
            label.textContent = config;

            const value = document.createElement('span');
            value.className = 'config-bar-value';
            value.textContent = score.toFixed(3);

            barFill.appendChild(label);
            barContainer.appendChild(barFill);
            barContainer.appendChild(value);
            chartDiv.appendChild(barContainer);
        });

        container.appendChild(chartDiv);
    });
}

function updateResultsTable() {
    const tbody = document.getElementById('results-tbody');
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No results yet</td></tr>';
        return;
    }

    tbody.innerHTML = results.map(result => {
        const compressionRatio = result.article_length > 0 ? 
            ((result.article_length - (result.generated_summary ? result.generated_summary.length : 0)) / result.article_length * 100).toFixed(1) : 0;
        
        // Handle missing rouge_scores
        const rouge1 = result.rouge_scores ? result.rouge_scores.rouge1.toFixed(3) : 'N/A';
        const rouge2 = result.rouge_scores ? result.rouge_scores.rouge2.toFixed(3) : 'N/A';
        const rougeL = result.rouge_scores ? result.rouge_scores.rougeL.toFixed(3) : 'N/A';
        
        return `
            <tr>
                <td>${result.article_id}</td>
                <td><small>${result.configuration || 'unknown'}</small></td>
                <td>${result.article_length}</td>
                <td>${rouge1}</td>
                <td>${rouge2}</td>
                <td>${rougeL}</td>
                <td>${compressionRatio}%</td>
                <td>${new Date(result.timestamp).toLocaleTimeString()}</td>
            </tr>
        `;
    }).join('');
}

// Download section management
function showDownloadSection(show) {
    const downloadSection = document.getElementById('download-section');
    if (downloadSection) {
        downloadSection.style.display = show ? 'block' : 'none';
    }
}

function updateDownloadProgress(percentage) {
    const progressBar = document.getElementById('download-progress-bar');
    const percentageText = document.getElementById('download-percentage');
    
    if (progressBar && percentageText) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
        percentageText.textContent = Math.round(percentage) + '%';
    }
}

function showDownloadProgress(show) {
    const progressContainer = document.getElementById('download-progress-container');
    const downloadBtn = document.getElementById('download-model-btn');
    
    if (progressContainer) {
        progressContainer.style.display = show ? 'block' : 'none';
    }
    if (downloadBtn) {
        downloadBtn.disabled = show;
        downloadBtn.textContent = show ? 'Downloading...' : 'Download Model';
    }
}

async function downloadModel() {
    const statusDiv = document.getElementById('summarizer-status');
    
    try {
        addLog('Starting model download...');
        showDownloadProgress(true);
        updateDownloadProgress(0);
        
        statusDiv.innerHTML = '⏳ Downloading Summarizer model...';
        statusDiv.className = 'summarizer-status status-supported';
        
        // Create a monitor for download progress
        const monitor = (event) => {
            if (event.type === 'downloadprogress') {
                const percentage = (event.loaded / event.total) * 100;
                updateDownloadProgress(percentage);
                addLog(`Download progress: ${Math.round(percentage)}%`);
            }
        };
        
        // Create summarizer with monitor for real download progress
        const summarizer = await Summarizer.create({
            sharedContext: "Downloading model for summarization",
            type: "tldr",
            length: "short",
            format: "plain-text",
            monitor: monitor
        });
        
        // Complete the progress
        updateDownloadProgress(100);
        addLog('Model download completed successfully');
        
        // Update status
        statusDiv.innerHTML = '✅ Summarizer API is ready and model downloaded';
        summarizerSupported = true;
        
        // Clean up and hide download section
        if (summarizer.destroy) {
            summarizer.destroy();
        }
        
        setTimeout(() => {
            showDownloadProgress(false);
            showDownloadSection(false);
            addLog('✅ Model is ready for use');
        }, 1000);
        
    } catch (error) {
        addLog('❌ Model download failed: ' + error.message);
        statusDiv.innerHTML = '❌ Model download failed: ' + error.message;
        statusDiv.className = 'summarizer-status status-not-supported';
        showDownloadProgress(false);
    }
}

// Socket.IO event handlers
socket.on('connect', function() {
    addLog('Connected to server');
});

socket.on('disconnect', function() {
    addLog('Disconnected from server');
});

socket.on('log_update', function(data) {
    addLog(data.message);
});

socket.on('evaluation_started', function(data) {
    const datasetInfo = data.dataset ? ` using ${data.dataset}` : '';
    addLog(`Evaluation started with ${data.total_articles} articles${datasetInfo}`);
    updateProgress(0, data.total_articles);
});

socket.on('progress_update', function(data) {
    updateProgress(data.current, data.total);
    document.getElementById('current-article').textContent = 
        `Processing article ${data.current} of ${data.total} (ID: ${data.article_id})`;
});

socket.on('article_completed', function(data) {
    // Add defensive check for rouge_scores
    if (!data.rouge_scores) {
        console.error('Received article_completed data without rouge_scores:', data);
        addLog(`⚠️ Article ${data.article_id} completed but missing ROUGE scores`);
        return;
    }
    
    results.push(data);
    
    // Update configuration results for analysis
    const config = data.configuration || 'unknown';
    if (!configResults.has(config)) {
        configResults.set(config, {
            rouge1: 0,
            rouge2: 0,
            rougeL: 0,
            count: 0
        });
    }
    
    const configData = configResults.get(config);
    configData.rouge1 = ((configData.rouge1 * configData.count) + data.rouge_scores.rouge1) / (configData.count + 1);
    configData.rouge2 = ((configData.rouge2 * configData.count) + data.rouge_scores.rouge2) / (configData.count + 1);
    configData.rougeL = ((configData.rougeL * configData.count) + data.rouge_scores.rougeL) / (configData.count + 1);
    configData.count++;
    
    updateResultsSummary();
    updateResultsTable();
    updateConfigurationAnalysis();
    addLog(`Completed article ${data.article_id} (${data.configuration}) - ROUGE-1: ${data.rouge_scores.rouge1.toFixed(3)}`);
});

socket.on('evaluation_completed', function(data) {
    evaluationRunning = false;
    updateUI();
    addLog(`Evaluation completed! Processed ${data.total_results} articles`);
    document.getElementById('current-article').textContent = 'Evaluation completed';
});

socket.on('summarize_request', async function(data) {
    if (!summarizerSupported) {
        addLog('Cannot process summarization request: API not supported');
        socket.emit('summarization_result', {
            request_id: data.request_id,
            article_id: data.article_id,
            configuration: data.configuration,
            summary: '',
            error: 'Summarizer API not supported'
        });
        return;
    }

    try {
        addLog(`Received summarization request for article ${data.article_id} (${data.configuration})`);
        
        // Log the input data
        addInputLog(data.article_id, data.text);
        
        // Parse configuration
        const [type, length, format] = data.configuration.split('_');
        
        // Create summarizer for this specific configuration
        // We don't reuse the summarizer since we need different configurations
        const summarizer = await Summarizer.create({
            sharedContext: "Summarize news articles for quality evaluation, focusing on key facts and main points",
            type: type,
            length: length,
            format: format
        });

        // Generate summary
        addLog(`Generating ${data.configuration} summary for article ${data.article_id}...`);
        const summary = await summarizer.summarize(data.text);
        
        // Log the output data with configuration info
        addOutputLog(data.article_id, summary, data.text.length, data.configuration);
        
        // Clean up
        if (summarizer.destroy) {
            summarizer.destroy();
        }
        
        // Send result back to server
        socket.emit('summarization_result', {
            request_id: data.request_id,
            article_id: data.article_id,
            configuration: data.configuration,
            summary: summary
        });

        addLog(`✅ Completed ${data.configuration} summarization for article ${data.article_id} (${summary.length} chars)`);
    } catch (error) {
        addLog(`❌ Error summarizing article ${data.article_id} (${data.configuration}): ${error.message}`);
        
        socket.emit('summarization_result', {
            request_id: data.request_id,
            article_id: data.article_id,
            configuration: data.configuration,
            summary: '',
            error: error.message
        });
    }
});

socket.on('summarization_acknowledged', function(data) {
    addLog(`Server acknowledged summarization for article ${data.article_id}`);
});

// Initialize UI
updateUI();
addLog('Application initialized');

// Configuration management functions
function updateConfigPreview() {
    const type = document.getElementById('config-type').value;
    const length = document.getElementById('config-length').value;
    const format = document.getElementById('config-format').value;
    const preview = `${type}_${length}_${format}`;
    document.getElementById('config-preview').textContent = preview;
}

function toggleConfigOptions() {
    const singleMode = document.getElementById('singleConfig').checked;
    const configOptions = document.getElementById('single-config-options');
    
    if (singleMode) {
        configOptions.classList.remove('hidden');
        configOptions.style.display = 'block';
    } else {
        configOptions.classList.add('hidden');
        configOptions.style.display = 'none';
    }
}

// Theme toggle functionality
(() => {
    'use strict'

    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const setTheme = theme => {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-bs-theme', 'dark')
        } else if (theme === 'auto') {
            document.documentElement.setAttribute('data-bs-theme', 'light')
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    const showActiveTheme = (theme, focus = false) => {
        const themeSwitcher = document.querySelector('#bd-theme')
        const themeIcon = document.querySelector('#theme-icon')
        const themeText = document.querySelector('#theme-text')

        if (!themeSwitcher) {
            return
        }

        const activeThemeIcon = document.querySelector(`[data-bs-theme-value="${theme}"] i`)
        const activeThemeText = document.querySelector(`[data-bs-theme-value="${theme}"]`).textContent.trim()

        document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
            element.classList.remove('active')
            element.setAttribute('aria-pressed', 'false')
        })

        const activeElement = document.querySelector(`[data-bs-theme-value="${theme}"]`)
        activeElement.classList.add('active')
        activeElement.setAttribute('aria-pressed', 'true')

        const iconClass = activeThemeIcon ? activeThemeIcon.className : 'bi bi-circle-half'
        themeIcon.className = iconClass
        themeText.textContent = activeThemeText.split(' ').slice(1).join(' ')

        if (focus) {
            themeSwitcher.focus()
        }
    }

    // Initialize theme
    const storedTheme = getStoredTheme()
    if (storedTheme) {
        setTheme(storedTheme)
        showActiveTheme(storedTheme)
    } else {
        setTheme('auto')
        showActiveTheme('auto')
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = getStoredTheme()
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
            setTheme(getPreferredTheme())
        }
    })

    window.addEventListener('DOMContentLoaded', () => {
        // Theme toggle event listeners
        document.querySelectorAll('[data-bs-theme-value]')
            .forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const theme = toggle.getAttribute('data-bs-theme-value')
                    setStoredTheme(theme)
                    setTheme(theme)
                    showActiveTheme(theme, true)
                })
            })
        
        // Download model button event listener
        const downloadBtn = document.getElementById('download-model-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadModel);
        }
        
        // Configuration event listeners
        const configSelects = ['config-type', 'config-length', 'config-format'];
        configSelects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', updateConfigPreview);
            }
        });
        
        // Evaluation mode radio buttons
        const radioButtons = document.querySelectorAll('input[name="evaluationMode"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', toggleConfigOptions);
        });
        
        // Initialize configuration display
        updateConfigPreview();
        toggleConfigOptions();
    })
})()
