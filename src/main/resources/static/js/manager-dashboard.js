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

    // --- UI要素の取得 ---

    // アラート要素
    const alertBox = document.getElementById('custom-alert-box');
    const alertMessage = document.getElementById('custom-alert-message');
    // オフィス要素
    const officeTableBody = document.getElementById('office-table-body');
    const addOfficeBtn = document.getElementById('add-office-btn');
    const officeModal = document.getElementById('office-modal');
    const officeForm = document.getElementById('office-form');
    const officeModalTitle = document.getElementById('office-modal-title');
    // 従業員要素
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
     // 従業員情報表示モーダル用
    const viewEmployeeModal = document.getElementById('view-employee-modal');
    const viewEmployeeContent = document.getElementById('view-employee-content');
    const closeViewEmployeeModalBtn = document.getElementById('close-view-employee-modal');
    const cancelViewEmployeeBtn = document.getElementById('cancel-view-employee-btn');
    // アバター要素
    const avatarPreview = document.getElementById('employee-avatar-preview');
    const avatarInput = document.getElementById('employee-avatar-input');
    const selectAvatarBtn = document.getElementById('employee-avatar-select-btn');
    const removeAvatarBtn = document.getElementById('employee-avatar-remove-btn');
    const avatarUrlInput = document.getElementById('employee-avatar-url');
    // 統計ボード要素
    const statsTotalEmployeesEl = document.getElementById('stats-total-employees');
    const statsByPositionEl = document.getElementById('stats-by-position');
    const statsByOfficeEl = document.getElementById('stats-by-office');
    // チームスケジュール要素
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
        const headers = { 'Accept': 'application/json' };
        if (!isFormData) headers['Content-Type'] = 'application/json';
        return headers;
    };
    const handleResponse = async (response) => {
        // CHỈ xử lý lỗi 401 (Hết hạn session) bằng cách đẩy về trang login
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/login-JP.html';
            throw new Error('セッションが期限切れです。再度ログインしてください。');
        }

        // Với các lỗi khác (bao gồm 403), chúng ta sẽ đọc thông báo lỗi từ server và để cho khối catch xử lý
        if (!response.ok) {
            // Cố gắng đọc lỗi dạng JSON từ server (nơi chứa thông báo của chúng ta)
            const errorData = await response.json().catch(() => ({ message: 'サーバーから不明なエラーが発生しました。' }));
            // Ném ra lỗi với thông báo từ server
            throw new Error(errorData.message || 'エラーが発生しました。');
        }

        // Nếu không có lỗi, tiếp tục xử lý bình thường
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

       // 1. Reset các class màu cũ (nếu có) và đảm bảo class gốc luôn tồn tại
       alertBox.className = 'custom-alert';

       // 2. Thêm class màu mới một cách an toàn bằng classList
       alertBox.classList.add(`alert-${type}`);

       // 3. Cập nhật nội dung và hiển thị
       alertMessage.textContent = message;
       alertBox.style.display = 'block';

       // 4. Hẹn giờ để ẩn đi
       setTimeout(() => {
           alertBox.style.display = 'none';
           // Xóa class màu để chuẩn bị cho lần hiển thị sau (tùy chọn nhưng nên làm)
           alertBox.classList.remove(`alert-${type}`);
       }, duration);
   }

     const renderWorkTypeLegend = (targetElementId) => {
        const targetEl = document.getElementById(targetElementId);
        if (!targetEl) {
            console.error(`IDを持つ要素が見つかりません: ${targetElementId}`);
            return;
        }

        // 既存のworkTypeTranslationsとworkTypeColorsオブジェクトを使用
        let legendHTML = Object.keys(workTypeTranslations).map(typeKey => {
            const color = workTypeColors[typeKey] || '#888888'; // 色を取得、予備の色も用意
            const name = workTypeTranslations[typeKey];      // 日本語名を取得

            return `
                <div class="flex items-center">
                    <span class="h-4 w-4 rounded-full mr-2 border border-gray-200" style="background-color: ${color};"></span>
                    <span class="text-sm text-gray-700">${name}</span>
                </div>
            `;
        }).join('');

        targetEl.innerHTML = legendHTML;
    };

    // =================================================================
    // == イベントリスナーの設定ロジック ==
    // =================================================================

    // 共通UIイベントの設定
    function setupCommonUIListeners() {
        // ユーザーメニュー
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
                e.preventDefault(); // ブラウザがhref="#"にジャンプするのを防ぐ

                // localStorageから現在のユーザー情報を取得
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

                if (currentUser && currentUser.id) {
                    // 既存の従業員詳細モーダルを再利用
                    openViewModal(currentUser.id);
                    // ドロップダウンメニューを閉じてすっきりさせる
                    userMenu.classList.add('hidden');
                } else {
                    showAlert('ユーザー情報が見つかりません。再度ログインしてください。', 'error');
                }
            });
        }

        // タブ
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });

        // ログアウト
        document.querySelector('a[href="#"][role="menuitem"]:last-child').addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('本当にログアウトしますか？')) {
                try {
                    await fetch(`/auth/logout`, { method: 'POST', credentials: 'include' });
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
        const officeData = { name: document.getElementById('office-name').value, address: document.getElementById('office-address').value };
        const url = isUpdating ? `${OFFICE_API_URL}/${officeId}` : OFFICE_API_URL;
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            await fetch(url, { method, headers: getRequestHeaders(), credentials: 'include', body: JSON.stringify(officeData) }).then(handleResponse);
            showAlert(`正常にオフィスを${isUpdating ? '更新' : '追加'}しました！`, 'success');
            officeModal.classList.add('hidden');
            await fetchAndRenderOffices();
            await loadOfficesForSelects(); // 従業員用のセレクトボックスも更新
        } catch (error) {
            showAlert(error.message, 'error');
        }
         });
        officeTableBody.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-office-btn');
        if (deleteBtn && confirm(`本当にオフィスID ${deleteBtn.dataset.id} を削除しますか？`)) {
            try {
                await fetch(`${OFFICE_API_URL}/${deleteBtn.dataset.id}`, { method: 'DELETE', headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);
                showAlert('オフィスを正常に削除しました！', 'success');
                await fetchAndRenderOffices();
                await loadOfficesForSelects();
            } catch (error) { showAlert(error.message, 'error'); }
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

            // ボタン（編集/削除）がクリックされた場合、そのボタンのアクションを実行
            if (e.target.closest('button')) {
                const editBtn = e.target.closest('.edit-employee-btn');
                if (editBtn) {
                    openEmployeeModal(editBtn.dataset.id);
                    return; // 表示モーダルが開かないようにここで停止
                }

            const deleteBtn = e.target.closest('.delete-employee-btn');
            if (deleteBtn && confirm('この従業員を本当に削除しますか？')) {
                try {
                        await fetch(`${EMPLOYEE_API_URL}/${deleteBtn.dataset.id}`, { method: 'DELETE', credentials: 'include' }).then(handleResponse);
                        showAlert('従業員を正常に削除しました！', 'success');
                        await fetchAndRenderEmployees();
                        await fetchAndRenderStatistics();

                    } catch (error) { showAlert(error.message, 'error'); }
                }return;
            }
        // 行のどこか（ボタン以外）がクリックされた場合、詳細表示モーダルを開く
            const employeeId = targetRow.id.replace('employee-row-', '');
            if (employeeId) {
                openViewModal(employeeId);
            }
        });
        // 従業員詳細表示モーダルを閉じるリスナー
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
            const saveButton = document.getElementById('save-employee-btn');
            saveButton.disabled = true;
            saveButton.textContent = '保存中...';
            try {
                if (selectedAvatarFile) {
                    const formData = new FormData();
                    formData.append('file', selectedAvatarFile);
                    const uploadResult = await fetch(`${FILE_API_URL}/upload-avatar`, { method: 'POST', credentials: 'include', body: formData }).then(handleResponse);
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

                // APIを呼び出し、更新された従業員データを受け取る
                const updatedEmployee = await fetch(url, {
                    method,
                    headers: getRequestHeaders(),
                    credentials: 'include',
                    body: JSON.stringify(employeeData)
                }).then(handleResponse);

                showAlert(`正常に従業員を${isUpdating ? '更新' : '追加'}しました！`, 'success');

                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

                // 更新されたユーザーがログイン中のユーザーか確認
                if (currentUser && currentUser.id == updatedEmployee.id) {
                    console.log('現在のユーザーの更新を検出しました。localStorageを同期中...');

                    // localStorageをサーバーからの新しい情報で更新
                    const newCurrentUserData = { ...currentUser, ...updatedEmployee, role: updatedEmployee.role.toLowerCase() };
                    localStorage.setItem('currentUser', JSON.stringify(newCurrentUserData));

                    // ページをリロードせずにナビゲーションバーのアバターを即時更新
                    const navAvatar = document.querySelector('#user-menu-button img');
                    if (newCurrentUserData.avatar && navAvatar) {
                        navAvatar.src = newCurrentUserData.avatar;
                    }
                }
                employeeModal.classList.add('hidden');
                await fetchAndRenderEmployees(isUpdating ? empCurrentPage : 0);
                await fetchAndRenderStatistics();
            } catch (error) {
                showAlert(error.message, 'error');
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = '従業員を保存';
            }
        });
    }
    // スケジュールモーダルのイベントリスナー設定関数
    function setupScheduleModalListeners() {
         // モーダルを閉じる
        const scheduleWorkTypeSelect = document.getElementById('schedule-workType');
        const startTimeInput = document.getElementById('schedule-startTime');
        const endTimeInput = document.getElementById('schedule-endTime');
        const startDateInput = document.getElementById('schedule-startDate');
        const endDateInput = document.getElementById('schedule-endDate');

        document.getElementById('close-schedule-modal').addEventListener('click', () => scheduleModal.classList.add('hidden'));
        document.getElementById('cancel-schedule-btn').addEventListener('click', () => scheduleModal.classList.add('hidden'));
        addScheduleBtn.addEventListener('click', () => openScheduleModal());

        // Thêm sự kiện 'change' cho dropdown nhân viên
         if (scheduleWorkTypeSelect) {
             scheduleWorkTypeSelect.addEventListener('change', (e) => {
                 const selectedType = e.target.value;

                 // Lấy các element cần điều khiển
                 const timeInputsContainer = startTimeInput.closest('.grid');
                 const endDateInput = document.getElementById('schedule-endDate');
                 const scheduleOfficeSelect = document.getElementById('schedule-office'); // Lấy dropdown văn phòng

                 if (selectedType === 'VACATION' || selectedType === 'BUSINESS_TRIP') {
                     // --- XỬ LÝ CHO SỰ KIỆN NHIỀU NGÀY / LINH HOẠT ---

                     // Ẩn các trường thời gian
                     timeInputsContainer.style.display = 'none';
                     startTimeInput.value = '';
                     endTimeInput.value = '';

                     // Cho phép người dùng chọn ngày kết thúc
                     endDateInput.readOnly = false;
                     endDateInput.classList.remove('bg-gray-200', 'cursor-not-allowed');

                     // Cho phép người dùng chọn văn phòng (quan trọng cho Business Trip)
                     scheduleOfficeSelect.classList.remove('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');

                 } else {
                     // --- XỬ LÝ CHO SỰ KIỆN TRONG NGÀY TẠI VĂN PHÒNG MẶC ĐỊNH ---

                     // Hiện các trường thời gian
                     timeInputsContainer.style.display = 'grid';

                     // Khóa ô ngày kết thúc
                     endDateInput.readOnly = true;
                     endDateInput.value = startDateInput.value;
                     endDateInput.classList.add('bg-gray-200', 'cursor-not-allowed');

                     // Khóa dropdown văn phòng và tự động chọn văn phòng mặc định
                     const employeeId = document.getElementById('schedule-employee').value;
                     if (employeeId) {
                         const employee = allEmployeesCache.find(emp => emp.id == employeeId);
                         if (employee && employee.officeId) {
                             scheduleOfficeSelect.value = employee.officeId;
                         }
                     }
                     scheduleOfficeSelect.classList.add('bg-gray-200', 'cursor-not-allowed', 'pointer-events-none');
                 }
             });
         }



        // フォームの送信処理（保存/新規作成）
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const scheduleId = document.getElementById('schedule-id').value;
            const isUpdating = !!scheduleId;

            const formData = new FormData(scheduleForm);
            const scheduleData = Object.fromEntries(formData.entries());

             const employeeSelect = document.getElementById('schedule-employee');
            // 従業員選択ボックスが無効化されている場合（個人カレンダーなど）、
            // employeeIdを送信データに手動で追加する
            if (employeeSelect.disabled && employeeSelect.value) {
                scheduleData.employeeId = employeeSelect.value;
            }

            const url = isUpdating ? `${SCHEDULE_API_URL}/${scheduleId}` : SCHEDULE_API_URL;
            const method = isUpdating ? 'PUT' : 'POST';

            try {
                await fetch(url, {
                    method,
                    headers: getRequestHeaders(),
                    credentials: 'include',
                    body: JSON.stringify(scheduleData)
                }).then(handleResponse);

                showAlert(`正常にスケジュールを${isUpdating ? '更新' : '新規作成'}しました！`, 'success');
                scheduleModal.classList.add('hidden');
                teamCalendar.refetchEvents(); // カレンダーを再読み込み
                if (personalCalendar) personalCalendar.refetchEvents();
            } catch (error) {
                showAlert(`保存中のエラー: ${error.message}`, 'error');
            }
        });

         // チームカレンダーのオフィスフィルター用リスナー
        teamCalendarOfficeFilter.addEventListener('change', () => {
            if (teamCalendar) {
                teamCalendar.refetchEvents();
                teamCalendar.refetchResources(); // オフィスで絞り込む場合は従業員も再読み込み
            }
        });

        // 削除ボタンの処理
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
    }
    // =================================================================
    // == メインロジック関数（レンダリング、データ取得など） ==
    // =================================================================

    // スケジュールモーダルを開き、データを入力する関数
    const openScheduleModal = async (scheduleId = null, prefillStartDate = null, prefillEndDate = null, prefillResourceId = null, isPersonal = false) => {
        scheduleForm.reset();
        document.getElementById('schedule-id').value = '';
        scheduleModal.classList.remove('hidden');



        const modalTitle = document.getElementById('schedule-modal-title');
        const employeeSelect = document.getElementById('schedule-employee');
        const startTimeInput = document.getElementById('schedule-startTime');
        const startDateInput = document.getElementById('schedule-startDate');
        const endDateInput = document.getElementById('schedule-endDate');
        const officeSelect = document.getElementById('schedule-office');

        // セレクトボックスに従業員リストを挿入
        employeeSelect.innerHTML = allEmployeesCache.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

        if (scheduleId) {
            // ------ 編集モード ------
            modalTitle.textContent = 'スケジュールを編集';
            deleteScheduleBtn.classList.remove('hidden');
            employeeSelect.disabled = false; // 従業員の編集を許可

            try {
                const schedule = await fetch(`${SCHEDULE_API_URL}/${scheduleId}`, { credentials: 'include' }).then(handleResponse);
                document.getElementById('schedule-id').value = schedule.id;
                employeeSelect.value = schedule.employeeId;
                officeSelect.value = schedule.officeId;
                startDateInput.value = schedule.startDate;
                endDateInput.value = schedule.endDate;
                startTimeInput.value = schedule.startTime || '';
                document.getElementById('schedule-endTime').value = schedule.endTime || '';
                document.getElementById('schedule-workType').value = schedule.workType;
                document.getElementById('schedule-notes').value = schedule.notes || '';
            } catch (error) {
                showAlert(`スケジュールの詳細を読み込めませんでした: ${error.message}`, 'error');
                scheduleModal.classList.add('hidden');
            }
        } else {
            // ------ 新規追加モード ------
            modalTitle.textContent = '新規スケジュールを追加';
            deleteScheduleBtn.classList.add('hidden');
            employeeSelect.disabled = false;

              if (prefillStartDate) startDateInput.value = prefillStartDate;
            // 終了日が渡されない場合、デフォルトで開始日と同じにする
            if (prefillEndDate) {
                endDateInput.value = prefillEndDate;
            // カレンダーからのクリックで情報を自動入力
            } else if (prefillStartDate) {
                endDateInput.value = prefillStartDate;
            }
            if (prefillResourceId) {
                employeeSelect.value = prefillResourceId;
            }
              if (prefillResourceId) {
                employeeSelect.value = prefillResourceId;
            }
              // --- PHẦN LOGIC ĐỂ TỰ ĐỘNG CHỌN VĂN PHÒNG ---
                if (prefillResourceId) {
                    // Tự động chọn nhân viên đã được click
                    employeeSelect.value = prefillResourceId;

                    // Tìm nhân viên trong cache để lấy officeId
                    const selectedEmployee = allEmployeesCache.find(emp => emp.id == prefillResourceId);

                    if (selectedEmployee && selectedEmployee.officeId) {
                        // Tự động chọn đúng văn phòng của nhân viên đó
                        document.getElementById('schedule-office').value = selectedEmployee.officeId;
                    }
                }

             employeeSelect.disabled = isPersonal;
        }
    };


    // チームカレンダー用の新しい関数とロジック
    const workTypeColors = {
        NORMAL: '#3B82F6',        // 青
        BUSINESS_TRIP: '#F59E0B', // オレンジ
        VACATION: '#10B981',      // 緑
        OUTSIDE: '#8B5CF6',       // 紫
        OVERTIME: '#EF4444'       // 赤
    };

    const initializeTeamCalendar = () => {
        if (!teamCalendarEl) return;

        teamCalendar = new FullCalendar.Calendar(teamCalendarEl, {
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source', // リソースビューには必須
            initialView: 'resourceTimelineWeek', // デフォルトの表示モード
            aspectRatio: 1.8,
            height: 'auto',
            slotMinWidth: 100, // 各スロットの最小幅
            slotEventOverlap: false, // イベントの重複を許可しない
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
            displayEventTime: false, // イベントタイトルに時間を表示しない
            editable: true,       // ドラッグ＆ドロップを許可
            selectable: true,       // 空きスロットの選択を許可
            selectMirror: true,     // 選択時にプレースホルダーを表示
            resourceAreaHeaderContent: '従業員',
            locale: 'ja',         // 言語を日本語に設定
            resourceAreaWidth: 200, // 従業員エリアの幅を自動調整
            // 各表示モードのカスタマイズ
            views: {
                resourceTimelineWeek: {
                    slotLabelInterval: { days: 1 } // 週表示ではラベルを1日ごとに
                },
                resourceTimelineDay: {
                    slotLabelInterval: { hours: 1 },
                    slotDuration: '00:30:00' // 日表示ではラベルを1時間ごとに
                },
                resourceTimelineMonth: {
                    slotLabelInterval: { days: 1 }, // 月表示ではラベルを1日ごとに
                }
            },

            // 従業員リスト（リソース）の読み込み
            resources: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const officeId = teamCalendarOfficeFilter.value;
                    const params = new URLSearchParams({ size: 200 });
                    if(officeId) params.append('officeId', officeId);

                    const employeesPage = await fetch(`${EMPLOYEE_API_URL}?${params.toString()}`, { headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);
                    allEmployeesCache = employeesPage.content; // 再利用のためにキャッシュを保存
                    const resources = allEmployeesCache.map(emp => ({
                        id: emp.id,
                        title: emp.name
                    }));
                    successCallback(resources);
                } catch (error) {
                    failureCallback(error);
                }
            },

            // スケジュール（イベント）の読み込み
            events: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const officeId = teamCalendarOfficeFilter.value;
                    const params = new URLSearchParams({
                        startDate: fetchInfo.start.toISOString().slice(0, 10),
                        endDate: fetchInfo.end.toISOString().slice(0, 10),
                    });
                    if (officeId) params.append('officeId', officeId);

                    const schedules = await fetch(`${SCHEDULE_API_URL}?${params.toString()}`, { headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);

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

                        return {
                            id: s.id,
                            resourceId: s.employeeId,
                            title: eventTitle,
                            start: `${s.startDate}${s.startTime ? 'T' + s.startTime : ''}`,
                            end: eventEnd,
                            color: workTypeColors[s.workType] || '#71717A',
                            allDay: !s.startTime,
                            extendedProps: {
                                employeeId: s.employeeId,
                                officeId: s.officeId,
                                startDate: s.startDate,
                                endDate: s.endDate,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                workType: s.workType,
                                notes: s.notes
                            }
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    failureCallback(error);
                }
            },

             select: (info) => {
                // info.endStrは選択された最終日の翌日になるため
                // 1日引いて実際の終了日を取得する必要がある
                const actualEndDate = new Date(info.endStr);
                actualEndDate.setDate(actualEndDate.getDate() - 1);

                openScheduleModal(
                    null,
                    info.startStr.split('T')[0],
                    actualEndDate.toISOString().split('T')[0], // 実際の終了日を渡す
                    info.resource.id
                );
                teamCalendar.unselect();
            },

            // スケジュールをクリックしたときのイベント
            eventClick: (info) => {
                info.jsEvent.preventDefault(); // デフォルトの動作を抑制
                openScheduleModal(info.event.id);
            },

           // 3. スケジュールのドラッグ＆ドロップ（移動または担当者変更）
           eventDrop: async (info) => {
               const { event, oldEvent, revert } = info;
               const newResourceId = event.getResources()[0]?.id;

               if (!newResourceId || !confirm(`このスケジュールを移動してもよろしいですか？`)) {
                   revert();
                   return;
               }

               try {
                   // Luôn bắt đầu bằng cách lấy toàn bộ dữ liệu gốc từ extendedProps
                   const originalData = event.extendedProps;
                   let payload = {}; // Khởi tạo payload rỗng

                   // So sánh ngày cũ và ngày mới (bỏ qua phần thời gian) để xác định loại hành động
                   const oldStartDay = new Date(oldEvent.start).setHours(0, 0, 0, 0);
                   const newStartDay = new Date(event.start).setHours(0, 0, 0, 0);

                   if (oldStartDay !== newStartDay) {

                       console.log("Hành động: Thay đổi ngày");

                       // Tính toán khoảng thời gian (duration) của sự kiện
                       const duration = new Date(originalData.endDate).getTime() - new Date(originalData.startDate).getTime();
                       const newEndDate = new Date(event.start.getTime() + duration);

                       payload = {
                           ...originalData, // Lấy tất cả dữ liệu gốc
                           employeeId: newResourceId, // Cập nhật người phụ trách mới
                           startDate: toLocalISOString(event.start), // Cập nhật ngày bắt đầu mới
                           endDate: toLocalISOString(newEndDate), // Cập nhật ngày kết thúc mới
                       };
                   } else {
                       console.log("Hành động: Thay đổi người phụ trách");

                       // Chỉ cần lấy lại toàn bộ dữ liệu gốc và thay đổi employeeId
                       payload = {
                           ...originalData, // Giữ nguyên startDate, endDate, notes, workType, etc.
                           employeeId: newResourceId, // Chỉ cập nhật người phụ trách mới
                       };
                   }

                   // Gửi yêu cầu PUT với payload đã được xử lý chính xác
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

            // 4. スケジュールのサイズ（期間）変更
            eventResize: async (info) => {
                const { event } = info;

                if (!confirm(`このスケジュールの期間を変更しますか？`)) {
                    info.revert();
                    return;
                }

                try {
                    const originalData = event.extendedProps;

                    // Tính toán ngày kết thúc mới
                    const actualEndDate = new Date(event.end);
                    actualEndDate.setDate(actualEndDate.getDate() - 1);

                    // Sử dụng hàm mới để lấy chuỗi ngày tháng an toàn
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
            buttonText: { today: '今日', month: '月', week: '週', day: '日' },
            editable: true,
            selectable: true,
            selectMirror: true,
            aspectRatio: 2,
            displayEventTime: false, // イベントタイトルに時間を表示しない
            events: async (fetchInfo, successCallback, failureCallback) => {
                try {
                    const params = new URLSearchParams({
                        startDate: fetchInfo.start.toISOString().slice(0, 10),
                        endDate: fetchInfo.end.toISOString().slice(0, 10),
                    });
                    const url = `${SCHEDULE_API_URL}/employee/${currentUser.id}?${params.toString()}`; //

                    const schedules = await fetch(url, { headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);

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
                            backgroundColor: workTypeColors[s.workType] || '#71717A',
                            borderColor: workTypeColors[s.workType] || '#71717A',
                            allDay: !s.startTime
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    failureCallback(error);
                }
            },

            eventClick: (info) => {
                info.jsEvent.preventDefault();
                openScheduleModal(info.event.id, null, null, null, true); // isPersonal = true でモーダルを呼び出す
            },

            select: (info) => {
                const startDate = info.startStr.split('T')[0];
                const actualEndDate = new Date(info.end);
                actualEndDate.setDate(actualEndDate.getDate() - 1);

                openScheduleModal(
                    null,
                    startDate,
                    actualEndDate.toISOString().split('T')[0],
                    currentUser.id,
                    true // isPersonal = true でモーダルを呼び出す
                );
                personalCalendar.unselect();
            },
        });

        personalCalendar.render();
    };

     // 統計データを取得して表示する関数
    const fetchAndRenderStatistics = async () => {
        // 読み込み中の状態を設定
        const loadingHTML = `<p class="text-center text-gray-400"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</p>`;
        if(statsTotalEmployeesEl) statsTotalEmployeesEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        if(statsByPositionEl) statsByPositionEl.innerHTML = loadingHTML;
        if(statsByOfficeEl) statsByOfficeEl.innerHTML = loadingHTML;

        try {
            const stats = await fetch(`${EMPLOYEE_API_URL}/statistics`, { headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);

            // 1. 総従業員数を表示
            if(statsTotalEmployeesEl) statsTotalEmployeesEl.textContent = stats.totalEmployees;

            // 2. 役職別の統計を表示
            if(statsByPositionEl) {
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

            // 3. オフィス別の統計を表示
            if(statsByOfficeEl) {
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
            if(statsTotalEmployeesEl) statsTotalEmployeesEl.textContent = "エラー";
            if(statsByPositionEl) statsByPositionEl.innerHTML = errorHTML;
            if(statsByOfficeEl) statsByOfficeEl.innerHTML = errorHTML;
        }
    };

    // --- オフィス関連のロジック ---
    const renderOfficeTable = (offices) => {
         officeTableBody.innerHTML = '';
        if (!offices || offices.length === 0) {
            officeTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">オフィスがまだありません。</td></tr>`;
            return;
        }
        offices.forEach(office => {
            const row = `
                <tr id="office-row-${office.id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${office.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${office.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${office.address || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <button class="text-indigo-600 hover:text-indigo-900 mr-3 edit-office-btn" data-id="${office.id}"><i class="fas fa-edit"></i> 編集</button>
                        <button class="text-red-600 hover:text-red-900 delete-office-btn" data-id="${office.id}"><i class="fas fa-trash-alt"></i> 削除</button>
                    </td>
                </tr>
            `;
            officeTableBody.insertAdjacentHTML('beforeend', row);
        });
     };
    const fetchAndRenderOffices = async () => {
        try {
            const response = await fetch(OFFICE_API_URL, { headers: getRequestHeaders(), credentials: 'include' });
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
                const response = await fetch(`${OFFICE_API_URL}/${officeId}`, { headers: getRequestHeaders(), credentials: 'include' });
                const officeData = await handleResponse(response);
                document.getElementById('office-id').value = officeData.id;
                document.getElementById('office-name').value = officeData.name;
                document.getElementById('office-address').value = officeData.address || '';
            } catch (error) { showAlert(error.message, 'error'); return; }
        } else {
            officeModalTitle.textContent = '新規オフィスを追加';
        }
        officeModal.classList.remove('hidden');
     };

    // --- 従業員関連のロジック ---
     // 詳細表示モーダルを開き、データを入力する関数
    const openViewModal = async (employeeId) => {
        viewEmployeeModal.classList.remove('hidden');
        viewEmployeeContent.innerHTML = `<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">読み込み中...</p></div>`;

        try {
            const emp = await fetch(`${EMPLOYEE_API_URL}/${employeeId}`, { headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);

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
        employeeTableBody.innerHTML = employees.length === 0
            ? `<tr><td colspan="7" class="text-center p-4">該当する従業員が見つかりません。</td></tr>`
            : employees.map(employee => {
                const avatarSrc = employee.avatar ? `/api/files/avatar/${employee.avatar}` : 'https://placehold.co/100x100/E2E8F0/A0AEC0?text=N/A';
                const positionName = positionTranslations[employee.position] || employee.position || 'N/A';
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
                        <button class="text-blue-600 hover:text-blue-900 edit-employee-btn" data-id="${employee.id}"><i class="fas fa-edit"></i></button>
                        <button class="text-red-600 hover:text-red-900 delete-employee-btn" data-id="${employee.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>`;
            }).join('');
    };

    const renderPaginationControls = (pageData) => {
        employeePagination.innerHTML = '';
        if (!pageData || pageData.totalPages <= 1) return;
        const { number, totalPages, first, last } = pageData;
        let paginationHTML = `<button class="page-link px-3 py-1 rounded-md bg-white border ${first ? 'opacity-50' : ''}" data-page="${number - 1}" ${first ? 'disabled' : ''}>&laquo; 前へ</button>`;
        for (let i = 0; i < totalPages; i++) {
            paginationHTML += `<button class="page-link px-3 py-1 rounded-md border ${i === number ? 'bg-blue-500 text-white' : 'bg-white'}" data-page="${i}">${i + 1}</button>`;
        }
        paginationHTML += `<button class="page-link px-3 py-1 rounded-md bg-white border ${last ? 'opacity-50' : ''}" data-page="${number + 1}" ${last ? 'disabled' : ''}>次へ &raquo;</button>`;
        employeePagination.innerHTML = `<div class="flex justify-center items-center space-x-2">${paginationHTML}</div>`;
    };

    const fetchAndRenderEmployees = async (page = 0) => {
        empCurrentPage = page;
        const params = new URLSearchParams({ page: empCurrentPage, size: empPageSize, keyword: searchEmployeeInput.value.trim(), officeId: filterEmployeeOffice.value, position: filterEmployeeRole.value });
        for(let p of new URLSearchParams(params)) { if(!p[1]) params.delete(p[0]); }
        try {
            const pageData = await fetch(`${EMPLOYEE_API_URL}?${params.toString()}`, { credentials: 'include' }).then(handleResponse);
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
            const offices = await fetch(OFFICE_API_URL, { headers: getRequestHeaders(), credentials: 'include' }).then(handleResponse);
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
            // --- 編集モード ---
            employeeModalTitle.textContent = '従業員情報を編集';
            employeePasswordInput.required = false;
            document.getElementById('employee-password-help').textContent = 'パスワードを変更しない場合は空のままにしてください。';

            try {
                const emp = await fetch(`${EMPLOYEE_API_URL}/${employeeId}`, { credentials: 'include' }).then(handleResponse);

                // フォームにデータを明確かつ安全に入力する
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

                // アバターの処理
                if (emp.avatar) {
                    avatarPreview.src = `/api/files/avatar/${emp.avatar}`;
                    avatarUrlInput.value = emp.avatar; // 古いファイル名を保存
                    removeAvatarBtn.classList.remove('hidden');
                }
            } catch (error) {
                showAlert(error.message, 'error');
                return;
            }
        } else {
            // --- 新規追加モード ---
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
        // ステップ1: ログインとアクセス権限の確認
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn || !['manager', 'admin'].includes((currentUser.role || '').toLowerCase())) {
            window.location.href = '/login-JP.html';
            return;
        }
        // ステップ2: 共通UIの更新
        document.querySelector('#user-menu-button span').textContent = `こんにちは、${currentUser.name}さん`;
        const navAvatar = document.querySelector('#user-menu-button img');
        if (currentUser.avatar && navAvatar) {
            navAvatar.src = `/api/files/avatar/${currentUser.avatar}`;
        }

        // ステップ3: イベントの設定
        setupCommonUIListeners();
        setupScheduleModalListeners(); // スケジュールモーダルのイベントを設定
        setupOfficeListeners();
        setupEmployeeListeners(); // 従業員モーダルのイベントを設定

        // ステップ4: 初期データの読み込み
        await fetchAndRenderOffices(); // オフィスリストの読み込み
        await loadOfficesForSelects(); // セレクトボックス用のオフィスリストを読み込み
        await fetchAndRenderEmployees(); // 従業員データの読み込み
        await fetchAndRenderStatistics(); // 統計データの読み込み
        renderWorkTypeLegend('team-calendar-legend');
        renderWorkTypeLegend('personal-calendar-legend');
        initializeTeamCalendar();
        initializePersonalCalendar();

    };
    initializePage();
});