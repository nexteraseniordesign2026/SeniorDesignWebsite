/**
 * DynamoDB Service
 * Handles fetching location data from DynamoDB via API Gateway
 */

class DynamoDBService {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint || window.DYNAMODB_API_ENDPOINT || '';
        this.cache = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = 0;
        this.usingMockData = false; // Track if we're using mock data
        this.lastError = null; // Store last error for debugging
    }

    /**
     * Map predicted_class to risk level
     */
    mapPredictedClassToRisk(predictedClass) {
        const riskMap = {
            'no_vegetation': 'NO_VEGETATION',
            'little_vegetation': 'MEDIUM',
            'lot_vegetation': 'HIGH',
            'back_of_panel': 'BAD_IMAGE'
        };
        return riskMap[predictedClass] || 'NO_VEGETATION';
    }

    /**
     * Map risk level to color
     */
    getRiskColor(risk) {
        const colorMap = {
            'BAD_IMAGE': { text: 'text-gray-400', bg: '#6b7280' },      // Grey for back_of_panel
            'HIGH': { text: 'text-red-400', bg: '#dc2626' },            // Red for lot_vegetation
            'MEDIUM': { text: 'text-orange-400', bg: '#ea580c' },       // Orange for little_vegetation
            'NO_VEGETATION': { text: 'text-green-400', bg: '#16a34a' }  // Green for no_vegetation
        };
        return colorMap[risk] || colorMap['NO_VEGETATION'];
    }

    /**
     * Generate S3 image URL
     */
    getImageUrl(item) {
        if (item.image_s3_bucket && item.image_s3_key) {
            // If using CloudFront or public S3 bucket
            return `https://${item.image_s3_bucket}.s3.amazonaws.com/${item.image_s3_key}`;
        }
        // Fallback to placeholder
        return 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
    }

    /**
     * Transform DynamoDB item to UI format
     */
    transformItem(item) {
        const risk = this.mapPredictedClassToRisk(item.predicted_class);
        const colors = this.getRiskColor(risk);
        
        // Format timestamp
        const timestamp = item.capture_timestamp || item.created_at || '';
        const timeOnly = timestamp.includes('T') 
            ? timestamp.split('T')[1]?.split('.')[0] || timestamp.split('T')[1] || ''
            : timestamp;

        return {
            captureId: item.capture_id,
            vehicleId: item.device_name || item.capture_id?.split('_')[0] || 'UNKNOWN',
            lat: parseFloat(item.latitude),
            lng: parseFloat(item.longitude),
            risk: risk,
            color: colors.text,
            bgColor: colors.bg,
            location: `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`,
            clearance: item.altitude ? `${item.altitude.toFixed(1)} ft` : 'N/A',
            species: item.predicted_class || 'Unknown',
            confidence: item.confidence || 0,
            allProbabilities: item.all_probabilities || {},
            image: this.getImageUrl(item),
            timestamp: timeOnly || timestamp,
            fullTimestamp: timestamp,
            deviceName: item.device_name,
            cameraId: item.camera_id,
            gpsStatus: item.gps_status,
            numSatellites: item.num_satellites,
            imageS3Key: item.image_s3_key,
            imageS3Bucket: item.image_s3_bucket
        };
    }

    /**
     * Fetch data from DynamoDB via API
     */
    async fetchLocations(options = {}) {
        const {
            limit = 100,
            deviceName = null,
            startTimestamp = null,
            endTimestamp = null
        } = options;

        // Check cache
        const now = Date.now();
        if (this.cache && (now - this.lastFetch) < this.cacheExpiry && !this.usingMockData) {
            console.log('Using cached DynamoDB data');
            return this.cache;
        }

        if (!this.apiEndpoint) {
            console.warn('DynamoDB API endpoint not configured. Using mock data.');
            this.usingMockData = true;
            this.lastError = 'API endpoint not configured';
            return this.getMockData();
        }

        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('limit', limit);
            if (deviceName) params.append('device_name', deviceName);
            if (startTimestamp) params.append('start_timestamp', startTimestamp);
            if (endTimestamp) params.append('end_timestamp', endTimestamp);

            const url = `${this.apiEndpoint}?${params.toString()}`;
            console.log('Fetching DynamoDB data from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
                console.error('DynamoDB API Error:', errorMessage);
                
                // If it's a ResourceNotFoundException, the table doesn't exist
                if (errorMessage.includes('ResourceNotFoundException')) {
                    console.warn('DynamoDB table not found. Please ensure the table exists and the Lambda function has correct permissions.');
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Check if response has an error field
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Transform items
            const transformed = Array.isArray(data.items) 
                ? data.items.map(item => this.transformItem(item))
                : [];

            // Cache the results
            this.cache = transformed;
            this.lastFetch = now;
            this.usingMockData = false;
            this.lastError = null;

            console.log(`✅ Fetched ${transformed.length} locations from DynamoDB`);
            return transformed;

        } catch (error) {
            console.error('❌ Error fetching DynamoDB data:', error);
            
            // Store error for debugging
            this.lastError = error.message || 'Unknown error';
            this.usingMockData = true;
            
            // Show user-friendly error message
            const errorMessage = error.message || 'Unknown error';
            if (errorMessage.includes('ResourceNotFoundException')) {
                console.warn('⚠️ DynamoDB table not found. Using mock data. Please ensure:');
                console.warn('1. DynamoDB table exists');
                console.warn('2. Lambda function has correct table name');
                console.warn('3. Lambda execution role has DynamoDB read permissions');
            } else {
                console.warn('⚠️ API error. Using mock data as fallback.');
            }
            
            // Fallback to mock data on error
            return this.getMockData();
        }
    }

    /**
     * Get mock data for development/testing
     */
    getMockData() {
        return [
            {
                captureId: 'raspberry_pi_20260203_175034',
                vehicleId: 'raspberry_pi',
                lat: 38.921574,
                lng: -83.123456,
                risk: 'HIGH',
                color: 'text-red-400',
                bgColor: '#dc2626',
                location: '38.9216, -83.1235',
                clearance: '250.5 ft',
                species: 'back_of_panel',
                confidence: 0.5306,
                image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                timestamp: '17:50:34',
                fullTimestamp: '2026-02-03T17:50:34Z',
                deviceName: 'raspberry_pi',
                cameraId: 0
            }
        ];
    }

    /**
     * Get location by capture ID
     */
    async getLocationById(captureId) {
        const locations = await this.fetchLocations();
        return locations.find(loc => loc.captureId === captureId);
    }

    /**
     * Get locations by device name
     */
    async getLocationsByDevice(deviceName) {
        return await this.fetchLocations({ deviceName });
    }

    /**
     * Check if currently using mock data
     */
    isUsingMockData() {
        return this.usingMockData;
    }

    /**
     * Get last error message
     */
    getLastError() {
        return this.lastError;
    }
}

// Export for use in other scripts
window.DynamoDBService = DynamoDBService;

