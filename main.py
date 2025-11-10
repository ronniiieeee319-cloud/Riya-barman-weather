"""
Riya Barman Weather App - Python Flask Version
A modern weather application with real-time data and PWA support
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Configuration
API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    """Serve PWA manifest"""
    return send_from_directory('static', 'manifest.json')

@app.route('/service-worker.js')
def service_worker():
    """Serve service worker"""
    return send_from_directory('static', 'service-worker.js')

@app.route('/api/weather/city/<city>')
def get_weather_by_city(city):
    """Get weather data by city name"""
    try:
        url = f"{API_BASE_URL}?q={city}&appid={API_KEY}&units=metric"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            weather_data = format_weather_data(data)
            return jsonify(weather_data)
        elif response.status_code == 404:
            return jsonify({'error': 'City not found'}), 404
        elif response.status_code == 401:
            return jsonify({'error': 'Invalid API key'}), 401
        else:
            return jsonify({'error': 'Unable to fetch weather data'}), 500
            
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weather/coordinates')
def get_weather_by_coords():
    """Get weather data by coordinates"""
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({'error': 'Missing coordinates'}), 400
        
        url = f"{API_BASE_URL}?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            weather_data = format_weather_data(data)
            return jsonify(weather_data)
        else:
            return jsonify({'error': 'Unable to fetch weather data'}), 500
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

def format_weather_data(data):
    """Format weather data for frontend"""
    return {
        'name': data['name'],
        'sys': {
            'country': data['sys']['country']
        },
        'main': {
            'temp': data['main']['temp'],
            'feels_like': data['main']['feels_like'],
            'humidity': data['main']['humidity']
        },
        'weather': [{
            'main': data['weather'][0]['main'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon']
        }],
        'wind': {
            'speed': data['wind']['speed']
        },
        'visibility': data['visibility']
    }

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'api_key_configured': API_KEY != 'YOUR_API_KEY_HERE'
    })

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='0.0.0.0', port=5000)
