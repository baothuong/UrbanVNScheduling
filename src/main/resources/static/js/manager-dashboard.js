document.addEventListener("DOMContentLoaded", function () {
    // =================================================================
    // == 設定とグローバル変数の宣言エリア ==
    // =================================================================

    const OFFICE_API_URL = `/api/offices`;
    const EMPLOYEE_API_URL = `/api/employees`;
    const SCHEDULE_API_URL = `/api/schedules`;
    const FILE_API_URL = `/api/files`;

    const workTypeTranslations = {
        NORMAL: '通常勤務',
        BUSINESS_TRIP: '出張',
        VACATION: '休暇',
        OUTSIDE: '外出',
        OVERTIME: '残業'
    };
    const positionTranslations = {
        STAFF: '従業員',
        LEADER: 'リーダー',
        MANAGER: 'マネージャー',
    };

    function toLocalISOString(date) {
        if (!date) return null;
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let empCurrentPage = 0;
    const empPageSize = 10;
    let selectedAvatarFile = null;
    let teamCalendar = null; // カレンダーオブジェクトを保存する変数
    let personalCalendar = null; // 個人カレンダー用の変数
    let allEmployeesCache = [];
    let isPopulatingForm = false;

    // --- UI要素の取得 ---
    const alertBox = document.getElementById('custom-alert-box');
    const alertMessage = document.getElementById('custom-alert-message');
    const officeTableBody = document.getElementById('office-table-body');
    const addOfficeBtn = document.getElementById('add-office-btn');
    const officeModal = document.getElementById('office-modal');
    const officeForm = document.getElementById('office-form');
    const officeModalTitle = document.getElementById('office-modal-title');
    const employeeTableBody = document.getElementById('employee-table-body');
    const employeePagination = document.getElementById('employee-pagination');
    const searchEmployeeInput = document.getElementById('search-employee-input');
    const filterEmployeeOffice = document.getElementById('filter-employee-office');
    const filterEmployeeRole = document.getElementById('filter-employee-role');
    const addEmployeeMainBtn = document.getElementById('add-employee-main-btn');
    const employeeModal = document.getElementById('employee-modal');
    const employeeForm = document.getElementById('employee-form');
    const employeeModalTitle = document.getElementById('employee-modal-title');
    const employeeIdInput = document.getElementById('employee-id');
    const employeePasswordInput = document.getElementById('employee-password');
    const employeeOfficeSelect = document.getElementById('employee-officeId');
    const viewEmployeeModal = document.getElementById('view-employee-modal');
    const viewEmployeeContent = document.getElementById('view-employee-content');
    const closeViewEmployeeModalBtn = document.getElementById('close-view-employee-modal');
    const cancelViewEmployeeBtn = document.getElementById('cancel-view-employee-btn');
    const avatarPreview = document.getElementById('employee-avatar-preview');
    const avatarInput = document.getElementById('employee-avatar-input');
    const selectAvatarBtn = document.getElementById('employee-avatar-select-btn');
    const removeAvatarBtn = document.getElementById('employee-avatar-remove-btn');
    const avatarUrlInput = document.getElementById('employee-avatar-url');
    const statsTotalEmployeesEl = document.getElementById('stats-total-employees');
    const statsByPositionEl = document.getElementById('stats-by-position');
    const statsByOfficeEl = document.getElementById('stats-by-office');
    const teamCalendarEl = document.getElementById('team-calendar');
    const teamCalendarOfficeFilter = document.getElementById('team-calendar-office-filter');
    const scheduleModal = document.getElementById('schedule-modal');
    const scheduleForm = document.getElementById('schedule-form');
    const deleteScheduleBtn = document.getElementById('delete-schedule-btn');
    const addScheduleBtn = document.getElementById('add-schedule-main-btn');
    // =================================================================
    // == ヘルパー関数 ==
    // =================================================================
    const getRequestHeaders = (isFormData = false) => {
        const headers = {
            'Accept': 'application/json'
        };
        if (!isFormData) headers['Content-Type'] = 'application/json';
        return headers;
    };
    const handleResponse = async (response) => {
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/login-JP.html';
            throw new Error('セッションが期限切れです。再度ログインしてください。');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: 'サーバーから不明なエラーが発生しました。'
            }));
            throw new Error(errorData.message || 'エラーが発生しました。');
        }
        if (response.status === 204) return null;
        return response.json();
    };

    function showAlert(message, type = 'info', duration = 3000) {
        const alertBox = document.getElementById('custom-alert-box');
        const alertMessage = document.getElementById('custom-alert-message');
        if (!alertBox || !alertMessage) {
            console.error("Lỗi: Không tìm thấy phần tử #custom-alert-box hoặc #custom-alert-message trong HTML.");
            return;
        }
        alertBox.className = 'custom-alert';
        alertBox.classList.add(`alert-${type}`);
        alertMessage.textContent = message;
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
            alertBox.classList.remove(`alert-${type}`);
        }, duration);
    }

    const renderWorkTypeLegend = (targetElementId) => {
        const targetEl = document.getElementById(targetElementId);
        if (!targetEl) return;
        let legendHTML = Object.keys(workTypeTranslations).map(typeKey => {
            const color = workTypeColors[typeKey] || '#888888';
            const name = workTypeTranslations[typeKey];
            return `
                <div class="flex items-center">
                    <span class="h-4 w-4 rounded-full mr-2 border border-gray-200" style="background-color: ${color};"></span>
                    <span class="text-sm text-gray-700">${name}</span>
                </div>`;
        }).join('');
        targetEl.innerHTML = legendHTML;
    };

    const setScheduleFormState = (enabled) => {
        const formElements = scheduleForm.querySelectorAll('input, select, textarea, button');
        formElements.forEach(el => {
            if (el.id !== 'close-schedule-modal' && el.id !== 'cancel-schedule-btn' && el.id !== 'schedule-workType') {
                el.disabled = !enabled;
            }
        });
        document.getElementById('schedule-workType').disabled = false;
    };

    const updateOfficeForInDayEvent = (employeeId) => {
        const scheduleWorkTypeSelect = document.getElementById('schedule-workType');
        const officeSelect = document.getElementById('schedule-office');
        const selectedWorkType = scheduleWorkTypeSelect.value;

        if (employeeId && selectedWorkType && selectedWorkType !== 'VACATION' && selectedWorkType !== 'BUSINESS_TRIP') {
            const employee = allEmployeesCache.find(emp => emp.id == employeeId);
            if (employee && employee.officeId) {
                officeSelect.value = employee.officeId;
            }
            officeSelect.disabled = true;
            officeSelect.classList.add('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');
        } else {
            officeSelect.disabled = false;
            officeSelect.classList.remove('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');
        }
    };
    const loadAndCacheAllEmployees = async () => {
        if (allEmployeesCache.length === 0) {
            try {
                // Lấy một lượng lớn (ví dụ 500) để đảm bảo có tất cả nhân viên, tránh phân trang
                const employeesPage = await fetch(`${EMPLOYEE_API_URL}?size=500`, {
                    headers: getRequestHeaders(),
                    credentials: 'include'
                }).then(handleResponse);
                allEmployeesCache = employeesPage.content;
            } catch (error) {
                showAlert('従業員リストの読み込みに失敗しました。', 'error');
            }
        }
    };

    const getScheduleState = (schedule) => {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đặt giờ về đầu ngày để so sánh ngày

        const scheduleStart = new Date(schedule.startDate);
        const scheduleEnd = new Date(schedule.endDate);

        // Tạo đối tượng datetime đầy đủ để so sánh
        const scheduleStartDateTime = new Date(`${schedule.startDate}T${schedule.startTime || '00:00:00'}`);
        const scheduleEndDateTime = new Date(`${schedule.endDate}T${schedule.endTime || '23:59:59'}`);

        // 1. KIỂM TRA ĐÃ KẾT THÚC
        if (scheduleEndDateTime < now) {
            return 'FINISHED';
        }

        // 2. KIỂM TRA ĐANG DIỄN RA
        if (scheduleStartDateTime <= now && now <= scheduleEndDateTime) {
            return 'IN_PROGRESS';
        }

        // 3. MẶC ĐỊNH LÀ CHƯA DIỄN RA
        return 'UPCOMING';
    };

    const setFormPermissions = (state) => {
        // Mở khóa tất cả trước khi thiết lập quyền
        const allElements = scheduleForm.querySelectorAll('input, select, textarea');
        allElements.forEach(el => {
            el.disabled = false;
            el.readOnly = false;
            el.classList.remove('bg-gray-200', 'cursor-not-allowed');
        });

        document.getElementById('save-schedule-btn').style.display = 'inline-block';
        document.getElementById('delete-schedule-btn').style.display = 'inline-block';
        document.getElementById('cancel-event-btn').style.display = 'none';


        switch (state) {
            case 'UPCOMING':
                // Giữ nguyên, mọi thứ đều có thể chỉnh sửa
                break;

            case 'IN_PROGRESS':
                // Khóa các trường không thể thay đổi khi sự kiện đang diễn ra
                const fieldsToLock = ['schedule-employee', 'schedule-workType', 'schedule-office', 'schedule-startDate', 'schedule-startTime'];
                fieldsToLock.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.disabled = true;
                        el.classList.add('bg-gray-200', 'cursor-not-allowed');
                    }
                });
                // Vô hiệu hóa nút xóa, không thể xóa sự kiện đang diễn ra
                document.getElementById('delete-schedule-btn').disabled = true;
                document.getElementById('delete-schedule-btn').title = "進行中のスケジュールを削除できません。";
                break;

            case 'FINISHED':
            case 'CANCELLED':
                // Khóa toàn bộ form, chỉ cho xem
                allElements.forEach(el => {
                    el.disabled = true;
                    el.readOnly = true;
                    el.classList.add('bg-gray-200', 'cursor-not-allowed');
                });
                document.getElementById('save-schedule-btn').style.display = 'none';
                document.getElementById('delete-schedule-btn').style.display = 'none';

                // Chỉ hiển thị nút "Hủy" cho sự kiện đã kết thúc và chưa bị hủy
                if (state === 'FINISHED') {
                    document.getElementById('cancel-event-btn').style.display = 'inline-block';
                }
                break;
        }
    };
    const updateEventFormUI = (selectedType) => {
        const startTimeInput = document.getElementById('schedule-startTime');
        const endTimeInput = document.getElementById('schedule-endTime');
        const endDateInput = document.getElementById('schedule-endDate');
        const startDateInput = document.getElementById('schedule-startDate');
        const officeSelect = document.getElementById('schedule-office');
        const timeInputsContainer = startTimeInput.closest('.grid');

        if (selectedType === 'VACATION' || selectedType === 'BUSINESS_TRIP') {
            timeInputsContainer.style.display = 'none';
            startTimeInput.value = '';
            endTimeInput.value = '';
            endDateInput.readOnly = false;
            endDateInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
            officeSelect.disabled = false;
            officeSelect.classList.remove('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');
        } else {
            timeInputsContainer.style.display = 'grid';
            if (startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
            endDateInput.readOnly = true;
            endDateInput.classList.add('bg-gray-200', 'cursor-not-allowed');

            const selectedEmployeeId = document.getElementById('schedule-employee').value;
            if (selectedEmployeeId) {
                updateOfficeForInDayEvent(selectedEmployeeId);
            } else {
                 officeSelect.disabled = true;
                 officeSelect.classList.add('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');
            }
        }
    };

    // =================================================================
    // == イベントリスナーの設定ロジック ==
    // =================================================================

    function setupCommonUIListeners() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        userMenuButton.addEventListener('click', () => userMenu.classList.toggle('hidden'));
        document.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });

        const viewProfileLink = document.getElementById('view-profile-link');
        if (viewProfileLink) {
            viewProfileLink.addEventListener('click', (e) => {
                e.preventDefault();
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                if (currentUser && currentUser.id) {
                    openViewModal(currentUser.id);
                    userMenu.classList.add('hidden');
                } else {
                    showAlert('ユーザー情報が見つかりません。再度ログインしてください。', 'error');
                }
            });
        }

        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });

        document.querySelector('a[href="#"][role="menuitem"]:last-child').addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('本当にログアウトしますか？')) {
                try {
                    await fetch(`/api/auth/logout`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                } finally {
                    localStorage.clear();
                    window.location.href = '/login-JP.html';
                }
            }
        });
    }

    function setupOfficeListeners() {
        addOfficeBtn.addEventListener('click', () => openOfficeModal());
        document.getElementById('close-office-modal').addEventListener('click', () => officeModal.classList.add('hidden'));
        document.getElementById('cancel-office-btn').addEventListener('click', () => officeModal.classList.add('hidden'));

        officeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const officeId = document.getElementById('office-id').value;
            const isUpdating = !!officeId;
            const officeData = {
                name: document.getElementById('office-name').value,
                address: document.getElementById('office-address').value
            };
            const url = isUpdating ? `${OFFICE_API_URL}/${officeId}` : OFFICE_API_URL;
            const method = isUpdating ? 'PUT' : 'POST';

            try {
                await fetch(url, {
                    method,
                    headers: getRequestHeaders(),
                    credentials: 'include',
                    body: JSON.stringify(officeData)
                }).then(handleResponse);
                showAlert(`正常にオフィスを${isUpdating ? '更新' : '追加'}しました！`, 'success');
                officeModal.classList.add('hidden');
                await fetchAndRenderOffices();
                await loadOfficesForSelects();
                await fetchAndRenderStatistics();
            } catch (error) {
                showAlert(error.message, 'error');
            }
        });
        officeTableBody.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-office-btn');
            if (deleteBtn && confirm(`本当にオフィスID ${deleteBtn.dataset.id} を削除しますか？`)) {
                try {
                    await fetch(`${OFFICE_API_URL}/${deleteBtn.dataset.id}`, {
                        method: 'DELETE',
                        headers: getRequestHeaders(),
                        credentials: 'include'
                    }).then(handleResponse);
                    showAlert('オフィスを正常に削除しました！', 'success');
                    await fetchAndRenderOffices();
                    await loadOfficesForSelects();
                    await fetchAndRenderStatistics();
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            }

            const editBtn = e.target.closest('.edit-office-btn');
            if (editBtn) openOfficeModal(editBtn.dataset.id);
        });
    }

    function setupEmployeeListeners() {
        addEmployeeMainBtn.addEventListener('click', () => openEmployeeModal());
        document.getElementById('close-employee-modal').addEventListener('click', () => employeeModal.classList.add('hidden'));
        document.getElementById('cancel-employee-btn').addEventListener('click', () => employeeModal.classList.add('hidden'));

        employeeTableBody.addEventListener('click', async (e) => {
            const targetRow = e.target.closest('tr');
            if (!targetRow) return;

            if (e.target.closest('button')) {
                const editBtn = e.target.closest('.edit-employee-btn');
                if (editBtn) {
                    openEmployeeModal(editBtn.dataset.id);
                    return;
                }

                const deleteBtn = e.target.closest('.delete-employee-btn');
                if (deleteBtn && confirm('この従業員を本当に削除しますか？')) {
                    try {
                        await fetch(`${EMPLOYEE_API_URL}/${deleteBtn.dataset.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        }).then(handleResponse);
                        showAlert('従業員を正常に削除しました！', 'success');
                        await fetchAndRenderEmployees();
                        await fetchAndRenderStatistics();
                        if (teamCalendar) {
                            teamCalendar.refetchResources();
                            teamCalendar.refetchEvents();
                        }
                    } catch (error) {
                        showAlert(error.message, 'error');
                    }
                }
                return;
            }
            const employeeId = targetRow.id.replace('employee-row-', '');
            if (employeeId) {
                openViewModal(employeeId);
            }
        });
        closeViewEmployeeModalBtn.addEventListener('click', () => viewEmployeeModal.classList.add('hidden'));
        cancelViewEmployeeBtn.addEventListener('click', () => viewEmployeeModal.classList.add('hidden'));

        [searchEmployeeInput, filterEmployeeOffice, filterEmployeeRole].forEach(el => {
            el.addEventListener('input', () => fetchAndRenderEmployees(0));
        });

        employeePagination.addEventListener('click', (e) => {
            const target = e.target.closest('.page-link');
            if (target && !target.disabled) fetchAndRenderEmployees(parseInt(target.dataset.page, 10));
        });

        selectAvatarBtn.addEventListener('click', () => avatarInput.click());
        removeAvatarBtn.addEventListener('click', () => {
            avatarInput.value = '';
            selectedAvatarFile = null;
            avatarPreview.src = 'https://placehold.co/100x100/E2E8F0/A0AEC0?text=Avatar';
            avatarUrlInput.value = '';
            removeAvatarBtn.classList.add('hidden');
        });

        avatarInput.addEventListener('change', () => {
            const file = avatarInput.files[0];
            if (file && file.type.startsWith('image/')) {
                selectedAvatarFile = file;
                avatarPreview.src = URL.createObjectURL(file);
                avatarUrlInput.value = '';
                removeAvatarBtn.classList.remove('hidden');
            } else {
                selectedAvatarFile = null;
            }
        });

        employeeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = employeeForm.elements['username'].value;
            const email = employeeForm.elements['email'].value;
            const password = employeeForm.elements['password'].value;

            if (/\s/.test(username)) {
                showAlert('ユーザー名はスペースを含めることはできません。', 'error');
                return;
            }
            if (/\s/.test(email)) {
                showAlert('メールアドレスはスペースを含めることはできません。', 'error');
                return;
            }
            if (password && /\s/.test(password)) {
                showAlert('パスワードはスペースを含めることはできません。', 'error');
                return;
            }
            const saveButton = document.getElementById('save-employee-btn');
            saveButton.disabled = true;
            saveButton.textContent = '保存中...';
            try {
                if (selectedAvatarFile) {
                    const formData = new FormData();
                    formData.append('file', selectedAvatarFile);
                    const uploadResult = await fetch(`${FILE_API_URL}/upload-avatar`, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    }).then(handleResponse);
                    if (uploadResult?.filename) {
                        avatarUrlInput.value = uploadResult.filename;
                    }
                }
                const employeeId = employeeIdInput.value;
                const isUpdating = !!employeeId;
                const form = new FormData(employeeForm);
                const employeeData = Object.fromEntries(form.entries());
                delete employeeData.avatarFile;
                if (isUpdating && !employeeData.password) delete employeeData.password;

                const url = isUpdating ? `${EMPLOYEE_API_URL}/${employeeId}` : EMPLOYEE_API_URL;
                const method = isUpdating ? 'PUT' : 'POST';

                const updatedEmployee = await fetch(url, {
                    method,
                    headers: getRequestHeaders(),
                    credentials: 'include',
                    body: JSON.stringify(employeeData)
                }).then(handleResponse);

                showAlert(`正常に従業員を${isUpdating ? '更新' : '追加'}しました！`, 'success');

                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

                if (currentUser && currentUser.id == updatedEmployee.id) {
                    console.log('現在のユーザーの更新を検出しました。localStorageを同期中...');
                    const newCurrentUserData = { ...currentUser,
                        ...updatedEmployee,
                        role: updatedEmployee.role.toLowerCase()
                    };
                    localStorage.setItem('currentUser', JSON.stringify(newCurrentUserData));
                    const navAvatar = document.querySelector('#user-menu-button img');
                    if (newCurrentUserData.avatar && navAvatar) {
                        navAvatar.src = `/api/files/avatar/${newCurrentUserData.avatar}`;
                    }
                }
                employeeModal.classList.add('hidden');
                await fetchAndRenderEmployees(isUpdating ? empCurrentPage : 0);
                await fetchAndRenderStatistics();
                if (teamCalendar) {
                    teamCalendar.refetchResources();
                    teamCalendar.refetchEvents();
                }
            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = '従業員を保存';
            }
        });
    }
    function setupScheduleModalListeners() {
        const scheduleWorkTypeSelect = document.getElementById('schedule-workType');
        const startTimeInput = document.getElementById('schedule-startTime');
        const endTimeInput = document.getElementById('schedule-endTime');
        const startDateInput = document.getElementById('schedule-startDate');
        const endDateInput = document.getElementById('schedule-endDate');
        const employeeSelect = document.getElementById('schedule-employee');
        const officeSelect = document.getElementById('schedule-office');
        const timeInputsContainer = startTimeInput.closest('.grid');

        document.getElementById('close-schedule-modal').addEventListener('click', () => scheduleModal.classList.add('hidden'));
        document.getElementById('cancel-schedule-btn').addEventListener('click', () => scheduleModal.classList.add('hidden'));
        addScheduleBtn.addEventListener('click', () => openScheduleModal());

        if (scheduleWorkTypeSelect) {
            scheduleWorkTypeSelect.addEventListener('change', (e) => {
                if (isPopulatingForm) return;
                const selectedType = e.target.value;

                updateEventFormUI(selectedType);

                if (!selectedType) {
                    setScheduleFormState(false);
                    timeInputsContainer.style.display = 'none';
                    return;
                }

                setScheduleFormState(true);

                if (selectedType === 'VACATION' || selectedType === 'BUSINESS_TRIP') {
                    timeInputsContainer.style.display = 'none';
                    startTimeInput.value = '';
                    endTimeInput.value = '';
                    endDateInput.readOnly = false;
                    endDateInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
                    officeSelect.disabled = false;
                    officeSelect.classList.remove('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');
                } else {
                    timeInputsContainer.style.display = 'grid';
                    endDateInput.value = startDateInput.value;
                    endDateInput.readOnly = true;
                    endDateInput.classList.add('bg-gray-200', 'cursor-not-allowed');
                    const selectedEmployeeId = document.getElementById('schedule-employee').value;
                    updateOfficeForInDayEvent(selectedEmployeeId);
                }
            });
        }

        if (employeeSelect) {
            employeeSelect.addEventListener('change', (e) => {
                if (isPopulatingForm) return;
                const employeeId = e.target.value;
                updateOfficeForInDayEvent(employeeId);
            });
        }

        if (startDateInput) {
            startDateInput.addEventListener('change', (e) => {
                const selectedWorkType = scheduleWorkTypeSelect.value;
                if (selectedWorkType && selectedWorkType !== 'VACATION' && selectedWorkType !== 'BUSINESS_TRIP') {
                    endDateInput.value = e.target.value;
                }
            });
        }

        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const scheduleId = document.getElementById('schedule-id').value;
            const isUpdating = !!scheduleId;
            const startDateInput = document.getElementById('schedule-startDate');
            const startTimeInput = document.getElementById('schedule-startTime');
            const endTimeInput = document.getElementById('schedule-endTime');
            const startDate = startDateInput.value;
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;

            if (startTime && endTime && startTime >= endTime) {
                showAlert('終了時間は開始時間より後でなければなりません！', 'warning');
                return;
            }
           if (!isUpdating) {
               const now = new Date();
               const startDateValue = document.getElementById('schedule-startDate').value;
               const startTimeValue = document.getElementById('schedule-startTime').value;

               // Chỉ kiểm tra thời gian trong quá khứ nếu đây là sự kiện có giờ cụ thể
               if (startTimeValue) {
                   const scheduleStartDateTime = new Date(`${startDateValue}T${startTimeValue}`);
                   // So sánh với thời điểm hiện tại (trừ đi 1 phút để linh hoạt hơn)
                   if (scheduleStartDateTime < (now - 60000)) {
                       showAlert('過去の日付や時間にスケジュールを設定することはできません。', 'warning');
                       return;
                   }
               } else {
                   // Đối với sự kiện cả ngày (all-day), chúng ta chỉ so sánh ngày
                   const scheduleStartDate = new Date(startDateValue);
                   const today = new Date();

                   // Chuẩn hóa cả hai ngày về 00:00:00 để so sánh thuần túy ngày tháng năm
                   scheduleStartDate.setHours(0, 0, 0, 0);
                   today.setHours(0, 0, 0, 0);

                   if (scheduleStartDate < today) {
                       showAlert('過去の日付にスケジュールを設定することはできません。', 'warning');
                       return;
                   }
               }
           }

            const formData = new FormData(scheduleForm);
            const scheduleData = Object.fromEntries(formData.entries());
            const officeSelect = document.getElementById('schedule-office');
            if (officeSelect.disabled && officeSelect.value) {
                scheduleData.officeId = officeSelect.value;
            }
            const employeeSelect = document.getElementById('schedule-employee');
            if (employeeSelect.disabled && employeeSelect.value) {
                scheduleData.employeeId = employeeSelect.value;
            }
            const url = isUpdating ? `${SCHEDULE_API_URL}/${scheduleId}` : SCHEDULE_API_URL;
            const method = isUpdating ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    headers: getRequestHeaders(),
                    credentials: 'include',
                    body: JSON.stringify(scheduleData)
                });
                if (!response.ok) {
                    let errorMessage = 'エラーが発生しました。';
                    try {
                        const errorData = await response.json();
                        errorMessage = Object.values(errorData).join('\n');
                    } catch (err) {
                        errorMessage = await response.text() || 'サーバーから不明なエラーが発生しました。';
                    }
                    throw new Error(errorMessage);
                }
                showAlert(`正常にスケジュールを${isUpdating ? '更新' : '新規作成'}しました！`, 'success');
                scheduleModal.classList.add('hidden');
                if (teamCalendar) teamCalendar.refetchEvents();
                if (personalCalendar) personalCalendar.refetchEvents();
            } catch (error) {
                showAlert(`保存中のエラー:\n${error.message}`, 'error', 5000);
            }
        });

        teamCalendarOfficeFilter.addEventListener('change', () => {
            if (teamCalendar) {
                teamCalendar.refetchEvents();
                teamCalendar.refetchResources();
            }
        });

        deleteScheduleBtn.addEventListener('click', async () => {
            const scheduleId = document.getElementById('schedule-id').value;
            if (!scheduleId || !confirm('このスケジュールを本当に削除しますか？')) return;
            try {
                await fetch(`${SCHEDULE_API_URL}/${scheduleId}`, {
                    method: 'DELETE',
                    headers: getRequestHeaders(),
                    credentials: 'include'
                }).then(handleResponse);
                showAlert('スケジュールを正常に削除しました！', 'success');
                scheduleModal.classList.add('hidden');
                teamCalendar.refetchEvents();
                if (personalCalendar) personalCalendar.refetchEvents();
            } catch (error) {
                showAlert(`削除中のエラー: ${error.message}`, 'error');
            }
        });

        const cancelEventBtn = document.getElementById('cancel-event-btn');
        cancelEventBtn.addEventListener('click', async () => {
            const scheduleId = document.getElementById('schedule-id').value;
            if (!scheduleId || !confirm('この過去のスケジュールをキャンセルしてもよろしいですか？')) return;
            try {
                await fetch(`${SCHEDULE_API_URL}/${scheduleId}/cancel`, {
                    method: 'PUT',
                    headers: getRequestHeaders(),
                    credentials: 'include'
                }).then(handleResponse);
                showAlert('スケジュールが正常にキャンセルされました！', 'success');
                scheduleModal.classList.add('hidden');
                if (teamCalendar) teamCalendar.refetchEvents();
                if (personalCalendar) personalCalendar.refetchEvents();
            } catch (error) {
                showAlert(`キャンセル中のエラー: ${error.message}`, 'error');
            }
        });
    }
    // =================================================================
    // == メインロジック関数（レンダリング、データ取得など） ==
    // =================================================================

    const openScheduleModal = async (scheduleId = null, prefillStartDate = null, prefillEndDate = null, prefillResourceId = null, isPersonal = false) => {
        scheduleForm.reset();
        isPopulatingForm = true;

        const employeeSelect = document.getElementById('schedule-employee');
        const modalTitle = document.getElementById('schedule-modal-title');

        // Luôn tải danh sách nhân viên
        employeeSelect.innerHTML = '<option value="">従業員を選択</option>' + allEmployeesCache.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

        if (scheduleId) { // Chế độ xem/sửa (Giữ nguyên logic này)
            modalTitle.textContent = 'スケジュールを編集';
            try {
                const schedule = await fetch(`${SCHEDULE_API_URL}/${scheduleId}`, {
                    headers: getRequestHeaders(),
                    credentials: 'include'
                }).then(handleResponse);

                document.getElementById('schedule-id').value = schedule.id;
                document.getElementById('schedule-employee').value = schedule.employeeId;
                document.getElementById('schedule-workType').value = schedule.workType;
                document.getElementById('schedule-office').value = schedule.officeId;
                document.getElementById('schedule-startDate').value = schedule.startDate;
                document.getElementById('schedule-endDate').value = schedule.endDate;
                document.getElementById('schedule-startTime').value = schedule.startTime || '';
                document.getElementById('schedule-endTime').value = schedule.endTime || '';
                document.getElementById('schedule-notes').value = schedule.notes || '';

                updateEventFormUI(schedule.workType);
                const state = schedule.status === 'CANCELLED' ? 'CANCELLED' : getScheduleState(schedule);

                // Cập nhật tiêu đề và quyền hạn (giữ nguyên)
                switch(state) {
                    case 'UPCOMING': modalTitle.textContent = 'スケジュールを編集 '; break;
                    case 'IN_PROGRESS': modalTitle.textContent = '進行中のスケジュール '; break;
                    case 'FINISHED': modalTitle.textContent = '過去のスケジュール '; break;
                    case 'CANCELLED': modalTitle.textContent = 'キャンセルされたスケジュール'; break;
                }
                setFormPermissions(state);

            } catch (error) {
                showAlert(`スケジュールの詳細を読み込めませんでした: ${error.message}`, 'error');
                scheduleModal.classList.add('hidden');
            }

        } else {
            // ================================================================
            // == LOGIC THÊM MỚI ĐÃ ĐƯỢC CẤU TRÚC LẠI HOÀN TOÀN ==
            // ================================================================
             document.getElementById('schedule-id').value = '';
            modalTitle.textContent = '新規スケジュールを追加';
            setFormPermissions('UPCOMING'); // Luôn cho phép chỉnh sửa khi thêm mới

            // Bước 1: Xác định loại công việc ban đầu dựa trên việc chọn nhiều ngày hay không
            let initialWorkType = '';
            const isMultiDaySelection = prefillStartDate && prefillEndDate && prefillStartDate !== prefillEndDate;
            if (isMultiDaySelection) {
                initialWorkType = 'VACATION'; // Mặc định là 'Nghỉ phép' nếu chọn nhiều ngày
            }

            // Bước 2: Điền các giá trị vào form một cách an toàn
            if (prefillStartDate) {
                document.getElementById('schedule-startDate').value = prefillStartDate;
            }
            // Chỉ điền ngày kết thúc nếu nó được cung cấp, nếu không thì dùng ngày bắt đầu
            document.getElementById('schedule-endDate').value = prefillEndDate || prefillStartDate || '';

            if (prefillResourceId) {
                employeeSelect.value = prefillResourceId;
            }

            // Bước 3: Cập nhật dropdown "Loại công việc"
            document.getElementById('schedule-workType').value = initialWorkType;

            // Bước 4: Gọi hàm cập nhật UI với loại công việc đã xác định
            // Điều này sẽ chạy vào đúng nhánh logic trong `updateEventFormUI`
            updateEventFormUI(initialWorkType);

            // Bước 5: Kích hoạt các trường trong form nếu đã có loại công việc được chọn sẵn
            if (initialWorkType) {
                setScheduleFormState(true);
            } else {
                setScheduleFormState(false); // Giữ form bị khóa nếu không có gì được chọn
            }
        }

        scheduleModal.classList.remove('hidden');
        isPopulatingForm = false; // Kết thúc điền form
    };


    const workTypeColors = {
        NORMAL: '#3B82F6',
        BUSINESS_TRIP: '#F59E0B',
        VACATION: '#10B981',
        OUTSIDE: '#8B5CF6',
        OVERTIME: '#EF4444'
    };

    const initializeTeamCalendar = () => {
        if (!teamCalendarEl) return;

        teamCalendar = new FullCalendar.Calendar(teamCalendarEl, {
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
            initialView: 'resourceTimelineWeek',
            aspectRatio: 1.8,
            height: 'auto',
            slotMinWidth: 100,
            slotEventOverlap: false,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
            },
            buttonText: {
                today: '今日',
                day: '日',
                week: '週',
                month: '月'
            },
            displayEventTime: false,
            editable: true,
            selectable: true,
            selectMirror: true,
            resourceAreaHeaderContent: '従業員',
            locale: 'ja',
            resourceAreaWidth: 200,
            views: {
                resourceTimelineWeek: {
                    slotLabelInterval: {
                        days: 1
                    }
                },
                resourceTimelineDay: {
                    slotLabelInterval: {
                        hours: 1
                    },
                    slotDuration: '00:30:00'
                },
                resourceTimelineMonth: {
                    slotLabelInterval: {
                        days: 1
                    },
                }
            },

            eventDidMount: function(info) {
                // Lấy các thông tin cần thiết từ event
                const props = info.event.extendedProps;
                const workTypeName = workTypeTranslations[props.workType] || props.workType;
                const notes = props.notes || '<em>なし</em>';
                const officeName = props.officeName || '<em>未定</em>';

                // --- BẮT ĐẦU LOGIC HIỂN THỊ THỜI GIAN/NGÀY THÔNG MINH ---

                let timeOrDateHTML = '';

                // 1. Kiểm tra xem có phải là sự kiện trong ngày hay không
                if (props.startDate === props.endDate) {
                    // Nếu là sự kiện TRONG NGÀY, hiển thị GIỜ
                    if (props.startTime) {
                        timeOrDateHTML = `
                            <p class="text-xs text-gray-600 mt-1">
                                <strong>時間:</strong> ${props.startTime.substring(0, 5)} - ${props.endTime.substring(0, 5)}
                            </p>
                        `;
                    }
                } else {
                    // Nếu là sự kiện NHIỀU NGÀY, hiển thị NGÀY
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedStartDate = new Date(props.startDate).toLocaleDateString('ja-JP', options);
                    const formattedEndDate = new Date(props.endDate).toLocaleDateString('ja-JP', options);

                    timeOrDateHTML = `
                        <p class="text-xs text-gray-600 mt-1">
                            <strong>期間:</strong> ${formattedStartDate} - ${formattedEndDate}
                        </p>
                    `;
                }

                // --- KẾT THÚC LOGIC ---

                // Sử dụng thư viện Tippy.js để tạo tooltip
                tippy(info.el, {
                    content: `
                        <div class="p-1 text-left">
                            <p class="font-bold text-blue-500 mb-1">
                                ${workTypeName}
                            </p>
                            ${timeOrDateHTML} <p class="text-xs text-gray-600 mt-1">
                                <strong>備考:</strong> ${notes}
                            </p>
                            <p class="text-xs text-gray-600 mt-1">
                                <strong>オフィス:</strong> ${officeName}
                            </p>
                        </div>
                    `,
                    allowHTML: true,
                    placement: 'top',
                    animation: 'shift-away-subtle',
                    theme: 'urban-blue',
                });
            },

            resources: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const officeId = teamCalendarOfficeFilter.value;
                    const params = new URLSearchParams({
                        size: 200
                    });
                    if (officeId) params.append('officeId', officeId);

                    const employeesPage = await fetch(`${EMPLOYEE_API_URL}?${params.toString()}`, {
                        headers: getRequestHeaders(),
                        credentials: 'include'
                    }).then(handleResponse);
                    allEmployeesCache = employeesPage.content;
                    const resources = allEmployeesCache.map(emp => ({
                        id: emp.id,
                        title: emp.name
                    }));
                    successCallback(resources);
                } catch (error) {
                    failureCallback(error);
                }
            },

            events: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const officeId = teamCalendarOfficeFilter.value;
                    const params = new URLSearchParams({
                        startDate: fetchInfo.start.toISOString().slice(0, 10),
                        endDate: fetchInfo.end.toISOString().slice(0, 10),
                    });
                    if (officeId) params.append('officeId', officeId);

                    const schedules = await fetch(`${SCHEDULE_API_URL}?${params.toString()}`, {
                        headers: getRequestHeaders(),
                        credentials: 'include'
                    }).then(handleResponse);

                    const events = schedules.map(s => {
                        let eventTitle;
                        const originalTitle = s.notes || workTypeTranslations[s.workType] || s.workType;
                        const isMultiDay = s.startDate !== s.endDate;

                        if (s.startTime && s.endTime) {
                            const formattedStartTime = s.startTime.substring(0, 5);
                            const formattedEndTime = s.endTime.substring(0, 5);
                            eventTitle = `${formattedStartTime} - ${formattedEndTime}`;
                            if (isMultiDay && originalTitle) {
                                eventTitle += ` - ${originalTitle}`;
                            }
                        } else {
                            eventTitle = originalTitle;
                        }

                        let eventEnd;
                        if (s.endTime) {
                            eventEnd = `${s.endDate}T${s.endTime}`;
                        } else {
                            const calendarEndDate = new Date(s.endDate);
                            calendarEndDate.setDate(calendarEndDate.getDate() + 1);
                            eventEnd = calendarEndDate.toISOString().split('T')[0];
                        }
                        const eventClassName = s.status === 'CANCELLED' ? 'event-cancelled' : '';


                        return {
                            id: s.id,
                            resourceId: s.employeeId,
                            title: eventTitle,
                            start: `${s.startDate}${s.startTime ? 'T' + s.startTime : ''}`,
                            end: eventEnd,
                            color: workTypeColors[s.workType] || '#71717A',
                            allDay: !s.startTime,
                            className: eventClassName,
                            extendedProps: { ...s
                            }
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    failureCallback(error);
                }
            },

            select: (info) => {
                const actualEndDate = new Date(info.endStr);
                actualEndDate.setDate(actualEndDate.getDate() - 1);

                openScheduleModal(
                    null,
                    info.startStr.split('T')[0],
                    toLocalISOString(actualEndDate),
                    info.resource.id
                );
                teamCalendar.unselect();
            },

            eventClick: (info) => {
                info.jsEvent.preventDefault();
                openScheduleModal(info.event.id);
            },

            eventDrop: async (info) => {
                const {
                    event,
                    oldEvent,
                    revert
                } = info;
                const newResourceId = event.getResources()[0]?.id;

                if (!newResourceId || !confirm(`このスケジュールを移動してもよろしいですか？`)) {
                    revert();
                    return;
                }

                try {
                    const originalData = event.extendedProps;
                    let payload = {};

                    const oldStartDay = new Date(oldEvent.start).setHours(0, 0, 0, 0);
                    const newStartDay = new Date(event.start).setHours(0, 0, 0, 0);

                    if (oldStartDay !== newStartDay) {
                        const duration = new Date(originalData.endDate).getTime() - new Date(originalData.startDate).getTime();
                        const newEndDate = new Date(event.start.getTime() + duration);
                        payload = {
                            ...originalData,
                            employeeId: newResourceId,
                            startDate: toLocalISOString(event.start),
                            endDate: toLocalISOString(newEndDate),
                        };
                    } else {
                        payload = {
                            ...originalData,
                            employeeId: newResourceId,
                        };
                    }

                    await fetch(`/api/schedules/${event.id}`, {
                        method: 'PUT',
                        headers: getRequestHeaders(),
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    }).then(handleResponse);

                    showAlert('スケジュールを正常に更新しました！', 'success');
                    teamCalendar.refetchEvents();
                    if (personalCalendar) personalCalendar.refetchEvents();

                } catch (error) {
                    showAlert(`更新中のエラー: ${error.message}`, 'error');
                    revert();
                }
            },

            eventResize: async (info) => {
                const {
                    event
                } = info;
                if (!confirm(`このスケジュールの期間を変更しますか？`)) {
                    info.revert();
                    return;
                }
                try {
                    const originalData = event.extendedProps;
                    const actualEndDate = new Date(event.end);
                    actualEndDate.setDate(actualEndDate.getDate() - 1);
                    const newStartDateStr = toLocalISOString(event.start);
                    const newEndDateStr = toLocalISOString(actualEndDate);
                    const payload = {
                        employeeId: originalData.employeeId,
                        officeId: originalData.officeId,
                        workType: originalData.workType,
                        notes: originalData.notes,
                        startTime: originalData.startTime,
                        endTime: originalData.endTime,
                        startDate: newStartDateStr,
                        endDate: newEndDateStr,
                    };

                    await fetch(`/api/schedules/${event.id}`, {
                        method: 'PUT',
                        headers: getRequestHeaders(),
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    }).then(handleResponse);

                    showAlert('期間を正常に更新しました！', 'success');
                    teamCalendar.refetchEvents();
                    if (personalCalendar) personalCalendar.refetchEvents();

                } catch (error) {
                    showAlert(`更新中のエラー: ${error.message}`, 'error');
                    info.revert();
                }
            },
        });
        teamCalendar.render();
    };

    const initializePersonalCalendar = () => {
        const personalCalendarEl = document.getElementById('personal-calendar');
        if (!personalCalendarEl) return;

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!currentUser || !currentUser.id) {
            personalCalendarEl.innerHTML = '<p class="text-center text-gray-500">カレンダーを読み込めません。再度ログインしてください。</p>';
            return;
        }
        personalCalendar = new FullCalendar.Calendar(personalCalendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            locale: 'ja',
            buttonText: {
                today: '今日',
                month: '月',
                week: '週',
                day: '日'
            },
            editable: true,
            selectable: true,
            selectMirror: true,
            aspectRatio: 2,
            displayEventTime: false,

            eventDidMount: function(info) {
                // Lấy các thông tin cần thiết từ event
                const props = info.event.extendedProps;
                const workTypeName = workTypeTranslations[props.workType] || props.workType;
                const notes = props.notes || '<em>なし</em>';
                const officeName = props.officeName || '<em>未定</em>';

                // --- BẮT ĐẦU LOGIC HIỂN THỊ THỜI GIAN/NGÀY THÔNG MINH ---

                let timeOrDateHTML = '';

                // 1. Kiểm tra xem có phải là sự kiện trong ngày hay không
                if (props.startDate === props.endDate) {
                    // Nếu là sự kiện TRONG NGÀY, hiển thị GIỜ
                    if (props.startTime) {
                        timeOrDateHTML = `
                            <p class="text-xs text-gray-600 mt-1">
                                <strong>時間:</strong> ${props.startTime.substring(0, 5)} - ${props.endTime.substring(0, 5)}
                            </p>
                        `;
                    }
                } else {
                    // Nếu là sự kiện NHIỀU NGÀY, hiển thị NGÀY
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedStartDate = new Date(props.startDate).toLocaleDateString('ja-JP', options);
                    const formattedEndDate = new Date(props.endDate).toLocaleDateString('ja-JP', options);

                    timeOrDateHTML = `
                        <p class="text-xs text-gray-600 mt-1">
                            <strong>期間:</strong> ${formattedStartDate} - ${formattedEndDate}
                        </p>
                    `;
                }

                // --- KẾT THÚC LOGIC ---

                // Sử dụng thư viện Tippy.js để tạo tooltip
                tippy(info.el, {
                    content: `
                        <div class="p-1 text-left">
                            <p class="font-bold text-blue-500 mb-1">
                                ${workTypeName}
                            </p>
                            ${timeOrDateHTML} <p class="text-xs text-gray-600 mt-1">
                                <strong>備考:</strong> ${notes}
                            </p>
                            <p class="text-xs text-gray-600 mt-1">
                                <strong>オフィス:</strong> ${officeName}
                            </p>
                        </div>
                    `,
                    allowHTML: true,
                    placement: 'top',
                    animation: 'shift-away-subtle',
                    theme: 'urban-blue',
                });
            },

            events: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const params = new URLSearchParams({
                        startDate: fetchInfo.start.toISOString().slice(0, 10),
                        endDate: fetchInfo.end.toISOString().slice(0, 10),
                    });
                    const url = `${SCHEDULE_API_URL}/employee/${currentUser.id}?${params.toString()}`;

                    const schedules = await fetch(url, {
                        headers: getRequestHeaders(),
                        credentials: 'include'
                    }).then(handleResponse);

                    const events = schedules.map(s => {
                        let eventTitle;
                        const originalTitle = s.notes || workTypeTranslations[s.workType] || s.workType;
                        const isMultiDay = s.startDate !== s.endDate;

                        if (s.startTime && s.endTime) {
                            const formattedStartTime = s.startTime.substring(0, 5);
                            const formattedEndTime = s.endTime.substring(0, 5);
                            eventTitle = `${formattedStartTime} - ${formattedEndTime}`;
                            if (isMultiDay && originalTitle) eventTitle += ` - ${originalTitle}`;
                        } else {
                            eventTitle = originalTitle;
                        }

                        let eventEnd;
                        if (s.endTime) {
                            eventEnd = `${s.endDate}T${s.endTime}`;
                        } else {
                            const calendarEndDate = new Date(s.endDate);
                            calendarEndDate.setDate(calendarEndDate.getDate() + 1);
                            eventEnd = calendarEndDate.toISOString().split('T')[0];
                        }
                        const eventClassName = s.status === 'CANCELLED' ? 'event-cancelled' : '';

                        return {
                            id: s.id,
                            title: eventTitle,
                            start: `${s.startDate}${s.startTime ? 'T' + s.startTime : ''}`,
                            end: eventEnd,
                            backgroundColor: workTypeColors[s.workType] || '#71717A',
                            borderColor: workTypeColors[s.workType] || '#71717A',
                            allDay: !s.startTime,
                            className: eventClassName,
                            extendedProps: { ...s
                            }
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    failureCallback(error);
                }
            },

            eventClick: (info) => {
                info.jsEvent.preventDefault();
                openScheduleModal(info.event.id, null, null, null, true);
            },

            select: (info) => {
                const startDate = info.startStr.split('T')[0];
                const actualEndDate = new Date(info.end);
                actualEndDate.setDate(actualEndDate.getDate() - 1);

                openScheduleModal(
                    null,
                    startDate,
                    toLocalISOString(actualEndDate),
                    currentUser.id,
                    true
                );
                personalCalendar.unselect();
            },

            // <<< SỬA LỖI 1: THÊM EVENTDROP VÀ EVENTRESIZE CHO LỊCH CÁ NHÂN >>>
            eventDrop: async (info) => {
                const { event, oldEvent, revert } = info;
                if (!confirm(`このスケジュールを移動してもよろしいですか？`)) {
                    revert();
                    return;
                }
                try {
                    const originalData = event.extendedProps;
                    // Tính toán ngày kết thúc mới bằng cách giữ nguyên khoảng thời gian của sự kiện
                    const duration = new Date(originalData.endDate).getTime() - new Date(originalData.startDate).getTime();
                    const newEndDate = new Date(event.start.getTime() + duration);
                    const payload = {
                        ...originalData, // Lấy tất cả dữ liệu gốc
                        startDate: toLocalISOString(event.start),
                        endDate: toLocalISOString(newEndDate),
                    };
                    await fetch(`/api/schedules/${event.id}`, {
                        method: 'PUT',
                        headers: getRequestHeaders(),
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    }).then(handleResponse);
                    showAlert('スケジュールを正常に更新しました！', 'success');
                    personalCalendar.refetchEvents(); // Chỉ cần tải lại lịch cá nhân
                    if (teamCalendar) teamCalendar.refetchEvents(); // <<< THÊM DÒNG NÀY: Đồng bộ lại team calendar

                } catch (error) {
                    showAlert(`更新中のエラー: ${error.message}`, 'error');
                    revert();
                }
            },

            eventResize: async (info) => {
                const { event, revert } = info;
                if (!confirm(`このスケジュールの期間を変更しますか？`)) {
                    revert();
                    return;
                }
                try {
                    const originalData = event.extendedProps;
                    // Tính ngày kết thúc thực tế (FullCalendar end date là exclusive)
                    const actualEndDate = new Date(event.end);
                    actualEndDate.setDate(actualEndDate.getDate() - 1);
                    const payload = {
                        ...originalData, // Lấy dữ liệu gốc
                        startDate: toLocalISOString(event.start),
                        endDate: toLocalISOString(actualEndDate),
                    };
                    await fetch(`/api/schedules/${event.id}`, {
                        method: 'PUT',
                        headers: getRequestHeaders(),
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    }).then(handleResponse);
                    showAlert('期間を正常に更新しました！', 'success');
                    personalCalendar.refetchEvents();
                    if (teamCalendar) teamCalendar.refetchEvents(); // Đồng bộ lại team calendar

                } catch (error) {
                    showAlert(`更新中のエラー: ${error.message}`, 'error');
                    revert();
                }
            },
            // <<< KẾT THÚC SỬA LỖI 1 >>>
        });

        personalCalendar.render();
    };

    const fetchAndRenderStatistics = async () => {
        const loadingHTML = `<p class="text-center text-gray-400"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</p>`;
        if (statsTotalEmployeesEl) statsTotalEmployeesEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        if (statsByPositionEl) statsByPositionEl.innerHTML = loadingHTML;
        if (statsByOfficeEl) statsByOfficeEl.innerHTML = loadingHTML;

        try {
            const stats = await fetch(`${EMPLOYEE_API_URL}/statistics`, {
                headers: getRequestHeaders(),
                credentials: 'include'
            }).then(handleResponse);

            if (statsTotalEmployeesEl) statsTotalEmployeesEl.textContent = stats.totalEmployees;
            if (statsByPositionEl) {
                if (Object.keys(stats.positionStats).length === 0) {
                    statsByPositionEl.innerHTML = `<p class="text-gray-500">データがありません。</p>`;
                } else {
                    statsByPositionEl.innerHTML = Object.entries(stats.positionStats).map(([position, count]) => `
                        <div class="flex justify-between items-center">
                            <span>${position}</span>
                            <span class="font-bold text-gray-800">${count}</span>
                        </div>
                    `).join('');
                }
            }
            if (statsByOfficeEl) {
                if (Object.keys(stats.officeStats).length === 0) {
                    statsByOfficeEl.innerHTML = `<p class="text-gray-500">データがありません。</p>`;
                } else {
                    statsByOfficeEl.innerHTML = Object.entries(stats.officeStats).map(([office, count]) => `
                        <div class="flex justify-between items-center">
                            <span>${office}</span>
                            <span class="font-bold text-gray-800">${count}</span>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            const errorHTML = `<p class="text-red-500 text-xs">${error.message}</p>`;
            showAlert("統計データを読み込めませんでした。", "error");
            if (statsTotalEmployeesEl) statsTotalEmployeesEl.textContent = "エラー";
            if (statsByPositionEl) statsByPositionEl.innerHTML = errorHTML;
            if (statsByOfficeEl) statsByOfficeEl.innerHTML = errorHTML;
        }
    };

    const renderOfficeTable = (offices) => {
        const officeTableBody = document.getElementById('office-table-body');
        officeTableBody.innerHTML = '';
        if (!offices || offices.length === 0) {
            officeTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">オフィスがまだありません。 </td></tr>`;
            return;
        }
        offices.forEach(office => {
            const statusBadge = office.isActive ?
                `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">稼働中</span>` :
                `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-700">停止中</span>`;
            const isEditDisabled = !office.isActive;
            const isDeleteDisabled = !office.isActive || office.employeeCount > 0;
            const editDisabledClasses = isEditDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-900';
            const deleteDisabledClasses = isDeleteDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-900';
            let deleteTooltip = '';
            if (!office.isActive) {
                deleteTooltip = '停止中のオフィスは削除できません。';
            } else if (office.employeeCount > 0) {
                deleteTooltip = `オフィスに${office.employeeCount}人の従業員がいるため、削除できません。`;
            }
            const rowClass = !office.isActive ? 'bg-gray-50 opacity-80' : 'bg-white';
            const row = `
                       <tr id="office-row-${office.id}" class="${rowClass}">
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${office.name}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${office.address || ''}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm">${statusBadge}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                               <button
                                   class="text-indigo-600 mr-3 edit-office-btn ${editDisabledClasses}"
                                   data-id="${office.id}"
                                   ${isEditDisabled ? 'disabled' : ''}
                                   title="${isEditDisabled ? '停止中のオフィスは編集できません。' : 'オフィスを編集'}">
                                   <i class="fas fa-edit"></i> 編集
                               </button>
                               <button
                                   class="text-red-600 delete-office-btn ${deleteDisabledClasses}"
                                   data-id="${office.id}"
                                   ${isDeleteDisabled ? 'disabled' : ''}
                                   title="${deleteTooltip}">
                                   <i class="fas fa-trash-alt"></i> 削除
                               </button>
                           </td>
                       </tr>
                   `;
            officeTableBody.insertAdjacentHTML('beforeend', row);
        });
    };
    const fetchAndRenderOffices = async () => {
        try {
            const response = await fetch(OFFICE_API_URL, {
                headers: getRequestHeaders(),
                credentials: 'include'
            });
            const offices = await handleResponse(response);
            renderOfficeTable(offices);
        } catch (error) {
            showAlert(error.message, 'error');
        }
    };
    const openOfficeModal = async (officeId = null) => {
        officeForm.reset();
        document.getElementById('office-id').value = '';
        if (officeId) {
            officeModalTitle.textContent = 'オフィス情報を編集';
            try {
                const response = await fetch(`${OFFICE_API_URL}/${officeId}`, {
                    headers: getRequestHeaders(),
                    credentials: 'include'
                });
                const officeData = await handleResponse(response);
                document.getElementById('office-id').value = officeData.id;
                document.getElementById('office-name').value = officeData.name;
                document.getElementById('office-address').value = officeData.address || '';
            } catch (error) {
                showAlert(error.message, 'error');
                return;
            }
        } else {
            officeModalTitle.textContent = '新規オフィスを追加';
        }
        officeModal.classList.remove('hidden');
    };

    const openViewModal = async (employeeId) => {
        viewEmployeeModal.classList.remove('hidden');
        viewEmployeeContent.innerHTML = `<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">読み込み中...</p></div>`;

        try {
            const emp = await fetch(`${EMPLOYEE_API_URL}/${employeeId}`, {
                headers: getRequestHeaders(),
                credentials: 'include'
            }).then(handleResponse);

            const avatarSrc = emp.avatar ? `/api/files/avatar/${emp.avatar}` : 'https://placehold.co/100x100/E2E8F0/A0AEC0?text=N/A';

            const renderField = (label, value) => {
                const displayValue = value || '<span class="text-gray-400 italic">未更新</span>';
                return `<div class="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt class="text-sm font-medium text-gray-500">${label}</dt>
                            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${displayValue}</dd>
                        </div>`;
            };

            viewEmployeeContent.innerHTML = `
                <div class="flex flex-col items-center">
                    <img class="h-40 w-45 rounded-full object-cover mb-4 border-2 border-gray-300 shadow-sm" src="${avatarSrc}" alt="アバター">
                    <h4 class="text-lg font-bold text-gray-900">${emp.name || '名前未設定'}</h4>
                    <p class="text-sm text-gray-500">${emp.position || '役職未設定'}</p>
                </div>
                <div class="border-t border-gray-200 mt-4 pt-4">
                    <dl>
                        ${renderField('ユーザー名', emp.username)}
                        ${renderField('メールアドレス', `<a href="mailto:${emp.email}" class="text-blue-600 hover:underline">${emp.email}</a>`)}
                        ${renderField('電話番号', emp.phoneNumber)}
                        ${renderField('性別', emp.gender)}
                        ${renderField('住所', emp.address)}
                        ${renderField('オフィス', emp.officeName)}
                        ${renderField('システム権限', `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">${emp.role}</span>`)}
                    </dl>
                </div>
            `;
        } catch (error) {
            viewEmployeeContent.innerHTML = `<div class="text-center p-8 text-red-500">${error.message}</div>`;
        }
    };

    const renderEmployeeTable = (employees) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const currentUserId = currentUser ? currentUser.id : null;
        const currentUserRole = currentUser ? currentUser.role.toUpperCase() : null;

        employeeTableBody.innerHTML = employees.length === 0 ?
            `<tr><td colspan="7" class="text-center p-4">該当する従業員が見つかりません。</td></tr>` :
            employees.map(employee => {
                const avatarSrc = employee.avatar ? `/api/files/avatar/${employee.avatar}` : 'https://placehold.co/100x100/E2E8F0/A0AEC0?text=N/A';
                const positionName = positionTranslations[employee.position] || employee.position || 'N/A';

                const isSelf = (employee.id === currentUserId);
                const isSuperior = (currentUserRole === 'MANAGER' && (employee.role === 'ADMIN' || employee.role === 'MANAGER'));
                const isDeleteDisabled = isSelf || isSuperior;

                let deleteTooltip = '従業員を削除';
                if (isSelf) {
                    deleteTooltip = '自分のアカウントを削除することはできません。';
                } else if (isSuperior) {
                    deleteTooltip = '上位の役職のアカウントを削除する権限はありません。';
                }

                const deleteButtonHTML = `<button
                    class="text-red-600 hover:text-red-900 delete-employee-btn ${isDeleteDisabled ? 'text-gray-400 cursor-not-allowed' : ''}"
                    data-id="${employee.id}"
                    ${isDeleteDisabled ? 'disabled' : ''}
                    title="${deleteTooltip}">
                    <i class="fas fa-trash-alt"></i>
                  </button>`;
                return `
                    <tr id="employee-row-${employee.id}">
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <img class="h-12 w-12 rounded-full object-cover" src="${avatarSrc}" alt="アバター">
                                <div class="ml-4 font-medium text-gray-900">${employee.name}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4">${employee.email}</td>
                        <td class="px-6 py-4">${positionName || 'N/A'}</td>
                        <td class="px-6 py-4">${employee.officeName || 'N/A'}</td>
                        <td class="px-6 py-4 text-center">
                            <button class="text-blue-600 hover:text-blue-900 edit-employee-btn mr-4" data-id="${employee.id}"><i class="fas fa-edit"></i></button>
                            ${deleteButtonHTML}
                        </td>
                    </tr>`;
            }).join('');
    };

    const renderPaginationControls = (pageData) => {
        employeePagination.innerHTML = '';
        if (!pageData || pageData.totalPages <= 1) return;
        const {
            number,
            totalPages,
            first,
            last
        } = pageData;
        let paginationHTML = `<button class="page-link px-3 py-1 rounded-md bg-white border ${first ? 'opacity-50' : ''}" data-page="${number - 1}" ${first ? 'disabled' : ''}>&laquo; 前へ</button>`;
        for (let i = 0; i < totalPages; i++) {
            paginationHTML += `<button class="page-link px-3 py-1 rounded-md border ${i === number ? 'bg-blue-500 text-white' : 'bg-white'}" data-page="${i}">${i + 1}</button>`;
        }
        paginationHTML += `<button class="page-link px-3 py-1 rounded-md bg-white border ${last ? 'opacity-50' : ''}" data-page="${number + 1}" ${last ? 'disabled' : ''}>次へ &raquo;</button>`;
        employeePagination.innerHTML = `<div class="flex justify-center items-center space-x-2">${paginationHTML}</div>`;
    };

    const fetchAndRenderEmployees = async (page = 0) => {
        empCurrentPage = page;
        const params = new URLSearchParams({
            page: empCurrentPage,
            size: empPageSize,
            keyword: searchEmployeeInput.value.trim(),
            officeId: filterEmployeeOffice.value,
            position: filterEmployeeRole.value
        });
        for (let p of new URLSearchParams(params)) {
            if (!p[1]) params.delete(p[0]);
        }
        try {
            const pageData = await fetch(`${EMPLOYEE_API_URL}?${params.toString()}`, {
                credentials: 'include'
            }).then(handleResponse);
            renderEmployeeTable(pageData.content);
            renderPaginationControls(pageData);
        } catch (error) {
            showAlert(error.message, 'error');
            employeeTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">${error.message}</td></tr>`;
            employeePagination.innerHTML = '';
        }
    };

    const loadOfficesForSelects = async () => {
        try {
            const offices = await fetch(`${OFFICE_API_URL}/active`, {
                headers: getRequestHeaders(),
                credentials: 'include'
            }).then(handleResponse);
            const optionsHTML = offices.map(office => `<option value="${office.id}">${office.name}</option>`).join('');
            employeeOfficeSelect.innerHTML = `<option value="">オフィスを選択</option>${optionsHTML}`;
            filterEmployeeOffice.innerHTML = `<option value="">すべてのオフィス</option>${optionsHTML}`;
            teamCalendarOfficeFilter.innerHTML = `<option value="">すべてのオフィス</option>${optionsHTML}`;
            document.getElementById('schedule-office').innerHTML = `<option value="">オフィスを選択</option>${optionsHTML}`;
        } catch (error) {
            showAlert('オフィスリストを読み込めませんでした。', 'warning');
        }
    };

    const openEmployeeModal = async (employeeId = null) => {
        employeeForm.reset();
        selectedAvatarFile = null;
        avatarInput.value = '';
        avatarPreview.src = 'https://placehold.co/100x100/E2E8F0/A0AEC0?text=Avatar';
        avatarUrlInput.value = '';
        removeAvatarBtn.classList.add('hidden');
        await loadOfficesForSelects();
        if (employeeId) {
            employeeModalTitle.textContent = '従業員情報を編集';
            employeePasswordInput.required = false;
            document.getElementById('employee-password-help').textContent = 'パスワードを変更しない場合は空のままにしてください。';
            try {
                const emp = await fetch(`${EMPLOYEE_API_URL}/${employeeId}`, {
                    credentials: 'include'
                }).then(handleResponse);
                employeeIdInput.value = emp.id;
                employeeForm.elements['name'].value = emp.name || '';
                employeeForm.elements['username'].value = emp.username || '';
                employeeForm.elements['email'].value = emp.email || '';
                employeeForm.elements['phoneNumber'].value = emp.phoneNumber || '';
                employeeForm.elements['gender'].value = emp.gender || '';
                employeeForm.elements['address'].value = emp.address || '';
                employeeForm.elements['position'].value = emp.position || '';
                employeeForm.elements['officeId'].value = emp.officeId || '';
                employeeForm.elements['role'].value = emp.role || '';
                if (emp.avatar) {
                    avatarPreview.src = `/api/files/avatar/${emp.avatar}`;
                    avatarUrlInput.value = emp.avatar;
                    removeAvatarBtn.classList.remove('hidden');
                }
            } catch (error) {
                showAlert(error.message, 'error');
                return;
            }
        } else {
            employeeModalTitle.textContent = '新規従業員を追加';
            employeePasswordInput.required = true;
            document.getElementById('employee-password-help').textContent = '新規作成時にはパスワードは必須です。';
        }
        employeeModal.classList.remove('hidden');
    };
    // =================================================================
    // == ページの初期化 ==
    // =================================================================
    const initializePage = async () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn || !['manager', 'admin'].includes((currentUser.role || '').toLowerCase())) {
            window.location.href = '/login-JP.html';
            return;
        }
        document.querySelector('#user-menu-button span').textContent = `こんにちは、${currentUser.name}さん`;
        const navAvatar = document.querySelector('#user-menu-button img');
        if (currentUser.avatar && navAvatar) {
            navAvatar.src = `/api/files/avatar/${currentUser.avatar}`;
        }

        setupCommonUIListeners();
        setupScheduleModalListeners();
        setupOfficeListeners();
        setupEmployeeListeners();

        await loadAndCacheAllEmployees();
        await fetchAndRenderOffices();
        await loadOfficesForSelects();
        await fetchAndRenderEmployees();
        await fetchAndRenderStatistics();
        renderWorkTypeLegend('team-calendar-legend');
        renderWorkTypeLegend('personal-calendar-legend');
        initializeTeamCalendar();
        initializePersonalCalendar();
    };
    initializePage();
});