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

        if (!mailUser || !mailPass) {
            console.log('[Mail] SMTP 설정이 없어 알림 발송을 건너뜁니다. (Settings > 알림 설정에서 구성)');
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
                // JSON 파싱 실패 시 기본값 유지
            }
        }

        // 3. Transporter 생성 (Gmail SMTP)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailUser,
                pass: mailPass,
            },
        });

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
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mail] 알림 발송 완료: ${candidateName} → ${recipients.join(', ')} (msgId: ${info.messageId})`);
    } catch (e) {
        // 이메일 발송 실패는 면접 완료 상태에 영향 없음
        console.error('[Mail] 알림 발송 실패 (면접 상태에는 영향 없음):', e.message);
    }
}

module.exports = { sendInterviewNotification };
