 document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL CONFIG & STATE ---
    const config = {

        currentUser: null,
        allOffices: [],
        calendar: null
    };

    // --- UI ELEMENTS ---
    const
        // Nav
        userNameNav = document.getElementById('user-name-nav'),
        userAvatarNav = document.getElementById('user-avatar-nav'),
        logoutButton = document.getElementById('logout-button'),

        // Attendance
        welcomeUsernameEl = document.getElementById('welcome-username'),
        currentDateEl = document.getElementById('current-date'),
        currentTimeEl = document.getElementById('current-time');

        // Calendar & Modal
        calendarEl = document.getElementById('calendar'),
        eventModal = document.getElementById('event-modal'),
        eventForm = document.getElementById('event-form'),
        modalTitle = document.getElementById('modal-title'),
        deleteBtn = document.getElementById('delete-btn'),
        cancelBtn = document.getElementById('cancel-btn'),
        closeModalBtn = document.getElementById('close-modal'),
        addEventBtn = document.getElementById('add-event-btn'),
        upcomingSchedulesList = document.getElementById('upcoming-schedules-list');



    // --- HELPER FUNCTIONS ---
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
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for sending session cookies
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

    // --- INITIALIZATION ---
    const initApp = () => {
        if (!initAuth()) return; // Stop if not authenticated
        initMenu();
        initCalendar();
        loadOffices();
        loadUpcomingSchedules();
        initProfileModal();

        initClock();
        initWelcomeInfo();
        addClockAnimation();
    };

    // 1. AUTHENTICATION
    const initAuth = () => {
        const userJson = localStorage.getItem('currentUser');
        if (!userJson) {
            window.location.href = '/login-JP.html';
            return false;
        }
        config.currentUser = JSON.parse(userJson);

        // Update user info in navbar
        userNameNav.textContent = `こんにちは、${config.currentUser.name}さん`;
        if (config.currentUser.avatar) {
            userAvatarNav.src = config.currentUser.avatar;
        }

        // Setup logout
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

    // 2. CLOCK & MENU
    const initClock = () => {
        const updateTime = () => {
            const now = new Date();

            // Cập nhật thời gian (giờ:phút:giây)
            const timeString = now.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            currentTimeEl.textContent = timeString;

            // Cập nhật ngày
            const dateString = now.toLocaleDateString('ja-JP', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            currentDateEl.textContent = dateString;
        };

        // Cập nhật ngay lập tức
        updateTime();

        // Cập nhật mỗi giây
        setInterval(updateTime, 1000);
    };

    const initWelcomeInfo = () => {
        if (config.currentUser && config.currentUser.name) {
            welcomeUsernameEl.textContent = config.currentUser.name;
        } else {
            welcomeUsernameEl.textContent = "ユーザー";
        }
    };

    const addClockAnimation = () => {
        // Thêm hiệu ứng nhấp nháy cho dấu hai chấm
        setInterval(() => {
            const timeText = currentTimeEl.textContent;
            if (timeText.includes(':')) {
                currentTimeEl.style.opacity = '0.7';
                setTimeout(() => {
                    currentTimeEl.style.opacity = '1';
                }, 500);
            }
        }, 2000);
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

    // 3. ATTENDANCE MODULE

    // 4. CALENDAR MODULE
    const initCalendar = () => {
         const workTypeColors = {
            NORMAL: '#3B82F6',
            BUSINESS_TRIP: '#F59E0B',
            VACATION: '#10B981',
            OUTSIDE: '#8B5CF6',
            OVERTIME: '#EF4444'
        };
         const workTypeTranslations = {
            NORMAL: '通常勤務',
            BUSINESS_TRIP: '出張',
            VACATION: '休暇',
            OUTSIDE: '外出',
            OVERTIME: '残業'
        };

        config.calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'ja', // Sử dụng ngôn ngữ tiếng Việt cho các nút
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: { today: '今日', month: '月', week: '週', day: '日' },
            height: 'auto',
            editable: true,
            selectable: true, // Cho phép chọn nhiều ngày
            selectMirror: true,
            displayEventTime: false,

            // Logic tải sự kiện đã được cập nhật
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
                        const isMultiDay = s.startDate !== s.endDate;

                        if (s.startTime && s.endTime) {
                            const formattedStartTime = s.startTime.substring(0, 5);
                            const formattedEndTime = s.endTime.substring(0, 5);
                            eventTitle = `${formattedStartTime} - ${formattedEndTime}`;
                            if (isMultiDay && originalTitle) eventTitle += ` - ${originalTitle}`;
                        } else {
                            eventTitle = originalTitle;
                        }

                        const calendarEndDate = new Date(s.endDate);
                        calendarEndDate.setDate(calendarEndDate.getDate() + 1);

                        return {
                            id: s.id,
                            title: eventTitle,
                            start: `${s.startDate}${s.startTime ? 'T' + s.startTime : ''}`,
                            end: calendarEndDate.toISOString().split('T')[0],
                            allDay: !s.startTime,
                            backgroundColor: workTypeColors[s.workType] || '#71717A',
                            borderColor: workTypeColors[s.workType] || '#71717A',
                            extendedProps: { ...s } // Lưu toàn bộ dữ liệu gốc
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    console.error('Calendar events error:', error);
                    failureCallback(error);
                    showAlert('カレンダーデータを読み込めません。', 'error');
                }
            },

            // Cập nhật eventClick
            eventClick: (info) => openEventModal(info.event),

            // Thêm sự kiện select để xử lý việc chọn nhiều ngày
            select: (info) => {
                const actualEndDate = new Date(info.end);
                actualEndDate.setDate(actualEndDate.getDate() - 1); // Trừ đi 1 ngày vì end của FullCalendar là exclusive

                openEventModal(
                    null, // null cho id -> chế độ tạo mới
                    info.startStr, // ngày bắt đầu
                    actualEndDate.toISOString().split('T')[0] // ngày kết thúc đã tính toán
                );
                config.calendar.unselect();
            },

            // Cập nhật eventDrop để gửi đi startDate và endDate
            eventDrop: async (info) => {
                const { event } = info;
                const oldDuration = info.oldEvent.end - info.oldEvent.start;
                const newEndDate = new Date(event.start.getTime() + oldDuration);

                try {
                    const response = await fetchWithAuth(`/api/schedules/${event.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            startDate: event.start.toISOString().split('T')[0],
                            endDate: newEndDate.toISOString().split('T')[0]
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

    const loadOffices = async () => {
        try {
            const response = await fetchWithAuth('/api/offices');
            if (!response.ok) throw new Error('Failed to fetch offices');
            config.allOffices = await response.json();
            const officeSelect = document.getElementById('event-office');
            officeSelect.innerHTML = '<option value="">オフィスを選択してください...</option>'; // Clear previous
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

    const loadUpcomingSchedules = async () => {
        const today = getTodayString();

        const getWorkTypeName = (workType) => {
            const workTypeNames = {
                'NORMAL': '通常勤務',
                'BUSINESS_TRIP': '出張',
                'VACATION': '休暇',
                'OUTSIDE': '外出',
                'OVERTIME': '残業'
            };
            return workTypeNames[workType] || workType;
        };

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekString = nextWeek.toISOString().split('T')[0];

        try {
             const response = await fetchWithAuth(`/api/schedules/employee/${config.currentUser.id}?startDate=${today}&endDate=${nextWeekString}`);
             if (!response.ok) throw new Error('Failed to fetch upcoming schedules');
             const schedules = (await response.json()).slice(0, 3); // take first 3

             upcomingSchedulesList.innerHTML = '';
             if(schedules.length === 0) {
                 upcomingSchedulesList.innerHTML = '<p class="text-sm text-gray-500">今後のスケジュールはありません。</p>';
                 return;
             }

             schedules.forEach(s => {
                 const div = document.createElement('div');
                 div.className = 'p-3 bg-gray-50 rounded-md';
                 div.innerHTML = `
                   <p class="font-medium text-gray-700">${new Date(s.startDate).toLocaleDateString('ja-JP', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                    <p class="text-sm text-gray-500">${s.notes} | ${s.officeName}</p>
                 `;
                 upcomingSchedulesList.appendChild(div);
             });

        } catch(e) {
             upcomingSchedulesList.innerHTML = '<p class="text-sm text-red-500">スケジュールの読み込み中にエラーが発生しました。</p>';
        }
    }
    // 5. PROFILE MODULE
    const initProfileModal = () => {
        const profileModal = document.getElementById('profile-modal');
        const closeProfileModal = document.getElementById('close-profile-modal');
        const closeProfileBtn = document.getElementById('close-profile-btn');
        const profileMenuItem = document.getElementById('user-menu-item-0');

        const openProfileModal = () => {
            loadUserProfile();
            profileModal.classList.remove('hidden');
        };

        const closeModal = () => {
            profileModal.classList.add('hidden');
        };

        // Event listeners
        profileMenuItem.addEventListener('click', (e) => {
            e.preventDefault();
            openProfileModal();
            // Đóng user menu
            document.getElementById('user-menu').classList.add('hidden');
        });

        closeProfileModal.addEventListener('click', closeModal);
        closeProfileBtn.addEventListener('click', closeModal);
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeModal();
        });
    };

    const loadUserProfile = () => {
        const user = config.currentUser;

        // Cập nhật thông tin cơ bản
        document.getElementById('profile-name').textContent = user.name || '--';
        document.getElementById('profile-username').textContent = user.username || '--';
        document.getElementById('profile-email').textContent = user.email || '--';
        document.getElementById('profile-phone').textContent = user.phoneNumber || '--';
        document.getElementById('profile-address').textContent = user.address || '--';
        document.getElementById('profile-office').textContent = user.officeName || '--';

        // Hiển thị giới tính
        const genderMap = {
            'MALE': '男性',
            'FEMALE': '女性',
            'OTHER': 'その他'
        };
        document.getElementById('profile-gender').textContent = genderMap[user.gender] || '--';

        // Hiển thị chức vụ
        const positionMap = {
            'MANAGER': 'マネージャー',
            'LEADER': 'チームリーダー',
            'STAFF': '従業員',
            'SUPERVISOR': 'スーパーバイザー'
        };
        document.getElementById('profile-position').textContent = positionMap[user.position] || '--';

        // Hiển thị vai trò
        const roleMap = {
            'ADMIN': '管理者',
            'MANAGER': 'マネージャー',
            'USER': 'ユーザー'
        };
        document.getElementById('profile-role').textContent = roleMap[user.role?.toUpperCase()] || '--';

        // Hiển thị avatar
        const profileAvatar = document.getElementById('profile-avatar');
        if (user.avatar) {
            profileAvatar.src = user.avatar;
        } else {
            profileAvatar.src = 'https://placehold.co/128x128/E2E8F0/A0AEC0?text=' + (user.name ? user.name.charAt(0).toUpperCase() : 'U');
        }
    };
    const openEventModal = (event = null, startDateStr = null, endDateStr = null) => {
        eventForm.reset();
        const startDateInput = document.getElementById('event-start-date');
        const endDateInput = document.getElementById('event-end-date');
          // Cập nhật giao diện form dựa trên giá trị WorkType ban đầu
            updateEventFormUI(document.getElementById('event-type').value);

        if (event) { // Chế độ sửa
            modalTitle.textContent = 'スケジュールを編集';
            const props = event.extendedProps;
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-notes').value = props.notes || '';
            startDateInput.value = props.startDate;
            endDateInput.value = props.endDate;
            document.getElementById('event-start-time').value = props.startTime || '';
            document.getElementById('event-end-time').value = props.endTime || '';
            document.getElementById('event-type').value = props.workType;
            document.getElementById('event-office').value = props.officeId || config.currentUser.officeId;
            deleteBtn.classList.remove('hidden');
        } else { // Chế độ tạo mới
            modalTitle.textContent = 'スケジュールを追加';
            document.getElementById('event-id').value = '';

            const today = getTodayString();
            startDateInput.value = startDateStr || today;
            endDateInput.value = endDateStr || startDateStr || today;

            document.getElementById('event-office').value = config.currentUser.officeId;
            deleteBtn.classList.add('hidden');
        }
        eventModal.classList.remove('hidden');
    };


    const closeEventModal = () => eventModal.classList.add('hidden');

    // --- EVENT LISTENERS for Calendar Modal ---
    addEventBtn.addEventListener('click', () => openEventModal());
    closeModalBtn.addEventListener('click', closeEventModal);
    cancelBtn.addEventListener('click', closeEventModal);
    eventModal.addEventListener('click', e => { if (e.target === eventModal) closeEventModal(); });

     const eventTypeSelect = document.getElementById('event-type');
     const employeeStartTimeInput = document.getElementById('event-start-time');
     const employeeEndTimeInput = document.getElementById('event-end-time');
     const employeeStartDateInput = document.getElementById('event-start-date');
     const employeeEndDateInput = document.getElementById('event-end-date');

     // 2. TẠO HÀM HELPER ĐỂ CẬP NHẬT GIAO DIỆN FORM
     const updateEventFormUI = (selectedType) => {
         if (!employeeStartTimeInput || !employeeEndDateInput) return; // Đảm bảo các element đã tồn tại

         const timeInputsContainer = employeeStartTimeInput.closest('.grid');

         if (selectedType === 'VACATION' || selectedType === 'BUSINESS_TRIP') {
             // Nếu là sự kiện nhiều ngày
             timeInputsContainer.style.display = 'none';
             employeeStartTimeInput.value = '';
             employeeEndTimeInput.value = '';

             employeeEndDateInput.readOnly = false;
             employeeEndDateInput.classList.remove('bg-gray-200', 'cursor-not-allowed');
         } else {
             // Nếu là sự kiện trong ngày
             timeInputsContainer.style.display = 'grid';

             employeeEndDateInput.value = employeeStartDateInput.value;
             employeeEndDateInput.readOnly = true;
             employeeEndDateInput.classList.add('bg-gray-200', 'cursor-not-allowed');
         }
     };

     // 3. Gán sự kiện 'change' cho dropdown "Loại công việc"
     if (eventTypeSelect) {
         eventTypeSelect.addEventListener('change', (e) => {
             updateEventFormUI(e.target.value); // Chỉ cần gọi hàm helper
         });
     }

     // 4. Gán sự kiện 'change' cho ô "Ngày bắt đầu"
     if (employeeStartDateInput) {
         employeeStartDateInput.addEventListener('change', (e) => {
             const selectedType = eventTypeSelect.value;
             if (selectedType !== 'VACATION' && selectedType !== 'BUSINESS_TRIP' && selectedType !== '') {
                 employeeEndDateInput.value = e.target.value;
             }
         });
     }

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('event-id').value;
        const startTime = document.getElementById('event-start-time').value;
        const endTime = document.getElementById('event-end-time').value;

        if (startTime && endTime && startTime >= endTime) {
            showAlert('終了時間は開始時間より後でなければなりません！', 'warning');
            return;
        }

        const payload = {
             notes: document.getElementById('event-notes').value,
            startDate: document.getElementById('event-start-date').value,
            endDate: document.getElementById('event-end-date').value,
            startTime: startTime || null,
            endTime: endTime || null,
            workType: document.getElementById('event-type').value,
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
                } catch (e) {
                    const responseText = await response.text();
                    errorMessage = responseText || `エラー ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            showAlert(`スケジュールが正常に${id ? '更新' : '作成'}されました。`, 'success');
            closeEventModal();
            config.calendar.refetchEvents();
            loadUpcomingSchedules();
        } catch (error) {
            console.error('Form submit error:', error);
            showAlert(`エラー: ${error.message}`, 'error');
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

    // Start the application
    initApp();
});