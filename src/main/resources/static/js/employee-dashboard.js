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

    // =================================================================
    // == 4. CORE LOGIC & INITIALIZATION FUNCTIONS
    // =================================================================

    const openEventModal = (event = null, startDateStr = null, endDateStr = null, preselectedWorkType = null) => {
        eventForm.reset();
        const startDateInput = document.getElementById('event-start-date');
        const endDateInput = document.getElementById('event-end-date');

        setFormReadOnly(false);
        document.getElementById('delete-btn').classList.add('hidden');

        if (event) { // View/Edit Mode
            const props = event.extendedProps;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventStartDate = new Date(props.startDate);

            document.getElementById('event-id').value = event.id;
            document.getElementById('event-notes').value = props.notes || '';
            startDateInput.value = props.startDate;
            endDateInput.value = props.endDate;
            document.getElementById('event-start-time').value = props.startTime || '';
            document.getElementById('event-end-time').value = props.endTime || '';
            eventTypeSelect.value = props.workType;
            document.getElementById('event-office').value = props.officeId || config.currentUser.officeId;

            updateEventFormUI(props.workType);

            if (eventStartDate < today || props.status === 'CANCELLED') {
                modalTitle.textContent = props.status === 'CANCELLED' ?
                    'キャンセルされたスケジュール (Lịch trình đã hủy)' :
                    '過去のスケジュールの詳細 (Chi tiết lịch trình quá khứ)';
                setFormReadOnly(true);
            } else {
                modalTitle.textContent = 'スケジュールを編集 (Chỉnh sửa Lịch trình)';
                document.getElementById('delete-btn').classList.remove('hidden');
                setEventFormState(true);
            }
        } else { // Create Mode
            modalTitle.textContent = 'スケジュールを追加 (Thêm Lịch trình)';
            document.getElementById('event-id').value = '';
            document.getElementById('delete-btn').classList.add('hidden');

            const todayStr = getTodayString();
            startDateInput.value = startDateStr || todayStr;
            endDateInput.value = endDateStr || startDateStr || todayStr;
            document.getElementById('event-office').value = config.currentUser.officeId;

            eventTypeSelect.value = preselectedWorkType || '';

            if (preselectedWorkType) {
                setEventFormState(true);
                updateEventFormUI(preselectedWorkType);
            } else {
                setEventFormState(false);
                updateEventFormUI(null);
            }
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

            // ### THAY ĐỔI NẰM Ở ĐÂY ###
            // Mặc định sẽ không hiển thị giờ (cho Month view)
            displayEventTime: false,

            // Nhưng sẽ ghi đè lại cho các view Tuần và Ngày
            views: {
                timeGridWeek: {
                    displayEventTime: true // Bật hiển thị giờ
                },
                timeGridDay: {
                    displayEventTime: true // Bật hiển thị giờ
                }
            },

            events: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const start = fetchInfo.start.toISOString().split('T')[0];
                    const end = fetchInfo.end.toISOString().split('T')[0];
                    const response = await fetchWithAuth(`/api/schedules/employee/${config.currentUser.id}?startDate=${start}&endDate=${end}`);
                    if (!response.ok) throw new Error('Failed to fetch events');
                    const schedules = await response.json();
                    const events = schedules.map(s => {
                        let eventTitle;
                        const originalTitle = s.notes || workTypeTranslations[s.workType] || s.workType;
                        // For month view, just show title. For week/day, show time + title
                        if (config.calendar.view.type.startsWith('timeGrid')) {
                           if (s.startTime && s.endTime) {
                                eventTitle = `${s.startTime.substring(0, 5)} - ${originalTitle}`;
                           } else {
                                eventTitle = originalTitle;
                           }
                        } else {
                            if (s.startTime && s.endTime) {
                                eventTitle = `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`;
                                if (s.startDate !== s.endDate && originalTitle) eventTitle += ` - ${originalTitle}`;
                            } else {
                                eventTitle = originalTitle;
                            }
                        }

                        let eventEnd;
                        if(s.startTime) { // Sự kiện có giờ
                            eventEnd = `${s.endDate}T${s.endTime}`;
                        } else { // Sự kiện cả ngày
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

                let preselectedWorkType = 'NORMAL';
                if (durationInDays > 1) {
                    preselectedWorkType = 'BUSINESS_TRIP';
                }

                const actualEndDate = new Date(info.end);
                actualEndDate.setDate(actualEndDate.getDate() - 1);

                openEventModal(
                    null,
                    toLocalISOString(info.start),
                    toLocalISOString(actualEndDate),
                    preselectedWorkType
                );

                config.calendar.unselect();
            },

            eventDrop: async (info) => {
                const { event } = info;
                const oldDuration = info.oldEvent.end - info.oldEvent.start;
                const newEndDate = new Date(event.start.getTime() + oldDuration);
                const inclusiveNewEndDate = new Date(newEndDate);
                inclusiveNewEndDate.setDate(inclusiveNewEndDate.getDate() - 1);

                try {
                    const response = await fetchWithAuth(`/api/schedules/${event.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            startDate: toLocalISOString(event.start),
                            endDate: toLocalISOString(inclusiveNewEndDate)
                        })
                    });
                    if (!response.ok) throw new Error('Failed to update event date');
                    showAlert('日付が正常に更新されました！', 'success');
                    config.calendar.refetchEvents();
                } catch (err) {
                    showAlert('日付の更新中にエラーが発生しました。', 'error');
                    info.revert();
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
        const startTime = document.getElementById('event-start-time').value;
        const endTime = document.getElementById('event-end-time').value;
        const workType = document.getElementById('event-type').value;

        if (workType !== 'VACATION' && workType !== 'BUSINESS_TRIP') {
            if (startTime && endTime && startTime >= endTime) {
                showAlert('終了時間は開始時間より後でなければなりません！', 'warning');
                return;
            }
        }

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
            showAlert(`スケジュールが正常に${id ? '更新' : '作成'}されました。`, 'success');
            closeEventModal();
            config.calendar.refetchEvents();
            loadUpcomingSchedules();
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
                showAlert('スケジュールが削除されました。', 'success');
                closeEventModal();
                config.calendar.refetchEvents();
                loadUpcomingSchedules();
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