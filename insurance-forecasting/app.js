// Insurance Premium Forecasting Application
class InsuranceForecastingApp {
    constructor() {
        this.data = null;
        this.processedData = null;
        this.selectedFeatures = [];
        this.results = {};
        this.forecastChart = null;
        this.performanceChart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDragAndDrop();
        // Add sample data option after a brief delay to ensure DOM is ready
        setTimeout(() => this.addSampleDataOption(), 100);
    }

    addSampleDataOption() {
        const uploadArea = document.getElementById('uploadArea');
        const uploadContent = uploadArea?.querySelector('.upload-content');
        
        if (!uploadContent) return;

        // Check if sample button already exists to prevent duplicates
        if (uploadContent.querySelector('.sample-data-btn')) return;
        
        const sampleButton = document.createElement('button');
        sampleButton.className = 'btn btn--secondary btn--sm sample-data-btn';
        sampleButton.textContent = 'Load Sample Data';
        sampleButton.style.marginTop = '10px';
        sampleButton.onclick = () => this.loadSampleData();
        
        uploadContent.appendChild(sampleButton);
    }

    loadSampleData() {
        // Create sample data for demonstration
        const sampleData = [
            { Year: 2020, Premium_Growth: 5.2, GDP_Growth: 2.1, Inflation: 1.8, Interest_Rate: 2.5, Unemployment: 6.2 },
            { Year: 2021, Premium_Growth: 6.1, GDP_Growth: 3.2, Inflation: 2.3, Interest_Rate: 2.0, Unemployment: 5.8 },
            { Year: 2022, Premium_Growth: 4.8, GDP_Growth: 2.8, Inflation: 3.1, Interest_Rate: 3.5, Unemployment: 5.2 },
            { Year: 2023, Premium_Growth: 5.5, GDP_Growth: 2.5, Inflation: 2.9, Interest_Rate: 4.0, Unemployment: 4.8 },
            { Year: 2024, Premium_Growth: 4.2, GDP_Growth: 2.3, Inflation: 2.5, Interest_Rate: 4.5, Unemployment: 4.5 },
            { Year: 2025, Premium_Growth: null, GDP_Growth: 2.1, Inflation: 2.2, Interest_Rate: 4.2, Unemployment: 4.3 },
            { Year: 2026, Premium_Growth: null, GDP_Growth: 2.0, Inflation: 2.1, Interest_Rate: 4.0, Unemployment: 4.1 }
        ];

        this.data = sampleData;
        this.processSampleData();
    }

