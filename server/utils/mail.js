const nodemailer = require('nodemailer');
const { getSupabase } = require('../db/supabase');
const localDb = require('../db/database');

/**
 * settings 테이블에서 값 읽기 (Supabase → localDb fallback)
 * settings.js의 GET 로직과 동일한 패턴 사용
 */
async function getSetting(key) {
    // 1. Supabase 우선 시도
    try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        if (!error && data && data.value) return data.value;
    } catch (e) {
        // Supabase 미연결 시 localDb로 fallback
    }
    // 2. 로컬 SQLite fallback
    try {
        const row = await localDb.get('SELECT value FROM settings WHERE key = ?', [key]);
        if (row && row.value) return row.value;
    } catch (e) {
        // 무시
    }
    return '';
}

/**
 * 면접 완료 알림 이메일 발송
 * @param {Object} params
 * @param {string} params.candidateName - 지원자 이름
 * @param {string} params.candidateEmail - 지원자 이메일
 * @param {string} params.jobTitle - 지원 직무
 * @param {number|string} params.aiScore - AI 종합 점수
 * @param {string} params.recommendation - AI 추천 결과
 */
async function sendInterviewNotification({ candidateName, candidateEmail, jobTitle, aiScore, recommendation }) {
    try {
        // 1. SMTP 설정 읽기 (Admin Settings UI에서 저장된 값)
        const mailUser = await getSetting('mail_user');
        const mailPass = await getSetting('mail_pass');

        console.log('[Mail] 알림 발송 시도 중...');

        if (!mailUser || !mailPass) {
            console.warn('[Mail] SMTP 설정(계정/비번)이 없습니다. 발송을 건너뜁니다.');
            return;
        }

        // 2. 수신자 목록 읽기
        const recipientsRaw = await getSetting('notification_emails');
        let recipients = ['charliekim@tecace.com']; // 기본값
        if (recipientsRaw) {
            try {
                const parsed = JSON.parse(recipientsRaw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    recipients = parsed;
                }
            } catch (e) {
                console.error('[Mail] 수신자 목록 JSON 파싱 에러:', e.message);
            }
        }

        console.log(`[Mail] 발송 설정: From=${mailUser}, Recipients=${recipients.join(', ')}`);

        // 3. Transporter 생성 (Gmail SMTP - 587 STARTTLS 사용)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587, 
            secure: false, // 587 포트는 STARTTLS를 위해 false로 시작
            requireTLS: true,
            auth: {
                user: mailUser,
                pass: mailPass,
            },
            tls: {
                // 특정 환경에서의 인증서 이슈 방지 (필요 시)
                ciphers: 'SSLv3',
                rejectUnauthorized: false 
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 15000
        });

        // ── SMTP 연결 확인 ──
        console.log(`[Mail] SMTP 서버 연결 시도 중... (Host: smtp.gmail.com:587 STARTTLS)`);
        try {
            await transporter.verify();
            console.log('[Mail] SMTP 서버 인증 및 연결 성공 (587)');
        } catch (verifyErr) {
            console.error('[Mail] SMTP 연결 실패 (587):', verifyErr.message);
            if (verifyErr.code === 'ETIMEDOUT') {
                console.error('[Mail] 힌트: 서버 방화벽에서 587번 포트 Egress가 차단되었을 수 있습니다.');
            }
            throw verifyErr;
        }

        // 4. 이메일 내용 구성
        const scoreDisplay = aiScore !== undefined && aiScore !== null ? `${aiScore}점` : '분석 중';
        const recDisplay = recommendation || '—';

        const htmlBody = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <h1 style="color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 4px;">TecAce AI Interview</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">면접 완료 알림</p>
            </div>

            <div style="background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 20px;">아래 지원자의 AI 면접이 완료되었습니다.</p>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600; width: 120px;">지원자</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${candidateName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">이메일</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px;">${candidateEmail}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">지원 직무</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${jobTitle || '—'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">AI 점수</td>
                        <td style="padding: 12px 0;">
                            <span style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 18px; font-weight: 900; padding: 4px 16px; border-radius: 8px;">${scoreDisplay}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">추천 결과</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${recDisplay}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                TecAce AI Interview Platform · Admin 페이지에서 상세 결과를 확인하세요.
            </p>
        </div>
        `;

        const mailOptions = {
            from: `"TecAce AI Interview" <${mailUser}>`,
            to: recipients.join(', '),
            subject: `[TecAce] ${candidateName}님의 면접이 완료되었습니다 — AI Score: ${scoreDisplay}`,
            html: htmlBody,
        };

        // 5. 발송
        console.log(`[Mail] 발송 시도 중... To: ${recipients.join(', ')}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mail] 발송 성공! (msgId: ${info.messageId})`);
    } catch (e) {
        console.error('[Mail] 최종 에러 (면접 데이터는 보존됨):', e.message);
    }
}

/**
 * SMTP 설정을 즉시 검증하고 테스트 메일을 발송합니다 (Admin UI용)
 */
async function verifyMailConfig(user, pass) {
    if (!user || !pass) throw new Error('계정 정보와 앱 비밀번호를 모두 입력해주세요.');
    
    console.log(`[Mail] 설정 검증 및 테스트 메일 발송 시도 중(587): ${user}`);
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });

    try {
        await transporter.verify();
        console.log('[Mail] SMTP 인증 성공 (테스트 587)');
        
        const info = await transporter.sendMail({
            from: `"TecAce System" <${user}>`,
            to: user, 
            subject: '[TecAce] 이메일 발송 설정 테스트 완료(587)',
            text: `이 메일이 도착했다면 AI 인터뷰 완료 알림 설정이 정상적으로 완료된 것입니다.\n\n발송 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`
        });
        
        console.log(`[Mail] 테스트 메일 발송 완료! (msgId: ${info.messageId})`);
        return { success: true };
    } catch (e) {
        console.error('[Mail] 587 설정 검증 실패:', e.message);
        throw e;
    }
}

module.exports = { sendInterviewNotification, verifyMailConfig };
