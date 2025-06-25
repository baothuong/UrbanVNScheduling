document.addEventListener('DOMContentLoaded', () => {
    // Lấy token từ URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Nếu không có token, có thể thông báo lỗi hoặc chuyển hướng
    if (!token) {
        alert("無効なリンクです。トークンが見つかりません。");
        // window.location.href = '/login-JP.html'; // Tùy chọn: chuyển về trang login
        return;
    }

    const resetPassword = async (token, password, confirmPass) => {
        // Kiểm tra mật khẩu trống
        if (!password || !confirmPass) {
            alert("新しいパスワードと確認用パスワードの両方を入力してください。");
            return;
        }
        // Kiểm tra mật khẩu không khớp
        if (password !== confirmPass) {
            alert("パスワードが一致しません。もう一度お試しください。");
            return;
        }

        try {
            // QUAN TRỌNG: Sử dụng đường dẫn tương đối
            const response = await fetch("/api/auth/resetpassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: token,
                    password: password,
                    comfirmPass: confirmPass
                })
            });

            const resultText = await response.text();

            if (response.ok) {
                alert("パスワードのリセットが成功しました！ログインページに移動します。");
                window.location.href = '/login-JP.html'; // Chuyển hướng sau khi thành công
            } else {
                // Hiển thị lỗi từ server
                alert(`パスワードのリセット中にエラーが発生しました： ${resultText}`);
            }
        } catch (error) {
            console.error("Request sending error:", error);
            alert("リクエストの送信中にエラーが発生しました。コンソールログを確認してください。");
        }
    };

    const submitButton = document.getElementById('submitResetButton');

    submitButton.addEventListener('click', () => {
        const newPassword = document.getElementById("newPassword").value;
        const confirmPass = document.getElementById("confirmPassword").value;
        resetPassword(token, newPassword, confirmPass);
    });
});