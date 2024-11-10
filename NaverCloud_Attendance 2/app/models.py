from app import db
from datetime import datetime

class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.now().date)
    check_in_time = db.Column(db.DateTime)
    check_in_status = db.Column(db.String(20))
    check_out_time = db.Column(db.DateTime)
    check_out_status = db.Column(db.String(20))
    late_reason = db.Column(db.Text)     # 지각 사유
    early_reason = db.Column(db.Text)    # 조퇴 사유
    
    def __init__(self, name, date=None):
        self.name = name
        self.date = date or datetime.now().date()
    
    def to_dict(self):
        return {
            'name': self.name,
            'checkInTime': self.check_in_time.strftime('%H:%M') if self.check_in_time else None,
            'checkInStatus': self.check_in_status,
            'checkOutTime': self.check_out_time.strftime('%H:%M') if self.check_out_time else None,
            'checkOutStatus': self.check_out_status,
            'lateReason': self.late_reason,    # 지각 사유
            'earlyReason': self.early_reason   # 조퇴 사유
        }

    def __repr__(self):
        return f'<Attendance {self.name} {self.date}>'