const express = require('express');
const router = express.Router();

// 임시 관리자 계정 정보 (하드코딩 - 프로토타입 단계)
const ADMIN_ID = 'gxhr@tecace.com';
const ADMIN_PW = 'gxhr2026!';

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_ID && password === ADMIN_PW) {
        // 성공 시 간단한 토큰 및 사용자 정보 반환
        return res.json({
            success: true,
            user: { email: ADMIN_ID, name: 'HR Admin' },
            token: 'dummy-session-token-' + Date.now()
        });
    }

    res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

module.exports = router;
