from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from NaverCloud_Attendance.config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    
    with app.app_context():
        db.create_all()  # 테이블 생성
        
    return app