from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configuración de la base de datos
    app.config['DB_HOST']     = os.getenv('DB_HOST')
    app.config['DB_PORT']     = int(os.getenv('DB_PORT'))
    app.config['DB_USER']     = os.getenv('DB_USER')
    app.config['DB_PASSWORD'] = os.getenv('DB_PASSWORD')
    app.config['DB_NAME']     = os.getenv('DB_NAME')

    # Registrar rutas
    from app.routes import main
    app.register_blueprint(main)

    return app