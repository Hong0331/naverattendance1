# init_db.py
from app import create_app, db
from app.models import Attendance
from datetime import datetime

app = create_app()

def init_db():
    with app.app_context():
        # 테이블 생성
        db.create_all()
        
        # 현재 날짜 가져오기
        today = datetime.now().date()
        
        # 기존 테이블 데이터 모두 삭제
        try:
            Attendance.query.delete()
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error deleting existing records: {str(e)}")
        
        # 초기 직원 데이터
        employees = [
            "강성준", "강수민", "김재현", "박홍석",
            "양은정", "양지수", "장은지", "조하영"
        ]
        
        # 새로운 레코드 추가
        for name in employees:
            attendance = Attendance(
                name=name,
                date=today,
                check_in_status=None,
                check_out_status=None,
                late_reason=None,     # 초기 지각 사유는 None
                early_reason=None     # 초기 조퇴 사유는 None
            )
            db.session.add(attendance)
        
        try:
            db.session.commit()
            print("Database initialized successfully!")
            
            # 확인을 위한 데이터 출력
            records = Attendance.query.all()
            print(f"\nCreated {len(records)} records:")
            for record in records:
                print(f"- {record.name}: {record.date}")
                
        except Exception as e:
            db.session.rollback()
            print(f"Error initializing database: {str(e)}")

if __name__ == '__main__':
    init_db()