    processSampleData() {
        try {
            this.validateAndProcessData();
            this.displayDataPreview();
            this.setupFeatureSelection();
            this.showSection('dataPreviewSection');
            this.showSection('featureSelectionSection');
            this.showSection('modelSelectionSection');
            this.showSection('configSection');

            const statusDiv = document.getElementById('uploadStatus');
            if (statusDiv) {
                statusDiv.className = 'upload-status success';
                statusDiv.textContent = '✅ Sample data loaded successfully!';
                statusDiv.classList.remove('hidden');
            }
        } catch (error) {
            const statusDiv = document.getElementById('uploadStatus');
            if (statusDiv) {
                statusDiv.className = 'upload-status error';
                statusDiv.textContent = `❌ Error: ${error.message}`;
                statusDiv.classList.remove('hidden');
            }
        }
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Train/test split slider
        const slider = document.getElementById('trainTestSplit');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                const splitValue = document.getElementById('splitValue');
                if (splitValue) {
                    splitValue.textContent = `${value}% / ${100-value}%`;
                }
            });
        }

        // Run forecasting button
        const runButton = document.getElementById('runForecasting');
        if (runButton) {
            runButton.addEventListener('click', () => this.runForecasting());
        }

        // Export buttons
        const exportResults = document.getElementById('exportResults');
        const exportChart = document.getElementById('exportChart');
        if (exportResults) {
            exportResults.addEventListener('click', () => this.exportResults());
        }
        if (exportChart) {
            exportChart.addEventListener('click', () => this.exportChart());
        }
    }

    initializeDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });

        uploadArea.addEventListener('click', (e) => {
            // Only trigger file input if not clicking on buttons
            if (!e.target.classList.contains('btn') && !e.target.closest('.btn')) {
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.click();
                }
            }
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        const statusDiv = document.getElementById('uploadStatus');
        if (!statusDiv) return;

        statusDiv.className = 'upload-status';
        statusDiv.textContent = 'Processing file...';
        statusDiv.classList.remove('hidden');

        try {
            let data;
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                data = await this.parseCSV(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                data = await this.parseExcel(file);
            } else {
                throw new Error('Unsupported file format. Please upload CSV or Excel files.');
            }

            this.data = data;
            this.validateAndProcessData();
            this.displayDataPreview();
            this.setupFeatureSelection();
            this.showSection('dataPreviewSection');
            this.showSection('featureSelectionSection');
            this.showSection('modelSelectionSection');
            this.showSection('configSection');

            statusDiv.className = 'upload-status success';
            statusDiv.textContent = '✅ File uploaded and processed successfully!';
        } catch (error) {
            statusDiv.className = 'upload-status error';
            statusDiv.textContent = `❌ Error: ${error.message}`;
        }
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('CSV parsing error: ' + results.errors[0].message));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error) => reject(error)
            });
        });
    }

    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Excel parsing error: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('File reading error'));
            reader.readAsArrayBuffer(file);
        });
    }

    validateAndProcessData() {
        if (!this.data || this.data.length === 0) {
            throw new Error('No data found in file');
        }

        const columns = Object.keys(this.data[0]);
        if (columns.length < 3) {
            throw new Error('File must have at least 3 columns (Year, Target, Features)');
        }

        // Process data types
        this.processedData = this.data.map(row => {
            const processedRow = {};
            for (const [key, value] of Object.entries(row)) {
                // Try to convert to number, keep as string if fails
                if (value === null || value === undefined || value === '') {
                    processedRow[key] = null;
                } else {
                    const numValue = parseFloat(value);
                    processedRow[key] = isNaN(numValue) ? value : numValue;
                }
            }
            return processedRow;
        });

        // Validate year column (first column)
        const yearColumn = columns[0];
        const years = this.processedData.map(row => row[yearColumn]).filter(year => year !== null);
        if (years.some(year => isNaN(year) || year < 1900 || year > 2100)) {
            throw new Error('First column must contain valid years');
        }

        // Sort by year
        this.processedData.sort((a, b) => {
            const aYear = a[yearColumn];
            const bYear = b[yearColumn];
            if (aYear === null) return 1;
            if (bYear === null) return -1;
            return aYear - bYear;
        });
    }

    displayDataPreview() {
        if (!this.processedData || this.processedData.length === 0) return;
        
        const columns = Object.keys(this.processedData[0]);
        const summaryDiv = document.getElementById('dataSummary');
        const table = document.getElementById('dataPreviewTable');

        if (!summaryDiv || !table) return;

        // Create summary
        const numRows = this.processedData.length;
        const numCols = columns.length;
        const validYears = this.processedData.filter(row => row[columns[0]] !== null);
        const yearRange = validYears.length > 0 ? 
            `${validYears[0][columns[0]]} - ${validYears[validYears.length-1][columns[0]]}` : 'N/A';
        
        let missingCounts = {};
        columns.forEach(col => {
            missingCounts[col] = this.processedData.filter(row => 
                row[col] === null || row[col] === undefined || row[col] === ''
            ).length;
        });

        summaryDiv.innerHTML = `
            <div class="summary-card">
                <h4>Rows</h4>
                <div class="value">${numRows}</div>
            </div>
            <div class="summary-card">
                <h4>Columns</h4>
                <div class="value">${numCols}</div>
            </div>
            <div class="summary-card">
                <h4>Year Range</h4>
                <div class="value">${yearRange}</div>
            </div>
            <div class="summary-card">
                <h4>Missing Values</h4>
                <div class="value">${Object.values(missingCounts).reduce((a, b) => a + b, 0)}</div>
            </div>
        `;

        // Create table header
        const thead = table.querySelector('thead');
        if (thead) {
            thead.innerHTML = `
                <tr>
                    ${columns.map(col => `<th>${col} ${missingCounts[col] > 0 ? `(${missingCounts[col]} missing)` : ''}</th>`).join('')}
                </tr>
            `;
        }

        // Create table body (show first 10 rows)
        const previewRows = this.processedData.slice(0, 10);
        const tbody = table.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = previewRows.map(row => `
                <tr>
                    ${columns.map(col => {
                        const value = row[col];
                        const isNumeric = typeof value === 'number';
                        const isMissing = value === null || value === undefined || value === '';
                        return `<td class="${isNumeric ? 'numeric' : ''} ${isMissing ? 'missing-value' : ''}">${isMissing ? 'N/A' : value}</td>`;
                    }).join('')}
                </tr>
            `).join('');

            if (this.processedData.length > 10) {
                tbody.innerHTML += `
                    <tr><td colspan="${columns.length}" style="text-align: center; color: var(--color-text-secondary); font-style: italic;">... and ${this.processedData.length - 10} more rows</td></tr>
                `;
            }
        }
    }

    setupFeatureSelection() {
        if (!this.processedData || this.processedData.length === 0) return;
        
        const columns = Object.keys(this.processedData[0]);
        const featureColumns = columns.slice(2); // Skip year and target columns
        const container = document.getElementById('featureCheckboxes');

        if (!container) return;

        container.innerHTML = featureColumns.map((col, index) => `
            <label class="feature-checkbox">
                <input type="checkbox" value="${col}" ${index < 5 ? 'checked' : ''}>
                <span>${col}</span>
            </label>
        `).join('');

        // Update selected features
        this.updateSelectedFeatures();
        
        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedFeatures());
        });
    }

    updateSelectedFeatures() {
        const checkboxes = document.querySelectorAll('#featureCheckboxes input[type="checkbox"]:checked');
        this.selectedFeatures = Array.from(checkboxes).map(cb => cb.value);
    }

    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
        }
    }

    async runForecasting() {
        const button = document.getElementById('runForecasting');
        const spinner = button?.querySelector('.btn-spinner');
        const text = button?.querySelector('.btn-text');
        const progress = document.getElementById('progress');

        if (!button || !text || !progress) return;

        // Disable button and show loading
        button.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        text.textContent = 'Running...';
        progress.classList.remove('hidden');
        progress.style.color = '';

        try {
            // Get configuration
            const forecastPeriodsElement = document.getElementById('forecastPeriods');
            const trainTestSplitElement = document.getElementById('trainTestSplit');
            const includeConfidenceElement = document.getElementById('includeConfidence');
            
            const forecastPeriods = parseInt(forecastPeriodsElement?.value || '5');
            const trainTestSplit = parseInt(trainTestSplitElement?.value || '80') / 100;
            const includeConfidence = includeConfidenceElement?.checked || false;

            // Get selected models
            const selectedModels = Array.from(document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            if (selectedModels.length === 0) {
                throw new Error('Please select at least one model');
            }

            this.updateSelectedFeatures();
            if (this.selectedFeatures.length === 0) {
                throw new Error('Please select at least one feature');
            }

            // Prepare data
            progress.textContent = 'Preparing data...';
            const preparedData = this.prepareModelingData();

            if (!preparedData || preparedData.target.length < 3) {
                throw new Error('Not enough valid data points for modeling (minimum 3 required)');
            }

            // Run models
            this.results = {};
            for (let i = 0; i < selectedModels.length; i++) {
                const modelType = selectedModels[i];
                progress.textContent = `Running ${this.getModelName(modelType)} (${i + 1}/${selectedModels.length})...`;
                
                try {
                    const result = await this.runModel(modelType, preparedData, trainTestSplit, forecastPeriods, includeConfidence);
                    this.results[modelType] = result;
                } catch (error) {
                    console.error(`Error running ${modelType}:`, error);
                    this.results[modelType] = {
                        error: error.message,
                        status: 'error'
                    };
                }
            }

            // Display results
            progress.textContent = 'Generating visualizations...';
            this.displayResults();
            this.createVisualization();
            this.createModelComparison();

            // Show results sections
            this.showSection('resultsSection');
            this.showSection('visualizationSection');
            this.showSection('comparisonSection');

            progress.textContent = 'Forecasting completed successfully!';
        } catch (error) {
            progress.textContent = `Error: ${error.message}`;
            progress.style.color = 'var(--color-error)';
        } finally {
            // Re-enable button
            button.disabled = false;
            if (spinner) spinner.classList.add('hidden');
            text.textContent = 'Run Forecasting';
        }
    }

    prepareModelingData() {
        if (!this.processedData || this.processedData.length === 0) return null;
        
        const columns = Object.keys(this.processedData[0]);
        const yearColumn = columns[0];
        const targetColumn = columns[1];

        // Filter out rows where target is missing
        const validData = this.processedData.filter(row => 
            row[targetColumn] !== null && 
            row[targetColumn] !== undefined && 
            row[targetColumn] !== '' && 
            !isNaN(row[targetColumn])
        );

        if (validData.length === 0) return null;

        // Extract features
        const features = validData.map(row => {
            const featureVector = [];
            this.selectedFeatures.forEach(feature => {
                const value = row[feature];
                // Use 0 for missing values (could be improved with better imputation)
                featureVector.push(value === null || value === undefined || isNaN(value) ? 0 : value);
            });
            return featureVector;
        });

        const target = validData.map(row => row[targetColumn]);
        const years = validData.map(row => row[yearColumn]);

        return {
            features,
            target,
            years,
            featureNames: this.selectedFeatures,
            targetName: targetColumn
        };
    }

    async runModel(modelType, data, trainTestSplit, forecastPeriods, includeConfidence) {
        if (!data || !data.target || data.target.length === 0) {
            throw new Error('No valid data available for modeling');
        }
        
        const splitIndex = Math.floor(data.target.length * trainTestSplit);
        
        const trainX = data.features.slice(0, splitIndex);
        const trainY = data.target.slice(0, splitIndex);
        const testX = data.features.slice(splitIndex);
        const testY = data.target.slice(splitIndex);

        let model;
        let trainPredictions, testPredictions, forecasts;

        switch (modelType) {
            case 'linear_regression':
                model = new LinearRegression();
                break;
            case 'multiple_regression':
                model = new MultipleLinearRegression();
                break;
            case 'arima':
                model = new ARIMAModel();
                break;
            case 'exponential_smoothing':
                model = new ExponentialSmoothing();
                break;
            case 'var':
                model = new VARModel();
                break;
            case 'decision_tree':
                model = new DecisionTree();
                break;
            case 'random_forest':
                model = new RandomForest();
                break;
            default:
                throw new Error(`Unknown model type: ${modelType}`);
        }

        // Train model
        await model.fit(trainX, trainY);

        // Make predictions
        trainPredictions = model.predict(trainX);
        testPredictions = testX.length > 0 ? model.predict(testX) : [];

        // Generate forecasts
        forecasts = model.forecast ? 
            model.forecast(forecastPeriods, data.features) : 
            this.generateSimpleForecasts(model, data.features, forecastPeriods);

        // Calculate metrics
        const trainMetrics = this.calculateMetrics(trainY, trainPredictions);
        const testMetrics = testX.length > 0 ? this.calculateMetrics(testY, testPredictions) : null;

        return {
            model,
            trainMetrics,
            testMetrics,
            trainPredictions,
            testPredictions,
            forecasts,
            status: 'success'
        };
    }

    generateSimpleForecasts(model, features, periods) {
        const forecasts = [];
        if (!features || features.length === 0) {
            // Fallback: generate simple trend forecasts
            for (let i = 0; i < periods; i++) {
                forecasts.push(0);
            }
            return forecasts;
        }
        
        const lastFeatures = features[features.length - 1];
        
        for (let i = 0; i < periods; i++) {
            // Simple approach: use last known features
            const prediction = model.predict([lastFeatures])[0];
            forecasts.push(prediction || 0);
        }
        
        return forecasts;
    }

    calculateMetrics(actual, predicted) {
        if (!actual || !predicted || actual.length === 0 || predicted.length === 0 || actual.length !== predicted.length) {
            return { rmse: 0, mae: 0, r2: 0 };
        }
        
        const n = actual.length;
        let sumSquaredError = 0;
        let sumAbsoluteError = 0;
        let sumSquaredTotal = 0;
        
        const actualMean = actual.reduce((a, b) => a + b, 0) / n;
        
        for (let i = 0; i < n; i++) {
            const error = actual[i] - predicted[i];
            sumSquaredError += error * error;
            sumAbsoluteError += Math.abs(error);
            sumSquaredTotal += (actual[i] - actualMean) ** 2;
        }
        
        const rmse = Math.sqrt(sumSquaredError / n);
        const mae = sumAbsoluteError / n;
        const r2 = sumSquaredTotal > 1e-10 ? 1 - (sumSquaredError / sumSquaredTotal) : 0;
        
        return { rmse, mae, r2 };
    }

    displayResults() {
        const resultsTableBody = document.querySelector('#resultsTable tbody');
        const forecastTableHead = document.querySelector('#forecastTable thead');
        const forecastTableBody = document.querySelector('#forecastTable tbody');

        if (!resultsTableBody || !forecastTableHead || !forecastTableBody) return;

        // Results table
        resultsTableBody.innerHTML = Object.entries(this.results).map(([modelType, result]) => {
            if (result.error) {
                return `
                    <tr>
                        <td>${this.getModelName(modelType)}</td>
                        <td colspan="6" class="error-message">${result.error}</td>
                        <td><span class="status-indicator error">Error</span></td>
                    </tr>
                `;
            }

            const train = result.trainMetrics;
            const test = result.testMetrics;
            
            return `
                <tr>
                    <td>${this.getModelName(modelType)}</td>
                    <td class="metric-value numeric">${train.rmse.toFixed(3)}</td>
                    <td class="metric-value numeric">${test ? test.rmse.toFixed(3) : 'N/A'}</td>
                    <td class="metric-value numeric">${train.mae.toFixed(3)}</td>
                    <td class="metric-value numeric">${test ? test.mae.toFixed(3) : 'N/A'}</td>
                    <td class="metric-value numeric">${train.r2.toFixed(3)}</td>
                    <td class="metric-value numeric">${test ? test.r2.toFixed(3) : 'N/A'}</td>
                    <td><span class="status-indicator success">Success</span></td>
                </tr>
            `;
        }).join('');

        // Forecast table
        const forecastPeriodsElement = document.getElementById('forecastPeriods');
        const forecastPeriods = parseInt(forecastPeriodsElement?.value || '5');
        
        const preparedData = this.prepareModelingData();
        if (!preparedData) return;
        
        const currentYear = Math.max(...preparedData.years);
        const forecastYears = Array.from({length: forecastPeriods}, (_, i) => currentYear + i + 1);

        const successfulModels = Object.entries(this.results).filter(([_, result]) => !result.error);
        
        forecastTableHead.innerHTML = `
            <tr>
                <th>Year</th>
                ${successfulModels.map(([modelType, _]) => `<th>${this.getModelName(modelType)}</th>`).join('')}
            </tr>
        `;

        forecastTableBody.innerHTML = forecastYears.map((year, index) => `
            <tr>
                <td>${year}</td>
                ${successfulModels.map(([_, result]) => {
                    const forecast = result.forecasts && result.forecasts[index];
                    return `<td class="forecast-value numeric">${forecast !== undefined ? forecast.toFixed(2) : 'N/A'}</td>`;
                }).join('')}
            </tr>
        `).join('');
    }

    createVisualization() {
        const ctx = document.getElementById('forecastChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.forecastChart) {
            this.forecastChart.destroy();
        }

        const data = this.prepareModelingData();
        if (!data) return;
        
        const forecastPeriodsElement = document.getElementById('forecastPeriods');
        const forecastPeriods = parseInt(forecastPeriodsElement?.value || '5');
        const currentYear = Math.max(...data.years);
        const forecastYears = Array.from({length: forecastPeriods}, (_, i) => currentYear + i + 1);

        const datasets = [];
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C'];
        let colorIndex = 0;

        // Historical data
        datasets.push({
            label: 'Historical Data',
            data: data.years.map((year, i) => ({x: year, y: data.target[i]})),
            borderColor: '#000000',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#000000'
        });

        // Model predictions and forecasts
        Object.entries(this.results).forEach(([modelType, result]) => {
            if (result.error || !result.forecasts) return;

            const color = colors[colorIndex % colors.length];
            colorIndex++;

            // Training predictions
            if (result.trainPredictions && result.trainPredictions.length > 0) {
                const trainData = data.years.slice(0, result.trainPredictions.length).map((year, i) => ({
                    x: year, 
                    y: result.trainPredictions[i]
                }));

                datasets.push({
                    label: `${this.getModelName(modelType)} (Train)`,
                    data: trainData,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 2
                });
            }

            // Test predictions
            if (result.testPredictions && result.testPredictions.length > 0) {
                const testStartIndex = result.trainPredictions ? result.trainPredictions.length : 0;
                const testData = data.years.slice(testStartIndex).map((year, i) => ({
                    x: year, 
                    y: result.testPredictions[i]
                }));

                datasets.push({
                    label: `${this.getModelName(modelType)} (Test)`,
                    data: testData,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [2, 2],
                    pointRadius: 2
                });
            }

            // Forecasts
            const forecastData = forecastYears.map((year, i) => ({
                x: year, 
                y: result.forecasts[i] || 0
            }));

            datasets.push({
                label: `${this.getModelName(modelType)} (Forecast)`,
                data: forecastData,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: color
            });
        });

        this.forecastChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Premium Growth Rate (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    createModelComparison() {
        const successfulResults = Object.entries(this.results).filter(([_, result]) => !result.error && result.testMetrics);
        
        const bestModelDiv = document.getElementById('bestModel');
        if (!bestModelDiv) return;

        if (successfulResults.length === 0) {
            bestModelDiv.innerHTML = '<p>No models available for comparison</p>';
            return;
        }

        // Find best model based on test RMSE
        const bestModel = successfulResults.reduce((best, [modelType, result]) => {
            return result.testMetrics.rmse < best.result.testMetrics.rmse ? 
                {modelType, result} : best;
        }, {modelType: successfulResults[0][0], result: successfulResults[0][1]});

        // Display best model
        bestModelDiv.innerHTML = `
            <h3>Best Performing Model</h3>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-16);">
                ${this.getModelName(bestModel.modelType)}
            </div>
            <div class="metric-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-16);">
                <div>
                    <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">Test RMSE</div>
                    <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${bestModel.result.testMetrics.rmse.toFixed(3)}</div>
                </div>
                <div>
                    <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">Test R²</div>
                    <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${bestModel.result.testMetrics.r2.toFixed(3)}</div>
                </div>
                <div>
                    <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">Test MAE</div>
                    <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${bestModel.result.testMetrics.mae.toFixed(3)}</div>
                </div>
            </div>
        `;

        // Create performance comparison chart
        const ctx = document.getElementById('performanceChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }

        const modelNames = successfulResults.map(([modelType, _]) => this.getModelName(modelType));
        const rmseData = successfulResults.map(([_, result]) => result.testMetrics.rmse);
        const r2Data = successfulResults.map(([_, result]) => result.testMetrics.r2);

        this.performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: modelNames,
                datasets: [
                    {
                        label: 'Test RMSE',
                        data: rmseData,
                        backgroundColor: '#1FB8CD',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Test R²',
                        data: r2Data,
                        backgroundColor: '#FFC185',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'RMSE'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'R²'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    getModelName(modelType) {
        const names = {
            'linear_regression': 'Linear Regression',
            'multiple_regression': 'Multiple Linear Regression',
            'arima': 'ARIMA',
            'exponential_smoothing': 'Exponential Smoothing',
            'var': 'VAR',
            'decision_tree': 'Decision Tree',
            'random_forest': 'Random Forest'
        };
        return names[modelType] || modelType;
    }

    exportResults() {
        if (!this.results || Object.keys(this.results).length === 0) {
            alert('No results to export. Please run forecasting first.');
            return;
        }
        
        const csv = this.generateResultsCSV();
        this.downloadCSV(csv, 'forecasting_results.csv');
    }

    exportChart() {
        if (!this.forecastChart) {
            alert('No chart to export. Please run forecasting first.');
            return;
        }
        
        const url = this.forecastChart.toBase64Image();
        const link = document.createElement('a');
        link.download = 'forecast_chart.png';
        link.href = url;
        link.click();
    }

    generateResultsCSV() {
        const headers = ['Model', 'Train_RMSE', 'Test_RMSE', 'Train_MAE', 'Test_MAE', 'Train_R2', 'Test_R2'];
        const rows = [headers];

        Object.entries(this.results).forEach(([modelType, result]) => {
            if (result.error) {
                rows.push([this.getModelName(modelType), 'Error', 'Error', 'Error', 'Error', 'Error', 'Error']);
            } else {
                const train = result.trainMetrics;
                const test = result.testMetrics;
                rows.push([
                    this.getModelName(modelType),
                    train.rmse.toFixed(4),
                    test ? test.rmse.toFixed(4) : 'N/A',
                    train.mae.toFixed(4),
                    test ? test.mae.toFixed(4) : 'N/A',
                    train.r2.toFixed(4),
                    test ? test.r2.toFixed(4) : 'N/A'
                ]);
            }
        });

        return rows.map(row => row.join(',')).join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}

// Simple Model Implementations with improved error handling
class LinearRegression {
    constructor() {
        this.slope = 0;
        this.intercept = 0;
    }

    async fit(X, y) {
        if (!X || !y || X.length === 0 || y.length === 0 || X.length !== y.length) {
            this.slope = 0;
            this.intercept = 0;
            return;
        }
        
        // Use first feature only for simple linear regression
        const x = X.map(row => Array.isArray(row) && row.length > 0 ? (row[0] || 0) : 0);
        const n = x.length;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const denominator = n * sumXX - sumX * sumX;
        if (Math.abs(denominator) > 1e-10) {
            this.slope = (n * sumXY - sumX * sumY) / denominator;
            this.intercept = (sumY - this.slope * sumX) / n;
        } else {
            this.slope = 0;
            this.intercept = sumY / n;
        }
    }

    predict(X) {
        if (!X || X.length === 0) return [];
        return X.map(row => {
            const x0 = Array.isArray(row) && row.length > 0 ? (row[0] || 0) : 0;
            return this.slope * x0 + this.intercept;
        });
    }
}

class MultipleLinearRegression {
    constructor() {
        this.coefficients = [];
        this.intercept = 0;
    }

    async fit(X, y) {
        if (!X || !y || X.length === 0 || y.length === 0 || X.length !== y.length) {
            this.intercept = 0;
            this.coefficients = [];
            return;
        }
        
        const n = X.length;
        const p = X[0] ? X[0].length : 0;
        
        // Simple approach: use mean of y as prediction
        this.intercept = y.reduce((a, b) => a + b, 0) / n;
        this.coefficients = new Array(p).fill(0);
        
        // Calculate simple correlations
        for (let j = 0; j < p; j++) {
            const xj = X.map(row => Array.isArray(row) && row.length > j ? (row[j] || 0) : 0);
            const meanX = xj.reduce((a, b) => a + b, 0) / n;
            const meanY = this.intercept;
            
            let numerator = 0;
            let denomX = 0;
            
            for (let i = 0; i < n; i++) {
                const dx = xj[i] - meanX;
                const dy = y[i] - meanY;
                numerator += dx * dy;
                denomX += dx * dx;
            }
            
            if (denomX > 1e-10) {
                this.coefficients[j] = numerator / denomX * 0.1; // Small coefficient
            }
        }
    }

    predict(X) {
        if (!X || X.length === 0) return [];
        return X.map(row => {
            if (!Array.isArray(row)) return this.intercept;
            const prediction = this.intercept + row.reduce((sum, xi, i) => {
                const coeff = i < this.coefficients.length ? this.coefficients[i] : 0;
                return sum + (xi || 0) * coeff;
            }, 0);
            return prediction;
        });
    }
}

class ARIMAModel {
    constructor() {
        this.arParam = 0.5;
        this.mean = 0;
        this.lastValues = [];
    }

    async fit(X, y) {
        if (!y || y.length === 0) {
            this.mean = 0;
            this.lastValues = [];
            return;
        }
        
        this.mean = y.reduce((a, b) => a + b, 0) / y.length;
        this.lastValues = y.slice(-3); // Keep last 3 values
        
        // Simple AR(1) parameter estimation
        if (y.length > 1) {
            let sumNum = 0;
            let sumDen = 0;
            for (let i = 1; i < y.length; i++) {
                const lag = y[i-1] - this.mean;
                const current = y[i] - this.mean;
                sumNum += lag * current;
                sumDen += lag * lag;
            }
            if (sumDen > 1e-10) {
                this.arParam = Math.max(-0.99, Math.min(0.99, sumNum / sumDen));
            }
        }
    }

    predict(X) {
        if (!X || X.length === 0) return [];
        return X.map(() => this.mean);
    }

    forecast(periods, X) {
        const forecasts = [];
        let lastValue = this.lastValues.length > 0 ? this.lastValues[this.lastValues.length - 1] : this.mean;
        
        for (let i = 0; i < periods; i++) {
            const forecast = this.mean + this.arParam * (lastValue - this.mean);
            forecasts.push(forecast);
            lastValue = forecast;
        }
        
        return forecasts;
    }
}

class ExponentialSmoothing {
    constructor() {
        this.alpha = 0.3;
        this.level = 0;
        this.trend = 0;
    }

    async fit(X, y) {
        if (!y || y.length === 0) {
            this.level = 0;
            this.trend = 0;
            return;
        }
        
        this.level = y[0];
        this.trend = y.length > 1 ? y[1] - y[0] : 0;
        
        for (let i = 1; i < y.length; i++) {
            const prevLevel = this.level;
            this.level = this.alpha * y[i] + (1 - this.alpha) * (this.level + this.trend);
            this.trend = this.alpha * (this.level - prevLevel) + (1 - this.alpha) * this.trend;
        }
    }

    predict(X) {
        if (!X || X.length === 0) return [];
        return X.map(() => this.level + this.trend);
    }

    forecast(periods, X) {
        const forecasts = [];
        for (let i = 0; i < periods; i++) {
            forecasts.push(this.level + this.trend * (i + 1));
        }
        return forecasts;
    }
}

class VARModel {
    constructor() {
        this.lastValues = [];
        this.trend = 0;
    }

    async fit(X, y) {
        if (!y || y.length === 0) {
            this.lastValues = [];
            this.trend = 0;
            return;
        }
        
        this.lastValues = y.slice(-2);
        if (this.lastValues.length === 2) {
            this.trend = this.lastValues[1] - this.lastValues[0];
        } else {
            this.trend = 0;
        }
    }

    predict(X) {
        if (!X || X.length === 0) return [];
        const lastValue = this.lastValues.length > 0 ? this.lastValues[this.lastValues.length - 1] : 0;
        return X.map(() => lastValue + this.trend);
    }

    forecast(periods, X) {
        const forecasts = [];
        const lastValue = this.lastValues.length > 0 ? this.lastValues[this.lastValues.length - 1] : 0;
        
        for (let i = 0; i < periods; i++) {
            forecasts.push(lastValue + this.trend * (i + 1));
        }
        return forecasts;
    }
}

class DecisionTree {
    constructor() {
        this.tree = null;
        this.maxDepth = 3;
    }

    async fit(X, y) {
        if (!X || !y || X.length === 0 || y.length === 0 || X.length !== y.length) {
            this.tree = { prediction: 0 };
            return;
        }
        this.tree = this.buildTree(X, y, 0);
    }

    buildTree(X, y, depth) {
        if (depth >= this.maxDepth || y.length < 2) {
            return { prediction: y.reduce((a, b) => a + b, 0) / y.length };
        }

        // Simple split on first feature at median
        const feature = 0;
        const values = X.map(row => Array.isArray(row) && row.length > 0 ? (row[0] || 0) : 0)
                       .sort((a, b) => a - b);
        const threshold = values.length > 0 ? values[Math.floor(values.length / 2)] : 0;
        
        const leftIndices = [];
        const rightIndices = [];
        
        X.forEach((row, idx) => {
            const value = Array.isArray(row) && row.length > 0 ? (row[0] || 0) : 0;
            if (value <= threshold) {
                leftIndices.push(idx);
            } else {
                rightIndices.push(idx);
            }
        });
        
        if (leftIndices.length === 0 || rightIndices.length === 0) {
            return { prediction: y.reduce((a, b) => a + b, 0) / y.length };
        }

        const leftX = leftIndices.map(idx => X[idx]);
        const leftY = leftIndices.map(idx => y[idx]);
        const rightX = rightIndices.map(idx => X[idx]);
        const rightY = rightIndices.map(idx => y[idx]);

        return {
            feature,
            threshold,
            left: this.buildTree(leftX, leftY, depth + 1),
            right: this.buildTree(rightX, rightY, depth + 1)
        };
    }

    predict(X) {
        if (!X || X.length === 0 || !this.tree) return [];
        return X.map(row => this.predictSingle(row, this.tree));
    }

    predictSingle(row, node) {
        if (!node || node.prediction !== undefined) {
            return node ? node.prediction : 0;
        }

        const value = Array.isArray(row) && row.length > node.feature ? (row[node.feature] || 0) : 0;
        if (value <= node.threshold) {
            return this.predictSingle(row, node.left);
        } else {
            return this.predictSingle(row, node.right);
        }
    }
}

class RandomForest {
    constructor() {
        this.trees = [];
        this.numTrees = 5;
    }

    async fit(X, y) {
        if (!X || !y || X.length === 0 || y.length === 0 || X.length !== y.length) {
            this.trees = [];
            return;
        }
        
        this.trees = [];
        
        for (let i = 0; i < this.numTrees; i++) {
            const { bootX, bootY } = this.bootstrap(X, y);
            const tree = new DecisionTree();
            await tree.fit(bootX, bootY);
            this.trees.push(tree);
        }
    }

    bootstrap(X, y) {
        const n = X.length;
        const bootX = [];
        const bootY = [];
        
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * n);
            bootX.push(X[idx]);
            bootY.push(y[idx]);
        }
        
        return { bootX, bootY };
    }

    predict(X) {
        if (!X || X.length === 0 || this.trees.length === 0) return [];
        
        const predictions = this.trees.map(tree => tree.predict(X));
        
        return X.map((_, i) => {
            const treePredictions = predictions.map(pred => pred[i] || 0);
            return treePredictions.reduce((a, b) => a + b, 0) / treePredictions.length;
        });
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InsuranceForecastingApp();
});