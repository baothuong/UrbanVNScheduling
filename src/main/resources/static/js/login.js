document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Hàm hiển thị thông báo
    function showAlert(message, type = 'success', duration = 3000) {
        const alertBox = document.getElementById('customAlert');
        const alertMessage = document.getElementById('alertMessage');
        alertMessage.textContent = message;
        alertBox.className = 'custom-alert';
        if (type === 'success') alertBox.classList.add('alert-success');
        else if (type === 'error') alertBox.classList.add('alert-error');
        else if (type === 'warning') alertBox.classList.add('alert-warning');
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, duration);
    }

    // Xử lý sự kiện submit form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showAlert('すべての必須項目を入力してください！', 'warning');
            return;
        }

        // Kích hoạt trạng thái loading
        loginButton.disabled = true;
        loginButtonText.textContent = 'ログイン中...';
        loginSpinner.classList.remove('hidden');

        try {
            // QUAN TRỌNG: Gọi API với đường dẫn tương đối
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'ユーザー名またはパスワードが正しくありません。');
            }

            // Đăng nhập thành công
            localStorage.setItem('currentUser', JSON.stringify({
                ...data.employee,
                role: data.employee.role.toLowerCase()
            }));
            localStorage.setItem('isLoggedIn', 'true');

            showAlert(`ログインに成功しました！ こんにちは、${data.employee.name}さん`, 'success');

            setTimeout(() => {
                if (data.employee.role.toLowerCase() === 'manager' || data.employee.role.toLowerCase() === 'admin') {
                    // Sửa đường dẫn để phù hợp với cấu trúc static
                    window.location.href = '/urbanQuanly-JP.html';
                } else {
                    window.location.href = '/urbanNhanVien-JP.html';
                }
            }, 1000);

        } catch (error) {
            showAlert(error.message, 'error');
            // Reset trạng thái loading khi có lỗi
            loginButton.disabled = false;
            loginButtonText.textContent = 'ログイン';
            loginSpinner.classList.add('hidden');
        }
    });
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
          const forgotPasswordModal = document.getElementById('forgotPasswordModal');
          const closeForgotModal = document.getElementById('closeForgotModal');
          const cancelForgotPassword = document.getElementById('cancelForgotPassword');
          const forgotPasswordForm = document.getElementById('forgotPasswordForm');
          const resetPasswordButton = document.getElementById('resetPasswordButton');
          const resetButtonText = document.getElementById('resetButtonText');
          const resetSpinner = document.getElementById('resetSpinner');
          const resetEmailInput = document.getElementById('resetEmail');

          // Toggle password visibility
          const togglePassword = document.getElementById('togglePassword');
          const eyeIcon = document.getElementById('eyeIcon');

          if (togglePassword) {
            togglePassword.addEventListener('click', () => {
              const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
              passwordInput.setAttribute('type', type);
              eyeIcon.classList.toggle('fa-eye');
              eyeIcon.classList.toggle('fa-eye-slash');
            });
          }

          // Open Forgot Password Modal
          if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
              e.preventDefault();
              openForgotPasswordModal();
            });
          }

          // Close Modal Events
          if (closeForgotModal) {
            closeForgotModal.addEventListener('click', closeForgotPasswordModal);
          }

          if (cancelForgotPassword) {
            cancelForgotPassword.addEventListener('click', closeForgotPasswordModal);
          }

          // Close modal when clicking outside
          if (forgotPasswordModal) {
            forgotPasswordModal.addEventListener('click', (e) => {
              if (e.target === forgotPasswordModal) {
                closeForgotPasswordModal();
              }
            });
          }

          // Handle Forgot Password Form Submission
          if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              await handleForgotPassword();
            });
          }

          // Functions for Forgot Password Modal
          function openForgotPasswordModal() {
            if (forgotPasswordModal) {
              forgotPasswordForm.reset();
              resetEmailInput.focus();
              forgotPasswordModal.classList.remove('hidden');
            }
          }

          function closeForgotPasswordModal() {
            if (forgotPasswordModal) {
              forgotPasswordModal.classList.add('hidden');
              forgotPasswordForm.reset();
              resetLoadingState();
            }
          }

          function setLoadingState() {
            resetPasswordButton.disabled = true;
            resetButtonText.textContent = '送信中...';
            resetSpinner.classList.remove('hidden');
          }

          function resetLoadingState() {
            resetPasswordButton.disabled = false;
            resetButtonText.textContent = 'リクエストを送信';
            resetSpinner.classList.add('hidden');
          }

          async function handleForgotPassword() {
            const email = resetEmailInput.value.trim();

            // Validate email
            if (!email) {
              showAlert('メールアドレスを入力してください！', 'warning');
              resetEmailInput.focus();
              return;
            }

            if (!isValidEmail(email)) {
              showAlert('有効なメールアドレスを入力してください！', 'warning');
              resetEmailInput.focus();
              return;
            }

            setLoadingState();

            try {
              const response = await fetch('http://localhost:8080/api/auth/forget-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email: email })
              });

              const responseText = await response.text();

              if (response.ok) {
                showAlert('パスワード再設定用のメールを送信しました！受信トレイをご確認ください。', 'success', 5000);
                closeForgotPasswordModal();
              } else {
                // Try to parse as JSON for error message
                try {
                  const errorData = JSON.parse(responseText);
                  throw new Error(errorData.message || 'メールの送信中にエラーが発生しました');
                } catch (parseError) {
                  throw new Error(responseText || 'メールの送信中にエラーが発生しました');
                }
              }
            } catch (error) {
              console.error('Forgot password error:', error);
              showAlert(error.message || '再設定用メールを送信できませんでした。後ほど再度お試しください。', 'error');
            } finally {
              resetLoadingState();
            }
          }

          // Email validation function
          function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
          }

          // Enhanced showAlert function (if not already exists)
          function showAlert(message, type = 'success', duration = 3000) {
            const alertBox = document.getElementById('customAlert');
            const alertMessage = document.getElementById('alertMessage');

            if (!alertBox || !alertMessage) {
              console.error('Alert elements not found');
              alert(message); // Fallback to browser alert
              return;
            }

            alertMessage.textContent = message;
            alertBox.className = 'custom-alert';

            // Add appropriate class based on type
            switch (type) {
              case 'success':
                alertBox.classList.add('alert-success');
                break;
              case 'error':
                alertBox.classList.add('alert-error');
                break;
              case 'warning':
                alertBox.classList.add('alert-warning');
                break;
              default:
                alertBox.classList.add('alert-success');
            }

            alertBox.style.display = 'block';

            // Auto hide after duration
            setTimeout(() => {
              alertBox.style.display = 'none';
            }, duration);
          }

          // Auto-focus email input when modal opens
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' &&
                mutation.attributeName === 'class' &&
                !forgotPasswordModal.classList.contains('hidden')) {
                setTimeout(() => resetEmailInput.focus(), 100);
              }
            });
          });

          if (forgotPasswordModal) {
            observer.observe(forgotPasswordModal, { attributes: true });
          }

          // Enter key handling
          resetEmailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !resetPasswordButton.disabled) {
              forgotPasswordForm.dispatchEvent(new Event('submit'));
            }
          });

          // Real-time email validation
          resetEmailInput.addEventListener('input', (e) => {
            const email = e.target.value.trim();
            const isValid = email === '' || isValidEmail(email);

            if (email && !isValid) {
              e.target.classList.add('border-red-500');
              e.target.classList.remove('border-gray-300');
            } else {
              e.target.classList.remove('border-red-500');
              e.target.classList.add('border-gray-300');
            }
          });
    // Các sự kiện khác cho modal quên mật khẩu, toggle password...
});