# Riya Barman Weather App (Flask)

A simple Flask-based weather app that uses the OpenWeatherMap API and can be run locally or deployed with Gunicorn.

## Prerequisites

- Python 3.11.7 (you indicated this interpreter)
- Git (optional)
- An OpenWeatherMap API key: https://openweathermap.org/api

## Quick setup (recommended: virtual environment)

Open PowerShell in the project root (`c:\tryy`) and run:

```powershell
# create a virtual environment
python -m venv .venv

# activate the venv (PowerShell)
.venv\Scripts\Activate.ps1

# upgrade pip and install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Environment variables

You can copy the example `.env.example` to `.env` and replace placeholders:

```powershell
# Windows PowerShell
copy .env.example .env
# then edit .env and replace placeholders with real values
```

Alternatively, set the API key in your current shell session (temporary):

```powershell
$env:OPENWEATHER_API_KEY = "your_real_api_key_here"
```

Note: `python-dotenv` (included in `requirements.txt`) is used by Flask tooling to load `.env` when using the `flask` CLI. If you run `python main.py` directly, ensure your environment variables are set in the shell or load them programmatically.

## Run locally

With the virtual environment active and `OPENWEATHER_API_KEY` set (either via `.env` or shell):

```powershell
# recommended for local development
python main.py

# then open http://127.0.0.1:5000 in your browser
```

If you prefer to use the Flask CLI (loads `.env` automatically):

```powershell
# set the FLASK_APP env var and run
$env:FLASK_APP = "main.py"
flask run --host=0.0.0.0 --port=5000
```

## Run with Gunicorn (production)

The repository contains a `Procfile` for platforms like Heroku. Locally (Linux/macOS) you can run:

```bash
# example (Linux/macOS)
gunicorn main:app -w 4 -b 0.0.0.0:8000
```

Note: Gunicorn is not typically used on Windows. For production deployment to Linux servers or PaaS, `web: gunicorn main:app` is the entrypoint (already in `Procfile`).

## Templates & Static files

The app expects a `templates/index.html` and a `static/` folder with `manifest.json` and `service-worker.js` for PWA features. These are currently placeholders in the todo list; I can create simple starter files if you want.

## Health check

There is a health endpoint at `/health` that will report application status and whether the API key is configured.

## Troubleshooting

- If requests to the OpenWeather API return 401, double-check `OPENWEATHER_API_KEY`.
- If you can't access the app, verify the virtual environment is activated and dependencies installed.

## Next steps I can do for you

- Create `templates/index.html`, `static/manifest.json`, and `static/service-worker.js` placeholders (I can add a minimal UI).
- Create the workspace virtualenv and install the pinned requirements automatically.
- Add unit tests or CI workflow.

If you want me to proceed with any of the above, say which one and I'll take care of it.
