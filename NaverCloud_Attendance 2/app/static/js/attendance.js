document.addEventListener('DOMContentLoaded', function() {
    const tableResponsive = document.querySelector('.table-responsive');
    const loadingSpinner = document.querySelector('.loading');
    const currentTimeDisplay = document.getElementById('currentTime');
    
    // 현재 시간 표시 함수
    function updateCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        currentTimeDisplay.textContent = `${hours}:${minutes}`;
    }
    
    // 1초마다 현재 시간 업데이트
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();  // 초기 시간 표시
    
    function loadAttendanceData() {
        loadingSpinner.classList.remove('d-none');
        
        fetch('/api/attendance')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'error') {
                    throw new Error(data.message);
                }
                
                let tableHTML = `
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>이름</th>
                                <th>출근 시간</th>
                                <th>출근 상태</th>
                                <th>퇴근 시간</th>
                                <th>퇴근 상태</th>
                                <th>사유</th>
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.forEach(record => {
                    const isCheckedIn = record.checkInTime !== null;
                    const isCheckedOut = record.checkOutTime !== null;
                    
                    tableHTML += `
                        <tr>
                            <td>${record.name || '-'}</td>
                            <td>${record.checkInTime || '-'}</td>
                            <td class="text-${getStatusColor(record.checkInStatus)}">${record.checkInStatus || '-'}</td>
                            <td>${record.checkOutTime || '-'}</td>
                            <td class="text-${getStatusColor(record.checkOutStatus)}">${record.checkOutStatus || '-'}</td>
                            <td>${record.reason || '-'}</td>
                            <td>
                                <div class="btn-group">
                                    ${!isCheckedIn ? `
                                        <button class="btn btn-sm btn-primary" 
                                                onclick="handleAttendance('${record.name}', 'checkin')">출근</button>
                                    ` : ''}
                                    ${isCheckedIn && !isCheckedOut ? `
                                        <button class="btn btn-sm btn-success me-1" 
                                                onclick="handleAttendance('${record.name}', 'checkout')">퇴근</button>
                                        <button class="btn btn-sm btn-warning" 
                                                onclick="handleAttendance('${record.name}', 'early')">조퇴</button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                });
                
                tableHTML += '</tbody></table>';
                tableResponsive.innerHTML = tableHTML;
                updateReportText();
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: '데이터를 불러오는데 실패했습니다',
                    text: error.message
                });
            })
            .finally(() => {
                loadingSpinner.classList.add('d-none');
            });
    }

    // 출퇴근 처리 함수
    window.handleAttendance = async function(name, type) {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        let data = {
            name: name,
            type: type,
            time: time
        };

        // 출근 처리
        if (type === 'checkin') {
            if (currentMinutes >= 551) {  // 09:11 이후는 모두 지각
                const { value: reason } = await Swal.fire({
                    title: '지각 사유를 입력해주세요',
                    input: 'text',
                    inputPlaceholder: '사유를 입력하세요',
                    showCancelButton: true,
                    confirmButtonText: '확인',
                    cancelButtonText: '취소',
                    inputValidator: (value) => {
                        if (!value) {
                            return '사유를 입력해주세요!';
                        }
                    }
                });
                
                if (!reason) return;
                data.reason = reason;
            }
        }
        else if (type === 'checkout') {
            if (currentMinutes < 1070) {  // 17:50 이전
                Swal.fire({
                    icon: 'warning',
                    title: '퇴근 불가',
                    text: '아직 퇴근 시간이 되지 않았습니다. (17:50 이후 퇴근 가능)'
                });
                return;
            }
        }
        else if (type === 'early') {
            const { value: reason } = await Swal.fire({
                title: '조퇴 사유를 입력해주세요',
                input: 'text',
                inputPlaceholder: '사유를 입력하세요',
                showCancelButton: true,
                confirmButtonText: '확인',
                cancelButtonText: '취소',
                inputValidator: (value) => {
                    if (!value) {
                        return '사유를 입력해주세요!';
                    }
                }
            });
            
            if (!reason) return;
            data.reason = reason;
        }

        fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                loadAttendanceData();
                let message = '';
                if (type === 'checkin') {
                    if (currentMinutes >= 551) {
                        message = '지각 처리되었습니다.';
                    } else {
                        message = '정상 출근 처리되었습니다.';
                    }
                } else if (type === 'checkout') {
                    message = '퇴근 처리되었습니다.';
                } else {
                    message = '조퇴 처리되었습니다.';
                }
                
                Swal.fire({
                    icon: 'success',
                    title: message,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: '알림',
                    text: data.message
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: '오류가 발생했습니다',
                text: '잠시 후 다시 시도해주세요.'
            });
        });
    };

    function getStatusColor(status) {
        switch(status) {
            case '정상': return 'success';
            case '지각': return 'warning';
            case '조퇴': return 'warning';
            default: return 'secondary';
        }
    }

    // 현황 텍스트 업데이트
    function updateReportText() {
        const reportText = document.getElementById('reportText');
        fetch('/api/attendance')
            .then(response => response.json())
            .then(data => {
                const header = `## 네이버 팀 출퇴근 현황\n\n`;
                const table = data.map(record => {
                    return `${record.name}\t${record.checkInTime || 'x'}\t${record.checkInStatus || 'x'}\t${record.checkOutTime || 'x'}\t${record.checkOutStatus || 'x'}\t${record.reason || 'x'}`;
                }).join('\n');
                
                reportText.textContent = `${header}${table}`;
            });
    }

    // 복사 버튼
    document.getElementById('copyStatus').addEventListener('click', async function() {
        const reportText = document.getElementById('reportText');
        try {
            await navigator.clipboard.writeText(reportText.textContent);
            Swal.fire({
                icon: 'success',
                title: '복사되었습니다',
                timer: 1500
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: '복사 실패',
                text: '클립보드 접근에 실패했습니다.'
            });
        }
    });

    // 초기화 버튼
    document.getElementById('resetButton').addEventListener('click', function() {
        // 먼저 비밀번호 입력 요청
        Swal.fire({
            title: '관리자 비밀번호 입력',
            input: 'password',
            inputPlaceholder: '비밀번호를 입력하세요',
            showCancelButton: true,
            confirmButtonText: '확인',
            cancelButtonText: '취소',
            inputValidator: (value) => {
                // 여기서 '1234'를 원하는 비밀번호로 변경하세요
                if (!value) {
                    return '비밀번호를 입력해주세요!';
                }
                if (value !== '1234') {  // 실제 비밀번호
                    return '비밀번호가 일치하지 않습니다!';
                }
            }
        }).then((password) => {
            if (password.isConfirmed) {
                // 비밀번호가 맞으면 초기화 확인 요청
                Swal.fire({
                    title: '초기화하시겠습니까?',
                    text: '모든 출퇴근 기록이 초기화됩니다',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: '초기화',
                    cancelButtonText: '취소'
                }).then((result) => {
                    if (result.isConfirmed) {
                        loadingSpinner.classList.remove('d-none');
                        fetch('/api/attendance/reset', {
                            method: 'POST'
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'success') {
                                loadAttendanceData();
                                Swal.fire({
                                    icon: 'success',
                                    title: '초기화되었습니다',
                                    timer: 1500
                                });
                            } else {
                                throw new Error(data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            Swal.fire({
                                icon: 'error',
                                title: '초기화 중 오류가 발생했습니다',
                                text: '잠시 후 다시 시도해주세요.'
                            });
                        })
                        .finally(() => {
                            loadingSpinner.classList.add('d-none');
                        });
                    }
                });
            }
        });
    });
    
    // 새로고침 버튼
    document.getElementById('refreshButton').addEventListener('click', loadAttendanceData);
    
    // 초기 데이터 로드
    loadAttendanceData();
    
    // 자동 새로고침 (30초)
    setInterval(loadAttendanceData, 30000);
});