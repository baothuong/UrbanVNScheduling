document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // == 1. GLOBAL CONFIG & STATE
    // =================================================================
    const config = {
        currentUser: null,
        allOffices: [],
        calendar: null
    };

    // =================================================================
    // == 2. UI ELEMENT REFERENCES
    // =================================================================
    const userNameNav = document.getElementById('user-name-nav');
    const userAvatarNav = document.getElementById('user-avatar-nav');
    const logoutButton = document.getElementById('logout-button');
    const welcomeUsernameEl = document.getElementById('welcome-username');
    const currentDateEl = document.getElementById('current-date');
    const currentTimeEl = document.getElementById('current-time');
    const calendarEl = document.getElementById('calendar');
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const addEventBtn = document.getElementById('add-event-btn');
    const upcomingSchedulesList = document.getElementById('upcoming-schedules-list');
    const eventTypeSelect = document.getElementById('event-type');
    const employeeStartDateInput = document.getElementById('event-start-date');

    // =================================================================
    // == 3. HELPER FUNCTIONS
    // =================================================================
    const showAlert = (message, type = 'info', duration = 3000) => {
        const alertBox = document.getElementById('custom-alert-box');
        const alertMessage = document.getElementById('custom-alert-message');
        alertMessage.textContent = message;
        alertBox.className = 'custom-alert';
        alertBox.classList.add(`alert-${type}`);
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, duration);
    };

    const fetchWithAuth = async (url, options = {}) => {
        const defaultOptions = {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        const mergedOptions = { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } };
        const response = await fetch(url, mergedOptions);
        if (response.status === 401) {
            showAlert('セッションの有効期限が切れました。再度ログインしてください。', 'error');
            localStorage.clear();
            window.location.href = '/login-JP.html';
            throw new Error('Unauthorized');
        }
        return response;
    };

    const getTodayString = () => new Date().toISOString().split('T')[0];

    const toLocalISOString = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const handleSuccessfulUpdate = (message) => {
        showAlert(message, 'success');
        closeEventModal();
        config.calendar.refetchEvents();
        loadUpcomingSchedules();
    };

    const setEventFormState = (enabled) => {
        const formElements = eventForm.querySelectorAll('input, select, textarea, button');
        formElements.forEach(el => {
            if (el.id !== 'close-modal' && el.id !== 'cancel-btn' && el.id !== 'event-type') {
                el.disabled = !enabled;
            }
        });
        document.getElementById('event-type').disabled = false;
    };

    const setFormReadOnly = (isReadOnly) => {
        const formElements = eventForm.querySelectorAll('input, select, textarea');
        formElements.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.readOnly = isReadOnly;
            }
            if (el.tagName === 'SELECT') {
                el.disabled = isReadOnly;
            }
            if (isReadOnly) {
                el.classList.add('bg-gray-100', 'cursor-not-allowed');
            } else {
                el.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        });
        document.getElementById('delete-btn').style.display = isReadOnly ? 'none' : 'inline-block';
        eventForm.querySelector('button[type="submit"]').style.display = isReadOnly ? 'none' : 'inline-block';
    };

    const updateEventFormUI = (selectedType) => {
        const startTimeInput = document.getElementById('event-start-time');
        const endTimeInput = document.getElementById('event-end-time');
        const endDateInput = document.getElementById('event-end-date');
        const startDateInput = document.getElementById('event-start-date');
        const officeSelect = document.getElementById('event-office');

        if (!startTimeInput || !endTimeInput) return;

        const timeInputsContainer = startTimeInput.closest('.grid');

        if (selectedType === 'VACATION' || selectedType === 'BUSINESS_TRIP') {
            timeInputsContainer.style.display = 'none';
            startTimeInput.value = '';
            endTimeInput.value = '';
            endDateInput.readOnly = false;
            endDateInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
            officeSelect.disabled = false;
            officeSelect.classList.remove('bg-gray-200', 'cursor-not-allowed');
        } else {
            timeInputsContainer.style.display = 'grid';
            endDateInput.value = startDateInput.value;
            endDateInput.readOnly = true;
            endDateInput.classList.add('bg-gray-200', 'cursor-not-allowed');
            if (config.currentUser && config.currentUser.officeId) {
                officeSelect.value = config.currentUser.officeId;
            }
            officeSelect.disabled = true;
            officeSelect.classList.add('bg-gray-200', 'cursor-not-allowed');
        }
    };

     const getScheduleState = (schedule) => {
            const now = new Date();
            const scheduleStartDateTime = new Date(`${schedule.startDate}T${schedule.startTime || '00:00:00'}`);
            const scheduleEndDateTime = new Date(`${schedule.endDate}T${schedule.endTime || '23:59:59'}`);

            if (scheduleEndDateTime < now) {
                return 'FINISHED';
            }
            if (scheduleStartDateTime <= now && now <= scheduleEndDateTime) {
                return 'IN_PROGRESS';
            }
            return 'UPCOMING';
        };

        const setFormPermissions = (state) => {
            const allElements = eventForm.querySelectorAll('input, select, textarea');
            const saveBtn = eventForm.querySelector('button[type="submit"]');
            const deleteBtn = document.getElementById('delete-btn');

            // Reset to default state first
            allElements.forEach(el => {
                el.disabled = false;
                el.readOnly = false;
                el.classList.remove('bg-gray-100', 'cursor-not-allowed');
            });
            saveBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
            deleteBtn.disabled = false;

            switch (state) {
                case 'IN_PROGRESS':
                    const fieldsToLock = ['event-type', 'event-start-date', 'event-start-time', 'event-office'];
                    fieldsToLock.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.disabled = true;
                            el.classList.add('bg-gray-100', 'cursor-not-allowed');
                        }
                    });
                    deleteBtn.disabled = true;
                    deleteBtn.title = "Không thể xóa lịch trình đang diễn ra.";
                    break;
                case 'FINISHED':
                case 'CANCELLED':
                    allElements.forEach(el => {
                        el.disabled = true;
                        el.readOnly = true;
                        el.classList.add('bg-gray-100', 'cursor-not-allowed');
                    });
                    saveBtn.style.display = 'none';
                    deleteBtn.style.display = 'none';

                    break;
            }
        };

    // =================================================================
    // == 4. CORE LOGIC & INITIALIZATION FUNCTIONS
    // =================================================================

    const openEventModal = (event = null, startDateStr = null, endDateStr = null, preselectedWorkType = null) => {
        eventForm.reset();

        if (event) { // Chế độ xem/sửa
            const props = event.extendedProps;
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-notes').value = props.notes || '';
            document.getElementById('event-start-date').value = props.startDate;
            document.getElementById('event-end-date').value = props.endDate;
            document.getElementById('event-start-time').value = props.startTime || '';
            document.getElementById('event-end-time').value = props.endTime || '';
            document.getElementById('event-type').value = props.workType;
            document.getElementById('event-office').value = props.officeId;

            updateEventFormUI(props.workType);

            const state = props.status === 'CANCELLED' ? 'CANCELLED' : getScheduleState(props);

            switch (state) {
                case 'UPCOMING':
                    modalTitle.textContent = 'スケジュールを編集 (Chỉnh sửa Lịch trình)';
                    break;
                case 'IN_PROGRESS':
                    modalTitle.textContent = '進行中のスケジュール (Lịch trình đang diễn ra)';
                    break;
                case 'FINISHED':
                    modalTitle.textContent = '過去のスケジュール (Lịch trình đã kết thúc)';
                    break;
                case 'CANCELLED':
                    modalTitle.textContent = 'キャンセルされたスケジュール (Lịch trình đã hủy)';
                    break;
            }
            setFormPermissions(state);
        } else { // Chế độ thêm mới
            modalTitle.textContent = 'スケジュールを追加 (Thêm Lịch trình)';
            document.getElementById('event-id').value = '';
            document.getElementById('event-start-date').value = startDateStr || getTodayString();
            document.getElementById('event-end-date').value = endDateStr || startDateStr || getTodayString();
            document.getElementById('event-office').value = config.currentUser.officeId || '';
            document.getElementById('event-type').value = preselectedWorkType || '';

            updateEventFormUI(preselectedWorkType);
            setFormPermissions('UPCOMING');
            setEventFormState(!!preselectedWorkType);
        }
        eventModal.classList.remove('hidden');
    };

    const closeEventModal = () => eventModal.classList.add('hidden');

    const loadUserProfile = () => {
        const user = config.currentUser;
        document.getElementById('profile-name').textContent = user.name || '--';
        document.getElementById('profile-username').textContent = user.username || '--';
        document.getElementById('profile-email').textContent = user.email || '--';
        document.getElementById('profile-phone').textContent = user.phoneNumber || '--';
        document.getElementById('profile-address').textContent = user.address || '--';
        document.getElementById('profile-office').textContent = user.officeName || '--';
        const genderMap = { 'MALE': '男性', 'FEMALE': '女性', 'OTHER': 'その他' };
        document.getElementById('profile-gender').textContent = genderMap[user.gender] || '--';
        const positionMap = { 'MANAGER': 'マネージャー', 'LEADER': 'チームリーダー', 'STAFF': '従業員', 'SUPERVISOR': 'スーパーバイザー' };
        document.getElementById('profile-position').textContent = positionMap[user.position] || '--';
        const roleMap = { 'ADMIN': '管理者', 'MANAGER': 'マネージャー', 'USER': 'ユーザー' };
        document.getElementById('profile-role').textContent = roleMap[user.role?.toUpperCase()] || '--';
        const profileAvatar = document.getElementById('profile-avatar');
        if (user.avatar) {
            profileAvatar.src = `/api/files/avatar/${user.avatar}`;
        } else {
            profileAvatar.src = 'https://placehold.co/128x128/E2E8F0/A0AEC0?text=' + (user.name ? user.name.charAt(0).toUpperCase() : 'U');
        }
    };

    const initProfileModal = () => {
        const profileModal = document.getElementById('profile-modal');
        const closeProfileModal = document.getElementById('close-profile-modal');
        const closeProfileBtn = document.getElementById('close-profile-btn');
        const profileMenuItem = document.getElementById('user-menu-item-0');
        const openModal = () => { loadUserProfile(); profileModal.classList.remove('hidden'); };
        const closeModal = () => profileModal.classList.add('hidden');
        profileMenuItem.addEventListener('click', (e) => { e.preventDefault(); openModal(); document.getElementById('user-menu').classList.add('hidden'); });
        closeProfileModal.addEventListener('click', closeModal);
        closeProfileBtn.addEventListener('click', closeModal);
        profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeModal(); });
    };

    const loadUpcomingSchedules = async () => {
        const today = getTodayString();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekString = nextWeek.toISOString().split('T')[0];
        try {
            const response = await fetchWithAuth(`/api/schedules/employee/${config.currentUser.id}?startDate=${today}&endDate=${nextWeekString}`);
            if (!response.ok) throw new Error('Failed to fetch upcoming schedules');
            const schedules = (await response.json()).filter(s => s.status === 'ACTIVE').slice(0, 3);
            upcomingSchedulesList.innerHTML = '';
            if (schedules.length === 0) {
                upcomingSchedulesList.innerHTML = '<p class="text-sm text-gray-500">今後のスケジュールはありません。</p>';
                return;
            }
            const workTypeNames = { 'NORMAL': '通常勤務', 'BUSINESS_TRIP': '出張', 'VACATION': '休暇', 'OUTSIDE': '外出', 'OVERTIME': '残業' };
            schedules.forEach(s => {
                const div = document.createElement('div');
                div.className = 'p-3 bg-gray-50 rounded-md';
                div.innerHTML = `
                    <p class="font-medium text-gray-700">${new Date(s.startDate).toLocaleDateString('ja-JP', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                    <p class="text-sm text-gray-500">${workTypeNames[s.workType] || s.workType} | ${s.officeName}</p>
                `;
                upcomingSchedulesList.appendChild(div);
            });
        } catch (e) {
            upcomingSchedulesList.innerHTML = '<p class="text-sm text-red-500">スケジュールの読み込み中にエラーが発生しました。</p>';
        }
    };

    const loadOffices = async () => {
        try {
            const response = await fetchWithAuth('/api/offices/active');
            if (!response.ok) throw new Error('Failed to fetch offices');
            config.allOffices = await response.json();
            const officeSelect = document.getElementById('event-office');
            officeSelect.innerHTML = '<option value="">オフィスを選択してください...</option>';
            config.allOffices.forEach(office => {
                const option = document.createElement('option');
                option.value = office.id;
                option.textContent = office.name;
                officeSelect.appendChild(option);
            });
        } catch (error) {
            showAlert('オフィス一覧を読み込めません。', 'error');
        }
    };

    const initCalendar = () => {
        const workTypeColors = { NORMAL: '#3B82F6', BUSINESS_TRIP: '#F59E0B', VACATION: '#10B981', OUTSIDE: '#8B5CF6', OVERTIME: '#EF4444' };
        const workTypeTranslations = { NORMAL: '通常勤務', BUSINESS_TRIP: '出張', VACATION: '休暇', OUTSIDE: '外出', OVERTIME: '残業' };
        config.calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'ja',
            initialView: 'dayGridMonth',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
            buttonText: { today: '今日', month: '月', week: '週', day: '日' },
            height: 'auto',
            editable: true,
            selectable: true,
            selectMirror: true,
            displayEventTime: false,
            views: {
                timeGridWeek: { displayEventTime: true },
                timeGridDay: { displayEventTime: true }
            },

            // <<< CẢI TIẾN: THÊM TOOLTIP KHI DI CHUỘT VÀO SỰ KIỆN >>>
           eventDidMount: function(info) {
               // Lấy các thông tin cần thiết từ event
               const props = info.event.extendedProps;
               const workTypeTranslations = { NORMAL: '通常勤務', BUSINESS_TRIP: '出張', VACATION: '休暇', OUTSIDE: '外出', OVERTIME: '残業' };
               const workTypeName = workTypeTranslations[props.workType] || props.workType;
               const notes = props.notes || '<em>なし</em>';
               const officeName = props.officeName || '<em>未定</em>';

               let timeOrDateHTML = '';
               if (props.startDate === props.endDate) {
                   if (props.startTime) {
                       timeOrDateHTML = `<p class="text-xs text-gray-600 mt-1"><strong>時間:</strong> ${props.startTime.substring(0, 5)} - ${props.endTime.substring(0, 5)}</p>`;
                   }
               } else {
                   const options = { year: 'numeric', month: 'long', day: 'numeric' };
                   const formattedStartDate = new Date(props.startDate).toLocaleDateString('ja-JP', options);
                   const formattedEndDate = new Date(props.endDate).toLocaleDateString('ja-JP', options);
                   timeOrDateHTML = `<p class="text-xs text-gray-600 mt-1"><strong>期間:</strong> ${formattedStartDate} - ${formattedEndDate}</p>`;
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
                    const start = fetchInfo.start.toISOString().split('T')[0];
                    const end = fetchInfo.end.toISOString().split('T')[0];
                    const response = await fetchWithAuth(`/api/schedules/employee/${config.currentUser.id}?startDate=${start}&endDate=${end}`);
                    if (!response.ok) throw new Error('Failed to fetch events');
                    const schedules = await response.json();
                    const events = schedules.map(s => {
                        // <<< CẢI TIẾN 3: ĐƠN GIẢN HÓA LOGIC TẠO TIÊU ĐỀ SỰ KIỆN >>>
                        const workTypeName = workTypeTranslations[s.workType] || s.workType;
                        const titleText = s.notes || workTypeName;
                        let eventTitle = titleText;

                        if (s.startTime) {
                            if (config.calendar.view.type.startsWith('timeGrid')) {
                                eventTitle = `${s.startTime.substring(0, 5)} - ${titleText}`;
                            } else {
                                eventTitle = `${s.startTime.substring(0, 5)} ${titleText}`;
                            }
                        }

                        let eventEnd;
                        if(s.startTime) {
                            eventEnd = `${s.endDate}T${s.endTime}`;
                        } else {
                            const calendarEndDate = new Date(s.endDate);
                            calendarEndDate.setDate(calendarEndDate.getDate() + 1);
                            eventEnd = toLocalISOString(calendarEndDate);
                        }

                        return {
                            id: s.id,
                            title: eventTitle,
                            start: `${s.startDate}${s.startTime ? 'T' + s.startTime : ''}`,
                            end: eventEnd,
                            allDay: !s.startTime,
                            backgroundColor: workTypeColors[s.workType] || '#71717A',
                            borderColor: workTypeColors[s.workType] || '#71717A',
                            className: s.status === 'CANCELLED' ? 'event-cancelled' : '',
                            extendedProps: { ...s }
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    failureCallback(error);
                    showAlert('カレンダーデータを読み込めません。', 'error');
                }
            },
            eventClick: (info) => openEventModal(info.event),
            select: (info) => {
                const durationInMs = info.end.getTime() - info.start.getTime();
                const durationInDays = durationInMs / (1000 * 60 * 60 * 24);
                let preselectedWorkType = durationInDays > 1 ? 'BUSINESS_TRIP' : 'NORMAL';
                const actualEndDate = new Date(info.end);
                actualEndDate.setDate(actualEndDate.getDate() - 1);
                openEventModal(null, toLocalISOString(info.start), toLocalISOString(actualEndDate), preselectedWorkType);
                config.calendar.unselect();
            },
            eventDrop: async (info) => {
                const { event, revert } = info;
                if (!confirm(`このスケジュールを移動してもよろしいですか？`)) {
                    revert();
                    return;
                }
                try {
                    const originalData = event.extendedProps;
                    const duration = new Date(originalData.endDate).getTime() - new Date(originalData.startDate).getTime();
                    const newEndDate = new Date(event.start.getTime() + duration);
                    const payload = { ...originalData, startDate: toLocalISOString(event.start), endDate: toLocalISOString(newEndDate) };
                    const response = await fetchWithAuth(`/api/schedules/${event.id}`, { method: 'PUT', body: JSON.stringify(payload) });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || '更新に失敗しました');
                    }
                    handleSuccessfulUpdate('スケジュールが正常に更新されました！');
                } catch (err) {
                    showAlert(`更新エラー: ${err.message}`, 'error');
                    revert();
                }
            },
            eventResize: async (info) => {
                const { event, revert } = info;
                if (!confirm(`このスケジュールの期間を変更してもよろしいですか？`)) {
                    revert();
                    return;
                }
                try {
                    const originalData = event.extendedProps;
                    const actualEndDate = new Date(event.end);
                    actualEndDate.setDate(actualEndDate.getDate() - 1);
                    const payload = { ...originalData, startDate: toLocalISOString(event.start), endDate: toLocalISOString(actualEndDate) };
                    const response = await fetchWithAuth(`/api/schedules/${event.id}`, { method: 'PUT', body: JSON.stringify(payload) });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || '更新に失敗しました');
                    }
                    handleSuccessfulUpdate('スケジュール期間が更新されました！');
                } catch (err) {
                    showAlert(`更新エラー: ${err.message}`, 'error');
                    revert();
                }
            }
        });
        config.calendar.render();
    };

    const initClock = () => {
        const updateTime = () => {
            const now = new Date();
            currentTimeEl.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            currentDateEl.textContent = now.toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        };
        // <<< CẢI TIẾN 4: TỐI ƯU HÓA KHỞI TẠO ĐỒNG HỒ >>>
        // Chạy ngay 1 lần để hiển thị giờ ngay lập tức, không phải chờ 1 giây
        updateTime();
        setInterval(updateTime, 1000);
    };

    const initWelcomeInfo = () => {
        welcomeUsernameEl.textContent = (config.currentUser && config.currentUser.name) ? config.currentUser.name : "ユーザー";
    };

    const initMenu = () => {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuItems = document.getElementById('mobile-menu-items');
        userMenuButton.addEventListener('click', () => userMenu.classList.toggle('hidden'));
        mobileMenuButton.addEventListener('click', () => mobileMenuItems.classList.toggle('hidden'));
        document.addEventListener('click', (event) => {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.classList.add('hidden');
            }
        });
    };

    const initAuth = () => {
        const userJson = localStorage.getItem('currentUser');
        if (!userJson) {
            window.location.href = '/login-JP.html';
            return false;
        }
        config.currentUser = JSON.parse(userJson);
        userNameNav.textContent = `こんにちは、${config.currentUser.name}さん`;
        if (config.currentUser.avatar) {
            userAvatarNav.src = `/api/files/avatar/${config.currentUser.avatar}`;
        }
        logoutButton.addEventListener('click', async () => {
            if (confirm('ログアウトしてもよろしいですか？')) {
                try {
                    await fetchWithAuth('/api/auth/logout', { method: 'POST' });
                } catch (error) {
                    console.error("Logout failed on server but proceeding.", error);
                } finally {
                    localStorage.clear();
                    showAlert('ログアウトに成功しました！', 'success', 1500);
                    setTimeout(() => { window.location.href = '/login-JP.html'; }, 1000);
                }
            }
        });
        return true;
    };

    const initApp = () => {
        if (!initAuth()) return;
        initMenu();
        initCalendar();
        loadOffices();
        loadUpcomingSchedules();
        initProfileModal();
        initClock();
        initWelcomeInfo();
    };

    // =================================================================
    // == 5. EVENT LISTENERS
    // =================================================================
    addEventBtn.addEventListener('click', () => openEventModal());
    closeModalBtn.addEventListener('click', closeEventModal);
    cancelBtn.addEventListener('click', closeEventModal);
    eventModal.addEventListener('click', e => { if (e.target === eventModal) closeEventModal(); });

    eventTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        if (!selectedType) {
            setEventFormState(false);
            updateEventFormUI(null);
        } else {
            setEventFormState(true);
            updateEventFormUI(selectedType);
        }
    });

    employeeStartDateInput.addEventListener('change', (e) => {
        const selectedType = eventTypeSelect.value;
        if (selectedType && selectedType !== 'VACATION' && selectedType !== 'BUSINESS_TRIP') {
            document.getElementById('event-end-date').value = e.target.value;
        }
    });

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('event-id').value;
        const isUpdating = !!id;

        // <<< ĐỒNG BỘ: THÊM VALIDATION KHI TẠO MỚI >>>
        if (!isUpdating) {
            const now = new Date();
            const startDateValue = document.getElementById('event-start-date').value;
            const startTimeValue = document.getElementById('event-start-time').value;
            if (startTimeValue) {
                const scheduleStartDateTime = new Date(`${startDateValue}T${startTimeValue}`);
                if (scheduleStartDateTime < (now - 60000)) {
                    showAlert('過去の日付や時間にスケジュールを設定することはできません。', 'warning');
                    return;
                }
            } else {
                const scheduleStartDate = new Date(startDateValue);
                const today = new Date();
                scheduleStartDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                if (scheduleStartDate < today) {
                    showAlert('過去の日付にスケジュールを設定することはできません。', 'warning');
                    return;
                }
            }
        }
        const workType = document.getElementById('event-type').value;
        const startTime = document.getElementById('event-start-time').value;
        const endTime = document.getElementById('event-end-time').value;

        const payload = {
            notes: document.getElementById('event-notes').value,
            startDate: document.getElementById('event-start-date').value,
            endDate: document.getElementById('event-end-date').value,
            startTime: startTime || null,
            endTime: endTime || null,
            workType: workType,
            officeId: document.getElementById('event-office').value,
            employeeId: config.currentUser.id
        };

        const url = id ? `/api/schedules/${id}` : '/api/schedules';
        const method = id ? 'PUT' : 'POST';
        try {
            const response = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
            if (!response.ok) {
                let errorMessage = '保存に失敗しました';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (err) {
                    errorMessage = await response.text() || `エラー ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            // <<< CẢI TIẾN 1: ÁP DỤNG HÀM DÙNG CHUNG >>>
            handleSuccessfulUpdate(`スケジュールが正常に${id ? '更新' : '作成'}されました。`);
        } catch (error) {
            showAlert(`エラー: ${error.message}`, 'error', 5000);
        }
    });

    deleteBtn.addEventListener('click', async () => {
        const id = document.getElementById('event-id').value;
        if (id && confirm('このスケジュールを削除してもよろしいですか?')) {
            try {
                const response = await fetchWithAuth(`/api/schedules/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '削除に失敗しました');
                }
                // <<< CẢI TIẾN 1: ÁP DỤNG HÀM DÙNG CHUNG >>>
                handleSuccessfulUpdate('スケジュールが削除されました。');
            } catch (error) {
                showAlert(`削除中にエラーが発生しました: ${error.message}`, 'error');
            }
        }
    });

    // =================================================================
    // == 6. START THE APPLICATION
    // =================================================================
    initApp();
});