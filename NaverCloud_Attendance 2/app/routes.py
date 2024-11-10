from flask import Blueprint, render_template, request, jsonify, current_app
from app.models import Attendance
from app import db
from datetime import datetime, time, timedelta

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/api/attendance', methods=['GET'])
def get_attendance():
    try:
        today = datetime.now().date()
        records = Attendance.query.filter_by(date=today).all()
        
        if not records:
            employee_names = [
                "강성준", "강수민", "김재현", "박홍석",
                "양은정", "양지수", "장은지", "조하영"
            ]
            
            for name in employee_names:
                new_record = Attendance(name=name, date=today)
                db.session.add(new_record)
            
            db.session.commit()
            records = Attendance.query.filter_by(date=today).all()
        
        attendance_data = [record.to_dict() for record in records]
        return jsonify(attendance_data)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': '데이터를 불러오는 중 오류가 발생했습니다.'
        }), 500

@main_bp.route('/api/attendance', methods=['POST'])
def update_attendance():
    try:
        data = request.json
        today = datetime.now().date()
        
        # 디버그 시간 처리
        if 'debug_time' in data:
            current_datetime = datetime.strptime(data['debug_time'], '%Y-%m-%d %H:%M')
        else:
            current_time = datetime.strptime(data['time'], '%H:%M').time()
            current_datetime = datetime.combine(today, current_time)
        
        record = Attendance.query.filter_by(
            name=data['name'],
            date=current_datetime.date()
        ).first()
        
        if not record:
            record = Attendance(name=data['name'], date=current_datetime.date())
            db.session.add(record)
        
        if data['type'] == 'checkin':
            # 출근 처리
            record.check_in_time = current_datetime
            
            current_time = current_datetime.time()
            if current_time < time(9, 11):
                record.check_in_status = '정상'
                record.late_reason = None
            elif current_time < time(9, 31):
                record.check_in_status = '지각'
                record.late_reason = data.get('reason', '')
            else:
                record.check_in_status = '무단지각'
                record.late_reason = '무단지각'
                
        elif data['type'] == 'checkout':
            # 퇴근 처리
            record.check_out_time = current_datetime
            
            current_time = current_datetime.time()
            if current_time < time(18, 0):
                record.check_out_status = '조퇴'
                record.early_reason = data.get('reason', '')
            else:
                record.check_out_status = '정상'
                record.early_reason = None
        
        db.session.commit()
        return jsonify({'status': 'success'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})

@main_bp.route('/api/attendance/reset', methods=['POST'])
def reset_attendance():
    try:
        db.session.query(Attendance).delete()
        db.session.commit()
        
        today = datetime.now().date()
        employee_names = [
            "강성준", "강수민", "김재현", "박홍석",
            "양은정", "양지수", "장은지", "조하영"
        ]
        
        for name in employee_names:
            new_record = Attendance(name=name, date=today)
            db.session.add(new_record)
        
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})