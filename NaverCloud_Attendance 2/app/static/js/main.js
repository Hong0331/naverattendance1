function loadAttendance() {
    fetch('/api/attendance')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('attendance-body');
            tbody.innerHTML = '';
            
            data.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.name}</td>
                    <td>${record.checkInTime || '-'}</td>
                    <td>${record.checkInStatus || '-'}</td>
                    <td>${record.checkOutTime || '-'}</td>
                    <td>${record.checkOutStatus || '-'}</td>
                    <td>${record.reason || '-'}</td>
                    <td>
                        <button onclick="updateAttendance('${record.name}', 'checkin')">출근</button>
                        <button onclick="updateAttendance('${record.name}', 'checkout')">퇴근</button>
                        <button onclick="markAbsent('${record.name}')">결석</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
}

function initializeDebugTime() {
    const debugTimeInput = document.getElementById('debugTime');
    const now = new Date();
    const dateString = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm 형식
    debugTimeInput.value = dateString;
    
    debugTimeInput.addEventListener('change', updateDebugTime);
}

async function updateDebugTime(event) {
    const debugTime = event.target.value;
    try {
        const response = await fetch('/api/debug/time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ debug_time: debugTime })
        });
        
        if (!response.ok) throw new Error('Failed to update debug time');
        
        // 화면 새로고침
        await refreshAttendanceData();
    } catch (error) {
        showAlert('error', '디버그 시간 설정 중 오류가 발생했습니다: ' + error.message);
    }
}

// 기존 출퇴근 업데이트 함수 수정
async function updateAttendance(name, type, reason = '') {
    const debugTimeInput = document.getElementById('debugTime');
    const debugTime = debugTimeInput.value;
    
    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                type,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                reason,
                debug_time: debugTime // 디버그 시간 추가
            })
        });
        
        const data = await response.json();
        if (data.status === 'error') {
            showAlert('error', data.message);
            return false;
        }
        
        await refreshAttendanceData();
        return true;
    } catch (error) {
        showAlert('error', '출퇴근 업데이트 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
}

function resetDebugTime() {
    const debugTimeInput = document.getElementById('debugTime');
    const now = new Date();
    const dateString = now.toISOString().slice(0, 16);
    debugTimeInput.value = dateString;
    updateDebugTime({ target: debugTimeInput });
}

function resetAttendance() {
    if (confirm('모든 출석 기록을 초기화하시겠습니까?')) {
        fetch('/api/attendance/reset', {
            method: 'POST'
        })
        .then(() => loadAttendance());
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeDebugTime();
});